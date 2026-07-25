const App = require('./js/common/app');
const errorCapture = require('./js/utils/errorCapture');

errorCapture.init();

wx.onShow(function() {
  if (!GameGlobal.app) {
    new App();
  }
});

if (!GameGlobal.app) {
  new App();
}

// 测试模块按需加载（仅在信号文件存在时）
try {
  const fs = wx.getFileSystemManager();

  // 成就测试信号
  try {
    fs.accessSync('.ach-test-signal');
    const { runAchievementTests } = require('./js/testAchievements');
    GameGlobal.runAchievementTests = runAchievementTests;
    try { fs.unlinkSync('.ach-test-signal'); } catch (_) {}
    // 触发自动运行
    setTimeout(() => {
      runAchievementTests().catch(e => {
        console.error('[TEST-ACH] Test runner crashed:', e);
      });
    }, 2000);
  } catch (_) {}

  // 常规测试信号
  try {
    fs.accessSync('.test-runner-signal');
    require('./js/testRunner');
    try { fs.unlinkSync('.test-runner-signal'); } catch (_) {}
  } catch (_) {}
} catch (_) {
  // wx.getFileSystemManager 不可用 → 生产环境，不加载测试
}
