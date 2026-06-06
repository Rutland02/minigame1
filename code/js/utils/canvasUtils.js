/**
 * 绘制圆角矩形路径（仅构建路径，不填充/描边）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * 安全提取触摸坐标
 * @param {TouchList} touches
 * @param {TouchList} [changedTouches]
 * @returns {{x: number, y: number} | null}
 */
function getTouchCoords(touches, changedTouches) {
  let touch = null;
  if (touches && touches.length > 0) {
    touch = touches[0];
  } else if (changedTouches && changedTouches.length > 0) {
    touch = changedTouches[0];
  }
  if (!touch) return null;
  return {
    x: touch.x || touch.clientX || touch.pageX || 0,
    y: touch.y || touch.clientY || touch.pageY || 0
  };
}

module.exports = {
  drawRoundedRect,
  getTouchCoords
};
