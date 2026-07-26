/**
 * 运行时错误捕获模块
 *
 * 拦截 console.error / console.warn / wx.onError / wx.onPageNotFound，
 * 将错误缓冲并通过 wx.request() 发送到本地服务器。
 */

const REPORT_URL = 'http://127.0.0.1:19830/errors';
const AUTO_FLUSH_INTERVAL = 5000; // 5 秒

const _errors = [];
let _installed = false;
let _autoFlushTimer = null;
let _flushing = false;

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

  // Hook console.error（跳过 flushTo 自身的错误，避免递归）
  const origError = console.error;
  console.error = function () {
    if (!_flushing) {
      try {
        const args = Array.prototype.slice.call(arguments);
        const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        _addEntry('console.error', msg, '', '');
      } catch (_) {}
    }
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

  // 自动定时 flush（每 5 秒），仅在有错误时发送
  _autoFlushTimer = setInterval(function () {
    if (_errors.length > 0) {
      flushTo();
    }
  }, AUTO_FLUSH_INTERVAL);

  // 切后台时立即 flush
  if (typeof wx !== 'undefined' && wx.onHide) {
    wx.onHide(function () {
      if (_errors.length > 0) {
        flushTo();
      }
    });
  }
}

function getErrors() {
  return _errors.slice();
}

function clear() {
  _errors.length = 0;
}

function stop() {
  if (_autoFlushTimer) {
    clearInterval(_autoFlushTimer);
    _autoFlushTimer = null;
  }
}

function dump() {
  if (_errors.length === 0) {
    console.log('[ERROR-CAPTURE] 无已捕获的错误');
    return;
  }
  console.log('[ERROR-CAPTURE] 已捕获 ' + _errors.length + ' 条错误:');
  for (let i = 0; i < _errors.length; i++) {
    const e = _errors[i];
    console.log('  [' + e.type + '] ' + e.message);
  }
}

function flushTo(url) {
  if (_errors.length === 0) return;
  const payload = _errors.slice();
  _flushing = true;
  try {
    wx.request({
      url: url || REPORT_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: { errors: payload, timestamp: new Date().toISOString() },
      success: function () {
        console.log('[ERROR-CAPTURE] ' + payload.length + ' error(s) sent');
      },
      fail: function () {
        // 静默失败，不调用 console.error 避免递归
      }
    });
  } catch (_) {}
  _flushing = false;
  _errors.length = 0;
}

module.exports = { init, getErrors, clear, flushTo, stop, dump };
