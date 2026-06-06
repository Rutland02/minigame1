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

class SpecialPiece extends GamePiece {
  constructor(type, color, specialType) {
    super(type, color);
    this.special = true;
    this.specialType = specialType;
  }
  
  reset(type, color, specialType) {
    super.reset(type, color);
    this.special = true;
    this.specialType = specialType;
    return this;
  }
}

class ObjectPool {
  constructor() {
    this.pool = [];
  }
  
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null;
  }
  
  recycle(obj) {
    this.pool.push(obj);
  }
}

const animationPool = new ObjectPool();

const piecePool = new ObjectPool();

const ColorType = {
    RED: 0,
    YELLOW: 1,
    WHITE: 2,
    PINK: 3,
    BLUE: 4,
    GREEN: 5,
    ANY: 6,
    COUNT: 7
};

const PieceType = {
    EMPTY: 0,
    NORMAL: 1,
    BUBBLE: 2,
    ROW_CLEAR: 3,
    COLUMN_CLEAR: 4,
    RAINBOW: 5,
    COUNT: 6
};

const COLORS = [
    '#EF4444',
    '#F59E0B',
    '#F8FAFC',
    '#EC4899',
    '#3B82F6',
    '#10B981',
    '#F8FAFC'
];

const ICONS = [
    'images/match3/icon_0000_red.png',
    'images/match3/icon_0001_yellow.png',
    'images/match3/icon_0002_white.png',
    'images/match3/icon_0003_pinlk.png',
    'images/match3/icon_0004_blue.png',
    'images/match3/icon_0005_green.png',
    null
];

const iconCache = [];

const AnimationType = {
    SWAP: 'swap',
    ELIMINATION: 'elimination',
    DROP: 'drop',
    POP: 'pop',
    SPECIAL: 'special'
};

class Match3Game {
  constructor() {
    try {
      if (typeof GameGlobal !== 'undefined' && GameGlobal.systemInfo) {
        this.width = GameGlobal.systemInfo.windowWidth || 375;
        this.height = GameGlobal.systemInfo.windowHeight || 667;
        this.pixelRatio = GameGlobal.systemInfo.pixelRatio || 1;
      } else if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
        const systemInfo = wx.getSystemInfoSync();
        this.width = systemInfo.windowWidth || 375;
        this.height = systemInfo.windowHeight || 667;
        this.pixelRatio = systemInfo.pixelRatio || 1;
      } else if (typeof window !== 'undefined') {
        this.width = window.innerWidth || 375;
        this.height = window.innerHeight || 667;
        this.pixelRatio = window.devicePixelRatio || 1;
      } else {
        this.width = 375;
        this.height = 667;
        this.pixelRatio = 1;
      }
    } catch (error) {
      console.error('Get system info error:', error);
      this.width = 375;
      this.height = 667;
      this.pixelRatio = 1;
    }
    
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = 60;
    this.board = [];
    this.selectedCell = null;
    this.gameStatus = 'playing';
    this.lastUpdateTime = Date.now();
    this.animations = [];
    this.isAnimating = false;
    this.touchStart = null;
    this.touchEnd = null;
    this.cellSize = 0;
    this.startX = 0;
    this.startY = 0;
    this.backgroundImage = null;
    
    try {
      this.initBoard();
      this.calculateLayout();
      this.loadBackgroundImage();
      this.loadIcons();
    } catch (error) {
      console.error('Initialize game error:', error);
    }
  }
  
  loadIcons() {
    for (let i = 0; i < ICONS.length - 1; i++) {
      const iconPath = ICONS[i];
      if (iconPath) {
        if (typeof wx !== 'undefined' && wx.createImage) {
          const img = wx.createImage();
          img.onload = () => {
            iconCache[i] = img;
          };
          img.onerror = (err) => {
            console.error(`Failed to load icon ${iconPath}:`, err);
          };
          img.src = iconPath;
        } else if (typeof window !== 'undefined' && window.Image) {
          const img = new Image();
          img.onload = () => {
            iconCache[i] = img;
          };
          img.onerror = (err) => {
            console.error(`Failed to load icon ${iconPath}:`, err);
          };
          img.src = iconPath;
        }
      }
    }
  }
  
  calculateLayout() {
    const size = this.board.length;
    this.cellSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
    this.startX = (this.width - this.cellSize * size) / 2;
    this.startY = 120;
  }

  initBoard() {
    const size = 8;
    
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
    const colorIndex = Math.floor(Math.random() * (ColorType.COUNT - 1));
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
        if (piece && piece.color === currentPiece.color) {
        } else {
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
        if (piece && piece.color === currentPiece.color) {
        } else {
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

  removeMatches(matches) {
    let removedCount = 0;
    const size = this.board.length;
    const removed = Array(size).fill().map(() => Array(size).fill(false));
    
    matches.forEach(match => {
      if (match.type === 'horizontal') {
        for (let j = match.start; j <= match.end; j++) {
          if (!removed[match.row][j] && this.board[match.row][j]) {
            if (match.end - match.start === 2) {
              this.board[match.row][j] = null;
            } else if (match.end - match.start === 3) {
              if (j === match.start) {
                const specialType = 'row_clear';
                this.board[match.row][j] = new SpecialPiece(this.board[match.row][j].type, this.board[match.row][j].color, specialType);
              } else {
                this.board[match.row][j] = null;
              }
            } else if (match.end - match.start >= 4) {
              if (j === match.start) {
                this.board[match.row][j] = new SpecialPiece(this.board[match.row][j].type, this.board[match.row][j].color, 'rainbow');
              } else {
                this.board[match.row][j] = null;
              }
            }
            removed[match.row][j] = true;
            removedCount++;
          }
        }
      } else if (match.type === 'vertical') {
        for (let i = match.start; i <= match.end; i++) {
          if (!removed[i][match.col] && this.board[i][match.col]) {
            if (match.end - match.start === 2) {
              this.board[i][match.col] = null;
            } else if (match.end - match.start === 3) {
              if (i === match.start) {
                const specialType = 'column_clear';
                this.board[i][match.col] = new SpecialPiece(this.board[i][match.col].type, this.board[i][match.col].color, specialType);
              } else {
                this.board[i][match.col] = null;
              }
            } else if (match.end - match.start >= 4) {
              if (i === match.start) {
                this.board[i][match.col] = new SpecialPiece(this.board[i][match.col].type, this.board[i][match.col].color, 'rainbow');
              } else {
                this.board[i][match.col] = null;
              }
            }
            removed[i][match.col] = true;
            removedCount++;
          }
        }
      } else if (match.type === 'special') {
        // 处理特殊棋子的消除
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
            specialType: piece.specialType
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
          specialType: newPiece.specialType
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
      this.addAnimation('drop', anim, 0.5);
    });
    
    return hasDropped;
  }

  handleCellClick(row, col) {
    if (this.gameStatus !== 'playing' || this.isAnimating) return;

    const size = this.board.length;
    if (row < 0 || row >= size || col < 0 || col >= size) return;

    if (!this.selectedCell) {
      this.selectedCell = { row, col };
      this.addAnimation('pop', { row, col }, 0.2);
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
    if (this.gameStatus !== 'playing' || this.isAnimating) return;

    const size = this.board.length;
    if (row1 < 0 || row1 >= size || col1 < 0 || col1 >= size || row2 < 0 || row2 >= size || col2 < 0 || col2 >= size) return;

    const piece1 = this.board[row1][col1];
    const piece2 = this.board[row2][col2];
    if (!piece1 || !piece2) return;

    this.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);

    this.waitForAnimations(() => {
      this.board[row1][col1] = piece2;
      this.board[row2][col2] = piece1;

      const matches = this.findMatches();
      if (matches.length > 0) {
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
        
        const removedCount = this.removeMatches(matches);
        this.score += removedCount * 10;
        this.moves++;

        matchColors.forEach(matchColor => {
          if (matchColor.type === 'horizontal' || matchColor.type === 'vertical') {
            this.addAnimation('elimination', { row: matchColor.row, col: matchColor.col, color: matchColor.color }, 0.6);
          } else if (matchColor.type === 'special') {
            this.addAnimation('special', { row: matchColor.row, col: matchColor.col, specialType: matchColor.specialType, color: matchColor.color }, 0.8);
          }
        });

        this.waitForAnimations(() => {
          const hasDropped = this.dropPieces();
          
          const checkNewMatchesCallback = () => {
            this.checkNewMatches();
          };
          
          if (hasDropped) {
            this.waitForAnimations(checkNewMatchesCallback);
          } else {
            checkNewMatchesCallback();
          }
        });

        if (this.score >= this.getLevelTarget()) {
          this.levelUp();
        }
      } else {
        this.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);
        this.waitForAnimations(() => {
          this.board[row1][col1] = piece1;
          this.board[row2][col2] = piece2;
        });
      }
    });
  }

  getLevelTarget() {
    return this.level * 100;
  }

  levelUp() {
    this.level++;
    this.time += 10;
    this.lastUpdateTime = Date.now();
    this.addAnimation('special', { row: 3, col: 3, specialType: 'level_up', color: '#FFD700' }, 1.0);
  }

  checkNewMatches() {
    let newMatches = this.findMatches();
    if (newMatches.length > 0) {
      const matchColors = [];
      newMatches.forEach(match => {
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
      
      const newRemovedCount = this.removeMatches(newMatches);
      this.score += newRemovedCount * 15;
      
      matchColors.forEach(matchColor => {
        if (matchColor.type === 'horizontal' || matchColor.type === 'vertical') {
          this.addAnimation('elimination', { row: matchColor.row, col: matchColor.col, color: matchColor.color }, 0.6);
        } else if (matchColor.type === 'special') {
          this.addAnimation('special', { row: matchColor.row, col: matchColor.col, specialType: matchColor.specialType, color: matchColor.color }, 0.8);
        }
      });
      
      this.waitForAnimations(() => {
        const hasDropped = this.dropPieces();
        
        const checkAfterDropCallback = () => {
          const afterDropMatches = this.findMatches();
          if (afterDropMatches.length > 0) {
            this.checkNewMatches();
          }
        };
        
        if (hasDropped) {
          this.waitForAnimations(checkAfterDropCallback);
        } else {
          checkAfterDropCallback();
        }
      });
    }
  }

  update() {
    if (this.gameStatus === 'playing') {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;
      
      const clampedDeltaTime = Math.min(deltaTime, 0.1);
      
      this.updateAnimations(clampedDeltaTime);
      
      this.time -= clampedDeltaTime;
      if (this.time <= 0) {
        this.time = 0;
        this.gameStatus = 'gameOver';
        this.saveGameScore();
      }
    }
  }

  saveGameScore() {
    if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.databus) {
      GameGlobal.app.databus.recordMatch3Score(this.score, this.level);
    }
  }

  updateAnimations(deltaTime) {
    if (this.isAnimating) {
      let allDone = true;
      const completedAnims = [];
      
      for (let i = 0; i < this.animations.length; i++) {
        const anim = this.animations[i];
        anim.progress += deltaTime / anim.duration;
        if (anim.progress < 1) {
          allDone = false;
        } else {
          anim.progress = 1;
          completedAnims.push(anim);
        }
      }
      
      if (allDone) {
        for (const anim of this.animations) {
          animationPool.recycle(anim);
        }
        this.animations = [];
        this.isAnimating = false;
      } else if (completedAnims.length > 0) {
        this.animations = this.animations.filter(anim => !completedAnims.includes(anim));
        for (const anim of completedAnims) {
          animationPool.recycle(anim);
        }
      }
    }
  }

  addAnimation(type, data, duration = 0.3) {
    let anim = animationPool.get();
    if (!anim) {
      anim = {
        type: '',
        data: null,
        progress: 0,
        duration: 0
      };
    }
    
    anim.type = type;
    anim.data = data;
    anim.progress = 0;
    anim.duration = duration;
    
    this.animations.push(anim);
    this.isAnimating = true;
  }

  easeOutQuad(t) {
    return t * (2 - t);
  }

  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  easeOutBounce(t) {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  waitForAnimations(callback) {
    if (!this.isAnimating) {
      callback();
      return;
    }

    const checkAnimationComplete = () => {
      if (!this.isAnimating) {
        callback();
      } else {
        setTimeout(checkAnimationComplete, 50);
      }
    };

    checkAnimationComplete();
  }

  render(ctx) {
    try {
      if (this.backgroundImage) {
        ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#2563EB');
        gradient.addColorStop(1, '#3B82F6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
      }

      this.drawGameInfo(ctx);

      this.drawGameBoard(ctx);

      this.drawBottomButtons(ctx);

      if (this.gameStatus === 'gameOver') {
        this.drawGameOver(ctx);
      }

      this.drawCulturalElements(ctx);
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  drawGameInfo(ctx) {
    const size = this.board.length;
    const boardHeight = this.cellSize * size;
    const boardBottomY = this.startY + boardHeight + 20;
    
    const x = 20;
    const y = boardBottomY;
    const width = this.width - 40;
    const height = 80;
    const radius = 15;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'left';
    ctx.fillText(`得分: ${this.score}`, 40, boardBottomY + 22);
    ctx.fillText(`等级: ${this.level}`, 150, boardBottomY + 22);
    ctx.fillText(`时间: ${Math.ceil(this.time)}s`, 260, boardBottomY + 22);
    
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('SCORE', 40, boardBottomY + 42);
    ctx.fillText('LEVEL', 150, boardBottomY + 42);
    ctx.fillText('TIME', 260, boardBottomY + 42);
  }

  drawGameBoard(ctx) {
    const size = this.board.length;
    const cellSize = this.cellSize;
    const startX = this.startX;
    const startY = this.startY;

    const boardWidth = cellSize * size;
    const boardHeight = cellSize * size;
    const x = startX - 10;
    const y = startY - 10;
    const width = boardWidth + 20;
    const height = boardHeight + 20;
    const radius = 20;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = startX + j * cellSize;
        const y = startY + i * cellSize;

        ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        let isInAnimation = false;
        this.animations.forEach(anim => {
          if (anim.type === 'swap') {
            const { row1, col1, row2, col2 } = anim.data;
            if ((row1 === i && col1 === j) || (row2 === i && col2 === j)) {
              isInAnimation = true;
            }
          } else if (anim.type === 'drop') {
            const { targetRow, targetCol } = anim.data;
            if (targetRow === i && targetCol === j) {
              isInAnimation = true;
            }
          } else if (anim.type === 'pop' || anim.type === 'elimination' || anim.type === 'special') {
            const { row, col } = anim.data;
            if (row === i && col === j) {
              isInAnimation = true;
            }
          }
        });

        if (this.board[i][j] && !isInAnimation) {
          const piece = this.board[i][j];
          const colorIndex = COLORS.indexOf(piece.color);
          const icon = iconCache[colorIndex];
          
          if (piece.special) {
            switch (piece.specialType) {
              case 'row_clear':
                if (icon) {
                  const iconSize = Math.floor(cellSize * 2/3);
                  const iconX = Math.floor(x + (cellSize - iconSize) / 2);
                  const iconY = Math.floor(y + (cellSize - iconSize) / 2);
                  
                  const scaleRatio = iconSize / icon.width;
                  if (scaleRatio < 0.5) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                  } else {
                    ctx.imageSmoothingEnabled = false;
                  }
                  
                  ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
                  ctx.imageSmoothingEnabled = true;
                } else {
                  ctx.fillStyle = piece.color;
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
                }
                ctx.fillStyle = '#fff';
                ctx.fillRect(x + cellSize / 4, y + cellSize / 2 - 5, cellSize / 2, 10);
                break;
              case 'column_clear':
                if (icon) {
                  ctx.drawImage(icon, x + cellSize / 6, y + cellSize / 6, cellSize * 2/3, cellSize * 2/3);
                } else {
                  ctx.fillStyle = piece.color;
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
                }
                ctx.fillStyle = '#fff';
                ctx.fillRect(x + cellSize / 2 - 5, y + cellSize / 4, 10, cellSize / 2);
                break;
              case 'rainbow':
                const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                gradient.addColorStop(0, '#FF0000');
                gradient.addColorStop(0.2, '#FF7F00');
                gradient.addColorStop(0.4, '#FFFF00');
                gradient.addColorStop(0.6, '#00FF00');
                gradient.addColorStop(0.8, '#0000FF');
                gradient.addColorStop(1, '#8B00FF');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
                break;
              default:
                if (icon) {
                  const iconSize = Math.floor(cellSize * 2/3);
                  const iconX = Math.floor(x + (cellSize - iconSize) / 2);
                  const iconY = Math.floor(y + (cellSize - iconSize) / 2);
                  
                  const scaleRatio = iconSize / icon.width;
                  if (scaleRatio < 0.5) {
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                  } else {
                    ctx.imageSmoothingEnabled = false;
                  }
                  
                  ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
                  ctx.imageSmoothingEnabled = true;
                } else {
                  ctx.fillStyle = piece.color;
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
                }
            }
          } else {
            if (icon) {
              const iconSize = Math.floor(cellSize * 2/3);
              const iconX = Math.floor(x + (cellSize - iconSize) / 2);
              const iconY = Math.floor(y + (cellSize - iconSize) / 2);
              
              const scaleRatio = iconSize / icon.width;
              if (scaleRatio < 0.5) {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
              } else {
                ctx.imageSmoothingEnabled = false;
              }
              
              ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
              ctx.imageSmoothingEnabled = true;
            } else {
              ctx.fillStyle = piece.color;
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        this.animations.forEach(anim => {
          if (anim.type === 'elimination' && anim.data.row === i && anim.data.col === j) {
            const easedProgress = this.easeOutQuad(anim.progress);
            const scale = 1 + easedProgress * 1.5;
            const opacity = 1 - easedProgress;
            ctx.globalAlpha = opacity;
            
            const colorIndex = COLORS.indexOf(anim.data.color || '#ffffff');
            const icon = iconCache[colorIndex];
            
            if (icon) {
              ctx.drawImage(icon, x + cellSize / 6 - (cellSize / 6) * (scale - 1), y + cellSize / 6 - (cellSize / 6) * (scale - 1), cellSize * 2/3 * scale, cellSize * 2/3 * scale);
            } else {
              ctx.fillStyle = anim.data.color || '#ffffff';
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
              ctx.fill();
            }
            
            for (let p = 0; p < 6; p++) {
              const angle = (p / 6) * Math.PI * 2;
              const distance = easedProgress * cellSize;
              const px = x + cellSize / 2 + Math.cos(angle) * distance;
              const py = y + cellSize / 2 + Math.sin(angle) * distance;
              const particleSize = (1 - easedProgress) * (cellSize / 6);
              ctx.beginPath();
              ctx.arc(px, py, particleSize, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          } else if (anim.type === 'swap') {
            const { row1, col1, row2, col2, piece1, piece2 } = anim.data;
            const easedProgress = this.easeOutBounce(anim.progress);
            
            if (row1 === i && col1 === j && piece1) {
              const targetX = startX + col2 * cellSize + cellSize / 2;
              const targetY = startY + row2 * cellSize + cellSize / 2;
              const currentX = startX + col1 * cellSize + cellSize / 2 + (targetX - (startX + col1 * cellSize + cellSize / 2)) * easedProgress;
              const currentY = startY + row1 * cellSize + cellSize / 2 + (targetY - (startY + row1 * cellSize + cellSize / 2)) * easedProgress;
              
              const colorIndex1 = COLORS.indexOf(piece1.color);
              const icon1 = iconCache[colorIndex1];
              
              if (icon1) {
                ctx.drawImage(icon1, currentX - cellSize / 3, currentY - cellSize / 3, cellSize * 2/3, cellSize * 2/3);
              } else {
                ctx.fillStyle = piece1.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
              }
              
              if (piece1.special) {
                ctx.fillStyle = '#fff';
                if (piece1.specialType === 'row_clear') {
                  ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
                } else if (piece1.specialType === 'column_clear') {
                  ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
                }
              }
            }
            
            if (row2 === i && col2 === j && piece2) {
              const targetX = startX + col1 * cellSize + cellSize / 2;
              const targetY = startY + row1 * cellSize + cellSize / 2;
              const currentX = startX + col2 * cellSize + cellSize / 2 + (targetX - (startX + col2 * cellSize + cellSize / 2)) * easedProgress;
              const currentY = startY + row2 * cellSize + cellSize / 2 + (targetY - (startY + row2 * cellSize + cellSize / 2)) * easedProgress;
              
              const colorIndex2 = COLORS.indexOf(piece2.color);
              const icon2 = iconCache[colorIndex2];
              
              if (icon2) {
                ctx.drawImage(icon2, currentX - cellSize / 3, currentY - cellSize / 3, cellSize * 2/3, cellSize * 2/3);
              } else {
                ctx.fillStyle = piece2.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
              }
              
              if (piece2.special) {
                ctx.fillStyle = '#fff';
                if (piece2.specialType === 'row_clear') {
                  ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
                } else if (piece2.specialType === 'column_clear') {
                  ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
                }
              }
            }
          } else if (anim.type === 'drop') {
            const { row, col, targetRow, targetCol, piece } = anim.data;
            const easedProgress = this.easeOutBounce(anim.progress);
            
            let startYPos;
            if (row === -1) {
              startYPos = startY - cellSize;
            } else {
              startYPos = startY + row * cellSize + cellSize / 2;
            }
            const targetYPos = startY + targetRow * cellSize + cellSize / 2;
            const currentY = startYPos + (targetYPos - startYPos) * easedProgress;
            const currentX = startX + col * cellSize + cellSize / 2;
            
            const colorIndex = COLORS.indexOf(piece.color);
            const icon = iconCache[colorIndex];
            
            if (icon) {
              ctx.drawImage(icon, currentX - cellSize / 3, currentY - cellSize / 3, cellSize * 2/3, cellSize * 2/3);
            } else {
              ctx.fillStyle = piece.color;
              ctx.beginPath();
              ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
              ctx.fill();
            }
            
            if (piece.special) {
              ctx.fillStyle = '#fff';
              if (piece.specialType === 'row_clear') {
                ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
              } else if (piece.specialType === 'column_clear') {
                ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
              }
            }
          } else if (anim.type === 'pop' && anim.data.row === i && anim.data.col === j) {
            const easedProgress = this.easeOutElastic(anim.progress);
            const scale = 1 + easedProgress * 0.3;
            if (this.board[i][j]) {
              const colorIndex = COLORS.indexOf(this.board[i][j].color);
              const icon = iconCache[colorIndex];
              
              if (icon) {
                ctx.drawImage(icon, x + cellSize / 6 - (cellSize / 6) * (scale - 1), y + cellSize / 6 - (cellSize / 6) * (scale - 1), cellSize * 2/3 * scale, cellSize * 2/3 * scale);
              } else {
                ctx.fillStyle = this.board[i][j].color;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          } else if (anim.type === 'special' && anim.data.row === i && anim.data.col === j) {
            const easedProgress = this.easeOutQuad(anim.progress);
            const scale = 1 + easedProgress * 2;
            const opacity = 1 - easedProgress;
            ctx.globalAlpha = opacity;
            
            if (anim.data.specialType === 'level_up') {
              const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
              gradient.addColorStop(0, '#FFD700');
              gradient.addColorStop(0.5, '#FFA500');
              gradient.addColorStop(1, '#FFD700');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * scale, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fff';
              ctx.font = '20px Inter, Arial';
              ctx.textAlign = 'center';
              ctx.fillText('LEVEL UP!', x + cellSize / 2, y + cellSize / 2 + 8);
            } else {
              const colorIndex = COLORS.indexOf(anim.data.color || '#ffffff');
              const icon = iconCache[colorIndex];
              
              if (icon) {
                ctx.drawImage(icon, x + cellSize / 6 - (cellSize / 6) * (scale - 1), y + cellSize / 6 - (cellSize / 6) * (scale - 1), cellSize * 2/3 * scale, cellSize * 2/3 * scale);
              } else {
                ctx.fillStyle = anim.data.color || '#ffffff';
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
              }
              
              for (let r = 0; r < 3; r++) {
                const radius = (cellSize / 2 + r * 10) * scale;
                ctx.strokeStyle = anim.data.color || '#ffffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = opacity * (1 - r * 0.3);
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
            ctx.globalAlpha = 1;
          }
        });


      }
    }
  }

  drawBottomButtons(ctx) {
    const x = 40;
    const y = this.height - 60;
    const width = 100;
    const height = 40;
    const radius = 20;
    
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    
    const backGradient = ctx.createLinearGradient(x, y, x + width, y);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 90, this.height - 35);

    const restartX = this.width - 140;
    const restartY = this.height - 60;
    const restartWidth = 100;
    const restartHeight = 40;
    const restartRadius = 20;
    
    ctx.save();
    ctx.shadowColor = 'rgba(16, 185, 129, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    
    const restartGradient = ctx.createLinearGradient(restartX, restartY, restartX + restartWidth, restartY);
    restartGradient.addColorStop(0, '#10B981');
    restartGradient.addColorStop(1, '#059669');
    ctx.fillStyle = restartGradient;
    
    ctx.beginPath();
    ctx.moveTo(restartX + restartRadius, restartY);
    ctx.lineTo(restartX + restartWidth - restartRadius, restartY);
    ctx.arcTo(restartX + restartWidth, restartY, restartX + restartWidth, restartY + restartRadius, restartRadius);
    ctx.lineTo(restartX + restartWidth, restartY + restartHeight - restartRadius);
    ctx.arcTo(restartX + restartWidth, restartY + restartHeight, restartX + restartWidth - restartRadius, restartY + restartHeight, restartRadius);
    ctx.lineTo(restartX + restartRadius, restartY + restartHeight);
    ctx.arcTo(restartX, restartY + restartHeight, restartX, restartY + restartHeight - restartRadius, restartRadius);
    ctx.lineTo(restartX, restartY + restartRadius);
    ctx.arcTo(restartX, restartY, restartX + restartRadius, restartY, restartRadius);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('重新开始', this.width - 90, this.height - 35);
  }

  drawGameOver(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const cardWidth = 300;
    const cardHeight = 250;
    const cardX = (this.width - cardWidth) / 2;
    const cardY = (this.height - cardHeight) / 2;
    
    const x = cardX;
    const y = cardY;
    const width = cardWidth;
    const height = cardHeight;
    const radius = 20;
    
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // 游戏结束文字
    ctx.fillStyle = '#2563EB';
    ctx.font = '28px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 40);
    
    // 得分和等级
    ctx.font = '20px Inter, Arial';
    ctx.fillStyle = '#1E293B';
    ctx.shadowBlur = 0;
    ctx.fillText(`最终得分: ${this.score}`, this.width / 2, this.height / 2);
    ctx.fillText(`等级: ${this.level}`, this.width / 2, this.height / 2 + 30);

    // 重新开始按钮
    const restartGradient = ctx.createLinearGradient(this.width / 2 - 100, this.height / 2 + 60, this.width / 2 + 100, this.height / 2 + 60);
    restartGradient.addColorStop(0, '#10B981');
    restartGradient.addColorStop(1, '#059669');
    ctx.fillStyle = restartGradient;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    
    const restartX = this.width / 2 - 100;
    const restartY = this.height / 2 + 60;
    const restartWidth = 200;
    const restartHeight = 50;
    const restartRadius = 25;
    
    ctx.beginPath();
    ctx.moveTo(restartX + restartRadius, restartY);
    ctx.lineTo(restartX + restartWidth - restartRadius, restartY);
    ctx.arcTo(restartX + restartWidth, restartY, restartX + restartWidth, restartY + restartRadius, restartRadius);
    ctx.lineTo(restartX + restartWidth, restartY + restartHeight - restartRadius);
    ctx.arcTo(restartX + restartWidth, restartY + restartHeight, restartX + restartWidth - restartRadius, restartY + restartHeight, restartRadius);
    ctx.lineTo(restartX + restartRadius, restartY + restartHeight);
    ctx.arcTo(restartX, restartY + restartHeight, restartX, restartY + restartHeight - restartRadius, restartRadius);
    ctx.lineTo(restartX, restartY + restartRadius);
    ctx.arcTo(restartX, restartY, restartX + restartRadius, restartY, restartRadius);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('重新开始', this.width / 2, this.height / 2 + 90);
    ctx.shadowBlur = 0;

    const homeGradient = ctx.createLinearGradient(this.width / 2 - 100, this.height / 2 + 120, this.width / 2 + 100, this.height / 2 + 120);
    homeGradient.addColorStop(0, '#6B7280');
    homeGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = homeGradient;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    
    const homeX = this.width / 2 - 100;
    const homeY = this.height / 2 + 120;
    const homeWidth = 200;
    const homeHeight = 50;
    const homeRadius = 25;
    
    ctx.beginPath();
    ctx.moveTo(homeX + homeRadius, homeY);
    ctx.lineTo(homeX + homeWidth - homeRadius, homeY);
    ctx.arcTo(homeX + homeWidth, homeY, homeX + homeWidth, homeY + homeRadius, homeRadius);
    ctx.lineTo(homeX + homeWidth, homeY + homeHeight - homeRadius);
    ctx.arcTo(homeX + homeWidth, homeY + homeHeight, homeX + homeWidth - homeRadius, homeY + homeHeight, homeRadius);
    ctx.lineTo(homeX + homeRadius, homeY + homeHeight);
    ctx.arcTo(homeX, homeY + homeHeight, homeX, homeY + homeHeight - homeRadius, homeRadius);
    ctx.lineTo(homeX, homeY + homeRadius);
    ctx.arcTo(homeX, homeY, homeX + homeRadius, homeY, homeRadius);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = '18px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('返回首页', this.width / 2, this.height / 2 + 150);
    ctx.shadowBlur = 0;
  }

  drawCulturalElements(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 80);
    ctx.quadraticCurveTo(this.width / 2, this.height - 120, this.width, this.height - 80);
    ctx.stroke();
    ctx.restore();
  }

  loadBackgroundImage() {
    if (typeof wx !== 'undefined' && wx.createImage) {
      const img = wx.createImage();
      img.onload = () => {
        this.backgroundImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load background image:', err);
      };
      img.src = 'images/ui/bg2.jpg';
    } else if (typeof window !== 'undefined' && window.Image) {
      const img = new Image();
      img.onload = () => {
        this.backgroundImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load background image:', err);
      };
      img.src = 'images/ui/bg2.jpg';
    }
  }

  handleTouchStart(e) {
    let x, y;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].x || e.touches[0].clientX || e.touches[0].pageX || 0;
      y = e.touches[0].y || e.touches[0].clientY || e.touches[0].pageY || 0;
    } else if (e.changedTouches && e.changedTouches[0]) {
      x = e.changedTouches[0].x || e.changedTouches[0].clientX || e.changedTouches[0].pageX || 0;
      y = e.changedTouches[0].y || e.changedTouches[0].clientY || e.changedTouches[0].pageY || 0;
    } else {
      return;
    }

    if (x >= 40 && x <= 140 && y >= this.height - 60 && y <= this.height - 20) {
      if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.showPage) {
        GameGlobal.app.showPage('home');
      }
      return;
    }

    if (x >= this.width - 140 && x <= this.width - 40 && y >= this.height - 60 && y <= this.height - 20) {
      this.reset();
      return;
    }

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

    if (this.gameStatus === 'gameOver') {
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 60 && y <= this.height / 2 + 110) {
        this.reset();
      }
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 120 && y <= this.height / 2 + 170) {
        if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('home');
        }
      }
    }
  }

  handleTouchMove(e) {
    let x, y;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].x || e.touches[0].clientX || e.touches[0].pageX || 0;
      y = e.touches[0].y || e.touches[0].clientY || e.touches[0].pageY || 0;
    } else if (e.changedTouches && e.changedTouches[0]) {
      x = e.changedTouches[0].x || e.changedTouches[0].clientX || e.changedTouches[0].pageX || 0;
      y = e.changedTouches[0].y || e.changedTouches[0].clientY || e.changedTouches[0].pageY || 0;
    } else {
      return;
    }
    this.touchEnd = { x, y };
  }

  handleTouchEnd(e) {
    if (this.touchStart) {
      try {
        const size = this.board.length;
        const startX = this.touchStart.x;
        const startY = this.touchStart.y;

        let endX, endY;
        if (e.changedTouches && e.changedTouches[0]) {
          const touch = e.changedTouches[0];
          endX = touch.x || touch.clientX || touch.pageX || 0;
          endY = touch.y || touch.clientY || touch.pageY || 0;
        } else {
          if (this.touchEnd) {
            endX = this.touchEnd.x;
            endY = this.touchEnd.y;
          } else {
            return;
          }
        }

        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        let endRow = this.touchStart.row;
        let endCol = this.touchStart.col;
        
        const swipeThreshold = 20;
        
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
  }

  reset() {
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = 60;
    this.selectedCell = null;
    this.gameStatus = 'playing';
    this.lastUpdateTime = Date.now();
    
    for (const anim of this.animations) {
      animationPool.recycle(anim);
    }
    this.animations = [];
    this.isAnimating = false;
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
    
    for (const anim of this.animations) {
      animationPool.recycle(anim);
    }
    
    this.board = [];
    this.animations = [];
    this.isAnimating = false;
    this.touchStart = null;
    this.touchEnd = null;
    this.selectedCell = null;
  }
}

module.exports = Match3Game;