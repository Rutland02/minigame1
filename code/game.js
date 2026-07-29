const App = require('./js/common/app');

// 错误上报面向本地调试服务器，仅测试模式启用（测试入口 game.test.js 会自行 init）
if (GameGlobal.__TEST_MODE__) {
  const errorCapture = require('./js/utils/errorCapture');
  errorCapture.init();
  GameGlobal.errorCapture = errorCapture;
}

wx.onShow(function() {
  if (!GameGlobal.app) {
    new App();
  }
});

if (!GameGlobal.app) {
  new App();
}
