// 数据管理工具
class DataManager {
  constructor() {
    this.data = {
      userInfo: null,
      score: 0,
      achievements: [],
      resources: {
        非遗: 0,
        自然: 0,
        红色: 0
      },
      gameProgress: {
        match3: {
          highestScore: 0,
          level: 1
        },
        puzzle: {
          completed: [],
          bestTime: {}
        }
      }
    };
  }

  init() {
    // 从本地存储加载数据
    const savedData = wx.getStorageSync('gameData');
    if (savedData) {
      this.data = { ...this.data, ...savedData };
    }
  }

  save() {
    // 保存数据到本地存储
    wx.setStorageSync('gameData', this.data);
  }

  getUserInfo() {
    return this.data.userInfo;
  }

  setUserInfo(userInfo) {
    this.data.userInfo = userInfo;
    this.save();
  }

  getScore() {
    return this.data.score;
  }

  addScore(score) {
    this.data.score += score;
    this.save();
  }

  getResources() {
    return this.data.resources;
  }

  addResource(type, amount) {
    if (this.data.resources[type] !== undefined) {
      this.data.resources[type] += amount;
      this.save();
    }
  }

  getAchievements() {
    return this.data.achievements;
  }

  addAchievement(achievement) {
    this.data.achievements.push(achievement);
    this.save();
  }

  getGameProgress(gameType) {
    return this.data.gameProgress[gameType] || {};
  }

  updateGameProgress(gameType, progress) {
    this.data.gameProgress[gameType] = { ...this.data.gameProgress[gameType], ...progress };
    this.save();
  }
}

module.exports = DataManager;