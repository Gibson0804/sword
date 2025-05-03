/**
 * 技能管理器
 * 负责加载、管理和显示游戏技能
 */
import EventEmitter from '../base/eventEmitter';

const screenWidth = window.innerWidth;
const screenHeight = window.innerHeight;

// 技能卡片尺寸和位置
const SKILL_CARD_WIDTH = 200;
const SKILL_CARD_HEIGHT = 200;
const SKILL_CARD_MARGIN = 30;
const SKILL_CARDS_TOP = 120;

export default class SkillManager extends EventEmitter {
  constructor() {
    super();
    
    // 初始化技能数据
    this.skills = [];
    this.currentSkillId = 'clearScreen'; // 默认技能
    
    // 加载技能数据
    this.loadSkills();
  }
  
  /**
   * 加载技能数据
   */
  loadSkills() {
    // 从本地存储获取当前选择的技能
    const savedSkillId = wx.getStorageSync('currentSkillId');
    if (savedSkillId) {
      this.currentSkillId = savedSkillId;
    }
    
    try {
      // 直接使用require加载配置文件
      const levelsConfig = require('../config/levels.json');
      
      this.skills = levelsConfig.skills;
      
      // 计算技能卡片位置
      this.calculateSkillCardPositions();
    } catch (error) {
      console.error('加载技能数据失败:', error);
      // 如果加载失败，使用默认技能数据
      this.useDefaultSkills();
    }
  }
  
  /**
   * 使用默认技能数据
   */
  useDefaultSkills() {
    // 默认技能数据
    this.skills = [
      {
        id: 'clearScreen',
        name: '清屏技能',
        description: '清除屏幕上所有怪物',
        cooldown: 30,
        icon: 'images/skills/clearScreen.png'
      },
      {
        id: 'defenseBuff',
        name: '防御增强',
        description: '暂时增强防线和村庄的防御力',
        cooldown: 25,
        icon: 'images/skills/defenseBuff.png'
      },
      {
        id: 'rapidFire',
        name: '快速射击',
        description: '暂时提高射击速度',
        cooldown: 20,
        icon: 'images/skills/rapidFire.png'
      }
    ];
    
    // 计算技能卡片位置
    this.calculateSkillCardPositions();
  }
  
  /**
   * 计算技能卡片位置
   */
  calculateSkillCardPositions() {
    const totalWidth = this.skills.length * (SKILL_CARD_WIDTH + SKILL_CARD_MARGIN) - SKILL_CARD_MARGIN;
    let startX = (screenWidth - totalWidth) / 2;
    
    this.skills.forEach((skill, index) => {
      skill.x = startX + index * (SKILL_CARD_WIDTH + SKILL_CARD_MARGIN);
      skill.y = SKILL_CARDS_TOP;
      skill.width = SKILL_CARD_WIDTH;
      skill.height = SKILL_CARD_HEIGHT;
    });
  }
  
  /**
   * 处理技能选择
   * @param {number} x - 触摸点X坐标
   * @param {number} y - 触摸点Y坐标
   */
  handleSkillSelection(x, y) {
    for (let i = 0; i < this.skills.length; i++) {
      const skill = this.skills[i];
      
      if (x >= skill.x && x <= skill.x + skill.width &&
          y >= skill.y && y <= skill.y + skill.height) {
        
        this.currentSkillId = skill.id;
        this.emit('skillSelected', skill);
        
        // 保存当前选择的技能
        wx.setStorageSync('currentSkillId', skill.id);
        
        // 显示提示
        wx.showToast({
          title: `已选择${skill.name}`,
          icon: 'success',
          duration: 1500
        });
        
        break;
      }
    }
  }
  
  /**
   * 获取当前技能
   * @returns {Object} 当前技能对象
   */
  getCurrentSkill() {
    return this.skills.find(skill => skill.id === this.currentSkillId);
  }
  
  /**
   * 渲染技能选择界面
   * @param {CanvasRenderingContext2D} ctx - Canvas上下文
   */
  render(ctx) {
    // 绘制技能卡片
    this.skills.forEach(skill => {
      // 绘制卡片背景
      ctx.fillStyle = skill.id === this.currentSkillId ? '#4a90e2' : '#6a6a6a';
      ctx.fillRect(skill.x, skill.y, skill.width, skill.height);
      
      // 绘制技能名称
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(skill.name, skill.x + skill.width / 2, skill.y + 20);
      
      // 绘制技能图标（如果有）
      try {
        const img = wx.createImage();
        img.src = skill.icon;
        ctx.drawImage(img, skill.x + skill.width / 2 - 40, skill.y + 50, 80, 80);
      } catch (e) {
        // 如果图标加载失败，显示占位符
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(skill.x + skill.width / 2 - 40, skill.y + 50, 80, 80);
        ctx.fillStyle = '#4a90e2';
        ctx.font = '40px Arial';
        ctx.fillText('?', skill.x + skill.width / 2, skill.y + 90);
      }
      
      // 绘制技能描述
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.fillText(skill.description, skill.x + skill.width / 2, skill.y + 140, skill.width - 20);
      
      // 绘制冷却时间
      ctx.fillText(`冷却: ${skill.cooldown}秒`, skill.x + skill.width / 2, skill.y + 170);
      
      // 绘制选中状态
      if (skill.id === this.currentSkillId) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(skill.x + 3, skill.y + 3, skill.width - 6, skill.height - 6);
      }
    });
  }
}
