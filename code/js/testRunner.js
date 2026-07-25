/**
 * 游戏内自动化测试模块
 *
 * 在小游戏环境内运行，直接访问 GameGlobal 测试所有功能。
 * 结果通过 console.log（带 [TEST] 前缀）输出，同时写入文件系统。
 *
 * 仅在开发环境（__DEV__ 或 URL 含 debug=1）下加载。
 */

const TestRunner = require('./utils/testRunnerBase');

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
      await sleep(400);
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
  await sleep(400);

  let quizHasQuestions = false;
  await runner.run('quiz_questions_loaded', async () => {
    const q = app.currentPage;
    quizHasQuestions = !!(q.vm.questions && q.vm.questions.length > 0);
    runner.assert(quizHasQuestions, 'Should have questions, got ' + (q.vm.questions ? q.vm.questions.length : 0));
    return q.vm.questions.length + ' questions';
  });

  if (!quizHasQuestions) {
    console.log('[TEST] Skipping quiz tests - no questions loaded');
  } else {
    await runner.run('quiz_initial_state', async () => {
      const q = app.currentPage;
      runner.assertEqual(q.vm.selectedOption, null, 'selectedOption');
      runner.assertEqual(q.vm.isAnswered, false, 'isAnswered');
      runner.assertEqual(q.vm.currentIndex, 0, 'currentIndex');
      return 'Initial state correct';
    });

    await runner.run('quiz_select_and_submit', async () => {
      const q = app.currentPage;
      q.vm.selectedOption = 0;
      q.vm.submitAnswer(databus);
      runner.assertEqual(q.vm.isAnswered, true, 'isAnswered after submit');
      runner.assert(typeof q.vm.isCorrect === 'boolean', 'isCorrect should be boolean');
      return 'Submitted, correct=' + q.vm.isCorrect + ', score=' + q.vm.score;
    });

    await runner.run('quiz_next_question', async () => {
      const q = app.currentPage;
      const before = q.vm.currentIndex;
      q.vm.nextQuestion();
      runner.assertEqual(q.vm.currentIndex, before + 1, 'currentIndex incremented');
      runner.assertEqual(q.vm.selectedOption, null, 'selectedOption reset');
      runner.assertEqual(q.vm.isAnswered, false, 'isAnswered reset');
      return 'Moved to question ' + q.vm.currentIndex;
    });

    await runner.run('quiz_hint', async () => {
      const q = app.currentPage;
      q.vm.isAnswered = false;
      q.vm.selectedOption = null;
      const before = q.vm.hintCount;
      q.vm.useHint();
      if (before > 0) {
        runner.assertEqual(q.vm.hintCount, before - 1, 'hint count decremented');
        runner.assert(q.vm.selectedOption !== null, 'option auto-selected');
      }
      return 'Hint used (had ' + before + ', now ' + q.vm.hintCount + ')';
    });

    await runner.run('quiz_button_no_overlap', async () => {
      const q = app.currentPage;
      const btns = q.getButtonRects();
      const hintRight = btns.hint.x + btns.hint.w;
      const submitLeft = btns.submit.x;
      runner.assert(submitLeft >= hintRight, 'Buttons should not overlap');
      return 'No overlap';
    });

    await runner.run('quiz_skip_question', async () => {
      const q = app.currentPage;
      q.vm.currentIndex = 0;
      q.vm.isAnswered = false;
      q.vm.selectedOption = null;
      q.vm.skipQuestion();
      runner.assertEqual(q.vm.isAnswered, true, 'isAnswered after skip');
      runner.assertEqual(q.vm.isCorrect, false, 'isCorrect false after skip');
      runner.assertEqual(q.vm.selectedOption, -1, 'selectedOption -1 after skip');
      return 'Skip OK';
    });

    await runner.run('quiz_multi_question_score', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      if (q.vm.questions.length < 2) return 'Skipped: not enough questions';
      let totalScore = 0;
      for (let i = 0; i < 2 && i < q.vm.questions.length; i++) {
        q.vm.currentIndex = i;
        q.vm.selectedOption = q.vm.questions[i].correctAnswer;
        q.vm.isAnswered = false;
        q.vm.submitAnswer(databus);
        totalScore += 10;
      }
      runner.assertEqual(q.vm.score, totalScore, 'Score should accumulate');
      return 'Multi-question score=' + q.vm.score;
    });

    await runner.run('quiz_consecutive_correct', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      if (q.vm.questions.length < 2) return 'Skipped: not enough questions';
      q.vm.consecutiveCorrect = 0;
      q.vm.currentIndex = 0;
      q.vm.selectedOption = q.vm.questions[0].correctAnswer;
      q.vm.isAnswered = false;
      q.vm.submitAnswer(databus);
      runner.assertEqual(q.vm.consecutiveCorrect, 1, 'consecutive after 1 correct');
      q.vm.currentIndex = 1;
      q.vm.selectedOption = q.vm.questions[1].correctAnswer;
      q.vm.isAnswered = false;
      q.vm.submitAnswer(databus);
      runner.assertEqual(q.vm.consecutiveCorrect, 2, 'consecutive after 2 correct');
      return 'Consecutive correct OK';
    });

    await runner.run('quiz_consecutive_reset_on_wrong', async () => {
      const q = app.currentPage;
      q.vm.consecutiveCorrect = 5;
      q.vm.currentIndex = 0;
      q.vm.selectedOption = -1;
      q.vm.isAnswered = false;
      q.vm.submitAnswer(databus);
      runner.assertEqual(q.vm.consecutiveCorrect, 0, 'consecutive reset on wrong');
      return 'Consecutive reset OK';
    });

    await runner.run('quiz_game_over_detection', async () => {
      const q = app.currentPage;
      q.vm.currentIndex = q.vm.questions.length;
      runner.assert(q.vm.isGameOver, 'isGameOver when currentIndex >= length');
      q.vm.currentIndex = 0;
      runner.assert(!q.vm.isGameOver, 'not isGameOver at start');
      return 'Game over detection OK';
    });

    await runner.run('quiz_show_score_records', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      q.vm.score = 30;
      q.vm.currentIndex = q.vm.questions.length;
      q.vm.showScore(databus);
      return 'showScore recorded';
    });

    await runner.run('quiz_setup_difficulty_easy', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      runner.assertEqual(q.vm.questionCount, 5, 'easy questionCount');
      runner.assertEqual(q.vm.timePerQuestion, 30, 'easy timePerQuestion');
      return 'Easy config OK';
    });

    await runner.run('quiz_setup_difficulty_medium', async () => {
      app.showPage('quiz', 'medium');
      await sleep(400);
      const q = app.currentPage;
      runner.assertEqual(q.vm.questionCount, 8, 'medium questionCount');
      runner.assertEqual(q.vm.timePerQuestion, 25, 'medium timePerQuestion');
      return 'Medium config OK';
    });

    await runner.run('quiz_setup_difficulty_hard', async () => {
      app.showPage('quiz', 'hard');
      await sleep(400);
      const q = app.currentPage;
      runner.assertEqual(q.vm.questionCount, 10, 'hard questionCount');
      runner.assertEqual(q.vm.timePerQuestion, 20, 'hard timePerQuestion');
      return 'Hard config OK';
    });

    await runner.run('quiz_reset_state', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      q.vm.score = 99;
      q.vm.currentIndex = 3;
      q.vm.consecutiveCorrect = 5;
      q.vm.maxConsecutiveCorrect = 5;
      q.vm.correctAnswerCount = 3;
      q.vm.gameOver = true;
      q.vm.hintCount = 0;
      q.vm.reset();
      runner.assertEqual(q.vm.score, 0, 'score reset');
      runner.assertEqual(q.vm.currentIndex, 0, 'currentIndex reset');
      runner.assertEqual(q.vm.consecutiveCorrect, 0, 'consecutive reset');
      runner.assertEqual(q.vm.maxConsecutiveCorrect, 0, 'maxConsecutive reset');
      runner.assertEqual(q.vm.correctAnswerCount, 0, 'correctAnswerCount reset');
      runner.assertEqual(q.vm.gameOver, false, 'gameOver reset');
      return 'Quiz reset OK';
    });

    await runner.run('quiz_accuracy_getter', async () => {
      app.showPage('quiz');
      await sleep(400);
      const q = app.currentPage;
      q.vm.questions = [{}, {}, {}, {}, {}]; // 5 questions
      q.vm.correctAnswerCount = 4;
      runner.assertEqual(q.vm.accuracy, 80, '4/5 = 80%');
      q.vm.correctAnswerCount = 0;
      runner.assertEqual(q.vm.accuracy, 0, '0/5 = 0%');
      q.vm.correctAnswerCount = 5;
      runner.assertEqual(q.vm.accuracy, 100, '5/5 = 100%');
      return 'Accuracy getter OK';
    });
  }

  // === Match3 Game ===
  app.showPage('match3');
  await sleep(400);

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
  await sleep(400);

  await runner.run('puzzle_init', async () => {
    const g = app.currentPage;
    runner.assert(!!g, 'Puzzle should exist');
    runner.assert(typeof g.render === 'function', 'Should have render');
    runner.assert(typeof g.handleTouchStart === 'function', 'Should have handleTouchStart');
    return 'Puzzle initialized';
  });

  await runner.run('puzzle_pieces_count', async () => {
    const g = app.currentPage;
    const size = g.getPuzzleSize();
    runner.assertEqual(g.pieces.length, size * size, 'Piece count should match grid size');
    const emptyCount = g.pieces.filter(p => p.isEmpty).length;
    runner.assertEqual(emptyCount, 1, 'Should have exactly one empty piece');
    return 'Pieces: ' + g.pieces.length + ', empty: ' + emptyCount;
  });

  await runner.run('puzzle_difficulty_3x3', async () => {
    const g = app.currentPage;
    g.changeLevel(1);
    runner.assertEqual(g.getPuzzleSize(), 3, 'Level 1 = 3x3');
    runner.assertEqual(g.pieces.length, 9, 'Level 1 = 9 pieces');
    return 'Difficulty 3x3 OK';
  });

  await runner.run('puzzle_difficulty_4x4', async () => {
    const g = app.currentPage;
    g.changeLevel(2);
    runner.assertEqual(g.getPuzzleSize(), 4, 'Level 2 = 4x4');
    runner.assertEqual(g.pieces.length, 16, 'Level 2 = 16 pieces');
    return 'Difficulty 4x4 OK';
  });

  await runner.run('puzzle_difficulty_5x5', async () => {
    const g = app.currentPage;
    g.changeLevel(3);
    runner.assertEqual(g.getPuzzleSize(), 5, 'Level 3 = 5x5');
    runner.assertEqual(g.pieces.length, 25, 'Level 3 = 25 pieces');
    g.changeLevel(1);
    return 'Difficulty 5x5 OK';
  });

  await runner.run('puzzle_can_move_empty', async () => {
    const g = app.currentPage;
    const empty = g.pieces.find(p => p.isEmpty);
    runner.assert(!g.canMove(empty, 'up'), 'Empty piece should not be movable');
    runner.assert(!g.canMove(empty, 'down'), 'Empty piece should not be movable');
    return 'Empty piece not movable';
  });

  await runner.run('puzzle_move_adjacent_to_empty', async () => {
    const g = app.currentPage;
    const empty = g.pieces.find(p => p.isEmpty);
    const er = empty.currentRow, ec = empty.currentCol;
    // piece 位于 empty 的某方向 → 它需要往反方向移动才能到达 empty
    const directions = [
      { dir: 'down', dr: -1, dc: 0 },
      { dir: 'up', dr: 1, dc: 0 },
      { dir: 'right', dr: 0, dc: -1 },
      { dir: 'left', dr: 0, dc: 1 },
    ];
    let found = false;
    for (const d of directions) {
      const adj = g.pieces.find(p => p.currentRow === er + d.dr && p.currentCol === ec + d.dc && !p.isEmpty);
      if (adj) {
        runner.assert(g.canMove(adj, d.dir), 'Adjacent piece should be movable ' + d.dir);
        found = true;
        break;
      }
    }
    runner.assert(found, 'Should have at least one movable adjacent piece');
    return 'Adjacent move OK';
  });

  await runner.run('puzzle_completion_detection', async () => {
    const g = app.currentPage;
    g.pieces.forEach(p => {
      p.currentRow = p.correctRow;
      p.currentCol = p.correctCol;
    });
    runner.assert(g.checkCompletion(), 'Should detect completion when all pieces in place');
    g.pieces[0].currentRow = 99;
    runner.assert(!g.checkCompletion(), 'Should detect incomplete when piece is displaced');
    g.pieces[0].currentRow = g.pieces[0].correctRow;
    return 'Completion detection OK';
  });

  await runner.run('puzzle_timer_running', async () => {
    const g = app.currentPage;
    g.changeLevel(1);
    g.startTime = Date.now() - 5000;
    g.endTime = null;
    g.gameStatus = g.STATES.PLAYING;
    const elapsed = g.getElapsedTime();
    runner.assert(elapsed >= 4 && elapsed <= 6, 'Elapsed ~5s, got ' + elapsed);
    return 'Timer running OK';
  });

  await runner.run('puzzle_timer_stopped_on_complete', async () => {
    const g = app.currentPage;
    g.gameStatus = g.STATES.COMPLETED;
    g.endTime = g.startTime + 30000;
    const elapsed = g.getElapsedTime();
    runner.assertEqual(elapsed, 30, 'Should return fixed elapsed time');
    g.gameStatus = g.STATES.PLAYING;
    return 'Timer stopped on complete OK';
  });

  await runner.run('puzzle_move_piece_updates_position', async () => {
    const g = app.currentPage;
    g.changeLevel(1);
    const empty = g.pieces.find(p => p.isEmpty);
    const er = empty.currentRow, ec = empty.currentCol;
    // Find a piece adjacent to empty
    const directions = [
      { dir: 'down', dr: -1, dc: 0 },
      { dir: 'up', dr: 1, dc: 0 },
      { dir: 'right', dr: 0, dc: -1 },
      { dir: 'left', dr: 0, dc: 1 },
    ];
    for (const d of directions) {
      const adj = g.pieces.find(p => p.currentRow === er + d.dr && p.currentCol === ec + d.dc && !p.isEmpty);
      if (adj) {
        const oldRow = adj.currentRow, oldCol = adj.currentCol;
        g.movePiece(adj, d.dir);
        runner.assertEqual(adj.currentRow, er, 'piece should move to empty row');
        runner.assertEqual(adj.currentCol, ec, 'piece should move to empty col');
        runner.assertEqual(empty.currentRow, oldRow, 'empty should move to piece old row');
        runner.assertEqual(empty.currentCol, oldCol, 'empty should move to piece old col');
        break;
      }
    }
    return 'movePiece position update OK';
  });

  await runner.run('puzzle_calculate_score_formula', async () => {
    const g = app.currentPage;
    g.level = 1;
    const score1 = g._calculatePuzzleScore(10);
    runner.assertEqual(score1, 80, 'level1 10s: max(100-20,20)=80');
    const score2 = g._calculatePuzzleScore(200);
    runner.assertEqual(score2, 20, 'level1 200s: max(100-400,20)=20(min)');
    g.level = 2;
    const score3 = g._calculatePuzzleScore(30);
    runner.assertEqual(score3, 140, 'level2 30s: max(200-60,40)=140');
    g.level = 3;
    const score4 = g._calculatePuzzleScore(50);
    runner.assertEqual(score4, 200, 'level3 50s: max(300-100,60)=200');
    g.level = 1;
    return 'Puzzle score formula OK';
  });

  await runner.run('puzzle_shuffle_valid', async () => {
    const g = app.currentPage;
    g.changeLevel(1);
    const size = g.getPuzzleSize();
    // All pieces should have valid positions after shuffle
    for (const piece of g.pieces) {
      runner.assert(piece.currentRow >= 0 && piece.currentRow < size, 'row in range');
      runner.assert(piece.currentCol >= 0 && piece.currentCol < size, 'col in range');
    }
    // Each position should be unique
    const positions = g.pieces.map(p => p.currentRow + ',' + p.currentCol);
    const unique = new Set(positions);
    runner.assertEqual(unique.size, g.pieces.length, 'all positions unique');
    return 'Shuffle produces valid board';
  });

  // === Achievement Page ===
  app.showPage('achievement');
  await sleep(400);

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
      await sleep(400);
    }
    return 'Full navigation cycle completed';
  });

  // === Match3 Core Logic Tests (B-1) ===
  try {
    const { runMatch3Tests } = require('./testMatch3');
    const match3Runner = await runMatch3Tests();
    match3Runner.results.forEach(r => runner.results.push(r));
  } catch (e) {
    console.error('[TEST] Match3 test module error:', e.message);
  }

  // === ScoreManager API Tests (B-2) ===
  try {
    const { runScoreManagerTests } = require('./testScoreManager');
    const smRunner = await runScoreManagerTests();
    smRunner.results.forEach(r => runner.results.push(r));
  } catch (e) {
    console.error('[TEST] ScoreManager test module error:', e.message);
  }

  // === Utility Function Tests ===
  const { LayoutRect, getTouchCoords, drawRoundedRect } = require('./utils/canvasUtils');

  await runner.run('layout_rect_contains_inside', async () => {
    const rect = new LayoutRect(10, 20, 100, 50);
    runner.assert(rect.contains(50, 40), 'Point inside should return true');
    runner.assert(rect.contains(10, 20), 'Top-left corner should be inside');
    runner.assert(rect.contains(110, 70), 'Bottom-right corner should be inside');
    return 'Contains inside OK';
  });

  await runner.run('layout_rect_contains_outside', async () => {
    const rect = new LayoutRect(10, 20, 100, 50);
    runner.assert(!rect.contains(5, 40), 'Left of rect should be false');
    runner.assert(!rect.contains(120, 40), 'Right of rect should be false');
    runner.assert(!rect.contains(50, 10), 'Above rect should be false');
    runner.assert(!rect.contains(50, 80), 'Below rect should be false');
    return 'Contains outside OK';
  });

  await runner.run('layout_rect_center', async () => {
    const rect = new LayoutRect(10, 20, 100, 50);
    runner.assertEqual(rect.centerX, 60, 'centerX');
    runner.assertEqual(rect.centerY, 45, 'centerY');
    return 'Center calculation OK';
  });

  await runner.run('get_touch_coords_from_touches', async () => {
    const touches = [{ x: 100, y: 200 }];
    const result = getTouchCoords(touches, null);
    runner.assert(result !== null, 'Should return coords');
    runner.assertEqual(result.x, 100, 'x coord');
    runner.assertEqual(result.y, 200, 'y coord');
    return 'Touch coords from touches OK';
  });

  await runner.run('get_touch_coords_from_changed', async () => {
    const changedTouches = [{ x: 50, y: 75 }];
    const result = getTouchCoords(null, changedTouches);
    runner.assert(result !== null, 'Should return coords from changedTouches');
    runner.assertEqual(result.x, 50, 'x from changedTouches');
    runner.assertEqual(result.y, 75, 'y from changedTouches');
    return 'Touch coords from changedTouches OK';
  });

  await runner.run('get_touch_coords_empty', async () => {
    const result = getTouchCoords(null, null);
    runner.assertEqual(result, null, 'Should return null for empty touches');
    const result2 = getTouchCoords([], []);
    runner.assertEqual(result2, null, 'Should return null for empty arrays');
    return 'Empty touch coords OK';
  });

  await runner.run('get_touch_coords_clientXY_fallback', async () => {
    const touches = [{ clientX: 300, clientY: 400 }];
    const result = getTouchCoords(touches, null);
    runner.assert(result !== null, 'Should work with clientX/Y');
    runner.assertEqual(result.x, 300, 'clientX fallback');
    runner.assertEqual(result.y, 400, 'clientY fallback');
    return 'clientX/Y fallback OK';
  });

  await runner.run('draw_rounded_rect_no_crash', async () => {
    const mockCtx = {
      beginPath: () => {},
      moveTo: () => {},
      arcTo: () => {},
      closePath: () => {},
    };
    drawRoundedRect(mockCtx, 10, 20, 100, 50, 8);
    return 'drawRoundedRect no crash with mock ctx';
  });

  // === Boundary & Robustness Tests ===
  await runner.run('match3_null_piece_handling', async () => {
    app.showPage('match3');
    await sleep(400);
    const g = app.currentPage;
    const orig = g.board[0][0];
    g.board[0][0] = null;
    const matches = g.findMatches();
    runner.assert(Array.isArray(matches), 'findMatches should handle null pieces');
    g.board[0][0] = orig;
    return 'Null piece handled without crash';
  });

  await runner.run('match3_empty_row_handling', async () => {
    app.showPage('match3');
    await sleep(400);
    const g = app.currentPage;
    const size = g.board.length;
    const savedRow = g.board[0].slice();
    for (let j = 0; j < size; j++) g.board[0][j] = null;
    const matches = g.findMatches();
    runner.assert(Array.isArray(matches), 'findMatches should handle empty row');
    for (let j = 0; j < size; j++) g.board[0][j] = savedRow[j];
    return 'Empty row handled';
  });

  await runner.run('quiz_empty_questions', async () => {
    app.showPage('quiz');
    await sleep(400);
    const q = app.currentPage;
    const savedQuestions = q.vm.questions;
    q.vm.questions = [];
    runner.assertEqual(q.vm.isGameOver, true, 'isGameOver with 0 questions');
    runner.assertEqual(q.vm.currentQuestion, null, 'currentQuestion null');
    q.vm.questions = savedQuestions;
    return 'Empty questions handled';
  });

  await runner.run('quiz_out_of_bounds_index', async () => {
    app.showPage('quiz');
    await sleep(400);
    const q = app.currentPage;
    const savedIndex = q.vm.currentIndex;
    q.vm.currentIndex = 9999;
    runner.assertEqual(q.vm.currentQuestion, null, 'Out-of-bounds returns null');
    runner.assertEqual(q.vm.isGameOver, true, 'isGameOver true for out-of-bounds');
    q.vm.currentIndex = savedIndex;
    return 'Out-of-bounds index handled';
  });

  await runner.run('save_restore_consistency', async () => {
    const sm = databus.scoreManager;
    const savedScores = JSON.parse(JSON.stringify(sm.scores));
    sm.save();
    const reloaded = sm.load();
    runner.assert(reloaded.match3, 'Reloaded should have match3');
    runner.assert(reloaded.quiz, 'Reloaded should have quiz');
    runner.assert(reloaded.puzzle, 'Reloaded should have puzzle');
    runner.assertEqual(reloaded.match3.gamesPlayed, savedScores.match3.gamesPlayed, 'gamesPlayed consistency');
    return 'Save/reload consistent';
  });

  // === EventBus & ResourceManager Tests (B-11) ===
  const EventBus = require('./utils/eventBus');
  const ResourceManager = require('./utils/resourceManager');

  await runner.run('eventbus_on_emit', async () => {
    const bus = new EventBus();
    let received = null;
    bus.on('test', data => { received = data; });
    bus.emit('test', 'hello');
    runner.assertEqual(received, 'hello', 'should receive emitted data');
    return 'EventBus on/emit OK';
  });

  await runner.run('eventbus_off', async () => {
    const bus = new EventBus();
    let count = 0;
    const fn = () => { count++; };
    bus.on('test', fn);
    bus.emit('test');
    runner.assertEqual(count, 1, 'should fire once');
    bus.off('test', fn);
    bus.emit('test');
    runner.assertEqual(count, 1, 'should not fire after off');
    return 'EventBus off OK';
  });

  await runner.run('eventbus_clear', async () => {
    const bus = new EventBus();
    let count = 0;
    bus.on('a', () => { count++; });
    bus.on('b', () => { count++; });
    bus.clear();
    bus.emit('a');
    bus.emit('b');
    runner.assertEqual(count, 0, 'no callbacks after clear');
    return 'EventBus clear OK';
  });

  await runner.run('resource_manager_getImage', async () => {
    const rm = new ResourceManager();
    runner.assertEqual(rm.getImage('nonexistent'), undefined, 'undefined for missing key');
    // Simulate loaded image
    rm.images['test'] = { src: 'test.png' };
    runner.assert(rm.getImage('test') !== undefined, 'should return cached image');
    return 'ResourceManager getImage OK';
  });

  await runner.run('resource_manager_isLoaded', async () => {
    const rm = new ResourceManager();
    runner.assertEqual(rm.isLoaded(), false, 'initially not loaded');
    rm.loaded = true;
    runner.assertEqual(rm.isLoaded(), true, 'loaded after set');
    rm.clear();
    runner.assertEqual(rm.isLoaded(), false, 'not loaded after clear');
    return 'ResourceManager isLoaded OK';
  });

  // === AnimationManager & Easing Tests (B-12) ===
  const { ObjectPool, AnimationManager, easeOutQuad, easeOutElastic, easeOutBounce, easeInQuad, easeInOutQuad, easeInBack, easeOutBack, easeInOutBack, easeInCubic, easeOutCubic, easeInOutCubic } = require('./games/match3/animation');

  await runner.run('objectpool_recycle_reuse', async () => {
    const pool = new ObjectPool();
    runner.assertEqual(pool.get(), null, 'empty pool returns null');
    const obj = { type: 'test' };
    pool.recycle(obj);
    runner.assertEqual(pool.get(), obj, 'should return recycled object');
    runner.assertEqual(pool.get(), null, 'empty again after get');
    return 'ObjectPool recycle/reuse OK';
  });

  await runner.run('animation_manager_add_and_progress', async () => {
    const mgr = new AnimationManager();
    runner.assertEqual(mgr.isAnimating, false, 'initially not animating');
    mgr.addAnimation('test', {}, 1.0);
    runner.assertEqual(mgr.isAnimating, true, 'animating after add');
    runner.assertEqual(mgr.animations.length, 1, 'one animation');
    // Progress should advance
    mgr.updateAnimations(0.5);
    runner.assert(mgr.animations[0].progress === 0.5, 'progress should be 0.5');
    // Complete
    mgr.updateAnimations(0.5);
    runner.assertEqual(mgr.isAnimating, false, 'done after full duration');
    runner.assertEqual(mgr.animations.length, 0, 'animations cleared');
    return 'AnimationManager add/update OK';
  });

  await runner.run('animation_manager_wait_immediate', async () => {
    const mgr = new AnimationManager();
    let called = false;
    mgr.waitForAnimations(() => { called = true; });
    runner.assert(called, 'should call immediately when not animating');
    return 'waitForAnimations immediate OK';
  });

  await runner.run('animation_manager_wait_pending', async () => {
    const mgr = new AnimationManager();
    mgr.addAnimation('test', {}, 0.5);
    let called = false;
    mgr.waitForAnimations(() => { called = true; });
    runner.assert(!called, 'should NOT call while animating');
    mgr.updateAnimations(0.5);
    runner.assert(called, 'should call after animations complete');
    return 'waitForAnimations pending OK';
  });

  await runner.run('animation_manager_clear', async () => {
    const mgr = new AnimationManager();
    mgr.addAnimation('a', {}, 1.0);
    mgr.addAnimation('b', {}, 1.0);
    mgr.clear();
    runner.assertEqual(mgr.isAnimating, false, 'not animating after clear');
    runner.assertEqual(mgr.animations.length, 0, 'no animations after clear');
    return 'AnimationManager clear OK';
  });

  // Easing function endpoint tests
  const easingFns = [
    { name: 'easeOutQuad', fn: easeOutQuad },
    { name: 'easeOutElastic', fn: easeOutElastic },
    { name: 'easeOutBounce', fn: easeOutBounce },
    { name: 'easeInQuad', fn: easeInQuad },
    { name: 'easeInOutQuad', fn: easeInOutQuad },
    { name: 'easeInBack', fn: easeInBack },
    { name: 'easeOutBack', fn: easeOutBack },
    { name: 'easeInOutBack', fn: easeInOutBack },
    { name: 'easeInCubic', fn: easeInCubic },
    { name: 'easeOutCubic', fn: easeOutCubic },
    { name: 'easeInOutCubic', fn: easeInOutCubic },
  ];

  await runner.run('easing_functions_endpoints', async () => {
    for (const { name, fn } of easingFns) {
      const at0 = fn(0);
      const at1 = fn(1);
      runner.assert(Math.abs(at0) < 0.001, name + ' f(0)~0, got ' + at0);
      runner.assert(Math.abs(at1 - 1) < 0.001, name + ' f(1)~1, got ' + at1);
    }
    return 'All easing endpoints OK';
  });

  await runner.run('easing_functions_midrange', async () => {
    for (const { name, fn } of easingFns) {
      const at05 = fn(0.5);
      runner.assert(at05 >= -0.5 && at05 <= 1.5, name + ' f(0.5) in range, got ' + at05);
    }
    return 'All easing midrange OK';
  });

  // === DataBus Method Tests (B-13) ===
  await runner.run('databus_update_quiz_data', async () => {
    const saved = { ...databus.quizData };
    databus.quizData = { total: 0, correct: 0 };
    databus.updateQuizData(true);
    runner.assertEqual(databus.quizData.total, 1, 'total increments');
    runner.assertEqual(databus.quizData.correct, 1, 'correct increments on right');
    databus.updateQuizData(false);
    runner.assertEqual(databus.quizData.total, 2, 'total increments again');
    runner.assertEqual(databus.quizData.correct, 1, 'correct stays on wrong');
    databus.quizData = saved;
    return 'updateQuizData OK';
  });

  await runner.run('databus_update_resource', async () => {
    const saved = { ...databus.resources };
    databus.resources = { '非遗': 0, '自然': 0, '红色': 0 };
    databus.updateResource('非遗', 5);
    runner.assertEqual(databus.resources['非遗'], 5, '非遗 +5');
    databus.updateResource('非遗', 3);
    runner.assertEqual(databus.resources['非遗'], 8, '非遗 +3 = 8');
    databus.updateResource('unknown', 10);
    runner.assert(databus.resources['unknown'] === undefined, 'unknown type ignored');
    databus.resources = saved;
    return 'updateResource OK';
  });

  await runner.run('databus_mark_tutorial_seen', async () => {
    const saved = databus.hasSeenTutorial;
    databus.hasSeenTutorial = false;
    databus.markTutorialSeen();
    runner.assert(databus.hasSeenTutorial === true, 'should mark as seen');
    databus.hasSeenTutorial = saved;
    return 'markTutorialSeen OK';
  });

  await runner.run('databus_save_load_consistency', async () => {
    const savedQuiz = { ...databus.quizData };
    const savedRes = { ...databus.resources };
    const savedTut = databus.hasSeenTutorial;
    databus.quizData = { total: 42, correct: 30 };
    databus.resources = { '非遗': 10, '自然': 5, '红色': 3 };
    databus.hasSeenTutorial = true;
    databus.saveToStorage();
    // Reset and reload
    databus.quizData = { total: 0, correct: 0 };
    databus.resources = { '非遗': 0, '自然': 0, '红色': 0 };
    databus.hasSeenTutorial = false;
    databus.loadFromStorage();
    runner.assertEqual(databus.quizData.total, 42, 'quiz total restored');
    runner.assertEqual(databus.quizData.correct, 30, 'quiz correct restored');
    runner.assertEqual(databus.resources['非遗'], 10, '非遗 restored');
    runner.assert(databus.hasSeenTutorial === true, 'tutorial restored');
    // Restore original
    databus.quizData = savedQuiz;
    databus.resources = savedRes;
    databus.hasSeenTutorial = savedTut;
    databus.saveToStorage();
    return 'save/load consistency OK';
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

  // 发送捕获的运行时错误
  const errorCapture = require('./utils/errorCapture');
  const captured = errorCapture.getErrors();
  if (captured.length > 0) {
    console.log('[TEST] ' + captured.length + ' runtime error(s) captured, sending...');
  }
  errorCapture.flushTo('http://127.0.0.1:19830/errors');

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
