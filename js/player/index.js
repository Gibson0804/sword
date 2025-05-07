import Animation from '../base/animation';
import { SCREEN_WIDTH, SCREEN_HEIGHT } from '../render';
import Bullet from './bullet';
import Splash from './splash';

// 玩家相关常量设置
const PLAYER_IMG_SRC = 'images/player/player.png'; // 需要替换为守护者图片
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 40;
const PLAYER_SHOOT_INTERVAL = 15; // 减少射击间隔，增加射击频率
const PLAYER_MOVE_SPEED = 5; // 玩家移动速度

export default class Player extends Animation {
  constructor() {
    super(PLAYER_IMG_SRC, PLAYER_WIDTH, PLAYER_HEIGHT);

    // 初始化坐标
    this.init();

    // 初始化事件监听
    this.initEvent();
  }

  init() {
    // 玩家默认处于屏幕底部居中位置
    this.x = SCREEN_WIDTH / 2 - this.width / 2;
    this.y = SCREEN_HEIGHT - this.height - 100; // 调整高度，留出村庄的空间

    // 限制玩家只能在屏幕底部水平移动
    this.minY = this.y;
    this.maxY = this.y;
    
    // 用于在手指移动的时候标识手指是否已经在玩家上了
    this.touched = false;

    this.isActive = true;
    this.visible = true;
    
    // 子弹伤害值
    this.bulletDamage = 1;
    // 子弹速度
    this.bulletSpeed = 10;
    
    // splash攻击相关参数
    this.splashDamage = 2; // splash攻击伤害值
    this.splashSpeed = 8; // splash攻击速度
    this.splashInterval = 60; // splash攻击间隔，1秒一次（60帧/秒）
    this.splashTimer = 0; // splash攻击计时器
  }
  


  /**
   * 判断手指是否在玩家上
   * @param {Number} x: 手指的X轴坐标
   * @param {Number} y: 手指的Y轴坐标
   * @return {Boolean}: 用于标识手指是否在玩家上的布尔值
   */
  checkIsFingerOnPlayer(x, y) {
    const deviation = 30;
    return (
      x >= this.x - deviation &&
      y >= this.y - deviation &&
      x <= this.x + this.width + deviation &&
      y <= this.y + this.height + deviation
    );
  }

  /**
   * 根据手指的位置设置玩家的位置
   * 只允许在X轴上移动，Y轴保持不变
   */
  setPlayerPosition(x) {
    // 只允许水平移动，限制在屏幕范围内
    this.x = Math.max(0, Math.min(x - this.width / 2, SCREEN_WIDTH - this.width));
    // Y轴保持不变
    this.y = this.minY;
  }

  /**
   * 玩家响应手指的触摸事件
   * 只允许水平移动
   */
  initEvent() {
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];
      if (GameGlobal.databus.isGameOver) {
        return;
      }
      // 检测是否点击在玩家上
      if (this.checkIsFingerOnPlayer(x, y)) {
        this.touched = true;
      }
    });

    wx.onTouchMove((e) => {
      const { clientX: x } = e.touches[0];
      if (this.touched) {
        this.setPlayerPosition(x);
      }
    });

    wx.onTouchEnd(() => {
      this.touched = false;
    });

    wx.onTouchCancel(() => {
      this.touched = false;
    });
  }

  /**
   * 玩家射击操作
   */
  shoot() {
    const bullet = GameGlobal.databus.pool.getItemByClass('bullet', Bullet);
    bullet.init(
      this.x + this.width / 2 - bullet.width / 2, 
      this.y - 10, 
      this.bulletSpeed,
      this.bulletDamage
    );
    GameGlobal.databus.bullets.push(bullet);
    GameGlobal.musicManager.playShoot(); // 播放射击音效
  }
  
  /**
   * 发射splash攻击
   * 自动寻找最近的怪兽并发射攻击
   */
  shootSplash() {
    // 检查是否有怪兽
    if (GameGlobal.databus.monsters.length === 0) {
      return; // 没有怪兽时不发射
    }
    
    const splash = GameGlobal.databus.pool.getItemByClass('splash', Splash);
    splash.init(
      this.x + this.width / 2 - splash.width / 2,
      this.y - 10,
      this.splashSpeed,
      this.splashDamage
    );
    
    GameGlobal.databus.splashes.push(splash);
    GameGlobal.musicManager.playShoot(); // 播放射击音效
  }



  update() {
    const isWin = GameGlobal.main && GameGlobal.main.gameInfo && GameGlobal.main.gameInfo.showVictory;
    if (GameGlobal.databus.isGameOver || isWin) {
      return;
    }

    // 固定射击间隔
    if (GameGlobal.databus.frame % PLAYER_SHOOT_INTERVAL === 0) {
      this.shoot(); // 玩家射击
    }

    // 更新splash攻击计时器（胜利/结束时不再累加）
    if (!(GameGlobal.databus.isGameOver || isWin)) {
      this.splashTimer++;
      if (this.splashTimer >= this.splashInterval) {
        this.shootSplash(); // 发射splash攻击
        this.splashTimer = 0; // 重置计时器
      }
    }
  }

  
}
