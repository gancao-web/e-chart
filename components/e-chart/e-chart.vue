<script>
// HBuilderX创建的vue2/vue3项目是webpack,支持require; 而cli创建的vite项目不支持require，只能import
// npm安装echarts尽管支持按需引入减少打包体积，但node_modules无法移到子包，所以对于vite来说子包只能采用全量esm
// webpack+vue3只能require在static目录的cjs，但webpack+vue2如果require在static目录的cjs，那么打包时主包和子包都有cjs, 导致体积翻倍
// 综上，为确保vue2分包正常，仅vue2使用在线定制的cjs，而vue3采用全量esm

// vue3采用全量esm,确保能正常分包 (从/node_modules/echarts/dist/目录拷贝)
// #ifdef VUE3
import * as echarts from './echarts.esm.min.js';
// #endif

// vue2使用require加载在线定制的cjs包,既能正常分包,又可减少打包体积
// #ifndef VUE3
const echarts = require('./echarts.min.js');
// #endif

import UniCanvas from './UniCanvas.js';
import UniImg from './UniImg.js';
import { getRandomId, addUnitRpx, getWindowInfo } from './util.js';

/**
 * Echarts图表组件 (采用vue2写法, 兼容vue3)
 * @description 对Apache ECharts做uni-app的适配, 支持ECharts官方所有图表在各类小程序和APP使用
 * @property {Object} width 宽度 (支持格式: 600, "600rpx", "300px", "50vh", "100%", 其中数字默认rpx单位)
 * @property {Object} height 高度 (支持格式同width, 默认600rpx)
 * @property {Boolean} disableScroll 在图表区域内触摸移动时,是否禁止页面滚动 (默认false)
 */
export default {
  name: 'e-chart',
  props: {
    width: {
      type: [Number, String],
      default: '100%',
    },
    height: {
      type: [Number, String],
      default: 600,
    },
    disableScroll: Boolean,
  },
  data() {
    return {
      canvasId: getRandomId()
    };
  },
  computed: {
    canvasStyle() {
      return `width:${addUnitRpx(this.width)};height:${addUnitRpx(this.height)}`
    },
  },
  watch: {
    width(){
      this.resize()
    },
    height(){
      this.resize()
    }
  },
  mounted() {
    // 支付宝小程序需在onReady回调函数中获取canvas实例 https://opendocs.alipay.com/mini/component/canvas?pathHash=d0b85da4
    // #ifndef MP-ALIPAY
    this.onCanvasReady();
    // #endif
  },
  methods: {
    // 通知外部可初始化echarts实例 (vue3抖音小程序在页面的onMounted中echartRef.value没值, 而在ready回调中则有值)
    onCanvasReady() {
      this.$emit('ready')
    },

    // 外部通过ref初始化, 因为uni-app不支持props传递function属性
    async init(option) {
      // #ifdef H5
      return this.initH5(option);
      // #endif

      // #ifndef H5
      return await this.initApp(option);
      // #endif
    },

    initH5(option) {
      // #ifdef H5
      if (echarts.setPlatformAPI) {
        echarts.setPlatformAPI({
          loadImage: (src, onload, onerror) => {
            const image = new Image();

            image.crossOrigin = 'anonymous'; // 解决图表保存为图片时的跨域错误
            image.onload = onload;
            image.onerror = onerror;
            image.src = src;
            return image;
          },
        });
      }

      const echartDom = document.getElementById(this.canvasId);
      
      this.echartObj = echarts.init(echartDom); 
      
      this.setOption(option);
      
      this.echartCanvas = echartDom.getElementsByTagName('canvas')[0];  // 必须先setOption,再获取canvas,否则是空白的canvas

      return { echartCanvas: this.echartCanvas, echartObj: this.echartObj, canvasId: this.canvasId, width: echartDom.clientWidth, height: echartDom.clientHeight }
      // #endif
    },

    async initApp(option) {
      // #ifndef H5
      // node有值则使用的是canvas 2d, 可以提升渲染性能，解决非同层渲染问题; 否则是旧版canvas
      const { node, ctx, width, height, devicePixelRatio } = await this.getAppCanvas();

      const canvas = node ? new UniCanvas(ctx, this.canvasId, true, node) : new UniCanvas(ctx, this.canvasId, false);
      
      // 禁用progressive (非H5不支持DOM的操作)
      echarts.registerPreprocessor((option) => {
        if (option && option.series) {
          if (option.series.length > 0) {
            option.series.forEach((series) => {
              series.progressive = 0;
            });
          } else if (typeof option.series === 'object') {
            option.series.progressive = 0;
          }
        }
      });
  
      if (echarts.setPlatformAPI) {
        // 图表中的图片需使用canvas的createImage方法加载
        echarts.setPlatformAPI({
          createCanvas: () => canvas,
          loadImage: (src, onload, onerror) => {
            const image = node ? node.createImage() : new UniImg();
            image.onload = onload;
            image.onerror = onerror;
            image.src = src;
            return image;
          },
        });
      } else {
        // 低版本echarts
        echarts.setCanvasCreator(() => canvas);
      }

      // 初始化图表实例 (实例不写在vue的data, 无需响应式: https://echarts.apache.org/zh/faq.html#others)
      this.echartObj = echarts.init(canvas, null, {
        devicePixelRatio,
        width,
        height,
      });

      canvas.setChart(this.echartObj);

      this.setOption(option);

      this.echartCanvas = node; // 缓存canvas节点,确保转存图片的时候能够取到(抖音小程序真机如果重新查询节点会转成失败,需事先缓存)

      return { echartCanvas: node, echartObj: this.echartObj, canvasId: this.canvasId, width, height }
      // #endif
    },

    // 设置配置
    setOption(option) {
      option && this.echartObj && this.echartObj.setOption(option);
    },
	
    // 宽高变化需重绘 (使用setTimeout,避免$nextTick在某些机型不触发的问题)
    resize() {
      this._resizeTimer && clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this.getCanvasQuery().boundingClientRect().exec(res => {
          const { width, height } = res[0];
          this.echartObj.resize({width, height}) // 必须设置width, height否则旧版canvas重绘失败
        });
      }, 30)
    },

    // 获取canvas查询对象
    getCanvasQuery() {
      let query = uni.createSelectorQuery();
      // #ifndef MP-ALIPAY
      query = query.in(this) // 支付宝小程序不支持in(this),而字节跳动小程序必须写in(this), 否则都取不到值
      // #endif
      return query.select(`#${this.canvasId}`)
    },

    // 获取Canvas上下文
    getAppCanvas() {
      return new Promise((resolve) => {
        this.getCanvasQuery().fields({ node: true, size: true }).exec((res) => {
          const { width, height, node } = res[0];

          let devicePixelRatio = 1; // 旧版canvas不支持dpr (新版2d支持, 使图表更清晰)

          if (node && node.getContext) {
            const ctxV2 = node.getContext('2d'); // 新版canvas (type="2d")

            // #ifndef MP-JD
            devicePixelRatio = getWindowInfo().pixelRatio; // 京东小程序仍使用1, 否则会被放大
            // #endif

            resolve({ ctx: ctxV2, width, height, node, devicePixelRatio });
          } else {
            const ctxV1 = uni.createCanvasContext(this.canvasId, this); // 旧版canvas (type="webgl")
            
            // #ifdef MP-LARK
            devicePixelRatio = getWindowInfo().pixelRatio; // 飞书小程序需使用真实dpr, 否则会被缩小
            // #endif

            resolve({ ctx: ctxV1, width, height, devicePixelRatio });
          }
        });
      });
    },

    // 触摸事件开始 - 将touch事件转为底层的mouse事件, 使点击或滑动相关事件生效 (解决移动端tooltip失效的问题)
    onTouchstart(e) {
      if (!this.echartObj) return;

      const zrxy = this.getZrXy(e);
      const handler = this.echartObj.getZr().handler;

      handler.dispatch('mousedown', zrxy);
      handler.dispatch('mousemove', zrxy); // 移动端tooltip需要move才显示, 加上这行确保点一下也能显示tooltip
      handler.processGesture(this.wrapTouch(e), 'start');
    },

    // 触摸事件滑动
    onTouchmove(e) {
      if (!this.echartObj) return;

      const zrxy = this.getZrXy(e);
      const handler = this.echartObj.getZr().handler;

      handler.dispatch('mousemove', zrxy);
      handler.processGesture(this.wrapTouch(e), 'change');
    },

    // 触摸事件结束
    onTouchend(e) {
      if (!this.echartObj) return;

      const zrxy = this.getZrXy(e);
      const handler = this.echartObj.getZr().handler;

      handler.dispatch('mouseup', zrxy);
      handler.dispatch('click', zrxy);
      handler.processGesture(this.wrapTouch(e), 'end');
    },
	
    // 转换触摸事件的坐标
    getZrXy(e) {
      const touch = e.touches[0];
    
      return { zrX: touch?.x, zrY: touch?.y };
    },
    
    // 包装触摸事件
    wrapTouch(e) {
      for (let i = 0; i < e.touches.length; ++i) {
        const touch = e.touches[i];
    
        touch.offsetX = touch.x;
        touch.offsetY = touch.y;
      }
    
      return e;
    },

    // canvas转为文件路径
    canvasToTempFilePath() {
      return new Promise((resolve, reject) => {
        const fail = (e) => {
          uni.showModal({ title: '保存失败', content: JSON.stringify(e), showCancel: false });
          reject(e);
        };

        // #ifdef H5
        // H5端转base64直接下载
        resolve(this.echartCanvas.toDataURL('image/png'));
        // #endif

        // #ifdef MP-TOUTIAO
        // 抖音小程序: https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/api/canvas/v1/canvas-to-temp-file-path
        const base64 = this.echartCanvas.toDataURL(); 
        const fileSystemManager = tt.getFileSystemManager()
        const filePath = `ttfile://user/${Date.now()}.png`;
        fileSystemManager.writeFile({
          filePath,
          encoding: "base64",
          data: base64.replace('data:image/png;base64,', ''),
          success: () => {
            resolve(filePath);
          },
          fail
        })
        // #endif

        // #ifndef H5 || MP-TOUTIAO
        // APP + 非抖音小程序
        const option = this.echartCanvas ? { canvas: this.echartCanvas } : { canvasId: this.canvasId }
        uni.canvasToTempFilePath({
          ...option,
          success(res){
            resolve(res.tempFilePath)
          },
          fail
        });
        // #endif
      });
    },
  },
};
</script>

<template>
  <!-- vue3抖音小程序必须加上 v-if="canvasId", 否则真机渲染报错 -->
  <canvas
    v-if="canvasId"
    type="2d"
    :id="canvasId"
    :style="canvasStyle"
    :canvas-id="canvasId"
    :disable-scroll="disableScroll"
    @touchstart="onTouchstart"
    @touchmove="onTouchmove"
    @touchend="onTouchend"
    @touchcancel="onTouchend"
    @ready="onCanvasReady"
  ></canvas>
</template>