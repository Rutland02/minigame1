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
 *   2. 触发游戏重新编译（修改 game.js 时间戳）
 *   3. 游戏加载 → 测试运行 → wx.request() 发送结果
 *   4. 服务器接收结果，保存报告，输出结果
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19830;
const REPORT_PATH = path.resolve(__dirname, '..', 'test-report.json');
const GAME_JS = path.resolve(__dirname, '..', 'code', 'game.js');
const TIMEOUT = 60000; // 60 秒

async function main() {
  console.log('========================================');
  console.log('  全自动测试');
  console.log('========================================\n');

  // 1. 启动 HTTP 服务器
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
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[1/3] 测试服务器已启动 (port ${PORT})`);
  });

  // 2. 触发游戏重新加载（修改 game.js 时间戳）
  try {
    const content = fs.readFileSync(GAME_JS, 'utf8');
    fs.writeFileSync(GAME_JS, content, 'utf8');
    console.log('[2/3] 已触发游戏重新编译');
  } catch (e) {
    console.error('[2/3] 触发重新编译失败:', e.message);
    console.error('    请手动在开发者工具中重新编译游戏');
  }

  // 3. 等待测试结果
  console.log('[3/3] 等待测试结果...\n');

  let report;
  try {
    report = await reportPromise;
  } catch (e) {
    console.error(e.message);
    console.error('\n排查步骤:');
    console.error('  1. 确认微信开发者工具已打开且项目已加载');
    console.error('  2. 确认游戏控制台有 [TEST] 输出');
    console.error('  3. 确认网络请求能到达 127.0.0.1:' + PORT);
    server.close();
    process.exit(1);
  }

  server.close();

  // 4. 保存报告
  if (report.error) {
    console.error('测试结果格式错误:', report.error);
    process.exit(1);
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('========================================');
  console.log(`  测试结果: ${report.total} 总计, ${report.passed} 通过, ${report.failed} 失败`);
  if (report.failedTests && report.failedTests.length > 0) {
    console.log('\n  失败用例:');
    for (const t of report.failedTests) {
      console.log(`    - ${t.name}: ${t.error}`);
    }
  }
  console.log(`\n  报告已保存: ${REPORT_PATH}`);
  console.log('========================================');

  process.exit(report.failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test runner crashed:', e.message);
  process.exit(1);
});
