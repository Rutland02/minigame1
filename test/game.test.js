/**
 * 测试模式入口文件
 *
 * 用于开发测试环境，检测信号文件并加载对应测试模块。
 * 生产环境应使用 code/game.js（不含测试逻辑）。
 *
 * 用法：将此文件内容复制到 code/game.js 或通过信号机制触发
 */

const App = require('../code/js/common/app');
const errorCapture = require('../code/js/utils/errorCapture');

errorCapture.init();
GameGlobal.errorCapture = errorCapture;

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
    const { runAchievementTests } = require('./testAchievements');
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
    require('./testRunner');
    try { fs.unlinkSync('.test-runner-signal'); } catch (_) {}
  } catch (_) {}
} catch (_) {
  // wx.getFileSystemManager 不可用 → 生产环境，不加载测试
}
