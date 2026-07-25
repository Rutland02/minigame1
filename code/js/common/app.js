const LoginPage = require('../pages/登录页/index');
const HomePage = require('../pages/首页/index');
const AchievementPage = require('../pages/成就页/index');
const QuizPage = require('../pages/答题页/index');
const Match3Game = require('../games/match3/game');
const PuzzleGame = require('../games/puzzle/game');
const ResourceManager = require('../utils/resourceManager');
const DataBus = require('../databus');
const EventBus = require('../utils/eventBus');

let canvas;
let ctx;

try {
  canvas = wx.createCanvas();
  ctx = canvas.getContext('2d');
  console.log('Canvas created successfully');
  console.log('Canvas width:', canvas.width);
  console.log('Canvas height:', canvas.height);
} catch (error) {
  console.error('Failed to create canvas:', error);
  canvas = {
    isMock: true,
    getContext: function() {
      return {
        clearRect: function() {},
        fillRect: function() {},
        fillText: function() {},
        drawImage: function() {},
        beginPath: function() {},
        moveTo: function() {},
        lineTo: function() {},
        stroke: function() {},
        fill: function() {},
        arc: function() {},
        font: '',
        fillStyle: '',
        strokeStyle: '',
        textAlign: '',
        textBaseline: ''
      };
    },
    addEventListener: function() {},
    width: (GameGlobal.systemInfo && GameGlobal.systemInfo.windowWidth) || 375,
    height: (GameGlobal.systemInfo && GameGlobal.systemInfo.windowHeight) || 667
  };
  ctx = canvas.getContext('2d');
}

const resourceManager = new ResourceManager();
GameGlobal.resourceManager = resourceManager;

// 缓存系统信息，避免各页面重复调用 wx.getSystemInfoSync()
GameGlobal.systemInfo = wx.getSystemInfoSync();

GameGlobal.databus = new DataBus();
GameGlobal.eventBus = new EventBus();

class App {
  constructor() {
    GameGlobal.app = this;
    this.databus = GameGlobal.databus;
    this.currentPage = null;
    this._transition = null;
    this._lastLoopTime = 0;
    this._achievementQueue = [];
    this._achievementBanner = null;
    this._boundLoop = this.loop.bind(this);
    this.dpr = GameGlobal.systemInfo ? GameGlobal.systemInfo.pixelRatio : 1;
    this.init();
  }

  async init() {
    try {
      await resourceManager.loadImages([
        { key: 'bg', src: 'images/ui/bg2.jpg' },
        { key: 'logo', src: 'images/logo/icon_0000_logo.png' },
        { key: 'loginButton', src: 'images/logo/icon_0001_log_in.png' }
      ]);
      console.log('图片资源加载完成');
    } catch (error) {
      console.error('加载图片资源失败:', error);
    }

    if (GameGlobal.eventBus) {
      GameGlobal.eventBus.on('achievement:unlocked', ({ achievement }) => {
        if (achievement) {
          this._achievementQueue.push(achievement);
        }
      });
    }

    try {
      if (typeof wx !== 'undefined' && wx.onTouchStart) {
        wx.onTouchStart(this.onTouchStart.bind(this));
        wx.onTouchMove(this.onTouchMove.bind(this));
        wx.onTouchEnd(this.onTouchEnd.bind(this));
      } else if (canvas.addEventListener) {
        canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
        canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
        canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
      }
    } catch (error) {
      console.error('添加触摸事件监听失败:', error);
    }
    
    ctx.scale(this.dpr, this.dpr);

    this.showPage('login');

    this.loop();
  }

  loop() {
    const now = Date.now();
    const dt = this._lastLoopTime ? (now - this._lastLoopTime) / 1000 : 0;
    this._lastLoopTime = now;

    ctx.clearRect(0, 0, canvas.width / this.dpr, canvas.height / this.dpr);

    this._processAchievementQueue();

    if (this._transition) {
      const t = this._transition;
      t.progress += dt;

      if (t.phase === 'fadeOut') {
        const alpha = Math.min(t.progress / t.duration, 1);
        ctx.save();
        ctx.globalAlpha = 1 - alpha;
        t.fromPage.render(ctx);
        ctx.restore();

        if (t.progress >= t.duration) {
          t.fromPage.destroy();
          this.currentPage = t.toPage;
          t.phase = 'fadeIn';
          t.progress = 0;
        }
      }

      if (t.phase === 'fadeIn') {
        const alpha = Math.min(t.progress / t.duration, 1);
        ctx.save();
        ctx.globalAlpha = alpha;
        this.currentPage.render(ctx);
        ctx.restore();

        if (t.progress >= t.duration) {
          this._transition = null;
        }
      }
    } else {
      if (this.currentPage && this.currentPage.update) {
        this.currentPage.update();
      }

      if (this.currentPage) {
        this.currentPage.render(ctx);
      }
    }

    if (this._achievementBanner) {
      this._updateAchievementBanner(dt);
      this._drawAchievementBanner(ctx);
    }

    requestAnimationFrame(this._boundLoop);
  }

  _processAchievementQueue() {
    if (this._achievementBanner || this._achievementQueue.length === 0) return;
    const achievement = this._achievementQueue.shift();
    this._achievementBanner = {
      achievement,
      phase: 'slideIn',
      progress: 0,
      duration: 0.3,
      showTime: 2.0,
      y: -70
    };
  }

  _updateAchievementBanner(dt) {
    const banner = this._achievementBanner;
    if (!banner) return;
    banner.progress += dt;
    if (banner.phase === 'slideIn') {
      const t = Math.min(banner.progress / banner.duration, 1);
      banner.y = -70 + 70 * t;
      if (t >= 1) {
        banner.phase = 'show';
        banner.progress = 0;
      }
    } else if (banner.phase === 'show') {
      if (banner.progress >= banner.showTime) {
        banner.phase = 'slideOut';
        banner.progress = 0;
      }
    } else if (banner.phase === 'slideOut') {
      const t = Math.min(banner.progress / banner.duration, 1);
      banner.y = -70 * t;
      if (t >= 1) {
        this._achievementBanner = null;
      }
    }
  }

  _drawAchievementBanner(ctx) {
    const banner = this._achievementBanner;
    if (!banner) return;
    const w = canvas.width / this.dpr;
    const h = 70;
    const y = banner.y;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    const gradient = ctx.createLinearGradient(0, y, 0, y + h);
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(1, '#059669');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.lineTo(w, y + h - 10);
    ctx.arcTo(w, y + h, w - 10, y + h, 10);
    ctx.lineTo(10, y + h);
    ctx.arcTo(0, y + h, 0, y + h - 10, 10);
    ctx.lineTo(0, y);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.font = '28px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    const icon = banner.achievement.icon || '';
    ctx.fillText(icon, 20, y + h / 2);

    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    const title = banner.achievement.title || '';
    ctx.fillText(title + ' 已解锁！', 56, y + h / 2);

    ctx.restore();
  }

  showPage(pageName, param) {
    if (this._transition) {
      this._transition.fromPage.destroy();
      this._transition = null;
    }

    let newPage;
    switch (pageName) {
      case 'login':
        newPage = new LoginPage();
        break;
      case 'home':
        newPage = new HomePage();
        break;
      case 'achievement':
        newPage = new AchievementPage();
        break;
      case 'match3':
        newPage = new Match3Game();
        break;
      case 'puzzle':
        newPage = new PuzzleGame();
        break;
      case 'quiz':
        newPage = new QuizPage(param);
        break;
    }

    if (!newPage) return;

    if (!this.currentPage) {
      this.currentPage = newPage;
      return;
    }

    this._transition = {
      fromPage: this.currentPage,
      toPage: newPage,
      progress: 0,
      duration: 0.15,
      phase: 'fadeOut'
    };
    this.currentPage = null;
  }

  onTouchStart(e) {
    if (this._transition) return;
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (this.currentPage && this.currentPage.handleTouchStart) {
      this.currentPage.handleTouchStart(e);
    }
  }

  onTouchMove(e) {
    if (this._transition) return;
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (this.currentPage && this.currentPage.handleTouchMove) {
      this.currentPage.handleTouchMove(e);
    }
  }

  onTouchEnd(e) {
    if (this._transition) return;
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (this.currentPage && this.currentPage.handleTouchEnd) {
      this.currentPage.handleTouchEnd(e);
    }
  }
}

module.exports = App;
