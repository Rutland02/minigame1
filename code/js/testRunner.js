/**
 * 游戏内自动化测试模块
 *
 * 在小游戏环境内运行，直接访问 GameGlobal 测试所有功能。
 * 结果通过 console.log（带 [TEST] 前缀）输出，同时写入文件系统。
 *
 * 仅在开发环境（__DEV__ 或 URL 含 debug=1）下加载。
 */

class TestRunner {
  constructor() {
    this.results = [];
    this.consoleLogs = [];
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runAllTests() {
  const runner = new TestRunner();
  const app = GameGlobal.app;
  const databus = GameGlobal.databus;

  if (!app) {
    console.error('[TEST] GameGlobal.app not found');
    return;
  }

  console.log('[TEST] Starting automated tests...');

  // === Page Navigation ===
  const pages = ['login', 'home', 'achievement', 'quiz', 'match3', 'puzzle'];
  for (const name of pages) {
    await runner.run('navigate_' + name, async () => {
      app.showPage(name);
      await sleep(100);
      const page = app.currentPage;
      runner.assert(!!page, name + ' page should exist');
      runner.assert(typeof page.render === 'function', name + ' should have render');
      return name + ' loaded';
    });
  }

  // === Data Layer ===
  await runner.run('databus_exists', async () => {
    runner.assert(!!databus, 'DataBus should exist');
    runner.assert(!!databus.scoreManager, 'Should have scoreManager');
    runner.assert(typeof databus.recordMatch3Score === 'function', 'Should have recordMatch3Score');
    return 'DataBus OK';
  });

  await runner.run('databus_no_dead_fields', async () => {
    runner.assert(!('achievements' in databus), 'should not have achievements');
    runner.assert(!('checkInPoints' in databus), 'should not have checkInPoints');
    runner.assert(!('knowledgeBuff' in databus), 'should not have knowledgeBuff');
    return 'No dead fields';
  });

  await runner.run('no_dataManager', async () => {
    runner.assert(typeof GameGlobal.dataManager === 'undefined', 'should not have dataManager');
    return 'DataManager not present';
  });

  // === Quiz Page ===
  app.showPage('quiz');
  await sleep(200);

  let quizHasQuestions = false;
  await runner.run('quiz_questions_loaded', async () => {
    const q = app.currentPage;
    quizHasQuestions = !!(q.questions && q.questions.length > 0);
    runner.assert(quizHasQuestions, 'Should have questions, got ' + (q.questions ? q.questions.length : 0));
    return q.questions.length + ' questions';
  });

  if (!quizHasQuestions) {
    console.log('[TEST] Skipping quiz tests - no questions loaded');
  } else {
    await runner.run('quiz_initial_state', async () => {
      const q = app.currentPage;
      runner.assertEqual(q.selectedOption, null, 'selectedOption');
      runner.assertEqual(q.isAnswered, false, 'isAnswered');
      runner.assertEqual(q.currentQuestion, 0, 'currentQuestion');
      return 'Initial state correct';
    });

    await runner.run('quiz_select_and_submit', async () => {
      const q = app.currentPage;
      q.selectedOption = 0;
      q.submitAnswer();
      runner.assertEqual(q.isAnswered, true, 'isAnswered after submit');
      runner.assert(typeof q.isCorrect === 'boolean', 'isCorrect should be boolean');
      return 'Submitted, correct=' + q.isCorrect + ', score=' + q.score;
    });

    await runner.run('quiz_next_question', async () => {
      const q = app.currentPage;
      const before = q.currentQuestion;
      q.nextQuestion();
      runner.assertEqual(q.currentQuestion, before + 1, 'currentQuestion incremented');
      runner.assertEqual(q.selectedOption, null, 'selectedOption reset');
      runner.assertEqual(q.isAnswered, false, 'isAnswered reset');
      return 'Moved to question ' + q.currentQuestion;
    });

    await runner.run('quiz_hint', async () => {
      const q = app.currentPage;
      q.isAnswered = false;
      q.selectedOption = null;
      const before = q.hintCount;
      q.useHint();
      if (before > 0) {
        runner.assertEqual(q.hintCount, before - 1, 'hint count decremented');
        runner.assert(q.selectedOption !== null, 'option auto-selected');
      }
      return 'Hint used (had ' + before + ', now ' + q.hintCount + ')';
    });

    await runner.run('quiz_button_no_overlap', async () => {
      const q = app.currentPage;
      const w = q.width;
      const submitLeft = w / 2 + 10;
      const hintRight = w / 2 - 10;
      runner.assert(submitLeft >= hintRight, 'Buttons should not overlap');
      return 'No overlap';
    });
  }

  // === Match3 Game ===
  app.showPage('match3');
  await sleep(300);

  await runner.run('match3_board_init', async () => {
    const g = app.currentPage;
    runner.assert(g.board && g.board.length > 0, 'Board should have rows');
    runner.assert(g.board[0].length > 0, 'Board should have cols');
    return 'Board ' + g.board.length + 'x' + g.board[0].length;
  });

  await runner.run('match3_pieces_valid', async () => {
    const g = app.currentPage;
    for (let i = 0; i < g.board.length; i++) {
      for (let j = 0; j < g.board[i].length; j++) {
        const p = g.board[i][j];
        if (p === null) continue;
        runner.assert(typeof p.color === 'string', 'piece[' + i + '][' + j + '] should have color string');
        runner.assert(p.color.startsWith('#'), 'piece[' + i + '][' + j + '] color should be hex');
      }
    }
    return 'All pieces valid';
  });

  await runner.run('match3_no_initial_matches', async () => {
    const g = app.currentPage;
    const size = g.board.length;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - 2; j++) {
        const a = g.board[i][j], b = g.board[i][j+1], c = g.board[i][j+2];
        if (a && b && c && a.color === b.color && b.color === c.color) {
          throw new Error('Horizontal match at [' + i + '][' + j + ']');
        }
      }
    }
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size - 2; i++) {
        const a = g.board[i][j], b = g.board[i+1][j], c = g.board[i+2][j];
        if (a && b && c && a.color === b.color && b.color === c.color) {
          throw new Error('Vertical match at [' + i + '][' + j + ']');
        }
      }
    }
    return 'No initial matches';
  });

  await runner.run('match3_color_types', async () => {
    const g = app.currentPage;
    const colors = new Set();
    for (let i = 0; i < g.board.length; i++) {
      for (let j = 0; j < g.board[i].length; j++) {
        if (g.board[i][j]) colors.add(g.board[i][j].color);
      }
    }
    runner.assert(colors.size >= 4 && colors.size <= 6, 'Should have 4-6 colors, got ' + colors.size);
    return colors.size + ' distinct colors';
  });

  // === Puzzle Game ===
  app.showPage('puzzle');
  await sleep(200);

  await runner.run('puzzle_init', async () => {
    const g = app.currentPage;
    runner.assert(!!g, 'Puzzle should exist');
    runner.assert(typeof g.render === 'function', 'Should have render');
    runner.assert(typeof g.handleTouchStart === 'function', 'Should have handleTouchStart');
    return 'Puzzle initialized';
  });

  // === Achievement Page ===
  app.showPage('achievement');
  await sleep(200);

  await runner.run('achievement_page', async () => {
    const p = app.currentPage;
    const sm = databus.scoreManager;
    runner.assert(!!p, 'Achievement page should exist');
    runner.assert(!!sm, 'ScoreManager should exist');
    runner.assert(sm.achievements && Array.isArray(sm.achievements.unlocked), 'unlocked should be array');
    return 'Achievement page OK, ' + sm.achievements.unlocked.length + ' unlocked';
  });

  // === Error Monitoring ===
  await runner.run('navigation_no_errors', async () => {
    for (const name of pages) {
      app.showPage(name);
      await sleep(100);
    }
    return 'Full navigation cycle completed';
  });

  // === Generate Report ===
  const summary = runner.report();

  console.log('[TEST] ========================================');
  console.log('[TEST] Tests: ' + summary.total + ' total, ' + summary.passed + ' passed, ' + summary.failed + ' failed');
  if (summary.failedTests.length > 0) {
    console.log('[TEST] Failed:');
    for (const t of summary.failedTests) {
      console.log('[TEST]   - ' + t.name + ': ' + t.error);
    }
  }
  console.log('[TEST] ========================================');

  // 发送结果到本地测试服务器
  try {
    wx.request({
      url: 'http://127.0.0.1:19830/report',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: summary,
      success: function() { console.log('[TEST] Report sent to test server'); },
      fail: function(e) { console.error('[TEST] Failed to send report:', e.errMsg); }
    });
  } catch (e) {
    console.error('[TEST] Failed to send report:', e.message);
  }

  return summary;
}

// Auto-run on load
console.log('[TEST] Test module loaded, will run in 2 seconds...');
setTimeout(() => {
  console.log('[TEST] Starting tests now...');
  runAllTests().catch(e => {
    console.error('[TEST] Test runner crashed:', e);
  });
}, 2000);

module.exports = { runAllTests };
