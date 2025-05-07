// 通用 Fancy 按钮绘制工具，支持多种样式，适用于主页面、关卡选择等

/**
 * 绘制一个圆角渐变按钮，可选样式
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 * @param {string} text
 * @param {string} style 可选: 'normal' | 'current' | 'selected'
 */
export function drawFancyButton(ctx, x, y, width, height, radius= 18, text, style = 'normal') {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  let grad;
  if (style === 'current') {
    grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, '#6ee7b7'); // 绿色渐变
    grad.addColorStop(1, '#34d399');
    ctx.strokeStyle = '#059669';
  } else if (style === 'selected') {
    grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, '#e0aaff'); // 紫色渐变
    grad.addColorStop(1, '#b983ff');
    ctx.strokeStyle = '#9d4edd';
  } else {
    grad = ctx.createLinearGradient(x, y, x, y + height);
    grad.addColorStop(0, '#ffe066');
    grad.addColorStop(1, '#f7b500');
    ctx.strokeStyle = '#b97a00';
  }
  ctx.fillStyle = grad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.font = 'bold 30px Arial';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.strokeText(text, x + width / 2, y + height / 2);
  ctx.fillText(text, x + width / 2, y + height / 2);
  ctx.restore();
}
