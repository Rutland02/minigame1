/**
 * 数据监控模块
 * 用于收集和上报用户行为、游戏数据和系统性能等信息
 */

class DataMonitor {
  constructor() {
    this.startTime = Date.now();
    this.pageLoadTimes = {};
    this.gameScores = [];
    this.userActions = [];
  }

  /**
   * 记录页面加载时间
   * @param {string} pageName - 页面名称
   */
  recordPageLoad(pageName) {
    const loadTime = Date.now() - this.startTime;
    this.pageLoadTimes[pageName] = loadTime;
    console.log(`页面 ${pageName} 加载时间: ${loadTime}ms`);
    this.reportData('page_load', {
      pageName,
      loadTime
    });
  }

  /**
   * 记录游戏得分
   * @param {string} gameType - 游戏类型
   * @param {number} score - 得分
   */
  recordGameScore(gameType, score) {
    const gameData = {
      gameType,
      score,
      timestamp: Date.now()
    };
    this.gameScores.push(gameData);
    this.reportData('game_score', gameData);
  }

  /**
   * 记录用户行为
   * @param {string} action - 行为类型
   * @param {object} data - 行为数据
   */
  recordUserAction(action, data = {}) {
    const actionData = {
      action,
      timestamp: Date.now(),
      ...data
    };
    this.userActions.push(actionData);
    this.reportData('user_action', actionData);
  }

  /**
   * 记录错误
   * @param {string} error - 错误信息
   * @param {string} source - 错误来源
   */
  recordError(error, source) {
    const errorData = {
      error: error.toString(),
      source,
      timestamp: Date.now()
    };
    console.error(`错误 [${source}]: ${error}`);
    this.reportData('error', errorData);
  }

  /**
   * 上报数据
   * @param {string} type - 数据类型
   * @param {object} data - 数据内容
   */
  reportData(type, data) {
    // 在实际项目中，这里可以使用 wx.request 发送数据到服务器
    // 这里仅做本地日志记录
    console.log(`上报数据 [${type}]:`, data);
    
    // 模拟上报
    if (wx && wx.request) {
      // 实际项目中的上报代码
      /*
      wx.request({
        url: 'https://your-api-server.com/monitor',
        method: 'POST',
        data: {
          type,
          data,
          appId: wx.getAccountInfoSync().miniProgram.appId,
          openId: wx.getStorageSync('openId')
        },
        success: (res) => {
          console.log('数据上报成功:', res);
        },
        fail: (err) => {
          console.error('数据上报失败:', err);
        }
      });
      */
    }
  }

  /**
   * 获取监控数据汇总
   * @returns {object} 监控数据汇总
   */
  getMonitorData() {
    return {
      pageLoadTimes: this.pageLoadTimes,
      gameScores: this.gameScores,
      userActions: this.userActions,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 导出监控数据
   * @returns {string} 监控数据JSON字符串
   */
  exportMonitorData() {
    return JSON.stringify(this.getMonitorData());
  }
}

// 导出单例
const dataMonitor = new DataMonitor();
export default dataMonitor;