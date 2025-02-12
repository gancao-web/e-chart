// 随机生成元素
export function getRandomId() {
  return `chart_${Math.random().toString(36).substring(2, 16)}`;
}
  
// 加rpx单位
export function addUnitRpx(num) {
  return isNaN(Number(num)) ? num : `${num}rpx`;
}

// 获取窗口信息
export function getWindowInfo() {
  if (uni.getWindowInfo && uni.canIUse('getWindowInfo')) {
    return uni.getWindowInfo();
  } else {
    return uni.getSystemInfoSync();
  }
}
