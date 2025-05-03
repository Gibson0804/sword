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
    
    // 特殊能力系统
    this.initSpecialAbilities();
  }
  
  // 初始化特殊能力
  initSpecialAbilities() {
    // 清屏技能 - 消灭所有怪兽
    this.clearScreenAbility = {
      name: '清屏技能',
      available: true,
      cooldown: 30 * 60, // 30秒冷却时间（60帧/秒）
      currentCooldown: 0,
      trigger: this.triggerClearScreen.bind(this)
    };
    
    // 防御增强技能 - 临时增强防线和村庄的防御
    this.enhanceDefenseAbility = {
      name: '防御增强',
      available: true,
      cooldown: 45 * 60, // 45秒冷却时间
      currentCooldown: 0,
      duration: 10 * 60, // 10秒持续时间
      active: false,
      trigger: this.triggerEnhanceDefense.bind(this)
    };
    
    // 快速射击技能 - 临时增加射击速度
    this.rapidFireAbility = {
      name: '快速射击',
      available: true,
      cooldown: 20 * 60, // 20秒冷却时间
      currentCooldown: 0,
      duration: 5 * 60, // 5秒持续时间
      active: false,
      originalInterval: PLAYER_SHOOT_INTERVAL,
      trigger: this.triggerRapidFire.bind(this)
    };
    
    // 当前选中的技能索引
    this.currentAbilityIndex = 0;
    
    // 技能列表
    this.abilities = [
      this.clearScreenAbility,
      this.enhanceDefenseAbility,
      this.rapidFireAbility
    ];
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
   * 增加双击触发特殊能力和长按切换特殊能力的功能
   */
  initEvent() {
    // 双击相关变量
    this.lastTapTime = 0;
    this.doubleTapDelay = 300; // 双击间隔时间（毫秒）
    
    // 长按相关变量
    this.longPressTimer = null;
    this.longPressDelay = 500; // 长按时间（毫秒）
    
    wx.onTouchStart((e) => {
      const { clientX: x, clientY: y } = e.touches[0];
      const currentTime = Date.now();

      if (GameGlobal.databus.isGameOver) {
        return;
      }
      
      // 检测双击
      if (currentTime - this.lastTapTime < this.doubleTapDelay) {
        // 触发当前选中的特殊能力
        const triggered = this.triggerCurrentAbility();
        if (triggered) {
          // 震动反馈
          wx.vibrateShort({
            type: 'heavy'
          });
        }
        
        // 重置双击计时器
        this.lastTapTime = 0;
      } else {
        // 记录单击时间
        this.lastTapTime = currentTime;
        
        // 设置长按计时器
        if (this.longPressTimer) clearTimeout(this.longPressTimer);
        
        this.longPressTimer = setTimeout(() => {
          // 切换到下一个特殊能力
          const nextAbility = this.switchToNextAbility();
          
          // 震动反馈
          wx.vibrateShort({
            type: 'medium'
          });
          
          // 显示切换提示
          wx.showToast({
            title: `已切换至: ${nextAbility.name}`,
            icon: 'none',
            duration: 1000
          });
          
          this.longPressTimer = null;
        }, this.longPressDelay);
      }
      
      // 检测是否点击在玩家上
      if (this.checkIsFingerOnPlayer(x, y)) {
        this.touched = true;
        this.setPlayerPosition(x);
      }
    });

    wx.onTouchMove((e) => {
      const { clientX: x } = e.touches[0];

      if (GameGlobal.databus.isGameOver) {
        return;
      }
      
      // 如果移动了，取消长按计时器
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      
      if (this.touched) {
        this.setPlayerPosition(x);
      }
    });

    wx.onTouchEnd(() => {
      this.touched = false;
      
      // 取消长按计时器
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    wx.onTouchCancel(() => {
      this.touched = false;
      
      // 取消长按计时器
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
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

  /**
   * 升级玩家能力
   * 在游戏过程中可以升级玩家的射击速度和伤害值
   */
  upgrade() {
    // 每次升级增加子弹伤害
    this.bulletDamage += 0.5;
    // 每次升级增加子弹速度
    this.bulletSpeed += 1;
  }

  update() {
    if (GameGlobal.databus.isGameOver) {
      return;
    }

    // 每隔一定帧数射击一次
    const shootInterval = this.rapidFireAbility.active ? 
      Math.floor(PLAYER_SHOOT_INTERVAL / 2) : PLAYER_SHOOT_INTERVAL;
    
    if (GameGlobal.databus.frame % shootInterval === 0) {
      this.shoot(); // 玩家射击
    }
    
    // 更新splash攻击计时器
    this.splashTimer++;
    if (this.splashTimer >= this.splashInterval) {
      this.shootSplash(); // 发射splash攻击
      this.splashTimer = 0; // 重置计时器
    }
    
    // 每得到100分升级一次
    if (GameGlobal.databus.score > 0 && GameGlobal.databus.score % 100 === 0 && 
        GameGlobal.databus.frame % 60 === 0) { // 每秒检查一次是否需要升级
      this.upgrade();
    }
    
    // 更新特殊能力冷却时间
    this.updateAbilities();
  }
  
  // 更新特殊能力状态
  updateAbilities() {
    // 更新所有特殊能力的冷却时间
    this.abilities.forEach(ability => {
      // 如果能力在冷却中
      if (!ability.available && ability.currentCooldown > 0) {
        ability.currentCooldown--;
        
        // 冷却结束
        if (ability.currentCooldown <= 0) {
          ability.available = true;
        }
      }
      
      // 如果能力处于激活状态且有持续时间
      if (ability.active && ability.duration) {
        ability.duration--;
        
        // 持续时间结束
        if (ability.duration <= 0) {
          this.deactivateAbility(ability);
        }
      }
    });
  }
  
  // 触发清屏技能
  triggerClearScreen() {
    if (!this.clearScreenAbility.available) return false;
    
    // 消灭屏幕上所有怪兽
    GameGlobal.databus.monsters.forEach(monster => {
      monster.destroy();
      GameGlobal.databus.score += monster.scoreValue / 2; // 只给一半分数
    });
    
    // 清空怪兽数组
    GameGlobal.databus.monsters = [];
    
    // 播放特效
    GameGlobal.musicManager.playExplosion();
    
    // 设置冷却
    this.clearScreenAbility.available = false;
    this.clearScreenAbility.currentCooldown = this.clearScreenAbility.cooldown;
    
    return true;
  }
  
  // 触发防御增强技能
  triggerEnhanceDefense() {
    if (!this.enhanceDefenseAbility.available) return false;
    
    // 增强防线和村庄的防御
    this.enhanceDefenseAbility.originalVillageHealth = GameGlobal.databus.villageHealth;
    this.enhanceDefenseAbility.originalDefenseHealth = GameGlobal.databus.defenseLineHealth;
    
    // 增加生命值
    GameGlobal.databus.villageHealth = Math.min(GameGlobal.databus.villageHealth + 50, 200);
    GameGlobal.databus.defenseLineHealth = Math.min(GameGlobal.databus.defenseLineHealth + 50, 200);
    
    // 激活技能
    this.enhanceDefenseAbility.active = true;
    this.enhanceDefenseAbility.duration = 10 * 60; // 10秒
    
    // 设置冷却
    this.enhanceDefenseAbility.available = false;
    this.enhanceDefenseAbility.currentCooldown = this.enhanceDefenseAbility.cooldown;
    
    // 播放特效
    GameGlobal.musicManager.playLevelUp();
    
    return true;
  }
  
  // 触发快速射击技能
  triggerRapidFire() {
    if (!this.rapidFireAbility.available) return false;
    
    // 激活技能
    this.rapidFireAbility.active = true;
    this.rapidFireAbility.duration = 5 * 60; // 5秒
    
    // 设置冷却
    this.rapidFireAbility.available = false;
    this.rapidFireAbility.currentCooldown = this.rapidFireAbility.cooldown;
    
    // 播放特效
    GameGlobal.musicManager.playShoot();
    
    return true;
  }
  
  // 停用技能
  deactivateAbility(ability) {
    ability.active = false;
    
    // 如果是防御增强技能，恢复原始生命值
    if (ability === this.enhanceDefenseAbility) {
      // 恢复原始生命值，但不会降低当前生命值
      GameGlobal.databus.villageHealth = Math.max(
        GameGlobal.databus.villageHealth,
        this.enhanceDefenseAbility.originalVillageHealth
      );
      
      GameGlobal.databus.defenseLineHealth = Math.max(
        GameGlobal.databus.defenseLineHealth,
        this.enhanceDefenseAbility.originalDefenseHealth
      );
    }
  }
  
  // 触发当前选中的技能
  triggerCurrentAbility() {
    const currentAbility = this.abilities[this.currentAbilityIndex];
    return currentAbility.trigger();
  }
  
  // 切换到下一个技能
  switchToNextAbility() {
    this.currentAbilityIndex = (this.currentAbilityIndex + 1) % this.abilities.length;
    return this.abilities[this.currentAbilityIndex];
  }
  
  /**
   * 根据技能ID设置当前技能
   * @param {string} skillId - 技能ID
   */
  setCurrentSkill(skillId) {
    // 技能ID与索引的映射
    const skillMap = {
      'clearScreen': 0,
      'defenseBuff': 1,
      'rapidFire': 2
    };
    
    // 如果存在该技能ID，则设置为当前技能
    if (skillMap[skillId] !== undefined) {
      this.currentAbilityIndex = skillMap[skillId];
      
      // 显示提示
      wx.showToast({
        title: `已装备技能: ${this.abilities[this.currentAbilityIndex].name}`,
        icon: 'none',
        duration: 1500
      });
    }
    
    return this.abilities[this.currentAbilityIndex];
  }
}
