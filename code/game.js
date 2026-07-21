const App = require('./js/common/app');

wx.onShow(function() {
  if (!GameGlobal.app) {
    new App();
  }
});

if (!GameGlobal.app) {
  new App();
}

// 开发环境加载测试模块
try {
  require('./js/testRunner');
} catch (e) {
  console.error('[TEST] Failed to load test module:', e);
}
