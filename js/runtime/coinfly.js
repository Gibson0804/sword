import Sprite from '../base/sprite';

export default class Coinfly extends Sprite {
  constructor() {
    
    super('images/ui/coin.png', 28, 28);

  }

  init(startX, startY, endX, endY, value = 1) {
    this.x = startX;
    this.y = startY;
    this.endX = endX;
    this.endY = endY;
    this.value = value;
    this.radius = 10;
    this.isActive = true;
    this.onArrive = null;
    this.duration = 30; // 飞行动画帧数
    this.frame = 0;
    this.startX = startX;
    this.startY = startY;
  }

  update() {
    if (!this.isActive) return;
    this.frame++;
    const t = Math.min(this.frame / this.duration, 1);
    // 线性插值飞行动画
    this.x = this.startX + (this.endX - this.startX) * t;
    this.y = this.startY + (this.endY - this.startY) * t;
    if (t >= 1 && this.isActive) {
      this.isActive = false;
      if (typeof this.onArrive === 'function') {
        this.onArrive(this.value);
      }
    }
  }

}

