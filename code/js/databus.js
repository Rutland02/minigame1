const ScoreManager = require('./utils/scoreManager');

function DataBus() {
  this.userInfo = null;
  this.score = 0;
  this.achievements = [];
  this.checkInPoints = [];
  this.quizData = { total: 0, correct: 0 };
  this.resources = { 非遗: 0, 自然: 0, 红色: 0 };
  this.knowledgeBuff = false;
  
  // 初始化成绩管理器
  this.scoreManager = new ScoreManager();
  
  this.loadFromStorage();
}

DataBus.prototype.saveToStorage = function() {
  try {
    wx.setStorageSync('databus', {
      userInfo: this.userInfo,
      score: this.score,
      achievements: this.achievements,
      checkInPoints: this.checkInPoints,
      quizData: this.quizData,
      resources: this.resources,
      knowledgeBuff: this.knowledgeBuff
    });
  } catch (e) {
    console.error('保存数据失败:', e);
  }
};

DataBus.prototype.loadFromStorage = function() {
  try {
    const data = wx.getStorageSync('databus');
    if (data) {
      this.userInfo = data.userInfo;
      this.score = data.score || 0;
      this.achievements = data.achievements || [];
      this.checkInPoints = data.checkInPoints || [];
      this.quizData = data.quizData || { total: 0, correct: 0 };
      this.resources = data.resources || { 非遗: 0, 自然: 0, 红色: 0 };
      this.knowledgeBuff = data.knowledgeBuff || false;
    }
  } catch (e) {
    console.error('加载数据失败:', e);
  }
};

DataBus.prototype.getUserInfo = function() {
  return this.userInfo;
};

DataBus.prototype.setUserInfo = function(userInfo) {
  this.userInfo = userInfo;
  this.saveToStorage();
};

DataBus.prototype.getAchievements = function() {
  return this.achievements;
};

DataBus.prototype.addAchievement = function(achievement) {
  this.achievements.push(achievement);
  this.saveToStorage();
};

DataBus.prototype.isCheckedIn = function(pointId) {
  return this.checkInPoints.some(function(point) {
    return point.id === pointId;
  });
};

DataBus.prototype.addCheckInPoint = function(point) {
  this.checkInPoints.push(point);
  this.saveToStorage();
};

DataBus.prototype.getCheckInData = function() {
  return this.checkInPoints;
};

DataBus.prototype.unlockExclusiveSkin = function(skinId) {
  console.log('解锁皮肤:', skinId);
};

DataBus.prototype.getTotalScore = function() {
  // 从成绩管理器获取总积分
  return this.scoreManager.getTotalScore();
};

DataBus.prototype.getQuizData = function() {
  return this.quizData;
};

DataBus.prototype.updateQuizData = function(isCorrect) {
  this.quizData.total++;
  if (isCorrect) {
    this.quizData.correct++;
    this.score += 10;
  }
  this.saveToStorage();
};

DataBus.prototype.updateResource = function(type, amount) {
  if (this.resources[type] !== undefined) {
    this.resources[type] += amount;
    this.saveToStorage();
  }
};

DataBus.prototype.getResources = function() {
  return this.resources;
};

DataBus.prototype.setKnowledgeBuff = function(isActive) {
  this.knowledgeBuff = isActive;
};

DataBus.prototype.getKnowledgeBuff = function() {
  return this.knowledgeBuff || false;
};

// ========== 成绩管理相关方法 ==========

// 记录消消乐成绩
DataBus.prototype.recordMatch3Score = function(score, level) {
  this.scoreManager.recordMatch3Score(score, level);
};

// 记录拼图成绩
DataBus.prototype.recordPuzzleScore = function(level, time, isCompleted) {
  this.scoreManager.recordPuzzleScore(level, time, isCompleted);
};

// 记录答题成绩
DataBus.prototype.recordQuizScore = function(correctCount, totalQuestions, score) {
  this.scoreManager.recordQuizScore(correctCount, totalQuestions, score);
};

// 获取消消乐成绩
DataBus.prototype.getMatch3Scores = function() {
  return this.scoreManager.getMatch3Scores();
};

// 获取拼图成绩
DataBus.prototype.getPuzzleScores = function() {
  return this.scoreManager.getPuzzleScores();
};

// 获取答题成绩
DataBus.prototype.getQuizScores = function() {
  return this.scoreManager.getQuizScores();
};

// 获取所有成绩
DataBus.prototype.getAllScores = function() {
  return this.scoreManager.getAllScores();
};

// 获取总体统计
DataBus.prototype.getOverallStats = function() {
  return this.scoreManager.getOverallStats();
};

// 获取所有成就（带解锁状态）
DataBus.prototype.getAllAchievementsWithStatus = function() {
  return this.scoreManager.getAllAchievementsWithStatus();
};

// 解锁成就
DataBus.prototype.unlockAchievement = function(achievementId) {
  return this.scoreManager.unlockAchievement(achievementId);
};

// 更新游戏时长
DataBus.prototype.updatePlayTime = function(minutes) {
  this.scoreManager.updatePlayTime(minutes);
};

// 重置所有成绩
DataBus.prototype.resetAllScores = function() {
  this.scoreManager.resetAllScores();
};

// 清除所有已解锁的成就
DataBus.prototype.clearAllAchievements = function() {
  return this.scoreManager.clearAllAchievements();
};

module.exports = DataBus;
