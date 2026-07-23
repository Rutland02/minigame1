const LoginPage = require('../pages/登录页/index');
const HomePage = require('../pages/首页/index');
const AchievementPage = require('../pages/成就页/index');
const QuizPage = require('../pages/答题页/index');
const Match3Game = require('../games/match3/game');
const PuzzleGame = require('../games/puzzle/game');
const ResourceManager = require('../utils/resourceManager');
const DataBus = require('../databus');

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
    width: 750,
    height: 1334
  };
  ctx = canvas.getContext('2d');
}

const resourceManager = new ResourceManager();
GameGlobal.resourceManager = resourceManager;

// 缓存系统信息，避免各页面重复调用 wx.getSystemInfoSync()
GameGlobal.systemInfo = wx.getSystemInfoSync();

GameGlobal.databus = new DataBus();

class App {
  constructor() {
    GameGlobal.app = this;
    this.databus = GameGlobal.databus;
    this.currentPage = null;
    this._boundLoop = this.loop.bind(this);
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
    
    this.showPage('login');
    
    this.loop();
  }

  // 游戏主循环
  loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (this.currentPage && this.currentPage.update) {
      this.currentPage.update();
    }
    
    if (this.currentPage) {
      this.currentPage.render(ctx);
    }
    
    requestAnimationFrame(this._boundLoop);
  }

  showPage(pageName) {
    if (this.currentPage) {
      this.currentPage.destroy();
    }

    switch (pageName) {
      case 'login':
        this.currentPage = new LoginPage();
        break;
      case 'home':
        this.currentPage = new HomePage();
        break;
      case 'achievement':
        this.currentPage = new AchievementPage();
        break;
      case 'match3':
        this.currentPage = new Match3Game();
        break;
      case 'puzzle':
        this.currentPage = new PuzzleGame();
        break;
      case 'quiz':
        this.currentPage = new QuizPage();
        break;
    }

    if (this.currentPage) {
      this.currentPage.render(ctx);
    }
  }

  onTouchStart(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
      // preventDefault not available on all event types
    }
    if (this.currentPage && this.currentPage.handleTouchStart) {
      this.currentPage.handleTouchStart(e);
    }
  }

  onTouchMove(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
      // preventDefault not available on all event types
    }
    if (this.currentPage && this.currentPage.handleTouchMove) {
      this.currentPage.handleTouchMove(e);
    }
  }

  onTouchEnd(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
      // preventDefault not available on all event types
    }
    if (this.currentPage && this.currentPage.handleTouchEnd) {
      this.currentPage.handleTouchEnd(e);
    }
  }
}

module.exports = App;
