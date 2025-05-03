let instance;

/**
 * 统一的音效管理器
 */
export default class Music {
  bgmAudio = wx.createInnerAudioContext();
  shootAudio = wx.createInnerAudioContext();
  boomAudio = wx.createInnerAudioContext();
  levelUpAudio = wx.createInnerAudioContext();
  hitAudio = wx.createInnerAudioContext();
  gameOverAudio = wx.createInnerAudioContext();

  constructor() {
    if (instance) return instance;

    instance = this;

    this.bgmAudio.loop = true; // 背景音乐循环播放
    this.bgmAudio.autoplay = false; // 禁用自动播放，需手动触发
    this.bgmAudio.src = 'audio/bgm.mp3';
    this.shootAudio.src = 'audio/bullet.mp3';
    this.boomAudio.src = 'audio/boom.mp3';
    
    // 使用现有的音效文件作为替代
    this.levelUpAudio.src = 'audio/bullet.mp3'; // 升级音效，先用子弹音效替代
    this.hitAudio.src = 'audio/bullet.mp3'; // 命中音效，先用子弹音效替代
    this.gameOverAudio.src = 'audio/boom.mp3'; // 游戏结束音效，先用爆炸音效替代
    
    // 调整音量
    this.bgmAudio.volume = 0.5;
    this.shootAudio.volume = 0.3;
    this.boomAudio.volume = 0.6;
    this.levelUpAudio.volume = 0.8;
    this.hitAudio.volume = 0.2;
    this.gameOverAudio.volume = 1.0;
  }

  // 播放射击音效
  playShoot() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.soundEnabled === false) return;
    this.shootAudio.currentTime = 0;
    this.shootAudio.play();
  }

  // 播放爆炸音效
  playExplosion() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.soundEnabled === false) return;
    this.boomAudio.currentTime = 0;
    this.boomAudio.play();
  }
  
  // 播放升级音效
  playLevelUp() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.soundEnabled === false) return;
    this.levelUpAudio.currentTime = 0;
    this.levelUpAudio.play();
  }
  
  // 播放命中音效
  playHit() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.soundEnabled === false) return;
    this.hitAudio.currentTime = 0;
    this.hitAudio.play();
  }
  
  // 播放游戏结束音效
  playGameOver() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.soundEnabled === false) return;
    this.gameOverAudio.currentTime = 0;
    this.gameOverAudio.play();
  }

  // 手动播放背景音乐
  playBgm() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.musicManager && GameGlobal.musicManager.musicEnabled === false) {
      this.bgmAudio.pause();
      return;
    }
    // 防止重复播放
    if (this.bgmAudio.paused || this.bgmAudio.currentTime === 0) {
      this.bgmAudio.play();
    }
  }

  // 手动暂停背景音乐
  pauseBgm() {
    // 只在正在播放时暂停
    if (!this.bgmAudio.paused) {
      this.bgmAudio.pause();
    }
  }
}
