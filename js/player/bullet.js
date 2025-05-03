import Sprite from '../base/sprite';

const BULLET_IMG_SRC = 'images/arrow.png'; // 替换为箭矢或其他适合守护村庄主题的子弹图片
const BULLET_WIDTH = 16;
const BULLET_HEIGHT = 30;

export default class Bullet extends Sprite {
  constructor() {
    super(BULLET_IMG_SRC, BULLET_WIDTH, BULLET_HEIGHT);
  }

  init(x, y, speed, damage = 1) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.damage = damage; // 子弹伤害值
    this.isActive = true;
    this.visible = true;
  }

  // 每一帧更新子弹位置
  update() {
    if (GameGlobal.databus.isGameOver) {
      return;
    }
  
    this.y -= this.speed;

    // 超出屏幕外销毁
    if (this.y < -this.height) {
      this.destroy();
    }
  }

  /**
   * 检测子弹是否与目标碰撞
   * @param {Object} target - 目标对象
   * @return {Boolean} - 是否碰撞
   */
  isCollideWith(target) {
    if (!this.isActive || !target.isActive) {
      return false;
    }

    // 简单矩形碰撞检测
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    const targetTop = target.y;
    const targetBottom = target.y + target.height;

    const bulletLeft = this.x;
    const bulletRight = this.x + this.width;
    const bulletTop = this.y;
    const bulletBottom = this.y + this.height;

    return !(
      bulletRight < targetLeft ||
      bulletLeft > targetRight ||
      bulletBottom < targetTop ||
      bulletTop > targetBottom
    );
  }

  destroy() {
    this.isActive = false;
    // 子弹没有销毁动画，直接移除
    this.remove();
  }

  remove() {
    this.isActive = false;
    this.visible = false;
    // 回收子弹对象
    GameGlobal.databus.removeBullets(this);
  }
}
