const BasePage = require('../../common/basePage');
const { BOARD_SIZE, INITIAL_TIME, SCORE_PER_REMOVE, CHAIN_SCORE_MULTIPLIER, LEVEL_UP_TIME_BONUS, LEVEL_TARGET_MULTIPLIER, SWIPE_THRESHOLD, ColorType, COLORS } = require('./constants');
const { ObjectPool, AnimationManager } = require('./animation');
const Match3Renderer = require('./renderer');

const piecePool = new ObjectPool();

class GamePiece {
  constructor(type, color) {
    this.type = type;
    this.color = color;
    this.special = false;
    this.specialType = null;
    this.row = -1;
    this.col = -1;
  }

  reset(type, color) {
    this.type = type;
    this.color = color;
    this.special = false;
    this.specialType = null;
    return this;
  }
}

class Match3Game extends BasePage {
  constructor() {
    super();

    this.STATES = Object.freeze({
      PLAYING: 'playing',
      GAME_OVER: 'gameOver',
    });

    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = INITIAL_TIME;
    this.board = [];
    this.selectedCell = null;
    this.gameStatus = this.STATES.PLAYING;
    this.lastUpdateTime = Date.now();
    this.touchStart = null;
    this.touchEnd = null;
    this.cellSize = 0;
    this.startX = 0;
    this.startY = 0;

    this.anim = new AnimationManager();
    this.renderer = new Match3Renderer(this);

    try {
      this.initBoard();
      this.calculateLayout();
    } catch (error) {
      console.error('Initialize game error:', error);
    }
  }

  calculateLayout() {
    const size = this.board.length;
    this.cellSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
    this.startX = (this.width - this.cellSize * size) / 2;
    this.startY = 120;
  }

  initBoard() {
    const size = BOARD_SIZE;

    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece) {
          piecePool.recycle(piece);
        }
      }
    }

    this.board = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      this.board.push(row);

      for (let j = 0; j < size; j++) {
        let piece;
        let validPiece = false;
        let attempts = 0;
        const maxAttempts = 100;

        while (!validPiece && attempts < maxAttempts) {
          piece = this.getRandomPiece();
          piece.row = i;
          piece.col = j;

          row.push(piece);

          try {
            const matches = this.findMatches();
            validPiece = matches.length === 0;
          } catch (error) {
            console.error('Find matches error:', error);
            validPiece = true;
          }

          if (!validPiece) {
            row.pop();
          }

          attempts++;
        }

        if (!validPiece) {
          piece.row = i;
          piece.col = j;
          row.push(piece);
        }
      }
    }

    let attempts = 0;
    const maxAttempts = 10;
    while (this.findMatches().length > 0 && attempts < maxAttempts) {
      try {
        const matches = this.findMatches();
        matches.forEach(match => {
          if (match.type === 'horizontal') {
            for (let j = match.start; j <= match.end; j++) {
              const piece = this.getRandomPiece();
              piece.row = match.row;
              piece.col = j;
              this.board[match.row][j] = piece;
            }
          } else if (match.type === 'vertical') {
            for (let i = match.start; i <= match.end; i++) {
              const piece = this.getRandomPiece();
              piece.row = i;
              piece.col = match.col;
              this.board[i][match.col] = piece;
            }
          }
        });
      } catch (error) {
        console.error('Fix matches error:', error);
        break;
      }
      attempts++;
    }

    this.calculateLayout();
  }

  getRandomPiece() {
    const colorIndex = Math.floor(Math.random() * ColorType.COUNT);
    const color = COLORS[colorIndex];
    const type = 'normal';

    let piece = piecePool.get();
    if (piece) {
      return piece.reset(type, color);
    } else {
      return new GamePiece(type, color);
    }
  }

  findMatches() {
    const matches = [];
    const size = this.board.length;
    const visited = Array(size).fill().map(() => Array(size).fill(false));

    for (let i = 0; i < size; i++) {
      let currentPiece = this.board[i][0];
      if (!currentPiece) {
        continue;
      }
      let start = 0;
      for (let j = 1; j < size; j++) {
        const piece = this.board[i][j];
        if (!piece || piece.color !== currentPiece.color) {
          if (j - start >= 3) {
            matches.push({ type: 'horizontal', row: i, start: start, end: j - 1 });
            for (let k = start; k < j; k++) {
              visited[i][k] = true;
            }
          }
          currentPiece = piece;
          start = j;
        }
      }
      if (currentPiece && size - start >= 3) {
        matches.push({ type: 'horizontal', row: i, start: start, end: size - 1 });
        for (let k = start; k < size; k++) {
          visited[i][k] = true;
        }
      }
    }

    for (let j = 0; j < size; j++) {
      let currentPiece = this.board[0][j];
      if (!currentPiece) {
        continue;
      }
      let start = 0;
      for (let i = 1; i < size; i++) {
        const piece = this.board[i][j];
        if (!piece || piece.color !== currentPiece.color) {
          if (i - start >= 3) {
            matches.push({ type: 'vertical', col: j, start: start, end: i - 1 });
            for (let k = start; k < i; k++) {
              visited[k][j] = true;
            }
          }
          currentPiece = piece;
          start = i;
        }
      }
      if (currentPiece && size - start >= 3) {
        matches.push({ type: 'vertical', col: j, start: start, end: size - 1 });
        for (let k = start; k < size; k++) {
          visited[k][j] = true;
        }
      }
    }

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const piece = this.board[i][j];
        if (piece && piece.special && !visited[i][j]) {
          this.handleSpecialPiece(i, j, matches, visited);
        }
      }
    }

    return matches;
  }

  handleSpecialPiece(row, col, matches, visited) {
    const piece = this.board[row][col];
    const size = this.board.length;

    switch (piece.specialType) {
      case 'row_clear':
        for (let j = 0; j < size; j++) {
          if (!visited[row][j] && this.board[row][j]) {
            visited[row][j] = true;
            matches.push({ type: 'special', row: row, col: j, specialType: 'row_clear' });
          }
        }
        break;
      case 'column_clear':
        for (let i = 0; i < size; i++) {
          if (!visited[i][col] && this.board[i][col]) {
            visited[i][col] = true;
            matches.push({ type: 'special', row: i, col: col, specialType: 'column_clear' });
          }
        }
        break;
      case 'rainbow':
        const targetColor = piece.color;
        for (let i = 0; i < size; i++) {
          for (let j = 0; j < size; j++) {
            const targetPiece = this.board[i][j];
            if (!visited[i][j] && targetPiece && targetPiece.color === targetColor) {
              visited[i][j] = true;
              matches.push({ type: 'special', row: i, col: j, specialType: 'rainbow' });
            }
          }
        }
        break;
    }
  }

  // 原地修改棋子属性，无需回收到池（piecePool 仍用于普通棋子生命周期管理）
  _createSpecialPiece(piece, specialType) {
    piece.special = true;
    piece.specialType = specialType;
    return piece;
  }

  _removeLineMatches(match, removed, isHorizontal) {
    let removedCount = 0;
    const size = this.board.length;
    const matchLength = match.end - match.start + 1;

    for (let k = match.start; k <= match.end; k++) {
      const row = isHorizontal ? match.row : k;
      const col = isHorizontal ? k : match.col;
      if (removed[row][col] || !this.board[row][col]) continue;

      if (matchLength === 3) {
        this.board[row][col] = null;
      } else if (matchLength === 4 && k === match.start) {
        const st = isHorizontal ? 'row_clear' : 'column_clear';
        this.board[row][col] = this._createSpecialPiece(this.board[row][col], st);
      } else if (matchLength >= 5 && k === match.start) {
        this.board[row][col] = this._createSpecialPiece(this.board[row][col], 'rainbow');
      } else {
        this.board[row][col] = null;
      }
      removed[row][col] = true;
      removedCount++;
    }
    return removedCount;
  }

  removeMatches(matches) {
    let removedCount = 0;
    const size = this.board.length;
    const removed = Array(size).fill().map(() => Array(size).fill(false));

    matches.forEach(match => {
      if (match.type === 'horizontal' || match.type === 'vertical') {
        removedCount += this._removeLineMatches(match, removed, match.type === 'horizontal');
      } else if (match.type === 'special') {
        if (!removed[match.row][match.col] && this.board[match.row][match.col]) {
          this.board[match.row][match.col] = null;
          removed[match.row][match.col] = true;
          removedCount++;
        }
      }
    });
    return removedCount;
  }

  dropPieces() {
    const size = this.board.length;
    const dropAnimations = [];
    let hasDropped = false;

    for (let j = 0; j < size; j++) {
      let emptySpaces = 0;
      for (let i = size - 1; i >= 0; i--) {
        if (this.board[i][j] === null) {
          emptySpaces++;
        } else if (emptySpaces > 0) {
          const piece = this.board[i][j];
          const pieceCopy = {
            type: piece.type,
            color: piece.color,
            special: piece.special,
            specialType: piece.specialType,
            row: i + emptySpaces,
            col: j
          };
          dropAnimations.push({
            row: i,
            col: j,
            targetRow: i + emptySpaces,
            targetCol: j,
            piece: pieceCopy
          });
          this.board[i + emptySpaces][j] = piece;
          this.board[i][j] = null;
          hasDropped = true;
        }
      }
      for (let i = 0; i < emptySpaces; i++) {
        const newPiece = this.getRandomPiece();
        const pieceCopy = {
          type: newPiece.type,
          color: newPiece.color,
          special: newPiece.special,
          specialType: newPiece.specialType,
          row: i,
          col: j
        };
        this.board[i][j] = newPiece;
        dropAnimations.push({
          row: -1,
          col: j,
          targetRow: i,
          targetCol: j,
          piece: pieceCopy
        });
        hasDropped = true;
      }
    }

    dropAnimations.forEach(anim => {
      this.anim.addAnimation('drop', anim, 0.5);
    });

    return hasDropped;
  }

  handleCellClick(row, col) {
    if (this.gameStatus !== this.STATES.PLAYING || this.anim.isAnimating) return;

    const size = this.board.length;
    if (row < 0 || row >= size || col < 0 || col >= size) return;

    if (!this.selectedCell) {
      this.selectedCell = { row, col };
      this.anim.addAnimation('pop', { row, col }, 0.2);
    } else {
      const rowDiff = Math.abs(row - this.selectedCell.row);
      const colDiff = Math.abs(col - this.selectedCell.col);

      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        this.handleCellSwap(this.selectedCell.row, this.selectedCell.col, row, col);
      }
      this.selectedCell = null;
    }
  }

  handleCellSwap(row1, col1, row2, col2) {
    if (this.gameStatus !== this.STATES.PLAYING || this.anim.isAnimating) return;

    const size = this.board.length;
    if (row1 < 0 || row1 >= size || col1 < 0 || col1 >= size || row2 < 0 || row2 >= size || col2 < 0 || col2 >= size) return;

    const piece1 = this.board[row1][col1];
    const piece2 = this.board[row2][col2];
    if (!piece1 || !piece2) return;

    this.anim.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);

    this.anim.waitForAnimations(() => {
      this.board[row1][col1] = piece2;
      this.board[row2][col2] = piece1;

      const matches = this.findMatches();
      if (matches.length > 0) {
        const matchColors = this.buildMatchColors(matches);

        this.playMatchEffects(matchColors);

        const removedCount = this.removeMatches(matches);
        this.score += removedCount * SCORE_PER_REMOVE;
        this.moves++;

        this.anim.waitForAnimations(() => {
          const hasDropped = this.dropPieces();

          const checkNewMatchesCallback = () => {
            this.checkNewMatches();
          };

          if (hasDropped) {
            this.anim.waitForAnimations(checkNewMatchesCallback);
          } else {
            checkNewMatchesCallback();
          }
        });

        if (this.score >= this.getLevelTarget()) {
          this.levelUp();
        }
      } else {
        this.anim.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);
        this.anim.waitForAnimations(() => {
          this.board[row1][col1] = piece1;
          this.board[row2][col2] = piece2;
        });
      }
    });
  }

  getLevelTarget() {
    return this.level * LEVEL_TARGET_MULTIPLIER;
  }

  levelUp() {
    this.level++;
    this.time += LEVEL_UP_TIME_BONUS;
    this.lastUpdateTime = Date.now();
    this.anim.addAnimation('special', { row: 3, col: 3, specialType: 'level_up', color: '#FFD700' }, 1.0);
  }

  checkNewMatches(_depth = 0) {
    if (_depth > 20) return;
    let newMatches = this.findMatches();
    if (newMatches.length > 0) {
      const matchColors = this.buildMatchColors(newMatches);

      this.playMatchEffects(matchColors);

      const newRemovedCount = this.removeMatches(newMatches);
      this.score += newRemovedCount * CHAIN_SCORE_MULTIPLIER;

      this.anim.waitForAnimations(() => {
        const hasDropped = this.dropPieces();

        const checkAfterDropCallback = () => {
          const afterDropMatches = this.findMatches();
          if (afterDropMatches.length > 0) {
            this.checkNewMatches(_depth + 1);
          }
        };

        if (hasDropped) {
          this.anim.waitForAnimations(checkAfterDropCallback);
        } else {
          checkAfterDropCallback();
        }
      });
    }
  }

  update() {
    if (this.gameStatus === this.STATES.PLAYING) {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;

      const clampedDeltaTime = Math.min(deltaTime, 0.1);

      this.anim.updateAnimations(clampedDeltaTime);

      this.time -= clampedDeltaTime;
      if (this.time <= 0) {
        this.time = 0;
        this.gameStatus = this.STATES.GAME_OVER;
        this.saveGameScore();
      }
    }
  }

  saveGameScore() {
    if (this.databus) {
      this.databus.recordMatch3Score(this.score, this.level);
    }
  }

  buildMatchColors(matches) {
    const matchColors = [];
    matches.forEach(match => {
      if (match.type === 'horizontal') {
        for (let j = match.start; j <= match.end; j++) {
          matchColors.push({
            row: match.row,
            col: j,
            color: this.board[match.row][j]?.color || '#ffffff',
            type: 'horizontal'
          });
        }
      } else if (match.type === 'vertical') {
        for (let i = match.start; i <= match.end; i++) {
          matchColors.push({
            row: i,
            col: match.col,
            color: this.board[i][match.col]?.color || '#ffffff',
            type: 'vertical'
          });
        }
      } else if (match.type === 'special') {
        matchColors.push({
          row: match.row,
          col: match.col,
          color: this.board[match.row][match.col]?.color || '#ffffff',
          type: 'special',
          specialType: match.specialType
        });
      }
    });
    return matchColors;
  }

  playMatchEffects(matchColors) {
    matchColors.forEach(matchColor => {
      if (matchColor.type === 'horizontal' || matchColor.type === 'vertical') {
        this.anim.addAnimation('elimination', { row: matchColor.row, col: matchColor.col, color: matchColor.color }, 0.6);
      } else if (matchColor.type === 'special') {
        this.anim.addAnimation('special', { row: matchColor.row, col: matchColor.col, specialType: matchColor.specialType, color: matchColor.color }, 0.8);
      }
    });
  }

  render(ctx) {
    try {
      this.drawBackground(ctx, '#2563EB', '#3B82F6');

      this.renderer.drawGameInfo(ctx);

      this.renderer.drawGameBoard(ctx);

      this.renderer.drawBottomButtons(ctx);

      if (this.gameStatus === this.STATES.GAME_OVER) {
        this.renderer.drawGameOver(ctx);
      }

      this.renderer.drawCulturalElements(ctx);
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  _getTouchPosition(e) {
    const touch = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
    if (!touch) return null;
    return {
      x: touch.x || touch.clientX || touch.pageX || 0,
      y: touch.y || touch.clientY || touch.pageY || 0
    };
  }

  handleTouchStart(e) {
    const pos = this._getTouchPosition(e);
    if (!pos) return;
    const { x, y } = pos;

    const btns = this.renderer.getButtonRects();
    if (btns.back.contains(x, y)) {
      this.navigateTo('home');
      return;
    }
    if (btns.restart.contains(x, y)) {
      this.reset();
      return;
    }

    if (this.gameStatus === this.STATES.GAME_OVER) {
      const goBtns = this.renderer.getGameOverRects();
      if (goBtns.restart.contains(x, y)) {
        this.reset();
      }
      if (goBtns.home.contains(x, y)) {
        this.navigateTo('home');
      }
      return;
    }

    // Board click (only in playing state)
    const size = this.board.length;
    const cellSize = this.cellSize;
    const startX = this.startX;
    const startY = this.startY;

    if (x >= startX && x <= startX + cellSize * size && y >= startY && y <= startY + cellSize * size) {
      const col = Math.floor((x - startX) / cellSize);
      const row = Math.floor((y - startY) / cellSize);
      this.touchStart = { row, col, x, y };
      this.handleCellClick(row, col);
    }
  }

  handleTouchMove(e) {
    const pos = this._getTouchPosition(e);
    if (!pos) return;
    this.touchEnd = pos;
  }

  handleTouchEnd(e) {
    if (!this.touchStart) return;
    try {
      const size = this.board.length;
      const startX = this.touchStart.x;
      const startY = this.touchStart.y;

      const endPos = this._getTouchPosition(e) || this.touchEnd;
      if (!endPos) return;
      const { x: endX, y: endY } = endPos;

      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      let endRow = this.touchStart.row;
      let endCol = this.touchStart.col;

      const swipeThreshold = SWIPE_THRESHOLD;

      if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
        if (absDeltaX > absDeltaY) {
          endCol += deltaX > 0 ? 1 : -1;
        } else {
          endRow += deltaY > 0 ? 1 : -1;
        }
      }

      if (endCol < 0 || endCol >= size || endRow < 0 || endRow >= size) {
        this.touchStart = null;
        this.touchEnd = null;
        return;
      }

      const rowDiff = endRow - this.touchStart.row;
      const colDiff = endCol - this.touchStart.col;

      if ((Math.abs(rowDiff) === 1 && colDiff === 0) || (rowDiff === 0 && Math.abs(colDiff) === 1)) {
        this.handleCellSwap(this.touchStart.row, this.touchStart.col, endRow, endCol);
      } else if (endRow === this.touchStart.row && endCol === this.touchStart.col) {
        this.selectedCell = null;
      }

      this.touchStart = null;
      this.touchEnd = null;
    } catch (error) {
      console.error('Touch end error:', error);
      this.touchStart = null;
      this.touchEnd = null;
    }
  }

  reset() {
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = INITIAL_TIME;
    this.selectedCell = null;
    this.gameStatus = this.STATES.PLAYING;
    this.lastUpdateTime = Date.now();

    this.anim.clear();
    this.touchStart = null;
    this.touchEnd = null;

    this.initBoard();
  }

  destroy() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece) {
          piecePool.recycle(piece);
        }
      }
    }

    this.anim.clear();

    this.board = [];
    this.touchStart = null;
    this.touchEnd = null;
    this.selectedCell = null;
  }
}

module.exports = Match3Game;
