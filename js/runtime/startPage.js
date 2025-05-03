/**
 * 游戏首页类
 * 动态背景、设置按钮、三个主按钮（样式参考图片），点击后触发事件
 */
import EventEmitter from '../base/eventEmitter';
import LevelSelectPage from './levelSelectPage';

const BG_FRAME_COUNT = 7;
const BG_FRAME_PREFIX = 'images/bg/bg_index';
const SET_ICON = 'images/ui/set.png';
const BUTTON_WIDTH = 180;
const BUTTON_HEIGHT = 70;
const BUTTON_RADIUS = 18;
const BUTTON_MARGIN = 28;
const BUTTON_FONT = 'bold 32px Arial';
const BUTTON_TEXT_COLOR = '#fff';
const BUTTON_STROKE_COLOR = '#222';
const BUTTON_GRADIENT_TOP = '#ffe066';
const BUTTON_GRADIENT_BOTTOM = '#f7b500';
const BUTTON_BORDER_COLOR = '#b97a00';

const { screenWidth, screenHeight } = wx.getSystemInfoSync();

export default class StartPage extends EventEmitter {
  /**
   * 获取当前选中的关卡编号（用于main.js启动游戏时调用）
   * @returns {number}
   */
  getCurrentLevel() {
    if (this.levelSelectPage && this.levelSelectPage.selectedLevel) {
      return this.levelSelectPage.selectedLevel.id || 1;
    }
    return 1;
  }

  currentScreen = 'home'; // 'home' or 'levelSelect'
  levelSelectPage = null;
  constructor() {
    super();
    // console.log('[StartPage] constructor called, instance id:', Math.random());
    this.bgFrames = [];
    this.bgAnimIndex = 0;
    this.bgAnimFrameCount = 0;
    this.bgAnimSpeed = 20;
    this.loadedFrames = 0;
    this.settingBtn = {
      x: screenWidth - 60,
      y: 160,
      width: 44,
      height: 44,
      icon: SET_ICON
    };
    this.settingBtnImg = wx.createImage();
    this.settingBtnImgLoaded = false;
    this.settingBtnImg.onload = () => { this.settingBtnImgLoaded = true; };
    this.settingBtnImg.src = this.settingBtn.icon;
    this.showSettingDialog = false;
    this.musicEnabled = wx.getStorageSync('musicEnabled') !== false;
    this.soundEnabled = wx.getStorageSync('soundEnabled') !== false;
    this.initBgFrames();
    this.initButtons();
    this.registerTouchEvents();
  }

  initBgFrames() {
    for (let i = 1; i <= BG_FRAME_COUNT; i++) {
      const img = wx.createImage();
      img.src = `${BG_FRAME_PREFIX}${i}.jpg`;
      img.onload = () => {
        this.loadedFrames++;
      };
      img.onerror = () => {
        // console.error('Failed to load bg frame:', img.src);
      };
      this.bgFrames.push(img);
    }
  }

  initButtons() {
    const centerX = screenWidth / 2 - BUTTON_WIDTH / 2;
    const baseY = screenHeight / 2 - BUTTON_HEIGHT - BUTTON_MARGIN;
    this.buttons = [
      {
        id: 'selectLevel',
        text: '选择关卡',
        x: centerX,
        y: baseY,
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT
      },
      {
        id: 'selectSkill',
        text: '选择技能',
        x: centerX,
        y: baseY + BUTTON_HEIGHT + BUTTON_MARGIN,
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT
      },
      {
        id: 'startGame',
        text: '开始游戏',
        x: centerX,
        y: baseY + (BUTTON_HEIGHT + BUTTON_MARGIN) * 2,
        width: BUTTON_WIDTH,
        height: BUTTON_HEIGHT
      }
    ];
  }

  updateBackground() {
    // 只要所有图片都加载完成，就循环切换
    if (this.loadedFrames < BG_FRAME_COUNT) return;
    this.bgAnimFrameCount++;
    if (this.bgAnimFrameCount >= this.bgAnimSpeed) {
      this.bgAnimFrameCount = 0;
      this.bgAnimIndex = (this.bgAnimIndex + 1) % BG_FRAME_COUNT;
    }
  }

  draw(ctx) {
    // 清除画布，确保每次重绘都是干净的
    ctx.clearRect(0, 0, screenWidth, screenHeight);
    
    // 背景
    const frame = this.bgFrames[this.bgAnimIndex];
    if (frame) {
      ctx.drawImage(frame, 0, 0, screenWidth, screenHeight);
    }
    // 按钮
    this.buttons.forEach(btn => {
      drawFancyButton(ctx, btn.x, btn.y, btn.width, btn.height, BUTTON_RADIUS, btn.text);
    });
    // 右上角设置按钮
    if (this.settingBtnImgLoaded) {
      ctx.drawImage(this.settingBtnImg, this.settingBtn.x, this.settingBtn.y, this.settingBtn.width, this.settingBtn.height);
    }
    // 设置弹窗 - 始终绘制在最上层
    if (this.showSettingDialog) {
      // console.log('[StartPage] Should show dialog, showSettingDialog =', this.showSettingDialog);
      this.drawSettingDialog(ctx);
    }
  }

  render(ctx) {
    if (this.currentScreen === 'home') {
      this.draw(ctx);
    } else if (this.currentScreen === 'levelSelect') {
      if (!this.levelSelectPage) {
        this.levelSelectPage = new LevelSelectPage();
        this.levelSelectPage.on('back', () => {
          this.currentScreen = 'home';
        });
        this.levelSelectPage.on('selectLevel', (lvl) => {
          // 可在此处处理选中关卡逻辑
        });
      }
      this.levelSelectPage.render(ctx);
    }
  }

  drawSettingDialog(ctx) {
    // console.log('[StartPage] Drawing setting dialog, screen size:', screenWidth, screenHeight);
    // 弹窗尺寸和位置
    const w = 320, h = 240;
    const x = (screenWidth - w) / 2, y = (screenHeight - h) / 2;
    // console.log('Dialog position:', x, y, 'size:', w, h);
    
    // 先保存当前绘图状态
    ctx.save();
    
    // 绘制半透明黑色遮罩，覆盖整个屏幕
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    
    // 绘制弹窗背景，使用更高对比度的颜色
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x, y, w, h);
    
    // 绘制弹窗边框
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    
    // 绘制标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('设置', x + w / 2, y + 40);
    ctx.font = '22px Arial';
    // 绘制音乐按钮
    this.musicBtnRect = {
      x: x + w / 2 - 100,
      y: y + 90,
      width: 80,
      height: 40
    };
    ctx.fillStyle = this.musicEnabled ? '#4caf50' : '#aaa';
    ctx.fillRect(this.musicBtnRect.x, this.musicBtnRect.y, this.musicBtnRect.width, this.musicBtnRect.height);
    ctx.fillStyle = '#fff';
    ctx.fillText('音乐', this.musicBtnRect.x + this.musicBtnRect.width / 2, this.musicBtnRect.y + this.musicBtnRect.height / 2 + 4);
    // 绘制音效按钮
    this.soundBtnRect = {
      x: x + w / 2 + 20,
      y: y + 90,
      width: 80,
      height: 40
    };
    ctx.fillStyle = this.soundEnabled ? '#4caf50' : '#aaa';
    ctx.fillRect(this.soundBtnRect.x, this.soundBtnRect.y, this.soundBtnRect.width, this.soundBtnRect.height);
    ctx.fillStyle = '#fff';
    ctx.fillText('音效', this.soundBtnRect.x + this.soundBtnRect.width / 2, this.soundBtnRect.y + this.soundBtnRect.height / 2 + 4);
    ctx.restore();
  }

  // 触摸事件注册
  registerTouchEvents() {
    // console.log('[StartPage] registerTouchEvents called');
    // 兼容所有微信小游戏触摸事件
    const handler = (event) => {
      // console.log('[StartPage] Touch event triggered:', event);
      // 微信小游戏事件对象，触点在 event.touches[0] 或 event.changedTouches[0]
      const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
      if (!t) return;
      // 直接使用原始触摸坐标，不需要乘以dpr
      const touchX = t.clientX;
      const touchY = t.clientY;
      // console.log('Touch:', touchX, touchY, 'SettingBtn:', this.settingBtn);
      // 设置按钮
      if (this.hitTest(this.settingBtn, {clientX: touchX, clientY: touchY})) {
        this.showSettingDialog = !this.showSettingDialog;
        // console.log('[StartPage] Setting button clicked, showSettingDialog:', this.showSettingDialog);
        // 强制重绘，确保弹窗显示
        if (this.showSettingDialog) {
          // console.log('[StartPage] Dialog should be visible now');
          // 不能直接调用 this.draw(ctx)，因为这里没有ctx
          // 设置标记，下一帧会自动重绘
        }
        return;
      }
      if (this.showSettingDialog) {
        // 检查是否点击音乐按钮
        if (this.musicBtnRect &&
            touchX >= this.musicBtnRect.x && touchX <= this.musicBtnRect.x + this.musicBtnRect.width &&
            touchY >= this.musicBtnRect.y && touchY <= this.musicBtnRect.y + this.musicBtnRect.height) {
          this.musicEnabled = !this.musicEnabled;
          wx.setStorageSync('musicEnabled', this.musicEnabled);
          if (GameGlobal.musicManager) {
            GameGlobal.musicManager.musicEnabled = this.musicEnabled;
            if (this.musicEnabled) {
              GameGlobal.musicManager.playBgm();
            } else {
              GameGlobal.musicManager.pauseBgm();
            }
          }
          // console.log('[StartPage] Music button clicked, musicEnabled:', this.musicEnabled);
          return;
        }
        // 检查是否点击音效按钮
        if (this.soundBtnRect &&
            touchX >= this.soundBtnRect.x && touchX <= this.soundBtnRect.x + this.soundBtnRect.width &&
            touchY >= this.soundBtnRect.y && touchY <= this.soundBtnRect.y + this.soundBtnRect.height) {
          this.soundEnabled = !this.soundEnabled;
          wx.setStorageSync('soundEnabled', this.soundEnabled);
          if (GameGlobal.musicManager) {
            GameGlobal.musicManager.soundEnabled = this.soundEnabled;
          }
          // 音效开关只需保存状态，播放时判断
          // console.log('[StartPage] Sound button clicked, soundEnabled:', this.soundEnabled);
          return;
        }
        // 点击弹窗其它区域，关闭弹窗
        this.showSettingDialog = false;
        // console.log('[StartPage] Dialog mask clicked, close dialog');
        return;
      }
      // 按钮
      for (let btn of this.buttons) {
        if (this.hitTest(btn, {clientX: touchX, clientY: touchY})) {
          if (btn.id === 'startGame') this.emit('startGame');
          if (btn.id === 'selectLevel') {
            this.currentScreen = 'levelSelect';
            if (!this.levelSelectPage) {
              this.levelSelectPage = new LevelSelectPage();
              this.levelSelectPage.on('back', () => {
                this.currentScreen = 'home';
              });
              this.levelSelectPage.on('selectLevel', (lvl) => {
                // 可在此处处理选中关卡逻辑
              });
            }
            return;
          }
          if (btn.id === 'selectSkill') this.emit('selectSkill');
          // console.log('[StartPage] Main button clicked:', btn.id);
          break;
        }
      }
    };
    wx.onTouchEnd && wx.onTouchEnd(handler);
    // wx.onTouchStart && wx.onTouchStart(handler); // 避免重复注册，导致弹窗一闪而过
  }

  hitTest(rect, t) {
    return t.clientX >= rect.x && t.clientX <= rect.x + rect.width && t.clientY >= rect.y && t.clientY <= rect.y + rect.height; // rect和t都用dpr后的坐标
  }
}

// 按钮样式参考图片（黄底圆角、黑白描边字）
function drawFancyButton(ctx, x, y, width, height, radius, text) {
  ctx.save();
  // 阴影
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  // 渐变
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, BUTTON_GRADIENT_TOP);
  gradient.addColorStop(1, BUTTON_GRADIENT_BOTTOM);
  // 圆角矩形
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  // 描边
  ctx.lineWidth = 3;
  ctx.strokeStyle = BUTTON_BORDER_COLOR;
  ctx.stroke();
  // 文字描边+填充
  ctx.font = BUTTON_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = BUTTON_STROKE_COLOR;
  ctx.strokeText(text, x + width / 2, y + height / 2 + 2);
  ctx.fillStyle = BUTTON_TEXT_COLOR;
  ctx.fillText(text, x + width / 2, y + height / 2 + 2);
  ctx.restore();
}
