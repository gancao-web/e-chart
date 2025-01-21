/**
 * 兼容echarts在非H5平台使用canvas
 * 引用: https://github.com/ecomfe/echarts-for-weixin/blob/master/ec-canvas/wx-canvas.js
 */
export default class WxCanvas {
  constructor(ctx, canvasId, isNew, canvasNode) {
    this.ctx = ctx;
    this.canvasId = canvasId;
    this.chart = null;
    this.isNew = isNew;
    if (isNew) {
      this.canvasNode = canvasNode;
    } else {
      this._initStyle(ctx);
    }

    this._initEvent();
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return this.ctx;
    }
  }

  setChart(chart) {
    this.chart = chart;
  }

  addEventListener() {
    // noop
  }

  attachEvent() {
    // noop
  }

  detachEvent() {
    // noop
  }

  _initCanvas(zrender, ctx) {
    zrender.util.getContext = function () {
      return ctx;
    };

    zrender.util.$override('measureText', function (text, font) {
      ctx.font = font || '12px sans-serif';
      return ctx.measureText(text);
    });
  }

  _initStyle(ctx) {
    ctx.createRadialGradient = () => {
      return ctx.createCircularGradient(arguments);
    };
  }

  _initEvent() {
    this.event = {};
    const eventNames = [
      {
        wxName: 'touchStart',
        ecName: 'mousedown',
      },
      {
        wxName: 'touchMove',
        ecName: 'mousemove',
      },
      {
        wxName: 'touchEnd',
        ecName: 'mouseup',
      },
      {
        wxName: 'touchEnd',
        ecName: 'click',
      },
    ];

    eventNames.forEach((name) => {
      this.event[name.wxName] = (e) => {
        const touch = e.touches[0];

        this.chart.getZr().handler.dispatch(name.ecName, {
          zrX: name.wxName === 'tap' ? touch.clientX : touch.x,
          zrY: name.wxName === 'tap' ? touch.clientY : touch.y,
          preventDefault: () => {},
          stopImmediatePropagation: () => {},
          stopPropagation: () => {},
        });
      };
    });
  }

  get width() {
    if (this.canvasNode) return this.canvasNode.width;
    return 0;
  }

  set width(w) {
    if (this.canvasNode) this.canvasNode.width = w;
  }

  get height() {
    if (this.canvasNode) return this.canvasNode.height;
    return 0;
  }

  set height(h) {
    if (this.canvasNode) this.canvasNode.height = h;
  }
}
