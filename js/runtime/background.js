import Sprite from '../base/sprite';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';

const BACKGROUND_IMAGE_SRC = 'images/bg/bg_level_1.jpg';
const BACKGROUND_WIDTH = 724;
const BACKGROUND_HEIGHT = 193; // 实际宽高可忽略，铺满屏幕用 SCREEN_WIDTH/HEIGHT

/**
 * 游戏背景类
 * 提供静态背景，不再滚动
 */
export default class BackGround extends Sprite {
  /**
   * @param {string} [imgSrc] 可选，背景图片路径
   */
  constructor(imgSrc = BACKGROUND_IMAGE_SRC) {
    super(imgSrc, BACKGROUND_WIDTH, BACKGROUND_HEIGHT);
  }

  /**
   * 切换背景图片
   * @param {string} src
   */
  setImage(src) {
    if (src && src !== this.img.src) {
      this.img.src = src;
    }
  }

  update() {
    // 背景保持静态，不需要更新
  }

  /**
   * 背景图重绘函数
   * 绘制静态背景，铺满整个屏幕
   */
  render(ctx) {
    // 用cover算法按比例铺满整个屏幕，不变形
    const img = this.img;
    const sw = img.naturalWidth || img.width;
    const sh = img.naturalHeight || img.height;
    const dw = SCREEN_WIDTH;
    const dh = SCREEN_HEIGHT;
    if (sw && sh) {
      // 计算cover区域
      const scale = Math.max(dw / sw, dh / sh);
      const tw = sw * scale;
      const th = sh * scale;
      const tx = (dw - tw) / 2;
      const ty = (dh - th) / 2;
      ctx.drawImage(img, 0, 0, sw, sh, tx, ty, tw, th);
    } else {
      // 图片未加载时，直接拉伸
      ctx.drawImage(img, 0, 0, dw, dh);
    }
  }
}
