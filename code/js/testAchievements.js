/**
 * 成就系统独立测试模块
 *
 * 两种运行方式：
 *   1. 自动：npm run test:ach → 写信号文件 → 触发重编译 → game.js 检测到信号后加载并触发
 *   2. 手动：控制台执行 GameGlobal.runAchievementTests()
 *
 * 结果通过 console.log（带 [TEST-ACH] 前缀）输出，同时发送到测试服务器。
 */

const REPORT_URL = 'http://127.0.0.1:19831/report';

const TestRunner = require('./utils/testRunnerBase');

async function runAchievementTests() {
  const runner = new TestRunner();
  const sm = GameGlobal.databus.scoreManager;

  if (!sm) {
    console.error('[TEST-ACH] ScoreManager not found');
    return;
  }

  console.log('[TEST-ACH] Starting achievement tests...');

  // backup
  const origUnlocked = [...sm.achievements.unlocked];
  const origUnlockDates = { ...sm.achievements.unlockDates };
  const origScores = JSON.parse(JSON.stringify(sm.scores));

  // --- unlock ---
  sm.clearAllAchievements();
  sm.scores = sm.getDefaultScores();
  sm.save();

  await runner.run('ach_unlock_basic', async () => {
    sm.unlockAchievement('first_game');
    runner.assert(sm.achievements.unlocked.includes('first_game'), 'should be unlocked');
    runner.assert(sm.achievements.unlockDates['first_game'] > 0, 'should have unlock date');
    return 'first_game unlocked';
  });

  await runner.run('ach_no_duplicate', async () => {
    const countBefore = sm.achievements.unlocked.length;
    const result = sm.unlockAchievement('first_game');
    runner.assertEqual(result, false, 'duplicate should return false');
    runner.assertEqual(sm.achievements.unlocked.length, countBefore, 'should not add duplicate');
    return 'Duplicate prevented';
  });

  // --- match3 triggers ---
  await runner.run('ach_match3_thresholds', async () => {
    sm.clearAllAchievements();
    sm.checkMatch3Achievements(1500, 5);
    runner.assert(sm.achievements.unlocked.includes('match3_master'), 'match3_master at 1500');
    runner.assert(!sm.achievements.unlocked.includes('match3_legend'), 'no match3_legend at 1500');
    runner.assert(!sm.achievements.unlocked.includes('level_master'), 'no level_master at lv5');

    sm.checkMatch3Achievements(10000, 10);
    runner.assert(sm.achievements.unlocked.includes('match3_legend'), 'match3_legend at 10000');
    runner.assert(sm.achievements.unlocked.includes('level_master'), 'level_master at lv10');
    return 'Match3 thresholds OK';
  });

  // --- puzzle triggers ---
  await runner.run('ach_puzzle_difficulty', async () => {
    sm.clearAllAchievements();
    sm.checkPuzzleAchievements(1, 120, true);
    runner.assert(sm.achievements.unlocked.includes('puzzle_beginner'), 'level 1');

    sm.checkPuzzleAchievements(2, 180, true);
    runner.assert(sm.achievements.unlocked.includes('puzzle_intermediate'), 'level 2');

    sm.checkPuzzleAchievements(3, 300, true);
    runner.assert(sm.achievements.unlocked.includes('puzzle_master'), 'level 3');
    return 'Puzzle difficulty OK';
  });

  await runner.run('ach_puzzle_no_unlock_on_fail', async () => {
    sm.clearAllAchievements();
    sm.checkPuzzleAchievements(1, 120, false);
    runner.assertEqual(sm.achievements.unlocked.length, 0, 'no unlock when incomplete');
    return 'No unlock on fail';
  });

  // --- quiz triggers ---
  await runner.run('ach_quiz_perfect', async () => {
    sm.clearAllAchievements();
    sm.checkQuizAchievements(10, 10);
    runner.assert(sm.achievements.unlocked.includes('quiz_perfect'), 'quiz_perfect on perfect');
    return 'quiz_perfect OK';
  });

  // --- overall triggers ---
  await runner.run('ach_game_enthusiast', async () => {
    sm.clearAllAchievements();
    sm.scores.overall.totalGamesPlayed = 9;
    sm.checkOverallAchievements();
    runner.assert(!sm.achievements.unlocked.includes('game_enthusiast'), 'not at 9');

    sm.scores.overall.totalGamesPlayed = 10;
    sm.checkOverallAchievements();
    runner.assert(sm.achievements.unlocked.includes('game_enthusiast'), 'unlocks at 10');
    return 'game_enthusiast OK';
  });

  // --- collector ---
  await runner.run('ach_collector_auto', async () => {
    sm.clearAllAchievements();
    const allDefs = sm.getAllAchievementDefinitions();
    const nonCollector = allDefs.filter(a => a.id !== 'collector');
    for (const def of nonCollector) {
      sm.unlockAchievement(def.id);
    }
    runner.assert(sm.achievements.unlocked.includes('collector'), 'collector should auto-unlock');
    return 'collector OK (' + sm.achievements.unlocked.length + '/' + allDefs.length + ')';
  });

  // --- query APIs ---
  await runner.run('ach_get_with_status', async () => {
    sm.clearAllAchievements();
    sm.unlockAchievement('first_game');
    const all = sm.getAllAchievementsWithStatus();
    const first = all.find(a => a.id === 'first_game');
    const locked = all.find(a => a.id === 'match3_master');
    runner.assert(first.isUnlocked === true, 'first_game unlocked');
    runner.assert(locked.isUnlocked === false, 'match3_master locked');
    runner.assert(first.unlockDate > 0, 'has unlock date');
    return 'getAllAchievementsWithStatus OK';
  });

  await runner.run('ach_get_unlocked_list', async () => {
    const unlocked = sm.getUnlockedAchievements();
    runner.assert(Array.isArray(unlocked), 'should be array');
    runner.assert(unlocked.length === 1, 'should have 1');
    runner.assert(unlocked[0].id === 'first_game', 'should be first_game');
    runner.assert(typeof unlocked[0].title === 'string', 'should have title');
    return 'getUnlockedAchievements OK';
  });

  // restore
  sm.scores = origScores;
  sm.achievements.unlocked = origUnlocked;
  sm.achievements.unlockDates = origUnlockDates;
  sm.save();

  // report
  const summary = runner.report();
  summary.suite = 'achievement';

  console.log('[TEST-ACH] ========================================');
  console.log('[TEST-ACH] Tests: ' + summary.total + ' total, ' + summary.passed + ' passed, ' + summary.failed + ' failed');
  if (summary.failedTests.length > 0) {
    console.log('[TEST-ACH] Failed:');
    for (const t of summary.failedTests) {
      console.log('[TEST-ACH]   - ' + t.name + ': ' + t.error);
    }
  }
  console.log('[TEST-ACH] ========================================');

  try {
    wx.request({
      url: REPORT_URL,
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: summary,
      success: function() { console.log('[TEST-ACH] Report sent'); },
      fail: function(e) { console.error('[TEST-ACH] Send failed:', e.errMsg); }
    });
  } catch (e) {
    console.error('[TEST-ACH] Send failed:', e.message);
  }

  return summary;
}

module.exports = { runAchievementTests };
