/**
 * Q版风格关卡选择页
 * 页面上半部分选择关卡，下半部分显示怪兽和奖励信息
 * 按钮样式、配色与首页一致
 */
import levelsConfig from '../config/levels';
import { getMonsterConfig } from '../npc/monster';
import EventEmitter from '../base/eventEmitter';

const { screenWidth, screenHeight } = wx.getSystemInfoSync();
const INFO_AREA_WIDTH = screenWidth - 80;
const BUTTON_AREA_WIDTH = INFO_AREA_WIDTH;
const BUTTON_HEIGHT = 44;
const BUTTON_RADIUS = 18;
const BUTTON_MARGIN = 28;
const MONSTER_ICON_SIZE = 44;
const REWARD_ICON_SIZE = 32;
const Q_BG_COLOR = '#ffe5f7';

function drawFancyButton(ctx, x, y, width, height, radius, text, style = 'normal') {
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

export default class LevelSelectPage extends EventEmitter {
  constructor() {
    super();
    this.levels = levelsConfig.levels.map(lvl => ({ ...lvl }));
    // 新增字段: 奖励
    this.levels.forEach(lvl => {
      if (!lvl.reward) lvl.reward = { coins: 100 * lvl.difficulty };
    });
    this.selectedLevel = this.levels.find(l => l.unlocked) || this.levels[0];
    this.monsterImages = {};
    this._preloadMonsterImages(this.selectedLevel.monsterTypes);
    this.registerTouchEvents();
  }

  _preloadMonsterImages(monsterTypes) {
    this.monsterImages = {};
    monsterTypes.forEach(type => {
      let img = (typeof wx !== 'undefined' && wx.createImage) ? wx.createImage() : new window.Image();
      img.src = getMonsterConfig(type).frames[0];
      this.monsterImages[type] = img;
    });
  }

  setSelectedLevel(level) {
    this.selectedLevel = level;
    this._preloadMonsterImages(level.monsterTypes);
  }

  render(ctx) {
    // 背景
    ctx.fillStyle = Q_BG_COLOR;
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    // 标题
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = '#f47fff';
    ctx.textAlign = 'center';
    ctx.fillText('选择关卡', screenWidth / 2, 60);
    // 支持滑动的关卡按钮区域
    const topY = 120;
    const perRow = 4;
    const rowGap = 24;
    const btnAreaW = BUTTON_AREA_WIDTH;
    // 计算正方形按钮宽高和间距：每行4个，按钮之间gap=24px
    const btnGap = 24;
    const btnW = (btnAreaW - btnGap * (perRow - 1)) / perRow;
    const btnH = btnW;
    const total = this.levels.length;
    const rows = Math.ceil(total / perRow);
    let scrollY = this._scrollY || 0;
    // 裁剪区域（防止溢出）
    ctx.save();
    ctx.beginPath();
    // 裁剪区域向左、右各多留一点阴影空间，防止按钮被遮挡
    const clipPad = 12;
    ctx.rect((screenWidth-btnAreaW)/2 - clipPad, topY - clipPad, btnAreaW + clipPad*2, (btnH * 2 + rowGap * 1.5) + clipPad*2);
    ctx.clip();
    for (let i = 0; i < total; ++i) {
      const rowIdx = Math.floor(i / perRow);
      const colIdx = i % perRow;
      const x = (screenWidth-btnAreaW)/2 + colIdx * (btnW + btnGap);
      const y = topY + rowIdx * (btnH + rowGap) + scrollY;
      let btnStyle = 'normal';
      if (this.currentLevelId && this.levels[i].id === this.currentLevelId) {
        btnStyle = 'current';
      } else if (this.selectedLevel && this.levels[i].id === this.selectedLevel.id) {
        btnStyle = 'selected';
      }
      drawFancyButton(ctx, x, y, btnW, btnH, BUTTON_RADIUS, (this.levels[i].id).toString(), btnStyle);
      if (!this.levels[i].unlocked) {
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(x + btnW - 22, y + 22, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('锁', x + btnW - 22, y + 27);
        ctx.restore();
      }
      this.levels[i]._btnRect = { x, y, width: btnW, height: btnH };
    }
    ctx.restore();
    // 下半部分: 只显示怪兽和奖励
    const infoY = topY + btnH * 2 + rowGap * 1.5 + 30;
    const infoW = screenWidth - 80, infoH = 140;
    ctx.save();
    ctx.strokeStyle = '#f47fff';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    // 使用按钮同款圆角
    const r = BUTTON_RADIUS;
    ctx.moveTo(40 + r, infoY);
    ctx.lineTo(screenWidth - 40 - r, infoY);
    ctx.arcTo(screenWidth - 40, infoY, screenWidth - 40, infoY + r, r);
    ctx.lineTo(screenWidth - 40, infoY + infoH - r);
    ctx.arcTo(screenWidth - 40, infoY + infoH, screenWidth - 40 - r, infoY + infoH, r);
    ctx.lineTo(40 + r, infoY + infoH);
    ctx.arcTo(40, infoY + infoH, 40, infoY + infoH - r, r);
    ctx.lineTo(40, infoY + r);
    ctx.arcTo(40, infoY, 40 + r, infoY, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // 怪兽类型和奖励左对齐且垂直分布
    let detailLeft = 60;
    let detailTop = infoY + 50;
    // 怪兽
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('敌人：', detailLeft, detailTop);
    this.selectedLevel.monsterTypes.forEach((type, i) => {
      ctx.save();
      const img = this.monsterImages[type];
      // 只在图片加载完成后绘制，顶部与文字顶部对齐
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.drawImage(
          img,
          detailLeft + 75 + i * 60 - MONSTER_ICON_SIZE / 2,
          detailTop - MONSTER_ICON_SIZE * 0.7, // 顶部对齐“怪兽：”
          MONSTER_ICON_SIZE,
          MONSTER_ICON_SIZE
        );
      }
      ctx.restore();
    });
    // 奖励
    detailTop += 50;
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('奖励：', detailLeft, detailTop);
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(detailLeft + 75, detailTop - 5, REWARD_ICON_SIZE/2, 0, Math.PI*2);
    ctx.fill();
    ctx.font = '18px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('币', detailLeft + 150, detailTop + 2);
    ctx.restore();
    ctx.font = '20px Arial';
    ctx.fillStyle = '#f47fff';
    ctx.textAlign = 'left';
    ctx.fillText('x ' + this.selectedLevel.reward.coins, detailLeft + 100, detailTop + 5);
    // 返回按钮
    drawFancyButton(ctx, screenWidth/2 - 100, screenHeight - 90, 200, 60, 18, '返回');
    this._backBtnRect = { x: screenWidth/2 - 100, y: screenHeight - 90, width: 200, height: 60 };
  }

  registerTouchEvents() {
    wx.onTouchEnd && wx.onTouchEnd((event) => {
      const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
      if (!t) return;
      const x = t.clientX, y = t.clientY;
      // 检查关卡按钮
      for (let lvl of this.levels) {
        const r = lvl._btnRect;
        if (r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
          if (!lvl.unlocked) return;
          this.setSelectedLevel(lvl);
          this.emit('selectLevel', lvl);
          return;
        }
      }
      // 检查返回按钮
      const r = this._backBtnRect;
      if (r && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height) {
        this.emit('back');
        return;
      }
    });
    // 支持滑动（上下拖动）
    let lastY = null;
    wx.onTouchMove && wx.onTouchMove((event) => {
      const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
      if (!t) return;
      if (lastY !== null) {
        let delta = t.clientY - lastY;
        this._scrollY = Math.max(Math.min((this._scrollY || 0) + delta, 0), -((Math.ceil(this.levels.length/4)-2)*(BUTTON_HEIGHT+24)));
      }
      lastY = t.clientY;
    });
    wx.onTouchStart && wx.onTouchStart((event) => {
      const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
      if (!t) return;
      lastY = t.clientY;
    });
    wx.onTouchEnd && wx.onTouchEnd(() => { lastY = null; });
  }

  getSelectedLevel() {
    return this.selectedLevel;
  }
}
