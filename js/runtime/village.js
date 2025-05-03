import Sprite from '../base/sprite';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const VILLAGE_IMG_SRC = 'images/player/house_small.png'; // 需要替换为村庄图片
const VILLAGE_WIDTH = 200;
const VILLAGE_HEIGHT = 80;

export default class Village extends Sprite {
  constructor() {
    super(VILLAGE_IMG_SRC, VILLAGE_WIDTH, VILLAGE_HEIGHT);
    this.init();
  }

  init() {
    // 村庄位于屏幕底部中央
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT - this.height;
    
    this.maxHealth = GameGlobal.databus.villageHealth;
    this.health = this.maxHealth;
    this.isActive = true;
    this.visible = true;
    this.isAlive = true;
  }

  // 村庄受到伤害
  takeDamage(damage) {
    this.health -= damage;
    
    // 震动反馈
    wx.vibrateShort({
      type: 'medium'
    });
    
    // 如果生命值小于等于0，村庄被摧毁
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
    }
  }

  // 检测村庄是否与目标碰撞
  isCollideWith(target) {
    if (!this.isActive || !target.isActive) {
      return false;
    }

    // 简单矩形碰撞检测
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    const targetTop = target.y;
    const targetBottom = target.y + target.height;

    const villageLeft = this.x;
    const villageRight = this.x + this.width;
    const villageTop = this.y;
    const villageBottom = this.y + this.height;

    return !(
      villageRight < targetLeft ||
      villageLeft > targetRight ||
      villageBottom < targetTop ||
      villageTop > targetBottom
    );
  }

  // 绘制村庄及其生命值
  render(ctx) {
    if (!this.visible) return;

    super.render(ctx);
    
    // 绘制村庄生命值条
    this.renderHealthBar(ctx);
  }
  
  // 绘制生命值条
  renderHealthBar(ctx) {
    const barWidth = this.width;
    const barHeight = 10;
    const barX = this.x;
    const barY = this.y - barHeight - 5;
    
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
    // 更新村庄状态，可以添加一些动画效果
    if (GameGlobal.databus.isGameOver) {
      return;
    }
    
    // 确保村庄生命值与全局数据同步
    this.maxHealth = GameGlobal.databus.villageHealth;
  }

  destroy() {
    this.isActive = false;
    this.isAlive = false;
    
    // 播放村庄被摧毁的效果
    GameGlobal.musicManager.playExplosion();
    
    // 强烈震动反馈
    wx.vibrateLong();
  }
}
