import './render';
import GameCore from './runtime/gameCore';
import StartPage from './runtime/startPage';
import LevelSelectPage from './runtime/levelSelectPage';
import Player from './player/index';
import Monster from './npc/monster';
import Village from './runtime/village';
import DefenseLine from './runtime/defenseLine';
import BackGround from './runtime/background';
import GameInfo from './runtime/gameinfo';
import Music from './runtime/music';

// 首页按钮样式常量和绘制函数（与startPage.js保持一致）
const BUTTON_RADIUS = 18;
const BUTTON_FONT = 'bold 20px Arial';
const BUTTON_TEXT_COLOR = '#fff';
const BUTTON_STROKE_COLOR = '#222';
const BUTTON_GRADIENT_TOP = '#ffe066';
const BUTTON_GRADIENT_BOTTOM = '#f7b500';
const BUTTON_BORDER_COLOR = '#b97a00';

function drawFancyButton(ctx, x, y, width, height, radius, text) {
  ctx.save();
  // 阴影
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 4;
  // 渐变
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, BUTTON_GRADIENT_TOP);
  gradient.addColorStop(1, BUTTON_GRADIENT_BOTTOM);
  // 圆角矩形
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  // 描边
  ctx.lineWidth = 3;
  ctx.strokeStyle = BUTTON_BORDER_COLOR;
  ctx.stroke();
  // 文字描边+填充
  ctx.font = BUTTON_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = BUTTON_STROKE_COLOR;
  ctx.strokeText(text, x + width / 2, y + height / 2 + 2);
  ctx.fillStyle = BUTTON_TEXT_COLOR;
  ctx.fillText(text, x + width / 2, y + height / 2 + 2);
  ctx.restore();
}

import DataBus from './databus';

// 游戏状态常量
const GAME_STATE = {
  START_PAGE: 'startPage', // 首页状态
  PLAYING: 'playing',     // 游戏中状态
  GAME_OVER: 'gameOver'   // 游戏结束状态
};

GameGlobal.databus = new DataBus(); // 全局数据管理，用于管理游戏状态和数据
// 首页需要音乐管理器实例，但不自动播放
GameGlobal.musicManager = new Music();
// 同步全局音频开关
GameGlobal.musicManager.musicEnabled = wx.getStorageSync('musicEnabled') !== false;
GameGlobal.musicManager.soundEnabled = wx.getStorageSync('soundEnabled') !== false;

let gameCore = null;
let currentPage = 'home';

function switchPage(page, options = {}) {
  if (page === 'game') {
    if (!gameCore) {
      gameCore = new GameCore(options);
      gameCore.start();
    }
  } else {
    if (gameCore) {
      gameCore.destroy();
      gameCore = null;
    }
  }
  currentPage = page;
  // 渲染对应页面
}

// 监听页面按钮事件
// 例如：startPage.on('startGame', () => switchPage('game', {level: selectedLevel, skill: selectedSkill}));
// 例如：levelSelectPage.on('back', () => switchPage('home'));
// ... 其他页面事件

// 首页初始化
switchPage('home');

const MONSTER_GENERATE_INTERVAL = 60; // 怪兽生成间隔，降低为60帧生成一次
const MONSTER_GENERATE_DECREASE_RATE = 0.92; // 怪兽生成间隔减少率，增大减少速度
const MIN_MONSTER_GENERATE_INTERVAL = 15; // 最小怪兽生成间隔，降低为15帧
const ctx = canvas.getContext('2d'); // 获取canvas的2D绘图上下文

/**
 * 游戏主函数 - 守护村庄
 */
export default class Main {
  // 胜利弹窗相关逻辑迁移到 GameInfo

  aniId = 0; // 用于存储动画帧的ID
  bg = new BackGround(); // 创建背景
  player = new Player(); // 创建玩家
  village = new Village(); // 创建村庄
  defenseLine = new DefenseLine(); // 创建防线
  gameInfo = new GameInfo(); // 创建游戏UI显示
  startPage = new StartPage(); // 创建新的首页
  monsterGenerateInterval = MONSTER_GENERATE_INTERVAL; // 当前怪兽生成间隔
  difficultyIncreaseInterval = 1000; // 每1000帧增加一次难度
  gameState = GAME_STATE.START_PAGE; // 初始游戏状态为首页
  currentLevelId = 1; // 当前关卡ID
  currentSkillId = 'clearScreen'; // 当前技能ID

  constructor() {
    // ...原有内容...
    this.gameInfo.on('nextLevel', () => {
      const nextLevelId = this.currentLevelId + 1;
      try {
        const levelsConfig = require('./config/levels').default;
        const nextConfig = levelsConfig.levels.find(l=>l.id===nextLevelId);
        if (nextConfig) {
          this.startGame({ levelId: nextLevelId });
        } else {
          wx.showToast && wx.showToast({ title: '没有更多关卡', icon: 'none' });
          this.gameState = GAME_STATE.START_PAGE;
        }
      } catch (e) {
        this.gameState = GAME_STATE.START_PAGE;
      }
      this.gameInfo.setVictory(false);
    });
    this.gameInfo.on('returnHome', () => {
      this.gameState = GAME_STATE.START_PAGE;
      this.gameInfo.setVictory(false);
    });
    // 当游戏结束时，重新开始游戏
    this.gameInfo.on('restart', this.restart.bind(this));
    
    // 当首页的开始游戏按钮被点击时，开始游戏
    this.startPage.on('startGame', this.startGame.bind(this));
    
    // 设置全局玩家对象，供其他类使用
    GameGlobal.player = this.player;

    // 初始化游戏，显示首页
    this.init();


  }

  /**
   * 初始化游戏，显示首页
   */
  init() {
    // 重置游戏数据
    GameGlobal.databus.reset();
    
    // 初始化游戏对象
    this.player.init();
    this.village.init();
    this.defenseLine.init();
    
    // 设置游戏状态为首页
    this.gameState = GAME_STATE.START_PAGE;
    
    // 初始化返回按钮
    this.initBackButton();
    
    // 开始动画循环
    this.loop();
  }

  /**
   * 初始化返回按钮
   */
  initBackButton() {
    // 创建返回按钮
    this.backButton = {
      x: 20,
      y: 40,
      width: 100,
      height: 40,
      text: '返回'
    };
    
    // 注册点击事件，使用微信小游戏的触摸事件API
    wx.onTouchStart(e => {
      if (this.gameState !== GAME_STATE.PLAYING) return;
      
      const touch = e.touches[0];
      const x = touch.clientX;
      const y = touch.clientY;
      
      // 检查是否点击了返回按钮
      if (x >= this.backButton.x && x <= this.backButton.x + this.backButton.width &&
          y >= this.backButton.y && y <= this.backButton.y + this.backButton.height) {
        // 弹出确认对话框
        wx.showModal({
          title: '确认返回',
          content: '您确定要返回首页吗？当前游戏进度将丢失。',
          success: (res) => {
            if (res.confirm) {
              // 用户点击确定，返回首页
              this.gameState = GAME_STATE.START_PAGE;
              
              // 暂停背景音乐
              if (GameGlobal.musicManager && GameGlobal.musicManager.bgmAudio) {
                GameGlobal.musicManager.bgmAudio.pause();
              }
            }
          }
        });
      }
    });
    
    // 开始动画循环
    cancelAnimationFrame(this.aniId);
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * 从首页开始游戏
   * @param {Object} options - 开始游戏选项，包含关卡ID和技能ID
   */
   startGame(options) {
    // 获取 LevelSelectPage 的完整关卡配置
    let levelConfig = null;
    if (this.startPage.levelSelectPage && this.startPage.levelSelectPage.selectedLevel) {
      levelConfig = this.startPage.levelSelectPage.selectedLevel;
      console.log('Selected level config:', levelConfig);
    } else if (this.startPage.getCurrentLevel) {
      // getCurrentLevel 可能返回id，需查找对应关卡配置
      const levelId = this.startPage.getCurrentLevel();
      try {
        const levelsConfig = require('./config/levels').default;
        levelConfig = levelsConfig.levels.find(l=>l.id===levelId);
      } catch (e) {}
    }
    // 保存当前选择的关卡和技能
    if (options) {
      this.currentLevelId = options.levelId || (levelConfig && levelConfig.id) || 1;
      this.currentSkillId = options.skillId || 'clearScreen';
    }
    // 兼容处理：如果没有 monsterConfig，但有 monsterTypes，则自动生成默认波次
    if (levelConfig && !levelConfig.monsterConfig && levelConfig.monsterTypes) {
      // 默认生成4波，每波数量递增
      levelConfig.monsterConfig = [2, 4, 6, 8].map(cnt => ({
        monsterType: levelConfig.monsterTypes,
        monsterCount: cnt,
        monsterGenerateInterval: 60,
      }));
    }
    // 保存完整关卡配置
    this.currentLevelConfig = levelConfig;
    // 检查levelConfig.id和currentLevelId一致性
    if (levelConfig && levelConfig.id && this.currentLevelId !== levelConfig.id) {
      this.currentLevelId = levelConfig.id;
    }
    // 根据选择的关卡设置难度
    if (levelConfig && levelConfig.monsterGenerateInterval) {
      this.monsterGenerateInterval = levelConfig.monsterGenerateInterval;
    } else {
      this.monsterGenerateInterval = MONSTER_GENERATE_INTERVAL;
    }
    // 设置当前技能
    this.player.setCurrentSkill(this.currentSkillId);
    // 重置游戏状态
    GameGlobal.databus.reset();
    this.player.init();
    this.village.init();
    this.defenseLine.init();
    console.log('currentLevelConfig:', levelConfig); // 确保打印的是对象
    // 设置背景图片，优先使用levelConfig.background，否则根据关卡ID查找
    let bgSrc = '';
    if (levelConfig && levelConfig.background) {
      bgSrc = levelConfig.background;
    } else {
      // 兜底：根据当前关卡ID查找levelsConfig
      try {
        const levelsConfig = require('./config/levels').default;
        const found = levelsConfig.levels.find(l=>l.id===this.currentLevelId);
        bgSrc = found && found.background ? found.background : '';
      } catch (e) {}
    }
    if (bgSrc) {
      this.bg.setImage(bgSrc);
    } else {
      this.bg.setImage(); // 用默认
    }
    // 开始播放背景音乐
    if (GameGlobal.musicManager && GameGlobal.musicManager.musicEnabled) {
      GameGlobal.musicManager.playBgm();
    }
    // 切换游戏状态为游戏中
    this.gameState = GAME_STATE.PLAYING;
  }

  /**
   * 重新开始游戏（游戏结束后重新开始）
   */
  restart() {
    // 重置游戏状态
    GameGlobal.databus.reset();
    this.player.init();
    this.village.init();
    this.defenseLine.init();
    
    // 开始播放背景音乐
    if (GameGlobal.musicManager && GameGlobal.musicManager.musicEnabled) {
      GameGlobal.musicManager.playBgm();
    }
    
    // 如果是游戏结束后重新开始，则返回首页
    this.gameState = GAME_STATE.START_PAGE;
  }

  /**
   * 随着帧数变化的怪兽生成逻辑
   * 帧数取模定义成生成的频率
   */
  // 怪兽分波生成核心变量
  _currentWaveIndex = 0;
  _waveMonsterGenerated = 0;
  _waveMonsterTotal = 0;
  _waveConfig = null;

  monsterGenerate() {
    // 初始化当前关卡波次
    if (!this.currentLevelConfig || !Array.isArray(this.currentLevelConfig.monsterConfig)) return;
    if (!this._waveConfig) {
      this._currentWaveIndex = 0;
      this._waveMonsterGenerated = 0;
      this._waveConfig = this.currentLevelConfig.monsterConfig[this._currentWaveIndex];
      this._waveMonsterTotal = this._waveConfig.monsterCount;
      GameGlobal.databus.currentWave = this._currentWaveIndex + 1;
      GameGlobal.databus.totalWave = this.currentLevelConfig.monsterConfig.length;
    }
    // 当前波次已生成完，进入下一波
    if (this._waveMonsterGenerated >= this._waveMonsterTotal) {
      if (this._currentWaveIndex < this.currentLevelConfig.monsterConfig.length - 1) {
        this._currentWaveIndex++;
        this._waveConfig = this.currentLevelConfig.monsterConfig[this._currentWaveIndex];
        this._waveMonsterGenerated = 0;
        this._waveMonsterTotal = this._waveConfig.monsterCount;
        GameGlobal.databus.currentWave = this._currentWaveIndex + 1;
      } else {
        // 所有关卡波次已生成完毕
        return;
      }
    }
    // 间隔生成怪兽
    if (GameGlobal.databus.frame % Math.floor(this._waveConfig.monsterGenerateInterval) === 0 && this._waveMonsterGenerated < this._waveMonsterTotal) {
      // 随机类型
      // 兼容 monsterType/monsterTypes 字段
      const monsterTypes = this._waveConfig.monsterType || this._waveConfig.monsterTypes || ["niu"];
      const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
      const monster = GameGlobal.databus.pool.getItemByClass('monster', Monster);
      monster.init(monsterType, 1, GameGlobal.databus.frame);
      GameGlobal.databus.monsters.push(monster);
      this._waveMonsterGenerated++;

    }
  }

  /**
   * 全局碰撞检测
   */
  collisionDetection() {
    // 检测子弹与怪兽的碰撞
    GameGlobal.databus.bullets.forEach((bullet) => {
      for (let i = 0, il = GameGlobal.databus.monsters.length; i < il; i++) {
        const monster = GameGlobal.databus.monsters[i];

        // 如果怪兽存活并且发生了碰撞
        if (monster.isCollideWith(bullet)) {
          monster.takeDamage(bullet.damage); // 怪兽受到伤害
          bullet.destroy(); // 销毁子弹
          
          if (!monster.isAlive) {
            monster.destroy(); // 销毁怪兽
            GameGlobal.databus.score += monster.scoreValue; // 增加分数
            GameGlobal.databus.coins += monster.scoreValue; // 增加金币
          }
          break; // 退出循环
        }
      }
    });

    // 检测怪兽与防线的碰撞（倒序遍历，防止移除元素时漏掉）
    for (let i = GameGlobal.databus.monsters.length - 1; i >= 0; i--) {
      const monster = GameGlobal.databus.monsters[i];

      // 如果怪兽与防线发生碰撞
      if (this.defenseLine.isCollideWith(monster)) {
        this.defenseLine.takeDamage(monster.damage); // 防线受到伤害
        monster.destroy(); // 销毁怪兽
        
        if (!this.defenseLine.isAlive) {
          // 如果防线被摧毁，怪兽会直接攻击村庄
          this.defenseLine.destroy();
        }
        
        break; // 退出循环
      }
    }
    
    // 如果防线已被摧毁，检测怪兽与村庄的碰撞
    if (!this.defenseLine.isAlive) {
      for (let i = GameGlobal.databus.monsters.length - 1; i >= 0; i--) {
        const monster = GameGlobal.databus.monsters[i];
  
        // 如果怪兽与村庄发生碰撞
        if (this.village.isCollideWith(monster)) {
          this.village.takeDamage(monster.damage); // 村庄受到伤害
          monster.destroy(); // 销毁怪兽
          
          if (!this.village.isAlive) {
            this.village.destroy(); // 村庄被摧毁
            GameGlobal.databus.gameOver(); // 游戏结束
          }
          
          break; // 退出循环
        }
      }
    }
  }

  /**
   * canvas重绘函数
   * 每一帧重新绘制所有内容
   */
  render() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.gameState === GAME_STATE.START_PAGE) {
      // 渲染首页
      this.startPage.render(ctx);
    } else if (this.gameState === GAME_STATE.PLAYING) {
      
      // 渲染游戏内容
      this.bg.render(ctx);
      this.village.render(ctx);
      this.defenseLine.render(ctx);
      
      // 渲染所有怪兽
      GameGlobal.databus.monsters.forEach((item) => {
        item.render(ctx);
      });
      
      // 渲染玩家
      this.player.render(ctx);
      
      // 渲染玩家子弹
      GameGlobal.databus.bullets.forEach((item) => {
        item.render(ctx);
      });
      
      // 渲染爆炸动画
      GameGlobal.databus.animations.forEach((item) => {
        item.render(ctx);
      });
      
      // 渲染游戏信息
      this.gameInfo.render(ctx);
      
      // 注意：gameInfo.render方法已经包含了所有游戏信息的渲染
      // 不需要单独调用renderGameScore等方法
      
      // 渲染返回按钮
      this.renderBackButton(ctx);
    } else if (this.gameState === GAME_STATE.GAME_OVER) {
      // 渲染游戏结束画面
      this.gameInfo.renderGameOver(ctx, GameGlobal.databus.score);
    }
  }
  
  /**
   * 渲染返回按钮
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */


  renderBackButton(ctx) {
    // 使用首页按钮样式
    drawFancyButton(
      ctx,
      this.backButton.x,
      this.backButton.y,
      this.backButton.width,
      this.backButton.height,
      BUTTON_RADIUS,
      this.backButton.text
    );
  }

  // 游戏逻辑更新主函数
  update() {
    // 根据游戏状态更新不同内容
    if (this.gameState === GAME_STATE.START_PAGE) {
      // 首页状态，不需要更新游戏逻辑
      return;
    }
    
    // 更新背景（游戏中状态才需要）
    this.bg.update();
    
    // 游戏中状态
    GameGlobal.databus.frame++; // 增加帧数

    if (GameGlobal.databus.isGameOver) {
      this.gameState = GAME_STATE.GAME_OVER;
      return;
    }

    // 检查是否需要升级
    this.checkLevelUp();

    this.player.update(); // 更新玩家
    this.village.update(); // 更新村庄
    this.defenseLine.update(); // 更新防线
    
    // 更新所有子弹
    GameGlobal.databus.bullets.forEach((item) => item.update());
    // 更新所有splash攻击
    GameGlobal.databus.splashes.forEach((item) => item.update());
    // 更新所有怪兽
    GameGlobal.databus.monsters.forEach((item) => item.update());

    this.monsterGenerate(); // 生成怪兽
    this.collisionDetection(); // 检测碰撞

    // 检查胜利：所有怪兽消灭且所有波次已生成
    if (
      this.gameState === GAME_STATE.PLAYING &&
      GameGlobal.databus.monsters.length === 0 &&
      this._currentWaveIndex === this.currentLevelConfig.monsterConfig.length - 1 &&
      this._waveMonsterGenerated >= this._waveMonsterTotal
    ) {
      this.gameInfo.setVictory(true);
    } else {
      this.gameInfo.setVictory(false);
    }
  }

  /**
   * 检查是否需要升级
   * 每得到一定分数升级一次
   */
  checkLevelUp() {
    // 每获得200分升级一次
    const shouldLevelUp = Math.floor(GameGlobal.databus.score / 200) + 1;
    
    if (shouldLevelUp > GameGlobal.databus.level) {
      // 升级
      GameGlobal.databus.level = shouldLevelUp;
      GameGlobal.databus.levelUp();
      
      // 升级玩家
      this.player.upgrade();
      
      // 升级效果
      GameGlobal.musicManager.playLevelUp();
      wx.vibrateShort({
        type: 'heavy'
      });
      
      // 降低怪兽生成间隔，增加难度
      this.monsterGenerateInterval *= 0.9;
      if (this.monsterGenerateInterval < MIN_MONSTER_GENERATE_INTERVAL) {
        this.monsterGenerateInterval = MIN_MONSTER_GENERATE_INTERVAL;
      }
      
      // 检查是否完成当前关卡，解锁下一关
      const currentLevel = this.startPage.getCurrentLevel();
      if (currentLevel && GameGlobal.databus.score >= currentLevel.monsterCount * 10) {
        // 解锁下一关
        const nextLevelId = this.currentLevelId + 1;
        const unlockedLevels = wx.getStorageSync('unlockedLevels') || [1];
        
        if (!unlockedLevels.includes(nextLevelId)) {
          unlockedLevels.push(nextLevelId);
          wx.setStorageSync('unlockedLevels', unlockedLevels);
          
          // 显示提示
          wx.showToast({
            title: `解锁了第${nextLevelId}关`,
            icon: 'success',
            duration: 2000
          });
        }
      }
    }
  }

  // 实现游戏帧循环
  loop() {
    if (this.gameState === GAME_STATE.START_PAGE) {
      this.startPage.updateBackground();
      this.startPage.render(ctx);
    } else {
      this.update();
      this.render(ctx);
    }
    // 请求下一帧动画
    this.aniId = requestAnimationFrame(this.loop.bind(this));
  }
}
