const ScoreManager = require('./utils/scoreManager');

class DataBus {
  constructor() {
    this.userInfo = null;
    this.quizData = { total: 0, correct: 0 };
    this.resources = { 非遗: 0, 自然: 0, 红色: 0 };
    this.hasSeenTutorial = false;

    this.scoreManager = new ScoreManager();

    this.loadFromStorage();
  }

  saveToStorage() {
    try {
      wx.setStorageSync('databus', {
        userInfo: this.userInfo,
        quizData: this.quizData,
        resources: this.resources,
        hasSeenTutorial: this.hasSeenTutorial
      });
    } catch (e) {
      console.error('保存数据失败:', e);
    }
  }

  loadFromStorage() {
    try {
      const data = wx.getStorageSync('databus');
      if (data) {
        this.userInfo = data.userInfo;
        this.quizData = data.quizData || { total: 0, correct: 0 };
        this.resources = data.resources || { 非遗: 0, 自然: 0, 红色: 0 };
        this.hasSeenTutorial = data.hasSeenTutorial || false;
      }
    } catch (e) {
      console.error('加载数据失败:', e);
    }
  }

  getUserInfo() {
    return this.userInfo;
  }

  setUserInfo(userInfo) {
    this.userInfo = userInfo;
    this.saveToStorage();
  }

  getTotalScore() {
    return this.scoreManager.getTotalScore();
  }

  getQuizData() {
    return this.quizData;
  }

  updateQuizData(isCorrect) {
    this.quizData.total++;
    if (isCorrect) {
      this.quizData.correct++;
    }
    this.saveToStorage();
  }

  updateResource(type, amount) {
    if (this.resources[type] !== undefined) {
      this.resources[type] += amount;
      this.saveToStorage();
    }
  }

  getResources() {
    return this.resources;
  }

  // 成绩管理相关方法
  recordMatch3Score(score, level) {
    this.scoreManager.recordMatch3Score(score, level);
  }

  recordPuzzleScore(level, time, isCompleted) {
    this.scoreManager.recordPuzzleScore(level, time, isCompleted);
  }

  calculatePuzzleScore(level, time) {
    return this.scoreManager.calculatePuzzleScore(level, time);
  }

  recordQuizScore(correctCount, totalQuestions, score) {
    this.scoreManager.recordQuizScore(correctCount, totalQuestions, score);
  }

  getMatch3Scores() {
    return this.scoreManager.getMatch3Scores();
  }

  getPuzzleScores() {
    return this.scoreManager.getPuzzleScores();
  }

  getQuizScores() {
    return this.scoreManager.getQuizScores();
  }

  getAllScores() {
    return this.scoreManager.getAllScores();
  }

  getOverallStats() {
    return this.scoreManager.getOverallStats();
  }

  getAllAchievementsWithStatus() {
    return this.scoreManager.getAllAchievementsWithStatus();
  }

  unlockAchievement(achievementId) {
    return this.scoreManager.unlockAchievement(achievementId);
  }

  updatePlayTime(minutes) {
    this.scoreManager.updatePlayTime(minutes);
  }

  resetAllScores() {
    this.scoreManager.resetAllScores();
  }

  clearAllAchievements() {
    return this.scoreManager.clearAllAchievements();
  }

  markTutorialSeen() {
    this.hasSeenTutorial = true;
    this.saveToStorage();
  }
}

module.exports = DataBus;
