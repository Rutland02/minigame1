class TestRunner {
  constructor() {
    this.results = [];
  }

  async run(name, fn) {
    const start = Date.now();
    try {
      const detail = await fn();
      this.results.push({ name, status: 'PASS', detail: detail || null, ms: Date.now() - start });
    } catch (e) {
      this.results.push({ name, status: 'FAIL', error: e.message, ms: Date.now() - start });
    }
  }

  assert(cond, msg) {
    if (!cond) throw new Error('Assertion failed: ' + msg);
  }

  assertEqual(a, b, label) {
    if (a !== b) throw new Error(label + ': expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
  }

  report() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL');
    return {
      total: this.results.length,
      passed,
      failed: failed.length,
      failedTests: failed,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = TestRunner;
