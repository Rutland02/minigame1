/**
 * 全自动测试框架
 *
 * 启动本地 HTTP 服务器接收测试结果，然后触发游戏重新加载。
 * 游戏内的测试模块通过 wx.request() 将结果 POST 回来。
 *
 * 用法：node scripts/test-runner.js
 *
 * 流程：
 *   1. 启动 HTTP 服务器监听测试结果
 *   2. 备份 game.js，复制 test 文件到 code/
 *   3. 触发游戏重新编译（修改 game.js 时间戳）
 *   4. 游戏加载 → 测试运行 → wx.request() 发送结果
 *   5. 服务器接收结果，保存报告，输出结果
 *   6. 恢复原始 game.js，清理临时测试文件
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19830;
const REPORT_PATH = path.resolve(__dirname, '..', 'test-report.json');
const ERROR_REPORT_PATH = path.resolve(__dirname, '..', 'error-report.json');
const GAME_JS = path.resolve(__dirname, '..', 'code', 'game.js');
const GAME_TEST = path.resolve(__dirname, '..', 'test', 'game.test.js');
const TEST_DIR = path.resolve(__dirname, '..', 'test');
const CODE_JS_DIR = path.resolve(__dirname, '..', 'code', 'js');
const TIMEOUT = 60000; // 60 秒

// 需要从 test/ 复制到 code/js/ 的测试文件
const TEST_FILES = [
  'testRunner.js',
  'testMatch3.js',
  'testScoreManager.js',
  'testAchievements.js',
  'testRunnerBase.js',
];

function cleanupTestFiles() {
  for (const name of TEST_FILES) {
    const target = path.join(CODE_JS_DIR, name);
    try { fs.unlinkSync(target); } catch (_) {}
  }
}

async function main() {
  console.log('========================================');
  console.log('  全自动测试');
  console.log('========================================\n');

  // 1. 启动 HTTP 服务器
  const collectedErrors = [];
  let resolveReport;
  const reportPromise = new Promise((resolve, reject) => {
    resolveReport = resolve;
    setTimeout(() => reject(new Error('Timeout: 未收到测试结果（60秒）')), TIMEOUT);
  });

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/report') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
        try {
          resolveReport(JSON.parse(body));
        } catch (e) {
          resolveReport({ error: 'Invalid JSON', raw: body });
        }
      });
    } else if (req.method === 'POST' && req.url === '/errors') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
        try {
          const data = JSON.parse(body);
          if (data.errors && Array.isArray(data.errors)) {
            collectedErrors.push(...data.errors);
          }
        } catch (_) {}
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[1/5] 测试服务器已启动 (port ${PORT})`);
  });

  // 2. 备份 game.js，复制测试文件到 code/
  let originalGameJs = null;
  try {
    originalGameJs = fs.readFileSync(GAME_JS, 'utf8');
    const testEntry = fs.readFileSync(GAME_TEST, 'utf8');
    fs.writeFileSync(GAME_JS, testEntry, 'utf8');

    // 复制测试文件到 code/js/
    for (const name of TEST_FILES) {
      const src = path.join(TEST_DIR, name);
      const dest = path.join(CODE_JS_DIR, name);
      fs.copyFileSync(src, dest);
    }

    console.log('[2/5] 已切换到测试模式，测试文件已就位');
  } catch (e) {
    console.error('[2/5] 切换测试入口失败:', e.message);
    cleanupTestFiles();
    if (originalGameJs !== null) fs.writeFileSync(GAME_JS, originalGameJs, 'utf8');
    server.close();
    process.exit(1);
  }

  // 3. 触发游戏重新加载（修改 game.js 时间戳）
  try {
    const content = fs.readFileSync(GAME_JS, 'utf8');
    fs.writeFileSync(GAME_JS, content, 'utf8');
    console.log('[3/5] 已触发游戏重新编译');
  } catch (e) {
    console.error('[3/5] 触发重新编译失败:', e.message);
    console.error('    请手动在开发者工具中重新编译游戏');
  }

  // 4. 等待测试结果
  console.log('[4/5] 等待测试结果...\n');

  let report;
  try {
    report = await reportPromise;
  } catch (e) {
    console.error(e.message);
    console.error('\n排查步骤:');
    console.error('  1. 确认微信开发者工具已打开且项目已加载');
    console.error('  2. 确认游戏控制台有 [TEST] 输出');
    console.error('  3. 确认网络请求能到达 127.0.0.1:' + PORT);
    cleanupTestFiles();
    if (originalGameJs !== null) fs.writeFileSync(GAME_JS, originalGameJs, 'utf8');
    console.log('\n已恢复原始 game.js');
    server.close();
    process.exit(1);
  }

  server.close();

  // 5. 恢复原始 game.js，清理临时测试文件
  cleanupTestFiles();
  if (originalGameJs !== null) {
    fs.writeFileSync(GAME_JS, originalGameJs, 'utf8');
    console.log('已恢复原始 game.js\n');
  }

  // 6. 保存报告
  if (report.error) {
    console.error('测试结果格式错误:', report.error);
    process.exit(1);
  }

  // 合并报告中的运行时错误与服务器收到的错误
  const reportErrors = report.runtimeErrorDetails || [];
  const allErrors = [...reportErrors, ...collectedErrors];

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('========================================');
  console.log(`  测试结果: ${report.total} 总计, ${report.passed} 通过, ${report.failed} 失败`);
  if (report.failedTests && report.failedTests.length > 0) {
    console.log('\n  失败用例:');
    for (const t of report.failedTests) {
      console.log(`    - ${t.name}: ${t.error}`);
    }
  }

  // 7. 保存运行时错误报告
  if (allErrors.length > 0) {
    fs.writeFileSync(ERROR_REPORT_PATH, JSON.stringify({
      count: allErrors.length,
      errors: allErrors,
      timestamp: new Date().toISOString()
    }, null, 2), 'utf8');
    console.log(`\n  运行时错误: ${allErrors.length} 个`);
    const byType = {};
    for (const e of allErrors) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(byType)) {
      console.log(`    - ${type}: ${count}`);
    }
    // 打印前 5 条错误详情
    const preview = allErrors.slice(0, 5);
    for (const e of preview) {
      const msg = e.message.length > 120 ? e.message.substring(0, 120) + '...' : e.message;
      console.log(`    [${e.type}] ${msg}`);
    }
    if (allErrors.length > 5) {
      console.log(`    ... 还有 ${allErrors.length - 5} 条，详见 ${ERROR_REPORT_PATH}`);
    }
  } else {
    console.log('\n  运行时错误: 0 个');
  }

  console.log(`\n  报告已保存: ${REPORT_PATH}`);
  console.log('========================================');

  const hasErrors = report.failed > 0 || allErrors.length > 0;
  process.exit(hasErrors ? 1 : 0);
}

main().catch(e => {
  console.error('Test runner crashed:', e.message);
  process.exit(1);
});
