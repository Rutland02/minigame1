/**
 * 运行时错误捕获模块
 *
 * 拦截 console.error / console.warn / wx.onError / wx.onPageNotFound，
 * 将错误缓冲并通过 wx.request() 发送到本地服务器。
 */

const REPORT_URL = 'http://127.0.0.1:19830/errors';

const _errors = [];
let _installed = false;

function _addEntry(type, message, stack, source) {
  _errors.push({
    type,
    message: String(message || ''),
    stack: stack ? String(stack) : '',
    source: source ? String(source) : '',
    timestamp: new Date().toISOString()
  });
}

function init() {
  if (_installed) return;
  _installed = true;

  // Hook console.error
  const origError = console.error;
  console.error = function () {
    try {
      const args = Array.prototype.slice.call(arguments);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      _addEntry('console.error', msg, '', '');
    } catch (_) {}
    return origError.apply(console, arguments);
  };

  // Hook console.warn
  const origWarn = console.warn;
  console.warn = function () {
    try {
      const args = Array.prototype.slice.call(arguments);
      const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      _addEntry('console.warn', msg, '', '');
    } catch (_) {}
    return origWarn.apply(console, arguments);
  };

  // wx.onError — uncaught runtime errors
  if (typeof wx !== 'undefined' && wx.onError) {
    wx.onError(function (msg) {
      const str = typeof msg === 'string' ? msg : (msg && msg.message ? msg.message : JSON.stringify(msg));
      _addEntry('wx.onError', str, '', '');
    });
  }

  // wx.onPageNotFound
  if (typeof wx !== 'undefined' && wx.onPageNotFound) {
    wx.onPageNotFound(function (res) {
      _addEntry('wx.onPageNotFound', res && res.path ? res.path : 'unknown', '', '');
    });
  }
}

function getErrors() {
  return _errors.slice();
}

function clear() {
  _errors.length = 0;
}

function flushTo(url) {
  if (_errors.length === 0) return;
  const payload = _errors.slice();
  try {
    wx.request({
      url: url || REPORT_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { errors: payload, timestamp: new Date().toISOString() },
      success: function () {
        console.log('[ERROR-CAPTURE] ' + payload.length + ' error(s) sent');
      },
      fail: function (e) {
        console.error('[ERROR-CAPTURE] Send failed:', e.errMsg);
      }
    });
  } catch (_) {}
  _errors.length = 0;
}

module.exports = { init, getErrors, clear, flushTo };
