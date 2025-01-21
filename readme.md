## 适配Apache ECharts的图表组件，支持ECharts官方所有图表在各类小程序和APP使用，支持vue2、vue3

1. 本组件不造轮子，只是对 [Apache ECharts](https://echarts.apache.org/zh/index.html) 做了uni适配，从而支持 [ECharts官方所有图表](https://echarts.apache.org/examples/zh/index.html) 在各类小程序和APP使用

2. 用法非常简单，您只需在 [ECharts示例面板](https://echarts.apache.org/examples/zh/editor.html?c=bar-simple) 调好配置，然后传给本组件即可

3. 支持按需引入，大幅减少打包体积，比 [ECharts在线定制](https://echarts.apache.org/zh/builder.html) 的还要小

![](https://igc-prod.oss-cn-hangzhou.aliyuncs.com/static_res/youzan/weixin-app.jpg)

## 快速入门

#### 1. 安装echarts
```
npm install echarts
```
#### 2. 在[插件市场](https://ext.dcloud.net.cn/plugin?id=21932)导入本组件
#### 3. 在具体页面中使用
#### vue2示例 :
```js
<template>
	<view>
		<e-chart ref="echartRef" @ready="initEchart" />
	</view>
</template>

<script>
	import * as echarts from 'echarts'; // 全量引入 (实际项目应按需引入,能大幅减少打包体积)
	
	export default {
		data() {
			return {
				// 支持echarts所有图表,您只需替换此处option即可展示任意图表
				option: { 
					xAxis: {
						type: 'category',
						data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
					},
					yAxis: { type: 'value' },
					series: [{
						data: [12, 20, 15, 8, 7, 11, 13],
						type: 'bar',
					}],
					grid: [{ left: 50, right: 15, top: 40, bottom: 30 }],
					tooltip: { show: true },
				},
			};
		},
		methods: {
			// 组件挂载后初始化echarts实例 (也可在请求数据后初始化)
			initEchart() { 
				this.$refs.echartRef.init(echarts, this.option);
			},
			// 异步更新数据或配置
			setOption() {
				this.option.series[0].data = [14, 11, 19, 12, 8, 7, 20];

				this.option.yAxis.axisLabel = {
					color: '#ff0000',
					formatter(value) {
						return `${value}g`; // 支持function属性
					},
				};

				// 执行更新
				this.$refs.echartRef.setOption(this.option);
			}
		}
	}
</script>
```

#### vue3示例 :
```js
<template>
	<view>
		<e-chart ref="echartRef" @ready="initEchart" />
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import * as echarts from 'echarts'; // 全量引入 (实际项目应按需引入,能大幅减少打包体积)

	// echart组件的ref
	const echartRef = ref(null);

	// 支持echarts所有图表,您只需替换此处option即可展示任意图表
	// const option = ref({}) // 不必声明为响应式对象,普通对象即可
	const option = {
		xAxis: {
			type: 'category',
			data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
		},
		yAxis: { type: 'value' },
		series: [{
			data: [12, 20, 15, 8, 7, 11, 13],
			type: 'bar',
		}],
		grid: [{ left: 50, right: 15, top: 40, bottom: 30 }],
		tooltip: { show: true },
	};

	// 组件挂载后初始化echarts实例 (也可在请求数据后初始化)
	function initEchart() { 
		echartRef.value.init(echarts, option);
	}

	// 异步更新数据或配置
	function setOption() {
		option.series[0].data = [14, 11, 19, 12, 8, 7, 20];

		option.yAxis.axisLabel = {
			color: '#ff0000',
			formatter(value) {
				return `${value}g`; // 支持function属性
			},
		};

		// 执行更新
		echartRef.value.setOption(option);
	}
</script>
```

## 按需引入
`import * as echarts from 'echarts'` 是全量引入，打包大小约1M  
按需引入非常简单，只需在[ECharts示例面板](https://echarts.apache.org/examples/zh/editor.html?c=bar-simple) 
打开'完整代码'下的'按需引入'开关，然后拷贝import和echarts.use代码即可  
按需引入打包大小约450k，比全量少一大半! 
比 [ECharts在线定制](https://echarts.apache.org/zh/builder.html) 的还要小，而且更精细可控  

![](https://igc-prod.oss-cn-hangzhou.aliyuncs.com/static_res/uni/echart-auto-import.png)

## 组件属性
```js
<e-chart width="100%" :height="600" :disable-scroll="false"/> 
```
| 属性 | 类型 | 说明 | 必填 | 默认值 |
| ---- | ---- | ---- | ---- | ---- |
| width | Number,String | 图表宽度(数字默认rpx,字符串时需写完整单位如`300px`)  | 否 | '100%' |
| height | Number,String | 图表高度(数字默认rpx,字符串时需写完整单位如`300px`) | 否 | 600 |
| disableScroll | Boolean | 在图表区域内触摸移动时,是否禁止页面滚动 | 否 | false |

## 图表事件
touch事件支持返回点中图表元素的信息, 如`seriesIndex, dataIndex, componentIndex, value`等
```js
<e-chart ref="echartRef" />

async initEchart() {
  // 组件挂载后初始化echarts实例 (await之后可获取echartObj对象)
  const { echartObj } = await this.$refs.echartRef.init(echarts, this.option); // vue2
  // const { echartObj } = await echartRef.value.init(echarts, option); // vue3

  let lastMoveEvent = null; // 记录最近一次move的值

  echartObj.on('mousedown', (e) => {
    console.log('mousedown', e);
	uni.showToast({ title: `下标${e.dataIndex + 1}, 值为${e.data}`, icon: 'none' })
  });

  echartObj.on('mousemove', (e) => {
    console.log('mousemove', e);
	lastMoveEvent = e;
  });

  // 'mouseup'需通过getZr()监听, 元素信息取最后一次move的值
  echartObj.getZr().on('mouseup', () => {
    if (lastMoveEvent) {
		console.log('mouseup', lastMoveEvent);
		lastMoveEvent = null;
	}
  });
}
```

## 保存图片
初始化echarts实例之后会返回echartCanvas, echartCanvasId, 可先把图表canvas对象转为图片, 再保存到相册  
具体细节可[下载示例项目](https://ext.dcloud.net.cn/plugin?id=21932)查看
```js
methods: {
	async initEchart() {
		const res = await this.$refs.echartRef.init(echarts, this.option);
		
		// 图表的canvas对象需在await后获取
		this.echartCanvas = res.echartCanvas;
		this.echartCanvasId = res.canvasId;
	},

	// 图表canvas转图片,并保存到相册
	save() {
		// #ifdef MP
		uni.canvasToTempFilePath({
			canvas: this.echartCanvas, // 小程序是canvas对象
			success: ({tempFilePath}) => {
				// 调用saveImageToPhotosAlbum保存图片
			}
		});
		// #endif

		// #ifdef APP
		uni.canvasToTempFilePath({
			canvasId: this.echartCanvasId, // APP端是canvas_id
			success: ({tempFilePath}) => {
				// 调用saveImageToPhotosAlbum保存图片
			}
		});
		// #endif
	},
```

## 常见问题
#### 1. 组件层级太高,遮住了fixed元素
本组件内部使用了[原生组件canvas](https://developers.weixin.qq.com/miniprogram/dev/component/native-component.html)，在开发工具部分版本可能会遮住fixed元素  
但实际上canvas已支持同层渲染，所以在真机是正常的，一定要以真机为准。

#### 2. 如何减少打包体积和小程序主包大小
1. 按需引入可以大幅减少打包体积，推荐；
2. 项目业务[使用分包](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/basic.html)可以减少小程序主包大小。但请注意`node_modules`和`uni_modules`的资源最终还是打在主包的, 尽管可以把`uni_modules`的资源移到子包, 但无法移动`node_modules`, 所以只能将业务代码尽量按模块分包
3. vue2项目支持使用[ECharts在线定制的echart.js](https://echarts.apache.org/zh/builder.html), 此时不用npm的echart.js, 所以移到子包中可减少主包大小
```js
import * as echarts from 'echarts'; // 使用npm的echarts, 是在node_modules, 无法移动到子包  
import * as echarts from '../js/echarts.min'; // 使用在线定制的js, 可移到子包, 减少主包大小  
```

#### 3. 运行示例项目报错
1. 需要先`npm install echarts`(在项目根目录运行npm命令)  
示例项目是通过HBuilderX创建的, 不是cli, 所以用HBuilderX导入项目, 安装echarts之后即可运行  
2. 检查manifest.json的vue版本是否正确, 不可使用vue3版本编译vue2的demo, 否则小程序运行报错, 如支付宝小程序
3. 若用`pnpm`可能会因缓存导致没有自动安装echarts所需的`zrender`或`tslib`依赖  
只需手动安装`pnpm add zrender`和`pnpm add tslib`即可  
也可试试清除pnpm缓存`pnpm store prune`或改用`npm`安装

#### 4. ECharts官网配置正常,拷贝到具体项目就不生效
1. 确保拷完按需引入的import和echarts.use代码 或 临时改为全量引入看看是否正常显示
2. 编译为其他平台看看是否正常，比如H5 或 微信小程序
3. 在示例项目运行相关配置看看是否正常
4. 运行到真机看看是否正常

#### 5. 为什么设计成通过ref操作组件的方式实现图表
1. import的echarts对象如果通过props传递, 会导致echarts部分属性丢失无法初始化  
2. option的function属性不支持通过props传递, 通过ref则很好避免了此问题
