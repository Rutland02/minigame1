/**
 * 独立运行时错误捕获脚本
 *
 * 触发游戏重新加载，收集运行时错误（不运行测试）。
 * 用法：node scripts/error-capture.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19830;
const ERROR_REPORT_PATH = path.resolve(__dirname, '..', 'error-report.json');
const GAME_JS = path.resolve(__dirname, '..', 'code', 'game.js');
const CAPTURE_TIME = 10000; // 捕获 10 秒

async function main() {
  console.log('========================================');
  console.log('  运行时错误捕获');
  console.log('========================================\n');

  const collectedErrors = [];

  // 1. 启动 HTTP 服务器
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/errors') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
        try {
          const data = JSON.parse(body);
          if (data.errors && Array.isArray(data.errors)) {
            collectedErrors.push(...data.errors);
            console.log(`  收到 ${data.errors.length} 条错误`);
          }
        } catch (_) {}
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[1/3] 错误收集服务器已启动 (port ${PORT})`);
  });

  // 2. 触发游戏重新加载
  try {
    const content = fs.readFileSync(GAME_JS, 'utf8');
    fs.writeFileSync(GAME_JS, content, 'utf8');
    console.log('[2/3] 已触发游戏重新编译');
  } catch (e) {
    console.error('[2/3] 触发重新编译失败:', e.message);
  }

  // 3. 等待错误报告
  console.log(`[3/3] 捕获运行时错误 (${CAPTURE_TIME / 1000}秒)...\n`);
  await new Promise(resolve => setTimeout(resolve, CAPTURE_TIME));

  server.close();

  // 保存报告
  const report = {
    count: collectedErrors.length,
    errors: collectedErrors,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(ERROR_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  console.log('========================================');
  if (collectedErrors.length > 0) {
    console.log(`  运行时错误: ${collectedErrors.length} 个`);
    const byType = {};
    for (const e of collectedErrors) {
      byType[e.type] = (byType[e.type] || 0) + 1;
    }
    for (const [type, count] of Object.entries(byType)) {
      console.log(`    - ${type}: ${count}`);
    }
    for (const e of collectedErrors) {
      const msg = e.message.length > 150 ? e.message.substring(0, 150) + '...' : e.message;
      console.log(`    [${e.type}] ${msg}`);
    }
  } else {
    console.log('  运行时错误: 0 个（未捕获到错误）');
  }
  console.log(`\n  报告已保存: ${ERROR_REPORT_PATH}`);
  console.log('========================================');
}

main().catch(e => {
  console.error('Error capture crashed:', e.message);
  process.exit(1);
});
