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
 * 绘制渐变按钮（填充+描边+居中文字）
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {string} colorStart - 渐变起始色
 * @param {string} colorEnd - 渐变结束色
 * @param {string} text - 按钮文字
 * @param {object} [options] - 可选配置
 * @param {string} [options.font='14px Arial, "PingFang SC", "Microsoft YaHei", sans-serif']
 * @param {string} [options.textColor='#ffffff']
 * @param {string} [options.strokeColor='rgba(255,255,255,0.5)']
 * @param {boolean} [options.pressed=false]
 */
function drawButton(ctx, x, y, width, height, radius, colorStart, colorEnd, text, options) {
  const opts = options || {};
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  ctx.fillStyle = gradient;
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
  if (opts.pressed) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fill();
  }
  ctx.strokeStyle = opts.strokeColor || 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = opts.textColor || '#ffffff';
  ctx.font = opts.font || '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
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
    x: touch.clientX || touch.x || touch.pageX || 0,
    y: touch.clientY || touch.y || touch.pageY || 0
  };
}

class LayoutRect {
  constructor(x, y, w, h) {
    this.x = x; this.y = y; this.w = w; this.h = h;
  }
  contains(px, py) {
    return px >= this.x && px <= this.x + this.w &&
           py >= this.y && py <= this.y + this.h;
  }
  get centerX() { return this.x + this.w / 2; }
  get centerY() { return this.y + this.h / 2; }
}

module.exports = {
  drawRoundedRect,
  drawButton,
  getTouchCoords,
  LayoutRect
};
