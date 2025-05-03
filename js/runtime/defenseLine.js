import Sprite from '../base/sprite';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const DEFENSE_LINE_IMG_SRC = 'images/player/gate_top.png'; // 需要替换为防线图片
const DEFENSE_LINE_WIDTH = SCREEN_WIDTH;
const DEFENSE_LINE_HEIGHT = 20;

export default class DefenseLine extends Sprite {
  constructor() {
    super(DEFENSE_LINE_IMG_SRC, DEFENSE_LINE_WIDTH, DEFENSE_LINE_HEIGHT);
    this.init();
  }

  init() {
    // 防线位于玩家前方
    this.x = 0;
    this.y = SCREEN_HEIGHT - 180; // 位于玩家上方，村庄下方
    
    this.maxHealth = GameGlobal.databus.defenseLineHealth;
    this.health = this.maxHealth;
    this.isActive = true;
    this.visible = true;
    this.isAlive = true;
  }

  // 防线受到伤害
  takeDamage(damage) {
    this.health -= damage;
    
    // 震动反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    // 如果生命值小于等于0，防线被摧毁
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
    }
  }

  // 检测防线是否与目标碰撞
  isCollideWith(target) {
    if (!this.isActive || !target.isActive) {
      return false;
    }

    // 简单矩形碰撞检测
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    const targetTop = target.y;
    const targetBottom = target.y + target.height;

    const lineLeft = this.x;
    const lineRight = this.x + this.width;
    const lineTop = this.y;
    const lineBottom = this.y + this.height;

    return !(
      lineRight < targetLeft ||
      lineLeft > targetRight ||
      lineBottom < targetTop ||
      lineTop > targetBottom
    );
  }

  // 绘制防线及其生命值
  render(ctx) {
    if (!this.visible) return;
    
    if (this.isAlive) {
      super.render(ctx);
      
      // 绘制防线生命值条
      this.renderHealthBar(ctx);
    }
  }
  
  // 绘制生命值条
  renderHealthBar(ctx) {
    const barWidth = this.width;
    const barHeight = 5;
    const barX = this.x;
    const barY = this.y - barHeight - 2;
    
    // 背景条
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // 生命值条
    const healthPercentage = this.health / this.maxHealth;
    const healthBarWidth = barWidth * healthPercentage;
    
    // 根据生命值百分比改变颜色
    if (healthPercentage > 0.6) {
      ctx.fillStyle = '#00FF00'; // 绿色
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = '#FFFF00'; // 黄色
    } else {
      ctx.fillStyle = '#FF0000'; // 红色
    }
    
    ctx.fillRect(barX, barY, healthBarWidth, barHeight);
  }

  update() {
    // 更新防线状态
    if (GameGlobal.databus.isGameOver) {
      return;
    }
    
    // 确保防线生命值与全局数据同步
    this.maxHealth = GameGlobal.databus.defenseLineHealth;
  }

  destroy() {
    this.isActive = false;
    this.isAlive = false;
    
    // 播放防线被摧毁的效果
    GameGlobal.musicManager.playExplosion();
    
    // 中等震动反馈
    wx.vibrateShort({
      type: 'medium'
    });
  }
}
