import Emitter from '../libs/tinyemitter';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const atlas = wx.createImage();
atlas.src = 'images/Common.png';

export default class GameInfo extends Emitter {
  showVictory = false;
  _winDialogBtns = [
    { key: 'next', text: '进入下一关' },
    { key: 'back', text: '确定' }
  ];
  _winDialogBtnRects = [];
  constructor() {
    super();
    // ...原有内容...
    wx.onTouchEnd && wx.onTouchEnd(this._handleVictoryTouch.bind(this));
  
    super();

    this.btnArea = {
      startX: SCREEN_WIDTH / 2 - 40,
      startY: SCREEN_HEIGHT / 2 - 100 + 180,
      endX: SCREEN_WIDTH / 2 + 50,
      endY: SCREEN_HEIGHT / 2 - 100 + 255,
    };

    // 绑定触摸事件
    wx.onTouchStart(this.touchEventHandler.bind(this))
  }

  setFont(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
  }

  render(ctx) {
    if (this.showVictory) {
      this._renderWinDialog(ctx);
      return;
    }
    this.renderGameInfo(ctx); // 绘制游戏信息（分数、生命值等）

    // 游戏结束时停止帧循环并显示游戏结束画面
    if (GameGlobal.databus.isGameOver) {
      this.renderGameOver(ctx, GameGlobal.databus.score); // 绘制游戏结束画面
    }
  }

  setVictory(flag) {
    if (this.showVictory !== flag) this.showVictory = flag;
  }

  _renderWinDialog(ctx) {
    // 弹窗位置和样式
    const w = 380, h = 230;
    const x = (SCREEN_WIDTH - w) / 2, y = (SCREEN_HEIGHT - h) / 2;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#f47fff';
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = '#f47fff';
    ctx.textAlign = 'center';
    ctx.fillText('胜利!', x + w / 2, y + 55);
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('恭喜你通过本关', x + w / 2, y + 100);
    // 按钮
    this._winDialogBtnRects = [];
    const btnW = 140, btnH = 46, btnGap = 30;
    for (let i = 0; i < this._winDialogBtns.length; i++) {
      const btnX = x + w / 2 - btnW - btnGap / 2 + i * (btnW + btnGap);
      const btnY = y + h - 80;
      ctx.fillStyle = '#ffe066';
      ctx.strokeStyle = '#b97a00';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(btnX + 16, btnY);
      ctx.lineTo(btnX + btnW - 16, btnY);
      ctx.arcTo(btnX + btnW, btnY, btnX + btnW, btnY + 16, 16);
      ctx.lineTo(btnX + btnW, btnY + btnH - 16);
      ctx.arcTo(btnX + btnW, btnY + btnH, btnX + btnW - 16, btnY + btnH, 16);
      ctx.lineTo(btnX + 16, btnY + btnH);
      ctx.arcTo(btnX, btnY + btnH, btnX, btnY + btnH - 16, 16);
      ctx.lineTo(btnX, btnY + 16);
      ctx.arcTo(btnX, btnY, btnX + 16, btnY, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.font = '22px Arial';
      ctx.fillStyle = '#222';
      ctx.textAlign = 'center';
      ctx.fillText(this._winDialogBtns[i].text, btnX + btnW / 2, btnY + btnH / 2 + 8);
      this._winDialogBtnRects.push({ x: btnX, y: btnY, w: btnW, h: btnH, key: this._winDialogBtns[i].key });
    }
    ctx.restore();
  }

  _handleVictoryTouch(event) {
    if (!this.showVictory) return;
    console.log('handleVictoryTouch1 ', event);
    const t = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
    console.log('handleVictoryTouch2 ', event);
    if (!t) return;
    const x = t.clientX, y = t.clientY;
    console.log('handleVictoryTouch ', x, y);
    for (const btn of this._winDialogBtnRects) {
      if (
        x >= btn.x && x <= btn.x + btn.w &&
        y >= btn.y && y <= btn.y + btn.h
      ) {
        if (btn.key === 'next') {
          console.log('handleVictoryTouch ', 'next');
          this.emit('nextLevel');
        } else if (btn.key === 'back') {
          console.log('handleVictoryTouch ', 'back');
          this.emit('returnHome');
        }
        break;
      }
    }
  }

  renderGameInfo(ctx) {
    this.setFont(ctx);
    // --- 只保留金币、怪兽数量、波数 ---
    // 绘制金币图标和数量
    const coinY = 100;
    if (!this.coinImg) {
      this.coinImg = wx.createImage();
      this.coinImg.src = 'images/ui/coin.png';
    }
    ctx.drawImage(this.coinImg, 10, coinY, 28, 28);
    ctx.font = '22px Arial';
    // coins 显示修正，确保为数字
    let coins = Number(GameGlobal.databus.coins);
    if (isNaN(coins)) coins = 0;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(`${coins}`, 45, coinY + 20);
    ctx.fillStyle = '#ff4500';
    ctx.fillText(`${coins}`, 45, coinY + 20);

    // 绘制怪兽数量
    ctx.font = '20px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`怪兽: ${GameGlobal.databus.monsters.length}`, 10, coinY + 50);
    // 显示当前波数
    if (GameGlobal.databus.currentWave && GameGlobal.databus.totalWave) {
      ctx.fillStyle = '#00eaff';
      ctx.fillText(`第${GameGlobal.databus.currentWave}/${GameGlobal.databus.totalWave}波`, 10, coinY + 80);
    }
  }

  renderGameOver(ctx, score) {
    this.drawGameOverImage(ctx);
    this.drawGameOverText(ctx, score);
    this.drawRestartButton(ctx);
  }

  drawGameOverImage(ctx) {
    ctx.drawImage(
      atlas,
      0,
      0,
      119,
      108,
      SCREEN_WIDTH / 2 - 150,
      SCREEN_HEIGHT / 2 - 100,
      300,
      300
    );
  }

  drawGameOverText(ctx, score) {
    this.setFont(ctx);
    ctx.fillText(
      '游戏结束',
      SCREEN_WIDTH / 2 - 40,
      SCREEN_HEIGHT / 2 - 100 + 50
    );
    ctx.fillText(
      `得分: ${score}`,
      SCREEN_WIDTH / 2 - 40,
      SCREEN_HEIGHT / 2 - 100 + 130
    );
  }

  drawRestartButton(ctx) {
    ctx.drawImage(
      atlas,
      120,
      6,
      39,
      24,
      SCREEN_WIDTH / 2 - 60,
      SCREEN_HEIGHT / 2 - 100 + 180,
      120,
      40
    );
    ctx.fillText(
      '重新开始',
      SCREEN_WIDTH / 2 - 40,
      SCREEN_HEIGHT / 2 - 100 + 205
    );
  }

  touchEventHandler(event) {
    const { clientX, clientY } = event.touches[0]; // 获取触摸点的坐标

    // 当前只有游戏结束时展示了UI，所以只处理游戏结束时的状态
    if (GameGlobal.databus.isGameOver) {
      // 检查触摸是否在按钮区域内
      if (
        clientX >= this.btnArea.startX &&
        clientX <= this.btnArea.endX &&
        clientY >= this.btnArea.startY &&
        clientY <= this.btnArea.endY
      ) {
        // 调用重启游戏的回调函数
        this.emit('restart');
      }
    }
  }
}
