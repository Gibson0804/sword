import Animation from '../base/animation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import monstersConfig from '../config/monsters';
import Coinfly from '../runtime/coinfly';

const EXPLO_IMG_PREFIX = 'images/explosion';

/**
 * 怪物工厂方法：根据 type 获取怪物配置
 */
export function getMonsterConfig(type) {
  return monstersConfig.monsters.find(m => m.type === type) || monstersConfig.monsters[0];
}


export default class Monster extends Animation {
  /**
   * @param {string} type 怪物类型（如'niu','feiji'）
   * @param {number} [difficulty=1] 难度系数，可选
   */
  constructor(type = 'niu', difficulty = 1) {
    // 只做基础初始化，具体属性全部由 init 重置
    const config = getMonsterConfig(type);
    // super 只传图片，不传宽高（宽高全部在 init 里赋值）
    super(config.frames[0]);
    this.init(type, difficulty);
  }

  /**
   * 对象池复用专用：重置怪兽全部属性
   * @param {string} type
   * @param {number} difficulty
   * @param {number} [frame] 可选，当前帧数
   */
  init(type = 'niu', difficulty = 1) {
    this.monsterType = type;
    this.config = getMonsterConfig(type);
    this.difficulty = difficulty;
    this.frames = this.config.frames;
    // 支持比例宽度配置
    if (this.config.width > 0 && this.config.width <= 1) {
      // 宽度为比例，自动转像素
      this.width = SCREEN_WIDTH * this.config.width;
    } else {
      this.width = this.config.width;
    }
    // 高度自适应：如未定义，则按首帧图片等比例缩放，否则直接用配置
    if (typeof this.config.height === 'undefined' || this.config.height === null) {
      // 需等图片加载后才能获取图片原始宽高
      const img = wx.createImage();
      img.src = this.frames[0];
      img.onload = () => {
        if (img.width > 0) {
          const scale = this.width / img.width;
          this.height = img.height * scale;
        } else {
          this.height = this.width;
        }
      };
      // 先用宽度占位，高度稍后回填
      this.height = this.width;
    } else if (this.config.height > 0 && this.config.height <= 1) {
      // 比例高度
      this.height = SCREEN_HEIGHT * this.config.height;
    } else {
      this.height = this.config.height;
    }
    this.x = this.getRandomX();
    this.y = -this.height;
    this.initAttributes();
    this.isActive = true;
    this.visible = true;
    this.isAlive = true;
    // 初始化动画帧（微信环境下会自动预加载）
    this.initFrames(this.config.frames);
    // 设置动画播放间隔（如180ms，越大越慢）
    this.interval = 180;
    // 启动动画自动播放
    this.playAnimation(0, true);
    // 可根据 frame 做特殊处理

  }

  /**
   * 初始化属性（血量、速度、分数等）
   */
  initAttributes() {
    const cfg = this.config;
    const diff = this.difficulty || 1;
    this.hp = cfg.hp * diff;
    this.maxHp = this.hp;
    this.speed = cfg.speed * (1 + 0.1 * (diff - 1));
    this.attack = cfg.attack;
    this.score = cfg.score;
    this.healthBarWidth = this.width;
    this.healthBarHeight = 4;
    this.healthBarY = -this.healthBarHeight - 2;
  }

  /**
   * 切换动画帧
   */


  /**
   * 怪物主更新逻辑
   */
  update() {
    this.y += this.speed;
    // 其他行为逻辑...
  }

  /**
   * 设置爆炸动画（可扩展）
   */
  initExplosionAnimation() {
    // ...保留原逻辑或自定义爆炸动画
  }


  getMonsterTypeIndex(currentFrame) {
    const level = Math.floor(currentFrame / 1000); // 每1000帧为一个难度等级
    
    // 随着等级提高，出现更强大怪兽的概率增加
    const rand = Math.random();
    
    if (level >= 10 && rand < 0.1) {
      return 3; // 10%概率出现Boss
    } else if (level >= 5 && rand < 0.3) {
      return 2; // 30%概率出现坦克怪兽
    } else if (level >= 2 && rand < 0.5) {
      return 1; // 50%概率出现快速怪兽
    } else {
      return 0; // 普通怪兽
    }
  }

  // 生成随机 X 坐标
  getRandomX() {
    const width = SCREEN_WIDTH * 0.3;
    let x = Math.random() * (SCREEN_WIDTH - width) + width * 0.5;
    return x;
  }

  // 预定义爆炸的帧动画
  initExplosionAnimation() {
    const EXPLO_FRAME_COUNT = 19;
    const frames = Array.from(
      { length: EXPLO_FRAME_COUNT },
      (_, i) => `${EXPLO_IMG_PREFIX}${i + 1}.png`
    );
    this.initFrames(frames);
  }

  // 每一帧更新怪兽位置
  update() {

    // // 死亡怪兽兜底回收：如果已死亡但还未被回收，立即回收
    // if (!this.isAlive && this.isActive) {
    //   this.remove();
    //   return;
    // }

    // if (GameGlobal.databus.isGameOver) {
    //   return;
    // }
    // 检查是否需要冲刺
    this.checkSprint();
    
    // 向下移动
    this.y += this.speed;
    
    // 如果怪兽走过屏幕一半，开始向中间靠近
    if (this.y > SCREEN_HEIGHT / 2) {
      // 计算屏幕中心点
      const screenCenterX = SCREEN_WIDTH / 2;
      
      // 怪兽当前中心点
      const monsterCenterX = this.x + this.width / 2;
      
      // 到中心的距离
      const distanceToCenter = screenCenterX - monsterCenterX;
      
      // 根据距离决定移动方向和速度
      if (Math.abs(distanceToCenter) > 5) { // 如果距离足够大
        // 横向移动速度为纵向速度的0.5倍
        const horizontalSpeed = this.speed * 0.5 * (distanceToCenter > 0 ? 1 : -1);
        this.x += horizontalSpeed;
      }
    }

    // 对象回收
    if (this.y > SCREEN_HEIGHT + this.height) {
      this.remove();
    }
  }
  
  // 检查是否需要冲刺
  checkSprint() {
    // 当怪兽接近防线时，有一定概率冲刺
    const defenseLineY = SCREEN_HEIGHT - 180; // 防线的Y坐标，与防线类中的设置一致
    const distanceToDefenseLine = defenseLineY - (this.y + this.height);
    
    // 当怪兽距离防线小于100像素时，有一定概率冲刺
    if (distanceToDefenseLine < 100 && distanceToDefenseLine > 0 && !this.isSprinting) {
      // 根据怪兽类型决定冲刺概率
      let sprintChance = 0;
      
      // type为字符串，如'niu'、'feiji'，可根据需要自定义更多类型
      switch (this.monsterType) {
        case 'feiji': // 假设feiji为快速怪兽
          sprintChance = 0.4;
          break;
        // 你可以根据实际配置扩展更多类型
        default:
          sprintChance = 0.2;
      }
      
      // 随机决定是否冲刺
      if (Math.random() < sprintChance) {
        this.startSprint();
      }
    }
  }
  
  // 开始冲刺
  startSprint() {
    this.isSprinting = true;
    this.originalSpeed = this.speed;
    this.speed *= 2; // 速度翻倍
    
    // 改变外观（可以通过改变颜色或其他方式来表示）
    this.sprintTimer = setTimeout(() => {
      // 冲刺结束，恢复原始速度
      if (this.isActive) {
        this.speed = this.originalSpeed;
        this.isSprinting = false;
      }
    }, 1000); // 冲刺持续1秒
  }

  // 怪兽受到伤害
  takeDamage(damage) {
    this.hp -= damage;
    
    // 如果生命值小于等于0，怪兽死亡并立即回收
    if (this.hp <= 0) {
      this.isAlive = false;
      this.destroy();
    }
  }

  // 检测怪兽是否与目标碰撞
  isCollideWith(target) {
    if (!this.isActive || !target.isActive) {
      return false;
    }

    // 简单矩形碰撞检测
    const targetLeft = target.x;
    const targetRight = target.x + target.width;
    const targetTop = target.y;
    const targetBottom = target.y + target.height;

    const monsterLeft = this.x;
    const monsterRight = this.x + this.width;
    const monsterTop = this.y;
    const monsterBottom = this.y + this.height;

    return !(
      monsterRight < targetLeft ||
      monsterLeft > targetRight ||
      monsterBottom < targetTop ||
      monsterTop > targetBottom
    );
  }

  destroy() {



    // 生成金币飞行动画
    if (!GameGlobal.databus.coinFlies) GameGlobal.databus.coinFlies = [];
    // 怪兽中心点
    const startX = this.x + this.width / 2;
    const startY = this.y + this.height / 2;
    // 金币目标点（页面金币文案处，约定为固定坐标）
    const endX = 54, endY = 120; // 与gameinfo.js金币文案位置对应

    const coinFlyNew = GameGlobal.databus.pool.getItemByClass('coinFly', Coinfly);
    coinFlyNew.init(startX, startY, endX, endY, this.score);
    coinFlyNew.onArrive = () => {
      GameGlobal.databus.removeCoinFly(coinFlyNew);
    };
    GameGlobal.databus.coinFlies.push(coinFlyNew);

    GameGlobal.databus.coins += this.score;

    GameGlobal.musicManager.playExplosion();
    this.remove();
  }

  remove() {
    this.isActive = false;
    this.isAlive = false;
    // 立即消失，不播放动画
    this.visible = false;
    this.stopAnimation();
    GameGlobal.databus.removeMonster(this);
  }
  
  /**
   * 渲染怪兽和血条
   */
  render(ctx) {
    // 死亡或不可见时不渲染任何内容
    if (!this.isAlive || !this.isActive || !this.visible) {
      return;
    }
    this.aniRender(ctx);
    // 渲染血条背景
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      this.x, 
      this.y + this.healthBarY, 
      this.healthBarWidth, 
      this.healthBarHeight
    );
    // 根据生命值百分比计算血条长度
    const healthPercent = this.hp / this.maxHp;
    // 根据生命值百分比决定血条颜色
    if (healthPercent > 0.6) {
      ctx.fillStyle = '#00FF00'; // 生命值较高时显示绿色
    } else if (healthPercent > 0.3) {
      ctx.fillStyle = '#FFFF00'; // 生命值中等时显示黄色
    } else {
      ctx.fillStyle = '#FF0000'; // 生命值较低时显示红色
    }
    // 渲染血条
    ctx.fillRect(
      this.x, 
      this.y + this.healthBarY, 
      this.healthBarWidth * healthPercent, 
      this.healthBarHeight
    );
  }
}
