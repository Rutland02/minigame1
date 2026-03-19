// 三色拼图游戏逻辑
class PuzzleGame {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.level = 1; // 1: 9块, 2: 16块, 3: 25块
    this.pieces = [];
    this.gameStatus = 'playing'; // playing, completed
    this.startTime = Date.now();
    this.endTime = null;
    this.initPuzzle();
  }

  initPuzzle() {
    const size = this.getPuzzleSize();
    const pieceCount = size * size;
    this.pieces = [];
    
    // 创建拼图块
    for (let i = 0; i < pieceCount; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      this.pieces.push({
        id: i,
        correctRow: row,
        correctCol: col,
        currentRow: row,
        currentCol: col,
        isEmpty: i === pieceCount - 1 // 最后一块为空
      });
    }
    
    // 打乱拼图
    this.shufflePuzzle();
    this.startTime = Date.now();
    this.endTime = null;
    this.gameStatus = 'playing';
  }

  getPuzzleSize() {
    switch (this.level) {
      case 1:
        return 3; // 9块
      case 2:
        return 4; // 16块
      case 3:
        return 5; // 25块
      default:
        return 3;
    }
  }

  shufflePuzzle() {
    const size = this.getPuzzleSize();
    const pieceCount = size * size;
    
    // 打乱拼图，确保可解
    let moves = 1000;
    let attempts = 0;
    const maxAttempts = 10000;
    
    while (moves > 0 && attempts < maxAttempts) {
      attempts++;
      // 随机选择一个方块
      const pieceIndex = Math.floor(Math.random() * this.pieces.length);
      const piece = this.pieces[pieceIndex];
      
      if (piece.isEmpty) continue;
      
      // 随机选择一个方向
      const directions = ['up', 'down', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      // 尝试移动
      if (this.canMove(piece, direction)) {
        this.movePiece(piece, direction);
        moves--;
      }
    }
  }

  canMove(piece, direction) {
    if (piece.isEmpty) return false;
    
    let newRow = piece.currentRow;
    let newCol = piece.currentCol;
    
    switch (direction) {
      case 'up':
        newRow--;
        break;
      case 'down':
        newRow++;
        break;
      case 'left':
        newCol--;
        break;
      case 'right':
        newCol++;
        break;
      default:
        return false;
    }
    
    const size = this.getPuzzleSize();
    
    // 检查边界
    if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
      return false;
    }
    
    // 检查目标位置是否为空
    const targetPiece = this.pieces.find(p => p.currentRow === newRow && p.currentCol === newCol);
    return targetPiece && targetPiece.isEmpty;
  }

  movePiece(piece, direction) {
    if (!this.canMove(piece, direction)) return;
    
    let newRow = piece.currentRow;
    let newCol = piece.currentCol;
    
    switch (direction) {
      case 'up':
        newRow--;
        break;
      case 'down':
        newRow++;
        break;
      case 'left':
        newCol--;
        break;
      case 'right':
        newCol++;
        break;
    }
    
    // 找到空白块并交换位置
    const emptyPiece = this.pieces.find(p => p.currentRow === newRow && p.currentCol === newCol);
    if (emptyPiece) {
      [piece.currentRow, emptyPiece.currentRow] = [emptyPiece.currentRow, piece.currentRow];
      [piece.currentCol, emptyPiece.currentCol] = [emptyPiece.currentCol, piece.currentCol];
    }
  }

  handlePieceClick(x, y) {
    if (this.gameStatus !== 'playing') return;

    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 120;

    // 检查坐标是否有效
    if (x < startX || x > startX + pieceSize * size || y < startY || y > startY + pieceSize * size) {
      return;
    }

    const col = Math.floor((x - startX) / pieceSize);
    const row = Math.floor((y - startY) / pieceSize);

    // 检查行列是否有效
    if (row < 0 || row >= size || col < 0 || col >= size) {
      return;
    }

    // 找到点击的方块
    const piece = this.pieces.find(p => p.currentRow === row && p.currentCol === col);

    if (!piece || piece.isEmpty) return;

    // 尝试四个方向移动
    const directions = ['up', 'down', 'left', 'right'];
    let moved = false;
    for (const direction of directions) {
      if (this.canMove(piece, direction)) {
        this.movePiece(piece, direction);
        moved = true;
        break;
      }
    }

    // 检查是否完成
    if (moved && this.checkCompletion()) {
      this.gameStatus = 'completed';
      this.endTime = Date.now();
    }
  }

  checkCompletion() {
    return this.pieces.every(piece => 
      piece.currentRow === piece.correctRow && piece.currentCol === piece.correctCol
    );
  }

  changeLevel(level) {
    this.level = level;
    this.initPuzzle();
  }

  getElapsedTime() {
    if (this.endTime) {
      return Math.floor((this.endTime - this.startTime) / 1000);
    } else if (this.gameStatus === 'playing') {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }
    return 0;
  }

  handleTouchEnd(e) {
    // 不需要处理
  }

  showDifficultyDialog() {
    // 显示自定义的难度选择对话框
    this.gameStatus = 'showing_difficulty';
  }

  renderDifficultyDialog(ctx) {
    // 绘制难度选择对话框
    const dialogWidth = 300;
    const dialogHeight = 200;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    // 绘制对话框背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制对话框
    ctx.fillStyle = '#fff';
    ctx.fillRect(dialogX, dialogY, dialogWidth, dialogHeight);
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 2;
    ctx.strokeRect(dialogX, dialogY, dialogWidth, dialogHeight);

    // 绘制标题
    ctx.fillStyle = '#333333';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', this.width / 2, dialogY + 40);

    // 绘制简单模式按钮
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(dialogX + 20, dialogY + 80, dialogWidth - 40, 40);
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('简单 (3×3)', this.width / 2, dialogY + 105);

    // 绘制中等模式按钮
    ctx.fillStyle = '#2196F3'; // 主按钮（蓝色）
    ctx.fillRect(dialogX + 20, dialogY + 130, dialogWidth - 40, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('中等 (4×4)', this.width / 2, dialogY + 155);
  }

  handleDifficultyDialogClick(x, y) {
    const dialogWidth = 300;
    const dialogHeight = 200;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    // 检查是否点击了简单模式按钮
    if (x >= dialogX + 20 && x <= dialogX + dialogWidth - 20 && y >= dialogY + 80 && y <= dialogY + 120) {
      this.changeLevel(1); // 简单模式
      this.gameStatus = 'playing';
      return;
    }

    // 检查是否点击了中等模式按钮
    if (x >= dialogX + 20 && x <= dialogX + dialogWidth - 20 && y >= dialogY + 130 && y <= dialogY + 170) {
      this.changeLevel(2); // 中等模式
      this.gameStatus = 'playing';
      return;
    }

    // 点击对话框外部关闭
    if (x < dialogX || x > dialogX + dialogWidth || y < dialogY || y > dialogY + dialogHeight) {
      this.gameStatus = 'playing';
    }
  }

  render(ctx) {
    try {
      // 绘制背景
      ctx.fillStyle = '#F5F5F5'; // 浅灰色背景
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制游戏信息
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333333'; // 深灰色文字
      ctx.fillText(`难度: ${this.getPuzzleSize()}×${this.getPuzzleSize()}`, 20, 40);
      ctx.fillText(`时间: ${this.getElapsedTime()}s`, 20, 65);

      // 绘制拼图
      const size = this.getPuzzleSize();
      const pieceSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
      const startX = (this.width - pieceSize * size) / 2;
      const startY = 120;

      this.pieces.forEach(piece => {
        const x = startX + piece.currentCol * pieceSize;
        const y = startY + piece.currentRow * pieceSize;

        if (!piece.isEmpty) {
          // 绘制拼图块
          ctx.fillStyle = '#E0E0E0'; // 浅灰色背景
          ctx.fillRect(x, y, pieceSize, pieceSize);
          ctx.strokeStyle = '#CCCCCC';
          ctx.strokeRect(x, y, pieceSize, pieceSize);

          // 绘制拼图内容（这里用颜色和数字代替实际图片）
          const colorIndex = (piece.correctRow * size + piece.correctCol) % 3;
          // 缓存颜色值 - 基于海澄村三色资源
          const colors = ['#FF5722', '#4CAF50', '#F44336'];
          const color = colors[colorIndex];
          ctx.fillStyle = color;
          ctx.fillRect(x + 2, y + 2, pieceSize - 4, pieceSize - 4);
          ctx.fillStyle = '#fff';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${piece.correctRow},${piece.correctCol}`, x + pieceSize / 2, y + pieceSize / 2 + 5);
        }
      });

      // 绘制底部按钮
      // 返回按钮 - 次要按钮
      ctx.fillStyle = '#9E9E9E'; // 灰色
      ctx.fillRect(40, this.height - 60, 100, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回', 90, this.height - 35);

      // 难度设置按钮 - 主按钮
      ctx.fillStyle = '#2196F3'; // 蓝色
      ctx.fillRect(this.width / 2 - 75, this.height - 60, 150, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('难度设置', this.width / 2, this.height - 35);

      // 重新开始按钮 - 成功按钮
      ctx.fillStyle = '#4CAF50'; // 绿色
      ctx.fillRect(this.width - 140, this.height - 60, 100, 40);
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', this.width - 90, this.height - 35);

      // 绘制游戏完成状态
      if (this.gameStatus === 'completed') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('拼图完成！', this.width / 2, this.height / 2 - 40);
        ctx.font = '18px Arial';
        ctx.fillText(`用时: ${this.getElapsedTime()}秒`, this.width / 2, this.height / 2);

        // 绘制再玩一次按钮 - 成功按钮
        ctx.fillStyle = '#4CAF50'; // 绿色
        ctx.fillRect(this.width / 2 - 100, this.height / 2 + 60, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('再玩一次', this.width / 2, this.height / 2 + 90);

        // 绘制返回按钮 - 次要按钮
        ctx.fillStyle = '#9E9E9E'; // 灰色
        ctx.fillRect(this.width / 2 - 100, this.height / 2 + 120, 200, 50);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返回首页', this.width / 2, this.height / 2 + 150);
      }

      // 绘制难度选择对话框
      if (this.gameStatus === 'showing_difficulty') {
        this.renderDifficultyDialog(ctx);
      }
    } catch (error) {
      console.error('Render error:', error);
    }
  }

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

    console.log('触摸坐标:', x, y);
    console.log('屏幕尺寸:', this.width, this.height);

    // 处理难度选择对话框
    if (this.gameStatus === 'showing_difficulty') {
      this.handleDifficultyDialogClick(x, y);
      return;
    }

    // 底部按钮区域 (固定高度60px)
    const buttonAreaTop = this.height - 60;
    const buttonAreaBottom = this.height;

    console.log('按钮区域顶部:', buttonAreaTop);

    // 检查是否点击了底部按钮区域
    if (y >= buttonAreaTop && y <= buttonAreaBottom) {
      console.log('点击了底部按钮区域');
      
      // 返回按钮 (左侧)
      if (x >= 40 && x <= 140) {
        console.log('点击了返回按钮');
        GameGlobal.app.showPage('home');
        return;
      }
      
      // 难度设置按钮 (中间)
      if (x >= this.width / 2 - 75 && x <= this.width / 2 + 75) {
        console.log('点击了难度设置按钮');
        // 显示难度选择对话框
        this.showDifficultyDialog();
        return;
      }
      
      // 重新开始按钮 (右侧)
      if (x >= this.width - 140 && x <= this.width - 40) {
        console.log('点击了重新开始按钮');
        this.initPuzzle();
        return;
      }
    }

    // 检查是否点击了拼图块
    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 40) / size, (this.height - 200) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 120;

    if (x >= startX && x <= startX + pieceSize * size && y >= startY && y <= startY + pieceSize * size) {
      this.handlePieceClick(x, y);
    }

    // 检查游戏完成时的按钮
    if (this.gameStatus === 'completed') {
      // 再玩一次按钮
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 60 && y <= this.height / 2 + 110) {
        this.initPuzzle();
      }
      // 返回首页按钮
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 120 && y <= this.height / 2 + 170) {
        GameGlobal.app.showPage('home');
      }
    }
  }

  destroy() {
    // 清理资源
  }
}

module.exports = PuzzleGame;