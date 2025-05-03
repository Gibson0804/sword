import Animation from '../base/animation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const SPLASH_IMG_SRC = 'images/attack/splash.png';
const SPLASH_WIDTH = 40;
const SPLASH_HEIGHT = 40;
const SPLASH_FRAME_COUNT = 4;

/**
 * splash攻击类
 * 自动追踪最近的敌人
 */
export default class Splash extends Animation {
  constructor() {
    super(SPLASH_IMG_SRC, SPLASH_WIDTH, SPLASH_HEIGHT);
    
    // 初始化帧动画
    this.initFrames();
  }

  initFrames() {
    // 创建帧动画
    const frames = [];
    for (let i = 0; i < SPLASH_FRAME_COUNT; i++) {
      frames.push({
        srcX: 0,
        srcY: SPLASH_HEIGHT * (SPLASH_FRAME_COUNT - 1 - i),
        width: SPLASH_WIDTH,
        height: SPLASH_HEIGHT
      });
    }
    this.frames = frames;
    this.frameIndex = 0; // 默认显示第一帧
    this.frameCount = frames.length;
  }

  init(x, y, speed, damage = 2) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage; // 伤害值，默认为普通子弹的2倍
    
    this.isActive = true;
    this.visible = true;
    this.isHit = false; // 是否已命中目标
    
    // 重置为第一帧
    this.frameIndex = 0;
    
    // 默认角度，正上方
    this.angle = 0;
    
    // 寻找最近的怪兽作为目标
    this.targetMonster = this.findNearestMonster();
    
    // 计算移动方向
    if (this.targetMonster) {
      this.calculateDirection();
    } else {
      // 如果没有目标，默认向上移动
      this.directionX = 0;
      this.directionY = -1;
      this.angle = 0;
    }
  }

  // 寻找最近的怪兽
  findNearestMonster() {
    if (!GameGlobal.databus.monsters.length) {
      return null;
    }
    
    let nearestMonster = null;
    let minDistance = Infinity;
    
    GameGlobal.databus.monsters.forEach(monster => {
      if (monster.isActive) {
        const dx = monster.x + monster.width / 2 - (this.x + this.width / 2);
        const dy = monster.y + monster.height / 2 - (this.y + this.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestMonster = monster;
        }
      }
    });
    
    return nearestMonster;
  }
  
  // 计算移动方向
  calculateDirection() {
    if (!this.targetMonster || !this.targetMonster.isActive) {
      // 如果目标不存在或已经被销毁，重新寻找目标
      this.targetMonster = this.findNearestMonster();
      if (!this.targetMonster) {
        // 如果没有可用目标，向上移动
        this.directionX = 0;
        this.directionY = -1;
        this.angle = 0;
        return;
      }
    }
    
    // 计算目标中心点
    const targetCenterX = this.targetMonster.x + this.targetMonster.width / 2;
    const targetCenterY = this.targetMonster.y + this.targetMonster.height / 2;
    
    // 计算当前位置中心点
    const currentCenterX = this.x + this.width / 2;
    const currentCenterY = this.y + this.height / 2;
    
    // 计算方向向量
    const dx = targetCenterX - currentCenterX;
    const dy = targetCenterY - currentCenterY;
    
    // 计算向量长度
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 计算角度，使用atan2函数
    this.angle = Math.atan2(dy, dx) + Math.PI / 2; // 加上90度，因为图片默认朝上
    
    // 归一化方向向量
    if (distance > 0) {
      this.directionX = dx / distance;
      this.directionY = dy / distance;
    } else {
      // 如果长度为0（已经在目标位置），向上移动
      this.directionX = 0;
      this.directionY = -1;
      this.angle = 0;
    }
  }

  // 每一帧更新splash攻击位置
  update() {
    if (GameGlobal.databus.isGameOver) {
      return;
    }
    
    if (this.isHit) {
      // 如果已命中，播放爆炸动画
      // 每隔5帧切换一次动画帧，使爆炸效果不会太快
      if (GameGlobal.databus.frame % 5 === 0) {
        this.frameIndex++;
        
        // 动画播放完毕后销毁
        if (this.frameIndex >= this.frameCount) {
          this.destroy();
        }
      }
      return;
    }
    
    // 如果目标不存在或已经被销毁，重新计算方向
    if (!this.targetMonster || !this.targetMonster.isActive) {
      this.calculateDirection();
    }
    
    // 更新位置
    this.x += this.directionX * this.speed;
    this.y += this.directionY * this.speed;
    
    // 检查是否超出屏幕
    if (this.x < -this.width || this.x > SCREEN_WIDTH ||
        this.y < -this.height || this.y > SCREEN_HEIGHT) {
      this.destroy();
      return;
    }
    
    // 检查是否命中目标
    this.checkHit();
  }
  
  // 检查是否命中目标
  checkHit() {
    for (let i = 0; i < GameGlobal.databus.monsters.length; i++) {
      const monster = GameGlobal.databus.monsters[i];
      
      if (monster.isActive && this.isCollideWith(monster)) {
        // 命中怪兽
        monster.hp -= this.damage;
        
        // 播放命中音效
        if (GameGlobal.musicManager && GameGlobal.musicManager.playHit) {
          GameGlobal.musicManager.playHit();
        }
        
        // 标记为已命中，开始播放爆炸动画
        this.isHit = true;
        this.frameIndex = 1; // 从第二帧开始播放爆炸动画
        
        // 如果怪兽死亡
        if (monster.hp <= 0) {
          monster.destroy();
          GameGlobal.databus.score += monster.score;
        }
        
        break;
      }
    }
  }

  // 检测splash攻击是否与目标碰撞
  isCollideWith(target) {
    if (!this.isActive || !target.isActive) {
      return false;
    }

    // 简单矩形碰撞检测
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    const targetTop = target.y;
    const targetBottom = target.y + target.height;

    const splashLeft = this.x;
    const splashRight = this.x + this.width;
    const splashTop = this.y;
    const splashBottom = this.y + this.height;

    return !(
      splashRight < targetLeft ||
      splashLeft > targetRight ||
      splashBottom < targetTop ||
      splashTop > targetBottom
    );
  }

  // 渲染splash攻击
  render(ctx) {
    if (!this.visible) return;
    
    // 获取当前帧
    const frame = this.frames[this.frameIndex];
    // 保存当前画布状态
    ctx.save();

    // 移动画布原点到splash中心
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    // 旋转画布
    ctx.rotate(this.angle);

    // 绘制splash（注意坐标变为相对中心点的偏移）
    ctx.drawImage(
      this.img,
      frame.srcX,
      frame.srcY,
      frame.width,
      frame.height,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );

    // 恢复画布状态
    ctx.restore();
  }

  destroy() {
    this.isActive = false;
    this.remove();
  }

  remove() {
    this.isActive = false;
    this.visible = false;
    // 回收splash对象
    GameGlobal.databus.removeSplash(this);
  }
}
