class DataMonitor {
  constructor() {
    this.startTime = Date.now();
    this.pageLoadTimes = {};
    this.gameScores = [];
    this.userActions = [];
  }

  recordPageLoad(pageName) {
    const loadTime = Date.now() - this.startTime;
    this.pageLoadTimes[pageName] = loadTime;
    console.log(`页面 ${pageName} 加载时间: ${loadTime}ms`);
    this.reportData('page_load', {
      pageName,
      loadTime
    });
  }

  recordGameScore(gameType, score) {
    const gameData = {
      gameType,
      score,
      timestamp: Date.now()
    };
    this.gameScores.push(gameData);
    this.reportData('game_score', gameData);
  }

  recordUserAction(action, data = {}) {
    const actionData = {
      action,
      timestamp: Date.now(),
      ...data
    };
    this.userActions.push(actionData);
    this.reportData('user_action', actionData);
  }

  recordError(error, source) {
    const errorData = {
      error: error.toString(),
      source,
      timestamp: Date.now()
    };
    console.error(`错误 [${source}]: ${error}`);
    this.reportData('error', errorData);
  }

  reportData(type, data) {
    console.log(`上报数据 [${type}]:`, data);
    
    if (wx && wx.request) {
    }
  }

  getMonitorData() {
    return {
      pageLoadTimes: this.pageLoadTimes,
      gameScores: this.gameScores,
      userActions: this.userActions,
      uptime: Date.now() - this.startTime
    };
  }

  exportMonitorData() {
    return JSON.stringify(this.getMonitorData());
  }
}

const dataMonitor = new DataMonitor();
export default dataMonitor;