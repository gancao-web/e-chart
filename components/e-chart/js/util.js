/* 随机生成元素id */
export function getRandomId() {
  return `chart_${Math.random().toString(36).substring(2, 16)}`;
}

/** 加rpx单位 */
export function addUnitRpx(num) {
  return isNaN(Number(num)) ? num : `${num}rpx`;
}

/** 转换触摸事件的坐标 */
export function getZrXy(e) {
  const touch = e.touches[0];

  return { zrX: touch?.x, zrY: touch?.y };
}

/** 包装触摸事件 */
export function wrapTouch(e) {
  for (let i = 0; i < e.touches.length; ++i) {
    const touch = e.touches[i];

    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }

  return e;
}
