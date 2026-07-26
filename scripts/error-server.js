/**
 * 常驻错误收集服务器
 *
 * 用法：node scripts/error-server.js
 *
 * 启动后持续监听 127.0.0.1:19830/errors，
 * 游戏运行时的 console.error / console.warn / wx.onError 会自动发送到这里。
 * 错误实时打印到终端，并保存到 error-report.json。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 19830;
const REPORT_PATH = path.resolve(__dirname, '..', 'error-report.json');

const collectedErrors = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/errors') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end('{"ok":true}');
      try {
        const data = JSON.parse(body);
        if (data.errors && Array.isArray(data.errors)) {
          for (const err of data.errors) {
            collectedErrors.push(err);
            const ts = err.timestamp ? new Date(err.timestamp).toLocaleTimeString() : '';
            const msg = err.message.length > 150 ? err.message.substring(0, 150) + '...' : err.message;
            console.log(`  [${err.type}] ${ts} ${msg}`);
          }
          // 保存到文件
          fs.writeFileSync(REPORT_PATH, JSON.stringify({
            count: collectedErrors.length,
            errors: collectedErrors,
            timestamp: new Date().toISOString()
          }, null, 2), 'utf8');
          console.log(`  -> 已保存 (${collectedErrors.length} 条)\n`);
        }
      } catch (_) {}
    });
  } else if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
  } else if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: collectedErrors.length }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('========================================');
  console.log('  错误收集服务器已启动');
  console.log(`  监听: http://127.0.0.1:${PORT}/errors`);
  console.log('  报告: ' + REPORT_PATH);
  console.log('  按 Ctrl+C 停止');
  console.log('========================================\n');
});

process.on('SIGINT', () => {
  console.log('\n停止服务器，已收集 ' + collectedErrors.length + ' 条错误');
  server.close();
  process.exit(0);
});
