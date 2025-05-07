import Pool from './base/pool';

let instance;

/**
 * 全局状态管理器
 * 负责管理游戏的状态，包括帧数、分数、子弹、怪兽和动画等
 */
export default class DataBus {
  // 直接在类中定义实例属性
  monsters = []; // 存储怪兽
  bullets = []; // 存储子弹
  splashes = []; // 存储splash攻击
  animations = []; // 存储动画
  coinFlies = []; // 存储金币飞行动画
  frame = 0; // 当前帧数
  coins = 0; // 当前金币
  level = 1; // 当前关卡
  villageHealth = 100; // 村庄生命值
  defenseLineHealth = 100; // 防线生命值
  isGameOver = false; // 游戏是否结束
  pool = new Pool(); // 初始化对象池

  constructor() {
    // 确保单例模式
    if (instance) return instance;

    instance = this;
  }

  // 重置游戏状态
  reset() {
    this.frame = 0; // 当前帧数
    this.coins = 0; // 当前金币
    this.level = 1; // 当前关卡
    this.villageHealth = 100; // 村庄生命值
    this.defenseLineHealth = 100; // 防线生命值
    this.bullets = []; // 存储子弹
    this.splashes = []; // 存储splash攻击
    this.monsters = []; // 存储怪兽
    this.animations = []; // 存储动画
    this.coinFlies = []; // 存储金币飞行动画
    this.isGameOver = false; // 游戏是否结束
  }

  // 游戏结束
  gameOver() {
    this.isGameOver = true;
  }

  /**
   * 升级关卡
   */
  levelUp() {
    this.level++;
    // 升级时可以增加村庄和防线的生命值上限
    this.villageHealth = Math.min(100 + (this.level - 1) * 20, 200);
    this.defenseLineHealth = Math.min(100 + (this.level - 1) * 10, 150);
  }

  /**
   * 回收怪兽，进入对象池
   * 此后不进入帧循环
   * @param {Object} monster - 要回收的怪兽对象
   */
  removeMonster(monster) {
    const idx = this.monsters.indexOf(monster);
    if (idx === -1) {
      // 已经被移除过了，不再重复移除
      return;
    }
    const temp = this.monsters.splice(idx, 1);
    if (temp && temp.length > 0) {
      console.log('[removeMonster] 怪兽被移除:', monster, monster.type, '剩余:', this.monsters.length);
      this.pool.recover('monster', monster); // 回收怪兽到对象池
    }
  }

  /**
   * 回收子弹，进入对象池
   * 此后不进入帧循环
   * @param {Object} bullet - 要回收的子弹对象
   */
  removeBullets(bullet) {
    const temp = this.bullets.splice(this.bullets.indexOf(bullet), 1);
    if (temp) {
      this.pool.recover('bullet', bullet); // 回收子弹到对象池
    }
  }
  
  /**
   * 回收splash攻击，进入对象池
   * 此后不进入帧循环
   * @param {Object} splash - 要回收的splash攻击对象
   */
  removeSplash(splash) {
    const temp = this.splashes.splice(this.splashes.indexOf(splash), 1);
    if (temp) {
      this.pool.recover('splash', splash); // 回收splash攻击到对象池
    }
  }

  removeCoinFly(coinFly) {
    const idx = this.coinFlies.indexOf(coinFly);
    if (idx === -1) {
      // 已经被移除过了，不再重复移除
      return;
    }
    const temp = this.coinFlies.splice(idx, 1);
    if (temp && temp.length > 0) {
      console.log('[removeCoinFly] 金币飞行动画被移除:', coinFly, '剩余:', this.coinFlies.length);
      this.pool.recover('coinFly', coinFly); // 回收金币飞行动画到对象池
    }
  }

}
