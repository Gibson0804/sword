// 游戏核心逻辑（GameCore）
// 只负责游戏主循环、数据、对象、碰撞、分数等核心，不包含UI和页面切换

import DataBus from '../databus';
import Player from '../player/index';
import Monster from '../npc/monster';
import Village from './village';
import DefenseLine from './defenseLine';

const MONSTER_GENERATE_INTERVAL = 60;
const MONSTER_GENERATE_DECREASE_RATE = 0.92;
const MIN_MONSTER_GENERATE_INTERVAL = 15;

export default class GameCore {
  constructor(options = {}) {
    this.level = options.level || 1;
    this.skill = options.skill || null;
    this.score = 0;
    this.villageHp = 100;
    this.defenseHp = 100;
    this.monsterGenerateInterval = MONSTER_GENERATE_INTERVAL;
    this.difficultyIncreaseInterval = 1000;
    this.databus = new DataBus();
    this.player = new Player();
    this.village = new Village();
    this.defenseLine = new DefenseLine();
    this.running = false;
    this._raf = null;
    // 事件回调
    this.onGameOver = options.onGameOver || (()=>{});
    this.onScoreChange = options.onScoreChange || (()=>{});
    // ... 其他事件
  }

  start() {
    this.running = true;
    this.databus.reset();
    this.player.init();
    this.village.init();
    this.defenseLine.init();
    this._mainLoop();
  }

  pause() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  resume() {
    if (!this.running) {
      this.running = true;
      this._mainLoop();
    }
  }

  destroy() {
    this.pause();
    this.monsters = [];
    this.bullets = [];
    this.player = null;
    this.village = null;
    this.defenseLine = null;
  }

  _mainLoop() {
    if (!this.running) return;
    this.update();
    // 可触发渲染回调
    this._raf = requestAnimationFrame(() => this._mainLoop());
  }

  update() {
    // 增加帧数
    this.databus.frame++;
    if (this.databus.isGameOver) {
      this.onGameOver();
      this.running = false;
      return;
    }
    this.player.update();
    this.village.update();
    this.defenseLine.update();
    this.databus.bullets.forEach((item) => item.update());
    this.databus.splashes.forEach((item) => item.update());
    this.databus.monsters.forEach((item) => item.update());
    this.monsterGenerate();
    this.collisionDetection();
    this.checkLevelUp();
  }

  monsterGenerate() {
    if (this.databus.frame % Math.floor(this.monsterGenerateInterval) === 0) {
      const currentLevel = Math.floor(this.databus.frame / 1000);
      const monsterCount = Math.min(2 + Math.floor(currentLevel / 1), 5);
      for (let i = 0; i < monsterCount; i++) {
        const monster = this.databus.pool.getItemByClass('monster', Monster);
        monster.init(this.databus.frame);
        this.databus.monsters.push(monster);
      }
    }
    if (this.databus.frame % this.difficultyIncreaseInterval === 0 && 
        this.monsterGenerateInterval > MIN_MONSTER_GENERATE_INTERVAL) {
      this.monsterGenerateInterval *= MONSTER_GENERATE_DECREASE_RATE;
      if (this.monsterGenerateInterval < MIN_MONSTER_GENERATE_INTERVAL) {
        this.monsterGenerateInterval = MIN_MONSTER_GENERATE_INTERVAL;
      }
    }
  }

  collisionDetection() {
    // 子弹与怪兽
    this.databus.bullets.forEach((bullet) => {
      for (let i = 0, il = this.databus.monsters.length; i < il; i++) {
        const monster = this.databus.monsters[i];
        if (monster.isCollideWith(bullet)) {
          monster.takeDamage(bullet.damage);
          bullet.destroy();
          if (!monster.isAlive) {
            monster.destroy();
            this.databus.score += monster.scoreValue;
            this.onScoreChange(this.databus.score);
          }
          break;
        }
      }
    });
    // 怪兽与防线
    for (let i = 0, il = this.databus.monsters.length; i < il; i++) {
      const monster = this.databus.monsters[i];
      if (this.defenseLine.isCollideWith(monster)) {
        this.defenseLine.takeDamage(monster.damage);
        monster.destroy();
        if (!this.defenseLine.isAlive) {
          this.defenseLine.destroy();
        }
        break;
      }
    }
    // 怪兽与村庄
    if (!this.defenseLine.isAlive) {
      for (let i = 0, il = this.databus.monsters.length; i < il; i++) {
        const monster = this.databus.monsters[i];
        if (this.village.isCollideWith(monster)) {
          this.village.takeDamage(monster.damage);
          monster.destroy();
          if (!this.village.isAlive) {
            this.village.destroy();
            this.databus.gameOver();
            this.onGameOver();
          }
          break;
        }
      }
    }
  }

  checkLevelUp() {
    const shouldLevelUp = Math.floor(this.databus.score / 200) + 1;
    if (shouldLevelUp > this.databus.level) {
      this.databus.level = shouldLevelUp;
      this.databus.levelUp();
      this.player.upgrade();
      // 可扩展：触发升级事件/音效/动画
      this.monsterGenerateInterval *= 0.9;
      if (this.monsterGenerateInterval < MIN_MONSTER_GENERATE_INTERVAL) {
        this.monsterGenerateInterval = MIN_MONSTER_GENERATE_INTERVAL;
      }
    }
  }
}
