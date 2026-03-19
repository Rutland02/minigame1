const LoginPage = require('../pages/登录页/index');
const HomePage = require('../pages/首页/index');
const AchievementPage = require('../pages/成就页/index');
const QuizPage = require('../pages/答题页/index');
const Match3Game = require('../games/match3/game');
const PuzzleGame = require('../games/puzzle/game');
const DataManager = require('../utils/dataManager');
const ResourceManager = require('../utils/resourceManager');

// 获取 canvas 元素
let canvas;
let ctx;

// 在微信小游戏中使用 wx.createCanvas() 获取 canvas
try {
  canvas = wx.createCanvas();
  ctx = canvas.getContext('2d');
  console.log('Canvas created successfully');
  console.log('Canvas width:', canvas.width);
  console.log('Canvas height:', canvas.height);
} catch (error) {
  console.error('Failed to create canvas:', error);
  // 在开发环境中模拟 canvas
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

// 创建资源管理器
const resourceManager = new ResourceManager();
GameGlobal.resourceManager = resourceManager;

GameGlobal.databus = {
  currentPage: null,
  userInfo: null,
  score: 0,
  achievements: [],
  resources: {
    非遗: 0,
    自然: 0,
    红色: 0
  }
};

GameGlobal.dataManager = new DataManager();

class App {
  constructor() {
    GameGlobal.app = this;
    this.init();
  }

  async init() {
    // 跳过图片加载
    console.log('跳过图片加载');
    try {
      await resourceManager.loadImages([]);
      console.log('图片资源加载完成');
    } catch (error) {
      console.error('加载图片资源失败:', error);
    }

    // 初始化数据
    GameGlobal.dataManager.init();
    
    // 添加触摸事件监听
    try {
      // 尝试使用微信小游戏的事件监听
      if (typeof wx !== 'undefined' && wx.onTouchStart) {
        wx.onTouchStart(this.onTouchStart.bind(this));
        wx.onTouchMove(this.onTouchMove.bind(this));
        wx.onTouchEnd(this.onTouchEnd.bind(this));
      } else if (canvas.addEventListener) {
        //  fallback to standard DOM events
        canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
        canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
        canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
      }
    } catch (error) {
      console.error('添加触摸事件监听失败:', error);
    }
    
    // 显示登录页
    this.showPage('login');
    
    // 启动游戏循环
    this.loop();
  }

  // 游戏主循环
  loop() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 更新当前页面
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.update) {
      GameGlobal.databus.currentPage.update();
    }
    
    // 渲染当前页面
    if (GameGlobal.databus.currentPage) {
      GameGlobal.databus.currentPage.render(ctx);
    }
    
    // 继续下一帧
    requestAnimationFrame(this.loop.bind(this));
  }

  showPage(pageName) {
    // 清除当前页面
    if (GameGlobal.databus.currentPage) {
      GameGlobal.databus.currentPage.destroy();
    }

    // 创建新页面
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

    // 渲染页面
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
      // 忽略 preventDefault 错误
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchStart) {
      GameGlobal.databus.currentPage.handleTouchStart(e);
      // 重新渲染页面
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
      // 忽略 preventDefault 错误
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchMove) {
      GameGlobal.databus.currentPage.handleTouchMove(e);
      // 重新渲染页面
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
      // 忽略 preventDefault 错误
    }
    if (GameGlobal.databus.currentPage && GameGlobal.databus.currentPage.handleTouchEnd) {
      GameGlobal.databus.currentPage.handleTouchEnd(e);
      // 重新渲染页面
      if (GameGlobal.databus.currentPage) {
        GameGlobal.databus.currentPage.render(ctx);
      }
    }
  }
}

module.exports = App;
