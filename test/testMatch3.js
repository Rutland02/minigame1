const TestRunner = require('./testRunnerBase');
const { COLORS, SCORE_PER_REMOVE, CHAIN_SCORE_MULTIPLIER, LEVEL_UP_TIME_BONUS } = require('../code/js/games/match3/constants');

function makePiece(color, row, col, special, specialType) {
  return { type: 'normal', color, special: !!special, specialType: specialType || null, row, col };
}

// 用两种颜色交替填充棋盘，确保无 3 连
function fillBoardNoMatch(g) {
  const size = g.board.length;
  const c0 = COLORS[0], c1 = COLORS[1];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      g.board[i][j] = makePiece((i + j) % 2 === 0 ? c0 : c1, i, j);
    }
  }
}

// 测试用色（不与棋盘底色 COLORS[0]/COLORS[1] 冲突）
const TCOLOR = COLORS[2];

function clearAnim(g) {
  g.anim.clear();
}

async function runMatch3Tests() {
  const runner = new TestRunner();
  const app = GameGlobal.app;

  if (!app) {
    console.error('[TEST-M3] GameGlobal.app not found');
    return runner;
  }

  console.log('[TEST-M3] Starting match3 tests...');

  app.showPage('match3');
  await new Promise(r => setTimeout(r, 400));

  // 1. 水平 3 连检测
  await runner.run('match3_find_horizontal_3', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const h = matches.filter(m => m.type === 'horizontal' && m.row === 3 && m.start === 2 && m.end === 4);
    runner.assert(h.length >= 1, '应检测到水平 3 连');
    return '水平 3 连: start=' + h[0].start + ' end=' + h[0].end;
  });

  // 2. 垂直 3 连检测
  await runner.run('match3_find_vertical_3', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[2][3] = makePiece(TCOLOR, 2, 3);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[4][3] = makePiece(TCOLOR, 4, 3);

    const matches = g.findMatches();
    const v = matches.filter(m => m.type === 'vertical' && m.col === 3 && m.start === 2 && m.end === 4);
    runner.assert(v.length >= 1, '应检测到垂直 3 连');
    return '垂直 3 连: start=' + v[0].start + ' end=' + v[0].end;
  });

  // 3. 3 连消除数量
  await runner.run('match3_remove_3match', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const targetMatch = matches.find(m => m.type === 'horizontal' && m.row === 3 && m.start === 2);
    runner.assert(targetMatch, '应找到目标匹配');
    const removedCount = g.removeMatches([targetMatch]);
    runner.assertEqual(removedCount, 3, 'removedCount');
    runner.assert(g.board[3][2] === null, '[3][2] 应为空');
    runner.assert(g.board[3][3] === null, '[3][3] 应为空');
    runner.assert(g.board[3][4] === null, '[3][4] 应为空');
    return '消除 3 子';
  });

  // 4. 4 连生成特殊棋子（行消除）
  await runner.run('match3_remove_4match_creates_special', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[3][1] = makePiece(TCOLOR, 3, 1);
    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const targetMatch = matches.find(m => m.type === 'horizontal' && m.row === 3 && m.start === 1);
    runner.assert(targetMatch, '应找到 4 连匹配');
    g.removeMatches([targetMatch]);

    const first = g.board[3][1];
    runner.assert(first !== null, '首位棋子应保留为特殊棋子');
    runner.assert(first.special === true, '应标记为 special');
    runner.assertEqual(first.specialType, 'row_clear', 'specialType');
    runner.assert(g.board[3][2] === null, '[3][2] 应为空');
    runner.assert(g.board[3][3] === null, '[3][3] 应为空');
    runner.assert(g.board[3][4] === null, '[3][4] 应为空');
    return '4 连生成 row_clear';
  });

  // 5. 5 连生成彩虹特殊棋子
  await runner.run('match3_remove_5match_creates_rainbow', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[3][0] = makePiece(TCOLOR, 3, 0);
    g.board[3][1] = makePiece(TCOLOR, 3, 1);
    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const targetMatch = matches.find(m => m.type === 'horizontal' && m.row === 3 && m.start === 0);
    runner.assert(targetMatch, '应找到 5 连匹配');
    g.removeMatches([targetMatch]);

    const first = g.board[3][0];
    runner.assert(first !== null, '首位棋子应保留为彩虹');
    runner.assert(first.special === true, '应标记为 special');
    runner.assertEqual(first.specialType, 'rainbow', 'specialType');
    return '5 连生成 rainbow';
  });

  // 6. 下落填补空位
  await runner.run('match3_drop_fills_gaps', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[5][0] = null;
    g.board[6][0] = null;
    g.board[7][0] = null;

    clearAnim(g);
    g.dropPieces();

    let nullCount = 0;
    for (let i = 0; i < g.board.length; i++) {
      if (g.board[i][0] === null) nullCount++;
    }
    runner.assertEqual(nullCount, 0, '第 0 列不应有空位');
    return '下落完成，空位已填补';
  });

  // 7. 连锁检测（级联）
  await runner.run('match3_cascade_detection', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.score = 0;

    // 在第 0 列放 4 个同色触发消除
    g.board[4][0] = makePiece(TCOLOR, 4, 0);
    g.board[5][0] = makePiece(TCOLOR, 5, 0);
    g.board[6][0] = makePiece(TCOLOR, 6, 0);
    g.board[7][0] = makePiece(TCOLOR, 7, 0);

    const matches = g.findMatches();
    const removedCount = g.removeMatches(matches);
    g.score += removedCount * SCORE_PER_REMOVE;
    const scoreBeforeCascade = g.score;

    clearAnim(g);
    g.dropPieces();

    const origWaitFor = g.anim.waitForAnimations.bind(g.anim);
    g.anim.waitForAnimations = function (cb) { cb(); };
    const origAdd = g.anim.addAnimation.bind(g.anim);
    g.anim.addAnimation = function () {};

    g.checkNewMatches();

    g.anim.waitForAnimations = origWaitFor;
    g.anim.addAnimation = origAdd;

    runner.assert(g.score > scoreBeforeCascade, '连锁后分数应增加: ' + scoreBeforeCascade + ' -> ' + g.score);
    return '连锁完成，分数 ' + scoreBeforeCascade + ' -> ' + g.score;
  });

  // 8. 单次消除分数
  await runner.run('match3_score_per_remove', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.score = 0;
    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const targetMatch = matches.find(m => m.type === 'horizontal' && m.row === 3 && m.start === 2);
    const removedCount = g.removeMatches([targetMatch]);
    g.score += removedCount * SCORE_PER_REMOVE;

    runner.assertEqual(removedCount, 3, 'removedCount');
    runner.assertEqual(g.score, 3 * SCORE_PER_REMOVE, '分数');
    return '分数 ' + g.score;
  });

  // 9. 升级阈值
  await runner.run('match3_level_up_threshold', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.level = 1;
    g.score = 90;
    g.time = 60;

    g.board[3][2] = makePiece(TCOLOR, 3, 2);
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);

    const matches = g.findMatches();
    const removedCount = g.removeMatches(matches);
    g.score += removedCount * SCORE_PER_REMOVE;

    if (g.score >= g.getLevelTarget()) {
      g.levelUp();
    }

    runner.assertEqual(g.level, 2, 'level');
    runner.assert(g.time > 60, '时间应增加 ' + LEVEL_UP_TIME_BONUS + 's');
    return '升级到 Lv' + g.level + ', 时间 ' + g.time.toFixed(1);
  });

  // 10. 超时游戏结束
  await runner.run('match3_game_over_on_timeout', async () => {
    const g = app.currentPage;
    g.gameStatus = g.STATES.PLAYING;
    g.time = 0.01;
    g.lastUpdateTime = Date.now() - 200;
    clearAnim(g);

    g.update();

    runner.assertEqual(g.gameStatus, g.STATES.GAME_OVER, 'gameStatus');
    return '超时触发 gameOver';
  });

  // 11. 行消除特殊棋子
  await runner.run('match3_special_row_clear', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[2][3] = makePiece(TCOLOR, 2, 3, true, 'row_clear');

    const matches = [];
    const visited = Array(8).fill().map(() => Array(8).fill(false));
    g.handleSpecialPiece(2, 3, matches, visited);

    runner.assert(matches.length >= 7, '应标记整行（不含自身共 7 个），实际 ' + matches.length);
    const allRow2 = matches.every(m => m.row === 2);
    runner.assert(allRow2, '所有标记应在第 2 行');
    return '行消除标记 ' + matches.length + ' 个';
  });

  // 12. 列消除特殊棋子
  await runner.run('match3_special_column_clear', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    g.board[3][4] = makePiece(TCOLOR, 3, 4, true, 'column_clear');

    const matches = [];
    const visited = Array(8).fill().map(() => Array(8).fill(false));
    g.handleSpecialPiece(3, 4, matches, visited);

    runner.assert(matches.length >= 7, '应标记整列（不含自身共 7 个），实际 ' + matches.length);
    const allCol4 = matches.every(m => m.col === 4);
    runner.assert(allCol4, '所有标记应在第 4 列');
    return '列消除标记 ' + matches.length + ' 个';
  });

  // 13. 无匹配时返回空数组
  await runner.run('match3_no_false_positive', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    const matches = g.findMatches();
    runner.assertEqual(matches.length, 0, '不应有匹配');
    return '无误报';
  });

  // 14. handleCellClick 选中棋子
  await runner.run('match3_handle_cell_click_select', async () => {
    const g = app.currentPage;
    g.gameStatus = g.STATES.PLAYING;
    g.selectedCell = null;
    clearAnim(g);

    g.handleCellClick(3, 3);

    runner.assert(g.selectedCell !== null, 'selectedCell 不应为 null');
    runner.assertEqual(g.selectedCell.row, 3, 'selectedCell.row');
    runner.assertEqual(g.selectedCell.col, 3, 'selectedCell.col');
    return '点击 (3,3) 选中成功';
  });

  // 15. handleCellClick 点击相邻格触发交换
  await runner.run('match3_handle_cell_click_swap_neighbor', async () => {
    const g = app.currentPage;
    fillBoardNoMatch(g);
    // 设置已知颜色供交换后匹配检测
    g.board[3][3] = makePiece(TCOLOR, 3, 3);
    g.board[3][4] = makePiece(TCOLOR, 3, 4);
    g.gameStatus = g.STATES.PLAYING;
    g.selectedCell = { row: 3, col: 3 };
    g.score = 0;
    clearAnim(g);

    // stub 动画：立即回调 / 忽略添加
    const origWaitFor = g.anim.waitForAnimations.bind(g.anim);
    g.anim.waitForAnimations = function (cb) { cb(); };
    const origAdd = g.anim.addAnimation.bind(g.anim);
    g.anim.addAnimation = function () {};

    g.handleCellClick(3, 4);

    g.anim.waitForAnimations = origWaitFor;
    g.anim.addAnimation = origAdd;

    runner.assert(g.selectedCell === null, 'selectedCell 应在交换后重置为 null');
    return '点击相邻格触发交换, selectedCell 已重置';
  });

  // 16. handleCellClick 点击非相邻格切换选中
  await runner.run('match3_handle_cell_click_non_neighbor', async () => {
    const g = app.currentPage;
    g.gameStatus = g.STATES.PLAYING;
    g.selectedCell = { row: 0, col: 0 };
    clearAnim(g);

    g.handleCellClick(5, 5);

    // handleCellClick else 分支末尾 this.selectedCell = null
    runner.assert(g.selectedCell === null, 'selectedCell 应在非相邻点击后重置');
    return '非相邻点击 selectedCell 已重置';
  });

  // 17. getLevelTarget 纯计算
  await runner.run('match3_get_level_target', async () => {
    const g = app.currentPage;
    g.level = 1;
    runner.assertEqual(g.getLevelTarget(), 50, 'level=1 目标');
    g.level = 5;
    runner.assertEqual(g.getLevelTarget(), 1250, 'level=5 目标');
    return 'getLevelTarget 计算正确';
  });

  // 18. reset 完全重置游戏状态
  await runner.run('match3_reset', async () => {
    const g = app.currentPage;
    g.score = 999;
    g.level = 5;
    g.moves = 50;
    g.gameStatus = g.STATES.GAME_OVER;
    // 清空棋盘避免 makePiece 生成的 plain object 被回收到 piecePool（无 reset 方法）
    g.board = [];

    g.reset();

    runner.assertEqual(g.score, 0, 'score 重置');
    runner.assertEqual(g.level, 1, 'level 重置');
    runner.assertEqual(g.moves, 0, 'moves 重置');
    runner.assertEqual(g.gameStatus, g.STATES.PLAYING, 'gameStatus 重置');
    runner.assert(g.board.length > 0, 'board 已重新初始化');
    return 'reset 状态归零';
  });

  const result = runner.report();
  console.log('[TEST-M3] Done: ' + result.passed + '/' + result.total + ' passed');
  return runner;
}

module.exports = { runMatch3Tests };
