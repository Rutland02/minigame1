const TestRunner = require('./utils/testRunnerBase');

async function runScoreManagerTests() {
  const runner = new TestRunner();
  const sm = GameGlobal.databus.scoreManager;

  const originalScores = JSON.parse(JSON.stringify(sm.scores));
  const originalAchievements = JSON.parse(JSON.stringify(sm.achievements));

  await runner.run('sm_default_structure', async () => {
    sm.resetAll();
    const m = sm.getMatch3Scores();
    const p = sm.getPuzzleScores();
    const q = sm.getQuizScores();
    const o = sm.getOverallStats();
    runner.assertEqual(m.gamesPlayed, 0, 'match3.gamesPlayed');
    runner.assertEqual(m.highestScore, 0, 'match3.highestScore');
    runner.assertEqual(m.totalScore, 0, 'match3.totalScore');
    runner.assertEqual(m.averageScore, 0, 'match3.averageScore');
    runner.assertEqual(m.bestLevel, 0, 'match3.bestLevel');
    runner.assertEqual(p.gamesPlayed, 0, 'puzzle.gamesPlayed');
    runner.assertEqual(p.completedCount, 0, 'puzzle.completedCount');
    runner.assertEqual(p.bestTime[1], null, 'puzzle.bestTime[1]');
    runner.assertEqual(p.bestTime[2], null, 'puzzle.bestTime[2]');
    runner.assertEqual(p.bestTime[3], null, 'puzzle.bestTime[3]');
    runner.assertEqual(q.gamesPlayed, 0, 'quiz.gamesPlayed');
    runner.assertEqual(q.totalQuestions, 0, 'quiz.totalQuestions');
    runner.assertEqual(q.correctAnswers, 0, 'quiz.correctAnswers');
    runner.assertEqual(q.accuracy, 0, 'quiz.accuracy');
    runner.assertEqual(q.bestScore, 0, 'quiz.bestScore');
    runner.assertEqual(o.totalGamesPlayed, 0, 'overall.totalGamesPlayed');
    runner.assertEqual(o.totalPlayTime, 0, 'overall.totalPlayTime');
    runner.assertEqual(sm.achievements.unlocked.length, 0, 'achievements empty');
    return 'All default fields correct';
  });

  await runner.run('sm_record_match3_basic', async () => {
    sm.resetAll();
    sm.recordMatch3Score(500, 3);
    const m = sm.getMatch3Scores();
    runner.assertEqual(m.gamesPlayed, 1, 'gamesPlayed');
    runner.assertEqual(m.totalScore, 500, 'totalScore');
    runner.assertEqual(m.highestScore, 500, 'highestScore');
    runner.assertEqual(m.averageScore, 500, 'averageScore');
    runner.assertEqual(m.bestLevel, 3, 'bestLevel');
    return 'Match3 basic record OK';
  });

  await runner.run('sm_record_match3_highest', async () => {
    sm.resetAll();
    sm.recordMatch3Score(500, 1);
    sm.recordMatch3Score(800, 2);
    const m = sm.getMatch3Scores();
    runner.assertEqual(m.highestScore, 800, 'highestScore should be 800');
    return 'Match3 highest OK';
  });

  await runner.run('sm_record_match3_average', async () => {
    sm.resetAll();
    sm.recordMatch3Score(200, 1);
    sm.recordMatch3Score(400, 2);
    const m = sm.getMatch3Scores();
    runner.assertEqual(m.averageScore, 300, 'averageScore');
    return 'Match3 average OK';
  });

  await runner.run('sm_record_puzzle_completed', async () => {
    sm.resetAll();
    sm.recordPuzzleScore(1, 45, true);
    const p = sm.getPuzzleScores();
    runner.assertEqual(p.gamesPlayed, 1, 'gamesPlayed');
    runner.assertEqual(p.completedCount, 1, 'completedCount');
    runner.assertEqual(p.bestTime[1], 45, 'bestTime[1]');
    return 'Puzzle completed OK';
  });

  await runner.run('sm_record_puzzle_best_time', async () => {
    sm.resetAll();
    sm.recordPuzzleScore(1, 60, true);
    sm.recordPuzzleScore(1, 30, true);
    const p = sm.getPuzzleScores();
    runner.assertEqual(p.bestTime[1], 30, 'bestTime[1] should be 30');
    return 'Puzzle best time OK';
  });

  await runner.run('sm_record_puzzle_not_completed', async () => {
    sm.resetAll();
    sm.recordPuzzleScore(1, 120, false);
    const p = sm.getPuzzleScores();
    runner.assertEqual(p.gamesPlayed, 1, 'gamesPlayed');
    runner.assertEqual(p.completedCount, 0, 'completedCount stays 0');
    return 'Puzzle not completed OK';
  });

  await runner.run('sm_record_quiz_basic', async () => {
    sm.resetAll();
    sm.recordQuizScore(3, 5, 30);
    const q = sm.getQuizScores();
    runner.assertEqual(q.gamesPlayed, 1, 'gamesPlayed');
    runner.assertEqual(q.correctAnswers, 3, 'correctAnswers');
    runner.assertEqual(q.totalQuestions, 5, 'totalQuestions');
    runner.assertEqual(q.accuracy, 60, 'accuracy');
    runner.assertEqual(q.bestScore, 30, 'bestScore');
    return 'Quiz basic record OK';
  });

  await runner.run('sm_record_quiz_accuracy_cumulative', async () => {
    sm.resetAll();
    sm.recordQuizScore(3, 5, 30);
    sm.recordQuizScore(4, 5, 40);
    const q = sm.getQuizScores();
    runner.assertEqual(q.totalQuestions, 10, 'totalQuestions');
    runner.assertEqual(q.correctAnswers, 7, 'correctAnswers');
    runner.assertEqual(q.accuracy, 70, 'accuracy');
    return 'Quiz cumulative accuracy OK';
  });

  await runner.run('sm_overall_games_count', async () => {
    sm.resetAll();
    sm.recordMatch3Score(100, 1);
    sm.recordPuzzleScore(1, 60, true);
    sm.recordQuizScore(5, 5, 50);
    const o = sm.getOverallStats();
    runner.assertEqual(o.totalGamesPlayed, 3, 'totalGamesPlayed');
    return 'Overall games count OK';
  });

  await runner.run('sm_achievement_first_game', async () => {
    sm.resetAll();
    sm.recordMatch3Score(100, 1);
    runner.assert(sm.achievements.unlocked.includes('first_game'), 'first_game unlocked');
    return 'first_game achievement OK';
  });

  await runner.run('sm_achievement_match3_master', async () => {
    sm.resetAll();
    sm.recordMatch3Score(1500, 1);
    runner.assert(sm.achievements.unlocked.includes('match3_master'), 'match3_master unlocked');
    return 'match3_master achievement OK';
  });

  await runner.run('sm_achievement_no_duplicate', async () => {
    sm.resetAll();
    sm.unlockAchievement('first_game');
    sm.unlockAchievement('first_game');
    const count = sm.achievements.unlocked.filter(id => id === 'first_game').length;
    runner.assertEqual(count, 1, 'should appear only once');
    return 'No duplicate unlock OK';
  });

  await runner.run('sm_achievement_collector', async () => {
    sm.resetAll();
    const allDefs = sm.getAllAchievementDefinitions();
    const nonCollector = allDefs.filter(a => a.id !== 'collector');
    for (const def of nonCollector) {
      sm.unlockAchievement(def.id);
    }
    runner.assert(sm.achievements.unlocked.includes('collector'), 'collector auto-unlocked');
    return 'collector auto-unlock OK';
  });

  await runner.run('sm_query_methods', async () => {
    sm.resetAll();
    sm.recordMatch3Score(500, 3);
    sm.recordPuzzleScore(1, 45, true);
    sm.recordQuizScore(4, 5, 40);
    const m = sm.getMatch3Scores();
    const p = sm.getPuzzleScores();
    const q = sm.getQuizScores();
    runner.assertEqual(m.gamesPlayed, 1, 'match3.gamesPlayed');
    runner.assertEqual(m.totalScore, 500, 'match3.totalScore');
    runner.assertEqual(p.gamesPlayed, 1, 'puzzle.gamesPlayed');
    runner.assertEqual(p.bestTime[1], 45, 'puzzle.bestTime[1]');
    runner.assertEqual(q.gamesPlayed, 1, 'quiz.gamesPlayed');
    runner.assertEqual(q.accuracy, 80, 'quiz.accuracy');
    return 'Query methods OK';
  });

  await runner.run('sm_reset_clears_all', async () => {
    sm.recordMatch3Score(999, 5);
    sm.recordPuzzleScore(2, 30, true);
    sm.unlockAchievement('first_game');
    sm.resetAll();
    const m = sm.getMatch3Scores();
    const p = sm.getPuzzleScores();
    const q = sm.getQuizScores();
    const o = sm.getOverallStats();
    runner.assertEqual(m.gamesPlayed, 0, 'match3 reset');
    runner.assertEqual(m.totalScore, 0, 'match3 totalScore reset');
    runner.assertEqual(p.gamesPlayed, 0, 'puzzle reset');
    runner.assertEqual(q.gamesPlayed, 0, 'quiz reset');
    runner.assertEqual(o.totalGamesPlayed, 0, 'overall reset');
    runner.assertEqual(sm.achievements.unlocked.length, 0, 'achievements cleared');
    return 'resetAll clears everything';
  });

  await runner.run('sm_get_total_score', async () => {
    sm.resetAll();
    sm.recordMatch3Score(500, 1);   // highestScore = 500
    sm.recordQuizScore(3, 5, 40);   // bestScore = 40
    sm.recordPuzzleScore(1, 30, true); // bestScore = calculated
    const total = sm.getTotalScore();
    const puzzleBest = sm.getPuzzleScores().bestScore;
    runner.assertEqual(total, 500 + 40 + puzzleBest, 'totalScore = match3.highestScore + quiz.bestScore + puzzle.bestScore');
    return 'getTotalScore formula correct';
  });

  await runner.run('sm_calculate_puzzle_score', async () => {
    sm.resetAll();
    // Not completed -> 0
    runner.assertEqual(sm._calculatePuzzleScore(1, 60, false), 0, 'not completed = 0');
    // Level 1: base=100, time=10 -> max(100-20, 20) = 80
    runner.assertEqual(sm._calculatePuzzleScore(1, 10, true), 80, 'level1 10s');
    // Level 2: base=200, time=30 -> max(200-60, 40) = 140
    runner.assertEqual(sm._calculatePuzzleScore(2, 30, true), 140, 'level2 30s');
    // Level 3: base=300, time=200 -> max(300-400, 60) = 60 (clamped to min)
    runner.assertEqual(sm._calculatePuzzleScore(3, 200, true), 60, 'level3 min clamp');
    return '_calculatePuzzleScore formula correct';
  });

  await runner.run('sm_get_all_achievements_with_status', async () => {
    sm.resetAll();
    sm.unlockAchievement('first_game');
    const all = sm.getAllAchievementsWithStatus();
    runner.assert(Array.isArray(all), 'should return array');
    runner.assert(all.length > 0, 'should have achievements');
    const firstGame = all.find(a => a.id === 'first_game');
    runner.assert(firstGame, 'should find first_game');
    runner.assert(firstGame.isUnlocked === true, 'first_game should be unlocked');
    runner.assert(typeof firstGame.unlockDate === 'number', 'should have unlockDate');
    const locked = all.find(a => !a.isUnlocked);
    runner.assert(locked, 'should have at least one locked achievement');
    return 'getAllAchievementsWithStatus correct';
  });

  await runner.run('sm_clear_achievements_only', async () => {
    sm.resetAll();
    sm.recordMatch3Score(500, 1);
    sm.unlockAchievement('first_game');
    const cleared = sm.clearAllAchievements();
    runner.assertEqual(cleared, 1, 'should return cleared count');
    runner.assertEqual(sm.achievements.unlocked.length, 0, 'unlocked should be empty');
    // Scores should be preserved
    runner.assertEqual(sm.getMatch3Scores().gamesPlayed, 1, 'scores preserved');
    return 'clearAllAchievements only clears achievements';
  });

  await runner.run('sm_update_play_time', async () => {
    sm.resetAll();
    runner.assertEqual(sm.getOverallStats().totalPlayTime, 0, 'initial playTime = 0');
    sm.updatePlayTime(5);  // 5 minutes = 300 seconds
    runner.assertEqual(sm.getOverallStats().totalPlayTime, 300, '5 min = 300s');
    sm.updatePlayTime(10);
    runner.assertEqual(sm.getOverallStats().totalPlayTime, 900, '15 min = 900s');
    return 'updatePlayTime accumulates correctly';
  });

  sm.scores = originalScores;
  sm.achievements.unlocked = originalAchievements.unlocked;
  sm.achievements.unlockDates = originalAchievements.unlockDates;
  sm.save();

  return runner;
}

module.exports = { runScoreManagerTests };
