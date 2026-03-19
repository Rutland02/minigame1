// 棋子基类
class GamePiece {
  constructor(type, color) {
    this.type = type; // 棋子类型
    this.color = color; // 棋子颜色
    this.special = false; // 是否为特殊棋子
    this.specialType = null; // 特殊棋子类型
    this.row = -1; // 棋子所在行
    this.col = -1; // 棋子所在列
  }
  
  // 重置棋子属性
  reset(type, color) {
    this.type = type;
    this.color = color;
    this.special = false;
    this.specialType = null;
    return this;
  }
}

// 特殊棋子类
class SpecialPiece extends GamePiece {
  constructor(type, color, specialType) {
    super(type, color);
    this.special = true;
    this.specialType = specialType; // 特殊类型：'bomb'（炸弹）, 'rocket'（火箭）, 'rainbow'（彩虹球）
  }
  
  // 重置特殊棋子属性
  reset(type, color, specialType) {
    super.reset(type, color);
    this.special = true;
    this.specialType = specialType;
    return this;
  }
}

// 对象池类
class ObjectPool {
  constructor() {
    this.pool = [];
  }
  
  // 获取对象
  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null;
  }
  
  // 回收对象
  recycle(obj) {
    this.pool.push(obj);
  }
}

// 动画对象池
const animationPool = new ObjectPool();

// 棋子对象池
const piecePool = new ObjectPool();

// 颜色类型
const ColorType = {
    YELLOW: 0,
    PURPLE: 1,
    RED: 2,
    BLUE: 3,
    GREEN: 4,
    PINK: 5,
    ANY: 6,
    COUNT: 7
};

// 棋子类型
const PieceType = {
    EMPTY: 0,
    NORMAL: 1,
    BUBBLE: 2,
    ROW_CLEAR: 3,
    COLUMN_CLEAR: 4,
    RAINBOW: 5,
    COUNT: 6
};

// 颜色对应 - 基于海澄村三色资源
const COLORS = [
    '#FF5722', // 非遗（橙色）
    '#4CAF50', // 自然（绿色）
    '#F44336', // 红色（红色）
    '#2196F3', // 主按钮（蓝色）
    '#FF9800', // 警告按钮（橙色）
    '#9C27B0', // 提示按钮（紫色）
    '#FFFFFF'  // Any (白色)
];

// 动画类型
const AnimationType = {
    SWAP: 'swap',
    ELIMINATION: 'elimination',
    DROP: 'drop',
    POP: 'pop',
    SPECIAL: 'special'
};

// Match3游戏核心类
class Match3Game {
  constructor() {
    // 兼容不同环境的系统信息获取
    try {
      if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
        const systemInfo = wx.getSystemInfoSync();
        this.width = systemInfo.windowWidth || 375;
        this.height = systemInfo.windowHeight || 667;
      } else if (typeof window !== 'undefined') {
        this.width = window.innerWidth || 375;
        this.height = window.innerHeight || 667;
      } else {
        this.width = 375;
        this.height = 667;
      }
    } catch (error) {
      console.error('Get system info error:', error);
      this.width = 375;
      this.height = 667;
    }
    
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = 60;
    this.board = [];
    this.selectedCell = null;
    this.gameStatus = 'playing'; // playing, paused, gameOver
    this.lastUpdateTime = Date.now();
    this.animations = [];
    this.isAnimating = false;
    this.touchStart = null;
    this.touchEnd = null;
    this.cellSize = 0;
    this.startX = 0;
    this.startY = 0;
    
    try {
      this.initBoard();
      this.calculateLayout();
    } catch (error) {
      console.error('Initialize game error:', error);
    }
  }
  
  // 计算布局
  calculateLayout() {
    const size = this.board.length;
    this.cellSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
    this.startX = (this.width - this.cellSize * size) / 2;
    this.startY = 120;
  }

  // 初始化游戏棋盘
  initBoard() {
    const size = 8; // 8x8游戏板
    
    // 回收旧棋子到对象池
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece) {
          piecePool.recycle(piece);
        }
      }
    }
    
    // 创建新游戏板，确保不会出现三个及以上连在一起的情况
    this.board = [];
    for (let i = 0; i < size; i++) {
      const row = [];
      this.board.push(row);
      
      for (let j = 0; j < size; j++) {
        let piece;
        let validPiece = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        // 尝试生成有效的棋子，确保不会形成三个或以上的连续匹配
        while (!validPiece && attempts < maxAttempts) {
          piece = this.getRandomPiece();
          piece.row = i;
          piece.col = j;
          
          // 临时放置棋子
          row.push(piece);
          
          // 检查是否会形成三个或以上的连续匹配
          try {
            const matches = this.findMatches();
            validPiece = matches.length === 0;
          } catch (error) {
            console.error('Find matches error:', error);
            validPiece = true; // 出错时默认使用当前棋子
          }
          
          // 如果无效，移除临时棋子
          if (!validPiece) {
            row.pop();
          }
          
          attempts++;
        }
        
        // 如果尝试次数过多，仍然使用当前棋子（防止无限循环）
        if (!validPiece) {
          piece.row = i;
          piece.col = j;
          row.push(piece);
        }
      }
    }
    
    // 最后再次检查，确保没有可消除的组合
    let attempts = 0;
    const maxAttempts = 10;
    while (this.findMatches().length > 0 && attempts < maxAttempts) {
      // 只修改有问题的位置，而不是整个游戏板
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
        break; // 出错时停止尝试
      }
      attempts++;
    }
    
    // 重新计算布局
    this.calculateLayout();
  }

  // 获取随机棋子
  getRandomPiece() {
    const colorIndex = Math.floor(Math.random() * (ColorType.COUNT - 1));
    const color = COLORS[colorIndex];
    const type = 'normal';
    
    // 从对象池获取棋子
    let piece = piecePool.get();
    if (piece) {
      return piece.reset(type, color);
    } else {
      return new GamePiece(type, color);
    }
  }

  // 寻找匹配
  findMatches() {
    const matches = [];
    const size = this.board.length;
    const visited = Array(size).fill().map(() => Array(size).fill(false));

    // 检查横向匹配
    for (let i = 0; i < size; i++) {
      let currentPiece = this.board[i][0];
      if (!currentPiece) {
        continue;
      }
      let start = 0;
      for (let j = 1; j < size; j++) {
        const piece = this.board[i][j];
        if (piece && piece.color === currentPiece.color) {
          // 继续计数
        } else {
          // 检查是否有3个或更多相同类型
          if (j - start >= 3) {
            matches.push({ type: 'horizontal', row: i, start: start, end: j - 1 });
            // 标记已访问
            for (let k = start; k < j; k++) {
              visited[i][k] = true;
            }
          }
          // 重置当前棋子和起始位置
          currentPiece = piece;
          start = j;
        }
      }
      // 检查行尾是否有3个或更多相同类型
      if (currentPiece && size - start >= 3) {
        matches.push({ type: 'horizontal', row: i, start: start, end: size - 1 });
        // 标记已访问
        for (let k = start; k < size; k++) {
          visited[i][k] = true;
        }
      }
    }

    // 检查纵向匹配
    for (let j = 0; j < size; j++) {
      let currentPiece = this.board[0][j];
      if (!currentPiece) {
        continue;
      }
      let start = 0;
      for (let i = 1; i < size; i++) {
        const piece = this.board[i][j];
        if (piece && piece.color === currentPiece.color) {
          // 继续计数
        } else {
          // 检查是否有3个或更多相同类型
          if (i - start >= 3) {
            matches.push({ type: 'vertical', col: j, start: start, end: i - 1 });
            // 标记已访问
            for (let k = start; k < i; k++) {
              visited[k][j] = true;
            }
          }
          // 重置当前棋子和起始位置
          currentPiece = piece;
          start = i;
        }
      }
      // 检查列尾是否有3个或更多相同类型
      if (currentPiece && size - start >= 3) {
        matches.push({ type: 'vertical', col: j, start: start, end: size - 1 });
        // 标记已访问
        for (let k = start; k < size; k++) {
          visited[k][j] = true;
        }
      }
    }

    // 检查特殊棋子的匹配
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const piece = this.board[i][j];
        if (piece && piece.special && !visited[i][j]) {
          // 处理特殊棋子的匹配
          this.handleSpecialPiece(i, j, matches, visited);
        }
      }
    }

    return matches;
  }

  // 处理特殊棋子
  handleSpecialPiece(row, col, matches, visited) {
    const piece = this.board[row][col];
    const size = this.board.length;

    switch (piece.specialType) {
      case 'row_clear':
        // 消除整行
        for (let j = 0; j < size; j++) {
          if (!visited[row][j] && this.board[row][j]) {
            visited[row][j] = true;
            matches.push({ type: 'special', row: row, col: j, specialType: 'row_clear' });
          }
        }
        break;
      case 'column_clear':
        // 消除整列
        for (let i = 0; i < size; i++) {
          if (!visited[i][col] && this.board[i][col]) {
            visited[i][col] = true;
            matches.push({ type: 'special', row: i, col: col, specialType: 'column_clear' });
          }
        }
        break;
      case 'rainbow':
        // 彩虹球：消除所有相同颜色的棋子
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

  // 移除匹配的棋子
  removeMatches(matches) {
    let removedCount = 0;
    const size = this.board.length;
    const removed = Array(size).fill().map(() => Array(size).fill(false));
    
    matches.forEach(match => {
      if (match.type === 'horizontal') {
        for (let j = match.start; j <= match.end; j++) {
          if (!removed[match.row][j] && this.board[match.row][j]) {
            // 只有在匹配长度为3时才消除，长度为4或更多时创建特殊棋子
            if (match.end - match.start === 2) {
              // 3个相同棋子，直接消除
              this.board[match.row][j] = null;
            } else if (match.end - match.start === 3) {
              // 4个相同棋子，创建特殊棋子
              if (j === match.start) {
                // 只在起始位置创建一个特殊棋子
                const specialType = 'row_clear';
                this.board[match.row][j] = new SpecialPiece(this.board[match.row][j].type, this.board[match.row][j].color, specialType);
              } else {
                // 其他位置设置为null
                this.board[match.row][j] = null;
              }
            } else if (match.end - match.start >= 4) {
              // 5个或更多相同棋子，创建彩虹球
              if (j === match.start) {
                // 只在起始位置创建一个彩虹球
                this.board[match.row][j] = new SpecialPiece(this.board[match.row][j].type, this.board[match.row][j].color, 'rainbow');
              } else {
                // 其他位置设置为null
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
            // 只有在匹配长度为3时才消除，长度为4或更多时创建特殊棋子
            if (match.end - match.start === 2) {
              // 3个相同棋子，直接消除
              this.board[i][match.col] = null;
            } else if (match.end - match.start === 3) {
              // 4个相同棋子，创建特殊棋子
              if (i === match.start) {
                // 只在起始位置创建一个特殊棋子
                const specialType = 'column_clear';
                this.board[i][match.col] = new SpecialPiece(this.board[i][match.col].type, this.board[i][match.col].color, specialType);
              } else {
                // 其他位置设置为null
                this.board[i][match.col] = null;
              }
            } else if (match.end - match.start >= 4) {
              // 5个或更多相同棋子，创建彩虹球
              if (i === match.start) {
                // 只在起始位置创建一个彩虹球
                this.board[i][match.col] = new SpecialPiece(this.board[i][match.col].type, this.board[i][match.col].color, 'rainbow');
              } else {
                // 其他位置设置为null
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

  // 棋子下落
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
          // 创建棋子状态的副本，避免对象池重用导致的动画异常
          const pieceCopy = {
            type: piece.type,
            color: piece.color,
            special: piece.special,
            specialType: piece.specialType
          };
          // 记录下落的方块信息
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
      // 填充新的方块到顶部
      for (let i = 0; i < emptySpaces; i++) {
        const newPiece = this.getRandomPiece();
        // 创建棋子状态的副本，避免对象池重用导致的动画异常
        const pieceCopy = {
          type: newPiece.type,
          color: newPiece.color,
          special: newPiece.special,
          specialType: newPiece.specialType
        };
        this.board[i][j] = newPiece;
        // 记录新方块的下落动画
        dropAnimations.push({
          row: -1, // 从顶部外落下
          col: j,
          targetRow: i,
          targetCol: j,
          piece: pieceCopy
        });
        hasDropped = true;
      }
    }
    
    // 添加下落动画
    dropAnimations.forEach(anim => {
      this.addAnimation('drop', anim, 0.5);
    });
    
    // 即使没有棋子下落，也要确保动画序列能够继续
    return hasDropped;
  }

  // 处理单元格点击
  handleCellClick(row, col) {
    if (this.gameStatus !== 'playing' || this.isAnimating) return;

    // 边界检查
    const size = this.board.length;
    if (row < 0 || row >= size || col < 0 || col >= size) return;

    if (!this.selectedCell) {
      // 第一次点击
      this.selectedCell = { row, col };
      // 添加选中动画
      this.addAnimation('pop', { row, col }, 0.2);
    } else {
      // 第二次点击，检查是否相邻
      const rowDiff = Math.abs(row - this.selectedCell.row);
      const colDiff = Math.abs(col - this.selectedCell.col);
      
      if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
        // 交换方块
        this.handleCellSwap(this.selectedCell.row, this.selectedCell.col, row, col);
      }
      // 重置选择
      this.selectedCell = null;
    }
  }

  // 处理单元格交换
  handleCellSwap(row1, col1, row2, col2) {
    if (this.gameStatus !== 'playing' || this.isAnimating) return;

    // 边界检查
    const size = this.board.length;
    if (row1 < 0 || row1 >= size || col1 < 0 || col1 >= size || row2 < 0 || row2 >= size || col2 < 0 || col2 >= size) return;

    // 检查棋子是否存在
    const piece1 = this.board[row1][col1];
    const piece2 = this.board[row2][col2];
    if (!piece1 || !piece2) return;

    // 添加交换动画
    this.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);

    // 等待交换动画完成后再执行后续操作
    this.waitForAnimations(() => {
      // 交换方块
      this.board[row1][col1] = piece2;
      this.board[row2][col2] = piece1;

      // 检查是否有匹配
      const matches = this.findMatches();
      if (matches.length > 0) {
        // 保存匹配棋子的颜色信息
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
        
        // 有匹配，计算分数
        const removedCount = this.removeMatches(matches);
        this.score += removedCount * 10;
        this.moves++;

        // 添加消除动画
        matchColors.forEach(matchColor => {
          if (matchColor.type === 'horizontal' || matchColor.type === 'vertical') {
            this.addAnimation('elimination', { row: matchColor.row, col: matchColor.col, color: matchColor.color }, 0.6);
          } else if (matchColor.type === 'special') {
            this.addAnimation('special', { row: matchColor.row, col: matchColor.col, specialType: matchColor.specialType, color: matchColor.color }, 0.8);
          }
        });

        // 等待消除动画完成后再执行下落
        this.waitForAnimations(() => {
          // 下落并填充新方块
          const hasDropped = this.dropPieces();
          
          // 等待下落动画完成后检查新的匹配
          const checkNewMatchesCallback = () => {
            this.checkNewMatches();
          };
          
          if (hasDropped) {
            this.waitForAnimations(checkNewMatchesCallback);
          } else {
            // 没有棋子下落，直接检查新的匹配
            checkNewMatchesCallback();
          }
        });

        // 检查是否完成关卡
        if (this.score >= this.getLevelTarget()) {
          this.levelUp();
        }
      } else {
        // 没有匹配，添加交换回来的动画
        this.addAnimation('swap', { row1, col1, row2, col2, piece1, piece2 }, 0.3);
        // 等待交换回来动画完成后再交换回来
        this.waitForAnimations(() => {
          // 交换回来
          this.board[row1][col1] = piece1;
          this.board[row2][col2] = piece2;
        });
      }
    });
  }

  // 获取关卡目标分数
  getLevelTarget() {
    return this.level * 100;
  }

  // 升级
  levelUp() {
    this.level++;
    this.time += 10;
    this.lastUpdateTime = Date.now();
    // 添加升级动画
    this.addAnimation('special', { row: 3, col: 3, specialType: 'level_up', color: '#FFD700' }, 1.0);
  }

  // 检查新的匹配
  checkNewMatches() {
    // 检查是否有新的匹配
    let newMatches = this.findMatches();
    if (newMatches.length > 0) {
      // 保存匹配棋子的颜色信息
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
      this.score += newRemovedCount * 15; // 连击加分
      
      // 添加消除动画
      matchColors.forEach(matchColor => {
        if (matchColor.type === 'horizontal' || matchColor.type === 'vertical') {
          this.addAnimation('elimination', { row: matchColor.row, col: matchColor.col, color: matchColor.color }, 0.6);
        } else if (matchColor.type === 'special') {
          this.addAnimation('special', { row: matchColor.row, col: matchColor.col, specialType: matchColor.specialType, color: matchColor.color }, 0.8);
        }
      });
      
      // 等待消除动画完成后再执行下落
      this.waitForAnimations(() => {
        const hasDropped = this.dropPieces();
        
        // 等待下落动画完成后检查新的匹配
        const checkAfterDropCallback = () => {
          const afterDropMatches = this.findMatches();
          // 只有当有新的匹配时才继续检查
          if (afterDropMatches.length > 0) {
            this.checkNewMatches();
          }
        };
        
        if (hasDropped) {
          this.waitForAnimations(checkAfterDropCallback);
        } else {
          // 没有棋子下落，直接检查新的匹配
          checkAfterDropCallback();
        }
      });
    }
  }

  // 更新游戏状态
  update() {
    if (this.gameStatus === 'playing') {
      const now = Date.now();
      const deltaTime = (now - this.lastUpdateTime) / 1000;
      this.lastUpdateTime = now;
      
      // 限制deltaTime，防止时间跳变导致的动画异常
      const clampedDeltaTime = Math.min(deltaTime, 0.1);
      
      // 更新动画
      this.updateAnimations(clampedDeltaTime);
      
      this.time -= clampedDeltaTime;
      if (this.time <= 0) {
        this.time = 0;
        this.gameStatus = 'gameOver';
      }
    }
  }

  // 更新动画
  updateAnimations(deltaTime) {
    if (this.isAnimating) {
      let allDone = true;
      const completedAnims = [];
      
      for (let i = 0; i < this.animations.length; i++) {
        const anim = this.animations[i];
        // 使用缓动函数使动画更流畅
        anim.progress += deltaTime / anim.duration;
        if (anim.progress < 1) {
          allDone = false;
        } else {
          anim.progress = 1;
          completedAnims.push(anim);
        }
      }
      
      if (allDone) {
        // 回收动画对象到对象池
        for (const anim of this.animations) {
          animationPool.recycle(anim);
        }
        this.animations = [];
        this.isAnimating = false;
      } else if (completedAnims.length > 0) {
        // 移除并回收已完成的动画
        this.animations = this.animations.filter(anim => !completedAnims.includes(anim));
        for (const anim of completedAnims) {
          animationPool.recycle(anim);
        }
      }
    }
  }

  // 添加动画
  addAnimation(type, data, duration = 0.3) {
    // 从对象池获取动画对象
    let anim = animationPool.get();
    if (!anim) {
      anim = {
        type: '',
        data: null,
        progress: 0,
        duration: 0
      };
    }
    
    // 重置动画属性
    anim.type = type;
    anim.data = data;
    anim.progress = 0;
    anim.duration = duration;
    
    this.animations.push(anim);
    this.isAnimating = true;
  }

  // 缓动函数
  easeOutQuad(t) {
    return t * (2 - t);
  }

  // 缓动函数 - 弹性
  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  // 缓动函数 - 弹跳
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

  // 等待所有动画完成后执行回调
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

  // 渲染游戏
  render(ctx) {
    try {
      // 绘制背景
      ctx.fillStyle = '#F5F5F5'; // 浅灰色背景
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制游戏信息
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333333'; // 深灰色文字
      ctx.fillText(`得分: ${this.score}`, 20, 40);
      ctx.fillText(`等级: ${this.level}`, 20, 65);
      ctx.fillText(`时间: ${Math.ceil(this.time)}s`, 20, 90);

      // 绘制游戏板
      const size = this.board.length;
      const cellSize = this.cellSize;
      const startX = this.startX;
      const startY = this.startY;

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const x = startX + j * cellSize;
          const y = startY + i * cellSize;

          // 绘制单元格背景
          ctx.fillStyle = '#E0E0E0'; // 浅灰色背景
          ctx.fillRect(x, y, cellSize, cellSize);
          ctx.strokeStyle = '#CCCCCC';
          ctx.strokeRect(x, y, cellSize, cellSize);

          // 检查是否有动画涉及当前位置
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

          // 绘制方块（如果不在动画中）
          if (this.board[i][j] && !isInAnimation) {
            const piece = this.board[i][j];
            ctx.fillStyle = piece.color;
            
            // 绘制特殊棋子
            if (piece.special) {
              // 绘制特殊棋子的特殊效果
              switch (piece.specialType) {
                case 'row_clear':
                  // 绘制行消除棋子
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
                  // 绘制行消除图案
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(x + cellSize / 4, y + cellSize / 2 - 5, cellSize / 2, 10);
                  break;
                case 'column_clear':
                  // 绘制列消除棋子
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
                  // 绘制列消除图案
                  ctx.fillStyle = '#fff';
                  ctx.fillRect(x + cellSize / 2 - 5, y + cellSize / 4, 10, cellSize / 2);
                  break;
                case 'rainbow':
                  // 绘制彩虹球
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
                  // 绘制普通棋子
                  ctx.beginPath();
                  ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                  ctx.fill();
              }
            } else {
              // 绘制普通棋子
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // 绘制动画
          this.animations.forEach(anim => {
            if (anim.type === 'elimination' && anim.data.row === i && anim.data.col === j) {
              const easedProgress = this.easeOutQuad(anim.progress);
              const scale = 1 + easedProgress * 1.5;
              const opacity = 1 - easedProgress;
              ctx.globalAlpha = opacity;
              ctx.fillStyle = anim.data.color || '#ffffff';
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
              ctx.fill();
              // 绘制粒子效果
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
              // 绘制交换动画
              const { row1, col1, row2, col2, piece1, piece2 } = anim.data;
              const easedProgress = this.easeOutBounce(anim.progress);
              
              // 绘制第一个方块的动画
              if (row1 === i && col1 === j && piece1) {
                const targetX = startX + col2 * cellSize + cellSize / 2;
                const targetY = startY + row2 * cellSize + cellSize / 2;
                const currentX = startX + col1 * cellSize + cellSize / 2 + (targetX - (startX + col1 * cellSize + cellSize / 2)) * easedProgress;
                const currentY = startY + row1 * cellSize + cellSize / 2 + (targetY - (startY + row1 * cellSize + cellSize / 2)) * easedProgress;
                
                ctx.fillStyle = piece1.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
                
                if (piece1.special) {
                  // 绘制特殊棋子符号
                  ctx.fillStyle = '#fff';
                  if (piece1.specialType === 'row_clear') {
                    ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
                  } else if (piece1.specialType === 'column_clear') {
                    ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
                  }
                }
              }
              
              // 绘制第二个方块的动画
              if (row2 === i && col2 === j && piece2) {
                const targetX = startX + col1 * cellSize + cellSize / 2;
                const targetY = startY + row1 * cellSize + cellSize / 2;
                const currentX = startX + col2 * cellSize + cellSize / 2 + (targetX - (startX + col2 * cellSize + cellSize / 2)) * easedProgress;
                const currentY = startY + row2 * cellSize + cellSize / 2 + (targetY - (startY + row2 * cellSize + cellSize / 2)) * easedProgress;
                
                ctx.fillStyle = piece2.color;
                ctx.beginPath();
                ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
                
                if (piece2.special) {
                  // 绘制特殊棋子符号
                  ctx.fillStyle = '#fff';
                  if (piece2.specialType === 'row_clear') {
                    ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
                  } else if (piece2.specialType === 'column_clear') {
                    ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
                  }
                }
              }
            } else if (anim.type === 'drop') {
              // 绘制下落动画
              const { row, col, targetRow, targetCol, piece } = anim.data;
              const easedProgress = this.easeOutBounce(anim.progress);
              
              // 计算当前位置
              let startYPos;
              if (row === -1) {
                // 新方块从顶部外落下
                startYPos = startY - cellSize;
              } else {
                // 现有方块下落
                startYPos = startY + row * cellSize + cellSize / 2;
              }
              const targetYPos = startY + targetRow * cellSize + cellSize / 2;
              const currentY = startYPos + (targetYPos - startYPos) * easedProgress;
              const currentX = startX + col * cellSize + cellSize / 2;
              
              // 绘制下落的方块
              ctx.fillStyle = piece.color;
              ctx.beginPath();
              ctx.arc(currentX, currentY, cellSize / 3, 0, Math.PI * 2);
              ctx.fill();
              
              if (piece.special) {
                // 绘制特殊棋子符号
                ctx.fillStyle = '#fff';
                if (piece.specialType === 'row_clear') {
                  ctx.fillRect(currentX - cellSize / 4, currentY - 5, cellSize / 2, 10);
                } else if (piece.specialType === 'column_clear') {
                  ctx.fillRect(currentX - 5, currentY - cellSize / 4, 10, cellSize / 2);
                }
              }
            } else if (anim.type === 'pop' && anim.data.row === i && anim.data.col === j) {
              // 绘制选中动画
              const easedProgress = this.easeOutElastic(anim.progress);
              const scale = 1 + easedProgress * 0.3;
              if (this.board[i][j]) {
                ctx.fillStyle = this.board[i][j].color;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
                ctx.fill();
              }
            } else if (anim.type === 'special' && anim.data.row === i && anim.data.col === j) {
              // 绘制特殊动画
              const easedProgress = this.easeOutQuad(anim.progress);
              const scale = 1 + easedProgress * 2;
              const opacity = 1 - easedProgress;
              ctx.globalAlpha = opacity;
              
              if (anim.data.specialType === 'level_up') {
                // 绘制升级动画
                const gradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.5, '#FFA500');
                gradient.addColorStop(1, '#FFD700');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
                // 绘制文字
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('LEVEL UP!', x + cellSize / 2, y + cellSize / 2 + 8);
              } else {
                // 绘制特殊棋子爆炸动画
                ctx.fillStyle = anim.data.color || '#ffffff';
                ctx.beginPath();
                ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * scale, 0, Math.PI * 2);
                ctx.fill();
                // 绘制冲击波
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

          // 绘制选中状态
          // if (this.selectedCell && this.selectedCell.row === i && this.selectedCell.col === j) {
          //   ctx.strokeStyle = '#2196F3';
          //   ctx.lineWidth = 3;
          //   ctx.strokeRect(x, y, cellSize, cellSize);
          // }
        }
      }

      // 绘制底部按钮
      // 返回按钮 - 次要按钮
      ctx.fillStyle = '#9E9E9E'; // 灰色
      ctx.fillRect(40, this.height - 60, 100, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回', 90, this.height - 35);

      // 重新开始按钮 - 成功按钮
      ctx.fillStyle = '#4CAF50'; // 绿色
      ctx.fillRect(this.width - 140, this.height - 60, 100, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', this.width - 90, this.height - 35);

      // 绘制游戏结束状态
      if (this.gameStatus === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 40);
        ctx.font = '18px Arial';
        ctx.fillText(`最终得分: ${this.score}`, this.width / 2, this.height / 2);
        ctx.fillText(`等级: ${this.level}`, this.width / 2, this.height / 2 + 30);

        // 绘制重新开始按钮 - 成功按钮
        ctx.fillStyle = '#4CAF50'; // 绿色
        ctx.fillRect(this.width / 2 - 100, this.height / 2 + 60, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('重新开始', this.width / 2, this.height / 2 + 90);

        // 绘制返回按钮 - 次要按钮
        ctx.fillStyle = '#9E9E9E'; // 灰色
        ctx.fillRect(this.width / 2 - 100, this.height / 2 + 120, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('返回首页', this.width / 2, this.height / 2 + 150);
      }
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  // 处理触摸开始
  handleTouchStart(e) {
    // 直接使用标准的触摸事件属性
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

    // 检查是否点击了底部按钮
    // 返回按钮
    if (x >= 40 && x <= 140 && y >= this.height - 60 && y <= this.height - 20) {
      if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.showPage) {
        GameGlobal.app.showPage('home');
      }
      return;
    }

    // 重新开始按钮
    if (x >= this.width - 140 && x <= this.width - 40 && y >= this.height - 60 && y <= this.height - 20) {
      this.reset();
      return;
    }

    // 检查是否点击了游戏板
    const size = this.board.length;
    const cellSize = this.cellSize;
    const startX = this.startX;
    const startY = this.startY;

    if (x >= startX && x <= startX + cellSize * size && y >= startY && y <= startY + cellSize * size) {
      const col = Math.floor((x - startX) / cellSize);
      const row = Math.floor((y - startY) / cellSize);
      this.touchStart = { row, col, x, y };
      // 添加触摸开始动画
      this.handleCellClick(row, col);
    }

    // 检查游戏结束时的按钮
    if (this.gameStatus === 'gameOver') {
      // 重新开始按钮
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 60 && y <= this.height / 2 + 110) {
        this.reset();
      }
      // 返回首页按钮
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 120 && y <= this.height / 2 + 170) {
        if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('home');
        }
      }
    }
  }

  // 处理触摸移动
  handleTouchMove(e) {
    // 直接使用标准的触摸事件属性
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

  // 处理触摸结束
  handleTouchEnd(e) {
    if (this.touchStart) {
      try {
        const size = this.board.length;
        const startX = this.touchStart.x;
        const startY = this.touchStart.y;

        // 在touchend事件中，使用changedTouches获取触摸结束的位置
        let endX, endY;
        if (e.changedTouches && e.changedTouches[0]) {
          const touch = e.changedTouches[0];
          endX = touch.x || touch.clientX || touch.pageX || 0;
          endY = touch.y || touch.clientY || touch.pageY || 0;
        } else {
          // 如果没有changedTouches，使用touchEnd
          if (this.touchEnd) {
            endX = this.touchEnd.x;
            endY = this.touchEnd.y;
          } else {
            return;
          }
        }

        // 计算滑动方向
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);
        
        // 确定主要滑动方向（只需要大概的方向，不需要精确位置）
        let endRow = this.touchStart.row;
        let endCol = this.touchStart.col;
        
        // 设置滑动阈值，只要滑动超过一定距离就判断方向
        const swipeThreshold = 20; // 滑动阈值，单位像素
        
        if (absDeltaX > swipeThreshold || absDeltaY > swipeThreshold) {
          if (absDeltaX > absDeltaY) {
            // 水平方向滑动
            endCol += deltaX > 0 ? 1 : -1;
          } else {
            // 垂直方向滑动
            endRow += deltaY > 0 ? 1 : -1;
          }
        }

        // 边界检查
        if (endCol < 0 || endCol >= size || endRow < 0 || endRow >= size) {
          this.touchStart = null;
          this.touchEnd = null;
          return;
        }

        // 检查是否是相邻的方块（现在基于方向判断，不需要精确位置）
        const rowDiff = endRow - this.touchStart.row;
        const colDiff = endCol - this.touchStart.col;
        
        if ((Math.abs(rowDiff) === 1 && colDiff === 0) || (rowDiff === 0 && Math.abs(colDiff) === 1)) {
          this.handleCellSwap(this.touchStart.row, this.touchStart.col, endRow, endCol);
        } else if (endRow === this.touchStart.row && endCol === this.touchStart.col) {
          // 点击同一个方块，取消选择
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

  // 重置游戏
  reset() {
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.time = 60;
    this.selectedCell = null;
    this.gameStatus = 'playing';
    this.lastUpdateTime = Date.now();
    
    // 清理动画
    for (const anim of this.animations) {
      animationPool.recycle(anim);
    }
    this.animations = [];
    this.isAnimating = false;
    this.touchStart = null;
    this.touchEnd = null;
    
    this.initBoard();
  }

  // 销毁游戏
  destroy() {
    // 清理资源
    // 回收棋子到对象池
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board[i].length; j++) {
        const piece = this.board[i][j];
        if (piece) {
          piecePool.recycle(piece);
        }
      }
    }
    
    // 清理动画
    for (const anim of this.animations) {
      animationPool.recycle(anim);
    }
    
    // 重置状态
    this.board = [];
    this.animations = [];
    this.isAnimating = false;
    this.touchStart = null;
    this.touchEnd = null;
    this.selectedCell = null;
  }
}

module.exports = Match3Game;