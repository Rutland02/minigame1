/**
 * 成就系统独立测试
 *
 * 用法：npm run test:ach
 *
 * 流程：
 *   1. 写入信号文件告诉游戏运行成就测试
 *   2. 启动 HTTP 服务器监听结果（端口 19831）
 *   3. 触发游戏重新编译
 *   4. 游戏检测到信号文件 → 只运行成就测试 → POST 结果回来
 *   5. 服务器接收结果，保存报告，输出结果
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19831;
const REPORT_PATH = path.resolve(__dirname, '..', 'test-report-achievements.json');
const GAME_JS = path.resolve(__dirname, '..', 'code', 'game.js');
const SIGNAL_FILE = path.resolve(__dirname, '..', 'code', '.ach-test-signal');
const TIMEOUT = 60000;

async function main() {
  console.log('========================================');
  console.log('  成就系统测试');
  console.log('========================================\n');

  // 1. 写入信号文件
  fs.writeFileSync(SIGNAL_FILE, 'run', 'utf8');
  console.log('[1/4] 已写入测试信号文件');

  // 2. 启动 HTTP 服务器
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
    console.log(`[2/4] 测试服务器已启动 (port ${PORT})`);
  });

  // 3. 触发游戏重新加载
  try {
    const content = fs.readFileSync(GAME_JS, 'utf8');
    fs.writeFileSync(GAME_JS, content, 'utf8');
    console.log('[3/4] 已触发游戏重新编译');
  } catch (e) {
    console.error('[3/4] 触发重新编译失败:', e.message);
    console.error('    请手动在开发者工具中重新编译游戏');
  }

  // 4. 等待测试结果
  console.log('[4/4] 等待测试结果...\n');

  let report;
  try {
    report = await reportPromise;
  } catch (e) {
    // 清理信号文件
    try { fs.unlinkSync(SIGNAL_FILE); } catch (_) {}
    console.error(e.message);
    console.error('\n排查步骤:');
    console.error('  1. 确认微信开发者工具已打开且项目已加载');
    console.error('  2. 确认游戏控制台有 [TEST-ACH] 输出');
    console.error('  3. 确认网络请求能到达 127.0.0.1:' + PORT);
    server.close();
    process.exit(1);
  }

  server.close();

  // 清理信号文件
  try { fs.unlinkSync(SIGNAL_FILE); } catch (_) {}

  // 保存报告
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
