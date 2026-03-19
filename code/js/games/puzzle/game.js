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
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

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
    const dialogWidth = 320;
    const dialogHeight = 280;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    // 绘制对话框背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制玻璃态对话框
    this.drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制标题
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', this.width / 2, dialogY + 60);

    // 绘制简单模式按钮
    this.drawRoundedRect(ctx, dialogX + 30, dialogY + 100, dialogWidth - 60, 50, 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('简单 (3×3)', this.width / 2, dialogY + 132);

    // 绘制中等模式按钮
    this.drawRoundedRect(ctx, dialogX + 30, dialogY + 160, dialogWidth - 60, 50, 25);
    const mediumGradient = ctx.createLinearGradient(dialogX + 30, dialogY + 160, dialogX + dialogWidth - 30, dialogY + 210);
    mediumGradient.addColorStop(0, '#4a6fa5');
    mediumGradient.addColorStop(1, '#6e5b7b');
    ctx.fillStyle = mediumGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('中等 (4×4)', this.width / 2, dialogY + 192);

    // 绘制困难模式按钮
    this.drawRoundedRect(ctx, dialogX + 30, dialogY + 220, dialogWidth - 60, 50, 25);
    const hardGradient = ctx.createLinearGradient(dialogX + 30, dialogY + 220, dialogX + dialogWidth - 30, dialogY + 270);
    hardGradient.addColorStop(0, '#F44336');
    hardGradient.addColorStop(1, '#D32F2F');
    ctx.fillStyle = hardGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('困难 (5×5)', this.width / 2, dialogY + 252);
  }

  handleDifficultyDialogClick(x, y) {
    const dialogWidth = 320;
    const dialogHeight = 280;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    // 检查是否点击了简单模式按钮
    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 100 && y <= dialogY + 150) {
      this.changeLevel(1); // 简单模式
      this.gameStatus = 'playing';
      return;
    }

    // 检查是否点击了中等模式按钮
    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 160 && y <= dialogY + 210) {
      this.changeLevel(2); // 中等模式
      this.gameStatus = 'playing';
      return;
    }

    // 检查是否点击了困难模式按钮
    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 220 && y <= dialogY + 270) {
      this.changeLevel(3); // 困难模式
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
      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#4a6fa5');
      gradient.addColorStop(1, '#6e5b7b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制半透明遮罩
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制游戏信息 - 使用玻璃态效果
      this.drawRoundedRect(ctx, 20, 20, 200, 80, 15);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制游戏信息文字
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`难度: ${this.getPuzzleSize()}×${this.getPuzzleSize()}`, 40, 45);
      ctx.fillText(`时间: ${this.getElapsedTime()}s`, 40, 75);

      // 绘制拼图 - 玻璃态容器
      const size = this.getPuzzleSize();
      const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
      const startX = (this.width - pieceSize * size) / 2;
      const startY = 130;
      const puzzleWidth = pieceSize * size;
      const puzzleHeight = pieceSize * size;

      // 绘制拼图容器
      this.drawRoundedRect(ctx, startX - 10, startY - 10, puzzleWidth + 20, puzzleHeight + 20, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 绘制拼图块
      this.pieces.forEach(piece => {
        const x = startX + piece.currentCol * pieceSize;
        const y = startY + piece.currentRow * pieceSize;

        if (!piece.isEmpty) {
          // 绘制拼图块 - 玻璃态效果
          this.drawRoundedRect(ctx, x, y, pieceSize, pieceSize, 8);
          
          // 缓存颜色值 - 基于海澄村三色资源
          const colorIndex = (piece.correctRow * size + piece.correctCol) % 3;
          const colors = ['#FF5722', '#4CAF50', '#F44336'];
          const color = colors[colorIndex];
          
          // 为拼图块添加渐变效果
          const pieceGradient = ctx.createLinearGradient(x, y, x, y + pieceSize);
          pieceGradient.addColorStop(0, color);
          pieceGradient.addColorStop(1, color + '80');
          ctx.fillStyle = pieceGradient;
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();

          // 绘制拼图内容（这里用数字代替实际图片）
          ctx.fillStyle = '#fff';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(`${piece.correctRow},${piece.correctCol}`, x + pieceSize / 2, y + pieceSize / 2 + 5);
        }
      });

      // 绘制底部按钮 - 垂直排列
      const buttonHeight = 50;
      const buttonWidth = 180;
      const buttonSpacing = 15;
      const totalButtonHeight = (buttonHeight + buttonSpacing) * 3 - buttonSpacing;
      const startY = this.height - totalButtonHeight - 30;
      
      // 返回按钮 - 次要按钮
      this.drawRoundedRect(ctx, (this.width - buttonWidth) / 2, startY, buttonWidth, buttonHeight, 25);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回', this.width / 2, startY + 32);

      // 难度设置按钮 - 主按钮
      const difficultyY = startY + buttonHeight + buttonSpacing;
      this.drawRoundedRect(ctx, (this.width - buttonWidth) / 2, difficultyY, buttonWidth, buttonHeight, 25);
      const mainButtonGradient = ctx.createLinearGradient((this.width - buttonWidth) / 2, difficultyY, (this.width + buttonWidth) / 2, difficultyY + buttonHeight);
      mainButtonGradient.addColorStop(0, '#4a6fa5');
      mainButtonGradient.addColorStop(1, '#6e5b7b');
      ctx.fillStyle = mainButtonGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('难度设置', this.width / 2, difficultyY + 32);

      // 重新开始按钮 - 成功按钮
      const restartY = difficultyY + buttonHeight + buttonSpacing;
      this.drawRoundedRect(ctx, (this.width - buttonWidth) / 2, restartY, buttonWidth, buttonHeight, 25);
      const successButtonGradient = ctx.createLinearGradient((this.width - buttonWidth) / 2, restartY, (this.width + buttonWidth) / 2, restartY + buttonHeight);
      successButtonGradient.addColorStop(0, '#4CAF50');
      successButtonGradient.addColorStop(1, '#45a049');
      ctx.fillStyle = successButtonGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', this.width / 2, restartY + 32);

      // 绘制游戏完成状态
      if (this.gameStatus === 'completed') {
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 玻璃态弹窗
        const dialogWidth = 300;
        const dialogHeight = 280;
        const dialogX = (this.width - dialogWidth) / 2;
        const dialogY = (this.height - dialogHeight) / 2;
        
        this.drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 20);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 标题
        ctx.fillStyle = '#fff';
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('拼图完成！', this.width / 2, dialogY + 60);
        
        // 用时
        ctx.font = '20px Arial';
        ctx.fillText(`用时: ${this.getElapsedTime()}秒`, this.width / 2, dialogY + 100);

        // 再玩一次按钮 - 成功按钮
        this.drawRoundedRect(ctx, dialogX + 30, dialogY + 140, dialogWidth - 60, 50, 25);
        const replayGradient = ctx.createLinearGradient(dialogX + 30, dialogY + 140, dialogX + dialogWidth - 30, dialogY + 190);
        replayGradient.addColorStop(0, '#4CAF50');
        replayGradient.addColorStop(1, '#45a049');
        ctx.fillStyle = replayGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('再玩一次', this.width / 2, dialogY + 172);

        // 返回首页按钮 - 次要按钮
        this.drawRoundedRect(ctx, dialogX + 30, dialogY + 200, dialogWidth - 60, 50, 25);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('返回首页', this.width / 2, dialogY + 232);
      }

      // 绘制难度选择对话框
      if (this.gameStatus === 'showing_difficulty') {
        this.renderDifficultyDialog(ctx);
      }
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  // 绘制圆角矩形（兼容不同Canvas API）
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
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

    // 底部按钮区域 - 垂直排列
    const buttonHeight = 50;
    const buttonWidth = 180;
    const buttonSpacing = 15;
    const totalButtonHeight = (buttonHeight + buttonSpacing) * 3 - buttonSpacing;
    const startY = this.height - totalButtonHeight - 30;
    const buttonAreaTop = startY;
    const buttonAreaBottom = startY + totalButtonHeight;

    console.log('按钮区域顶部:', buttonAreaTop);

    // 检查是否点击了底部按钮区域
    if (y >= buttonAreaTop && y <= buttonAreaBottom) {
      console.log('点击了底部按钮区域');
      
      // 检查x坐标是否在按钮宽度范围内
      if (x >= (this.width - buttonWidth) / 2 && x <= (this.width + buttonWidth) / 2) {
        // 返回按钮 (顶部)
        if (y >= startY && y <= startY + buttonHeight) {
          console.log('点击了返回按钮');
          GameGlobal.app.showPage('home');
          return;
        }
        
        // 难度设置按钮 (中间)
        const difficultyY = startY + buttonHeight + buttonSpacing;
        if (y >= difficultyY && y <= difficultyY + buttonHeight) {
          console.log('点击了难度设置按钮');
          // 显示难度选择对话框
          this.showDifficultyDialog();
          return;
        }
        
        // 重新开始按钮 (底部)
        const restartY = difficultyY + buttonHeight + buttonSpacing;
        if (y >= restartY && y <= restartY + buttonHeight) {
          console.log('点击了重新开始按钮');
          this.initPuzzle();
          return;
        }
      }
    }

    // 检查是否点击了拼图块
    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

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