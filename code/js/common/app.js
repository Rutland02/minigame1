const LoginPage = require('../pages/登录页/index');
const HomePage = require('../pages/首页/index');
const AchievementPage = require('../pages/成就页/index');
const QuizPage = require('../pages/答题页/index');
const Match3Game = require('../games/match3/game');
const PuzzleGame = require('../games/puzzle/game');
const DataManager = require('../utils/dataManager');
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

GameGlobal.databus = new DataBus();
GameGlobal.dataManager = new DataManager();

class App {
  constructor() {
    GameGlobal.app = this;
    this.databus = GameGlobal.databus;
    this.init();
  }

  async init() {
    console.log('跳过图片加载');
    try {
      await resourceManager.loadImages([]);
      console.log('图片资源加载完成');
    } catch (error) {
      console.error('加载图片资源失败:', error);
    }

  
    GameGlobal.dataManager.init();
    
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
    
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.update) {
      GameGlobal.databus.currentPage.update();
    }
    
    if (GameGlobal.databus.currentPage) {
      GameGlobal.databus.currentPage.render(ctx);
    }
    
    requestAnimationFrame(this.loop.bind(this));
  }

  showPage(pageName) {
    if (GameGlobal.databus.currentPage) {
      GameGlobal.databus.currentPage.destroy();
    }

    switch (pageName) {
      case 'login':
        GameGlobal.databus.currentPage = new LoginPage();
        break;
      case 'home':
        GameGlobal.databus.currentPage = new HomePage();
        break;
      case 'achievement':
        GameGlobal.databus.currentPage = new AchievementPage();
        break;
      case 'match3':
        GameGlobal.databus.currentPage = new Match3Game();
        break;
      case 'puzzle':
        GameGlobal.databus.currentPage = new PuzzleGame();
        break;
      case 'quiz':
        GameGlobal.databus.currentPage = new QuizPage();
        break;
    }

    if (GameGlobal.databus.currentPage) {
      GameGlobal.databus.currentPage.render(ctx);
    }
  }

  onTouchStart(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchStart) {
      GameGlobal.databus.currentPage.handleTouchStart(e);
      if (GameGlobal.databus.currentPage) {
        GameGlobal.databus.currentPage.render(ctx);
      }
    }
  }

  onTouchMove(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchMove) {
      GameGlobal.databus.currentPage.handleTouchMove(e);
      if (GameGlobal.databus.currentPage) {
        GameGlobal.databus.currentPage.render(ctx);
      }
    }
  }

  onTouchEnd(e) {
    try {
      if (e.preventDefault) {
        e.preventDefault();
      }
    } catch (error) {
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchEnd) {
      GameGlobal.databus.currentPage.handleTouchEnd(e);
      if (GameGlobal.databus.currentPage) {
        GameGlobal.databus.currentPage.render(ctx);
      }
    }
  }
}

module.exports = App;
