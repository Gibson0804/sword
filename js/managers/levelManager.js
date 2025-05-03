/**
 * 关卡管理器
 * 负责加载、管理和显示游戏关卡
 */
import EventEmitter from '../base/eventEmitter';
import levelsConfig from '../config/levels';

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

// 关卡卡片尺寸和位置
const LEVEL_CARD_WIDTH = 280;
const LEVEL_CARD_HEIGHT = 150;
const LEVEL_CARD_MARGIN = 20;
const LEVEL_CARDS_TOP = 120;

export default class LevelManager extends EventEmitter {
  constructor() {
    super();
    
    // 初始化关卡数据
    this.levels = [];
    this.currentLevelId = 1;
    
    // 加载关卡数据
    this.loadLevels();
  }
  
  /**
   * 加载关卡数据
   */
  loadLevels() {
    // 从本地存储获取已解锁的关卡
    const unlockedLevels = wx.getStorageSync('unlockedLevels') || [1];
    
    try {
      // 直接使用导入的配置
      // 更新关卡解锁状态
      this.levels = levelsConfig.levels.map(level => {
        return {
          ...level,
          unlocked: unlockedLevels.includes(level.id)
        };
      });
      
      // 计算关卡卡片位置
      this.calculateLevelCardPositions();
    } catch (error) {
      console.error('加载关卡数据失败:', error);
      // 如果加载失败，使用默认关卡数据
      this.useDefaultLevels();
    }
  }
  
  /**
   * 使用默认关卡数据
   */
  useDefaultLevels() {
    // 默认关卡数据
    this.levels = [
      {
        id: 1,
        name: '第一关：村庄初遇',
        description: '保卫你的村庄，击退第一波怪物入侵',
        unlocked: true,
        monsterTypes: ['normal'],
        monsterCount: 20,
        monsterGenerateInterval: 60,
        monsterGenerateDecreaseRate: 0.95,
        minMonsterGenerateInterval: 20,
        difficulty: 1
      },
      {
        id: 2,
        name: '第二关：增援部队',
        description: '更多的怪物正在接近，准备好迎接更大的挑战',
        unlocked: false,
        monsterTypes: ['normal', 'fast'],
        monsterCount: 30,
        monsterGenerateInterval: 55,
        monsterGenerateDecreaseRate: 0.93,
        minMonsterGenerateInterval: 18,
        difficulty: 2
      },
      {
        id: 3,
        name: '第三关：精英部队',
        description: '更强大的怪物出现了，它们拥有更高的生命值',
        unlocked: false,
        monsterTypes: ['normal', 'fast', 'elite'],
        monsterCount: 35,
        monsterGenerateInterval: 50,
        monsterGenerateDecreaseRate: 0.92,
        minMonsterGenerateInterval: 16,
        difficulty: 3
      },
      {
        id: 4,
        name: '第四关：狂暴入侵',
        description: '怪物数量激增，准备好面对狂暴的入侵',
        unlocked: false,
        monsterTypes: ['normal', 'fast', 'elite', 'berserker'],
        monsterCount: 40,
        monsterGenerateInterval: 45,
        monsterGenerateDecreaseRate: 0.90,
        minMonsterGenerateInterval: 14,
        difficulty: 4
      },
      {
        id: 5,
        name: '第五关：最终防线',
        description: '这是最后的防线，全力保卫你的村庄',
        unlocked: false,
        monsterTypes: ['normal', 'fast', 'elite', 'berserker', 'boss'],
        monsterCount: 50,
        monsterGenerateInterval: 40,
        monsterGenerateDecreaseRate: 0.88,
        minMonsterGenerateInterval: 12,
        difficulty: 5
      }
    ];
    
    // 计算关卡卡片位置
    this.calculateLevelCardPositions();
  }
  
  /**
   * 计算关卡卡片位置
   */
  calculateLevelCardPositions() {
    const totalWidth = this.levels.length * (LEVEL_CARD_WIDTH + LEVEL_CARD_MARGIN) - LEVEL_CARD_MARGIN;
    let startX = (screenWidth - totalWidth) / 2;
    
    this.levels.forEach((level, index) => {
      level.x = startX + index * (LEVEL_CARD_WIDTH + LEVEL_CARD_MARGIN);
      level.y = LEVEL_CARDS_TOP;
      level.width = LEVEL_CARD_WIDTH;
      level.height = LEVEL_CARD_HEIGHT;
    });
  }
  
  /**
   * 处理关卡选择
   * @param {number} x - 触摸点X坐标
   * @param {number} y - 触摸点Y坐标
   */
  handleLevelSelection(x, y) {
    for (let i = 0; i < this.levels.length; i++) {
      const level = this.levels[i];
      
      if (x >= level.x && x <= level.x + level.width &&
          y >= level.y && y <= level.y + level.height) {
        
        // 只能选择已解锁的关卡
        if (level.unlocked) {
          this.currentLevelId = level.id;
          this.emit('levelSelected', level);
          
          // 保存当前选择的关卡
          wx.setStorageSync('currentLevelId', level.id);
          
          // 显示提示
          wx.showToast({
            title: `已选择${level.name}`,
            icon: 'success',
            duration: 1500
          });
        } else {
          // 显示提示
          wx.showToast({
            title: '请先通过前面的关卡',
            icon: 'none',
            duration: 1500
          });
        }
        
        break;
      }
    }
  }
  
  /**
   * 解锁下一关
   */
  unlockNextLevel() {
    const nextLevelId = this.currentLevelId + 1;
    const nextLevel = this.levels.find(level => level.id === nextLevelId);
    
    if (nextLevel) {
      nextLevel.unlocked = true;
      
      // 更新本地存储
      const unlockedLevels = wx.getStorageSync('unlockedLevels') || [1];
      if (!unlockedLevels.includes(nextLevelId)) {
        unlockedLevels.push(nextLevelId);
        wx.setStorageSync('unlockedLevels', unlockedLevels);
      }
      
      // 显示提示
      wx.showToast({
        title: `解锁了${nextLevel.name}`,
        icon: 'success',
        duration: 2000
      });
    }
  }
  
  /**
   * 获取当前关卡
   * @returns {Object} 当前关卡对象
   */
  getCurrentLevel() {
    return this.levels.find(level => level.id === this.currentLevelId);
  }
  
  /**
   * 获取关卡总数
   * @returns {number} 关卡总数
   */
  getLevelCount() {
    return this.levels.length;
  }
  
  /**
   * 渲染关卡选择界面
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  render(ctx) {
    // 绘制关卡卡片
    this.levels.forEach(level => {
      // 绘制卡片背景
      ctx.fillStyle = level.unlocked ? (level.id === this.currentLevelId ? '#4a90e2' : '#6a6a6a') : '#333333';
      ctx.fillRect(level.x, level.y, level.width, level.height);
      
      // 绘制关卡名称
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(level.name, level.x + level.width / 2, level.y + 20);
      
      // 绘制关卡描述
      ctx.font = '14px Arial';
      ctx.fillText(level.description, level.x + level.width / 2, level.y + 50, level.width - 20);
      
      // 绘制难度
      ctx.fillText(`难度: ${'★'.repeat(level.difficulty)}`, level.x + level.width / 2, level.y + 80);
      
      // 绘制锁定状态
      if (!level.unlocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(level.x, level.y, level.width, level.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('🔒', level.x + level.width / 2, level.y + level.height / 2 - 12);
      }
      
      // 绘制选中状态
      if (level.id === this.currentLevelId && level.unlocked) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(level.x + 3, level.y + 3, level.width - 6, level.height - 6);
      }
    });
  }
}
