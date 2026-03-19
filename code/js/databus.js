function DataBus() {
  this.userInfo = null;
  this.score = 0;
  this.achievements = [];
  this.checkInPoints = [];
  this.quizData = { total: 0, correct: 0 };
  this.resources = { 非遗: 0, 自然: 0, 红色: 0 };
}

DataBus.prototype.getUserInfo = function() {
  return this.userInfo;
};

DataBus.prototype.setUserInfo = function(userInfo) {
  this.userInfo = userInfo;
};

DataBus.prototype.getAchievements = function() {
  return this.achievements;
};

DataBus.prototype.addAchievement = function(achievement) {
  this.achievements.push(achievement);
};

DataBus.prototype.isCheckedIn = function(pointId) {
  return this.checkInPoints.some(function(point) {
    return point.id === pointId;
  });
};

DataBus.prototype.addCheckInPoint = function(point) {
  this.checkInPoints.push(point);
};

DataBus.prototype.getCheckInData = function() {
  return this.checkInPoints;
};

DataBus.prototype.unlockExclusiveSkin = function(skinId) {
  console.log('解锁皮肤:', skinId);
};

DataBus.prototype.getTotalScore = function() {
  return this.score;
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
};

DataBus.prototype.updateResource = function(type, amount) {
  if (this.resources[type] !== undefined) {
    this.resources[type] += amount;
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

module.exports = DataBus;