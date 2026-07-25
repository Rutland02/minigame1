const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class PuzzleGame extends BasePage {
  constructor() {
    super();

    this.STATES = Object.freeze({
      PLAYING: 'playing',
      COMPLETED: 'completed',
      DIFFICULTY: 'showing_difficulty',
    });

    this.level = 1;
    this.pieces = [];
    this.gameStatus = this.STATES.PLAYING;
    this.startTime = Date.now();
    this.endTime = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.animations = [];
    this.animationFrame = 0;
    this.isAnimating = false;
    this.puzzleImage = null;
    this.initPuzzle();
    this.loadPuzzleImage();
    this.updateLayout();
  }

  initPuzzle() {
    const size = this.getPuzzleSize();
    const pieceCount = size * size;
    this.pieces = [];
    
    for (let i = 0; i < pieceCount; i++) {
      const row = Math.floor(i / size);
      const col = i % size;
      this.pieces.push({
        id: i,
        correctRow: row,
        correctCol: col,
        currentRow: row,
        currentCol: col,
        isEmpty: i === pieceCount - 1
      });
    }
    
    this.shufflePuzzle();
    this.startTime = Date.now();
    this.endTime = null;
    this.gameStatus = this.STATES.PLAYING;
    this.updateLayout();
  }

  getPuzzleSize() {
    switch (this.level) {
      case 1:
        return 3;
      case 2:
        return 4;
      case 3:
        return 5;
      default:
        return 3;
    }
  }

  updateLayout() {
    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

    this.boardRect = new LayoutRect(startX, startY, pieceSize * size, pieceSize * size);
    this.pieceSize = pieceSize;

    const btnW = 100, btnH = 50, btnGap = 20;
    const totalW = btnW * 3 + btnGap * 2;
    const btnStartX = (this.width - totalW) / 2;
    const btnY = this.height - btnH - 20;
    this.buttons = {
      back:       new LayoutRect(btnStartX, btnY, btnW, btnH),
      difficulty: new LayoutRect(btnStartX + btnW + btnGap, btnY, btnW, btnH),
      restart:    new LayoutRect(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH),
    };

    // Completed dialog buttons
    const dlgW = 300, dlgH = 280;
    const dlgX = (this.width - dlgW) / 2;
    const dlgY = (this.height - dlgH) / 2;
    this.completedButtons = {
      replay: new LayoutRect(dlgX + 30, dlgY + 140, dlgW - 60, 50),
      home:   new LayoutRect(dlgX + 30, dlgY + 200, dlgW - 60, 50),
    };

    // Difficulty dialog buttons
    const diffDlgW = 320, diffDlgH = 280;
    const diffDlgX = (this.width - diffDlgW) / 2;
    const diffDlgY = (this.height - diffDlgH) / 2;
    this.difficultyButtons = {
      easy:   new LayoutRect(diffDlgX + 30, diffDlgY + 100, diffDlgW - 60, 50),
      medium: new LayoutRect(diffDlgX + 30, diffDlgY + 160, diffDlgW - 60, 50),
      hard:   new LayoutRect(diffDlgX + 30, diffDlgY + 220, diffDlgW - 60, 50),
    };
  }

  shufflePuzzle() {
    const size = this.getPuzzleSize();
    const pieceCount = size * size;
    
    let moves = 1000;
    let attempts = 0;
    const maxAttempts = 10000;
    
    while (moves > 0 && attempts < maxAttempts) {
      attempts++;
      const pieceIndex = Math.floor(Math.random() * this.pieces.length);
      const piece = this.pieces[pieceIndex];
      
      if (piece.isEmpty) continue;
      
      const directions = ['up', 'down', 'left', 'right'];
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
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
    
    if (newRow < 0 || newRow >= size || newCol < 0 || newCol >= size) {
      return false;
    }
    
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
    
    const emptyPiece = this.pieces.find(p => p.currentRow === newRow && p.currentCol === newCol);
    if (emptyPiece) {
      this.addAnimation('slide', {
        piece: piece,
        emptyPiece: emptyPiece,
        direction: direction,
        startRow: piece.currentRow,
        startCol: piece.currentCol,
        endRow: newRow,
        endCol: newCol,
        startTime: Date.now()
      });
      
      [piece.currentRow, emptyPiece.currentRow] = [emptyPiece.currentRow, piece.currentRow];
      [piece.currentCol, emptyPiece.currentCol] = [emptyPiece.currentCol, piece.currentCol];
    }
  }

  addAnimation(type, data) {
    this.animations.push({ type, data, progress: 0 });
    this.isAnimating = true;
  }

  updateAnimations() {
    if (this.animations.length === 0) {
      this.isAnimating = false;
      return;
    }

    const now = Date.now();
    const duration = 300;

    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.data.startTime;
      anim.progress = Math.min(elapsed / duration, 1);

      if (anim.progress >= 1) {
        return false;
      }
      return true;
    });
  }

  handlePieceClick(x, y) {
    if (this.gameStatus !== this.STATES.PLAYING) return;

    const size = this.getPuzzleSize();
    const pieceSize = this.pieceSize;
    const startX = this.boardRect.x;
    const startY = this.boardRect.y;

    if (!this.boardRect.contains(x, y)) {
      return;
    }

    const col = Math.floor((x - startX) / pieceSize);
    const row = Math.floor((y - startY) / pieceSize);

    if (row < 0 || row >= size || col < 0 || col >= size) {
      return;
    }

    const piece = this.pieces.find(p => p.currentRow === row && p.currentCol === col);

    if (!piece || piece.isEmpty) return;

    const directions = ['up', 'down', 'left', 'right'];
    let moved = false;
    for (const direction of directions) {
      if (this.canMove(piece, direction)) {
        this.movePiece(piece, direction);
        moved = true;
        break;
      }
    }

    if (moved && this.checkCompletion()) {
      this.gameStatus = this.STATES.COMPLETED;
      this.endTime = Date.now();
      this.saveGameScore();
    }
  }

  saveGameScore() {
    const time = this.getElapsedTime();
    if (this.databus) {
      this.databus.recordPuzzleScore(this.level, time, true);
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
    } else if (this.gameStatus === this.STATES.PLAYING) {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }
    return 0;
  }

  handleTouchEnd(e) {
    if (this.gameStatus !== this.STATES.PLAYING) return;

    if (this.buttons.back.contains(this.touchStartX, this.touchStartY) ||
        this.buttons.difficulty.contains(this.touchStartX, this.touchStartY) ||
        this.buttons.restart.contains(this.touchStartX, this.touchStartY)) {
      return;
    }

    const endCoords = getTouchCoords(e.touches, e.changedTouches);
    if (!endCoords) return;
    const endX = endCoords.x;
    const endY = endCoords.y;

    const deltaX = endX - this.touchStartX;
    const deltaY = endY - this.touchStartY;

    if (Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
      return;
    }

    let direction;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const size = this.getPuzzleSize();
    const pieceSize = this.pieceSize;
    const startX = this.boardRect.x;
    const startY = this.boardRect.y;

    if (!this.boardRect.contains(this.touchStartX, this.touchStartY)) {
      return;
    }

    const col = Math.floor((this.touchStartX - startX) / pieceSize);
    const row = Math.floor((this.touchStartY - startY) / pieceSize);

    if (row < 0 || row >= size || col < 0 || col >= size) {
      return;
    }

    const piece = this.pieces.find(p => p.currentRow === row && p.currentCol === col);

    if (!piece || piece.isEmpty) return;

    if (this.canMove(piece, direction)) {
      this.movePiece(piece, direction);
      
      if (this.checkCompletion()) {
        this.gameStatus = this.STATES.COMPLETED;
        this.endTime = Date.now();
        this.saveGameScore();
      }
    }
  }

  showDifficultyDialog() {
    this.gameStatus = this.STATES.DIFFICULTY;
  }

  renderDifficultyDialog(ctx) {
    const dialogWidth = 320;
    const dialogHeight = 280;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', this.width / 2, dialogY + 60);

    drawRoundedRect(ctx, dialogX + 30, dialogY + 100, dialogWidth - 60, 50, 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('简单 (3×3)', this.width / 2, dialogY + 132);

    drawRoundedRect(ctx, dialogX + 30, dialogY + 160, dialogWidth - 60, 50, 25);
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

    drawRoundedRect(ctx, dialogX + 30, dialogY + 220, dialogWidth - 60, 50, 25);
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
    if (this.difficultyButtons.easy.contains(x, y)) {
      this.changeLevel(1);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }
    if (this.difficultyButtons.medium.contains(x, y)) {
      this.changeLevel(2);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }
    if (this.difficultyButtons.hard.contains(x, y)) {
      this.changeLevel(3);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }

    // Click outside dialog -> close
    const diffDlgW = 320, diffDlgH = 280;
    const diffDlgX = (this.width - diffDlgW) / 2;
    const diffDlgY = (this.height - diffDlgH) / 2;
    if (x < diffDlgX || x > diffDlgX + diffDlgW || y < diffDlgY || y > diffDlgY + diffDlgH) {
      this.gameStatus = this.STATES.PLAYING;
    }
  }

  render(ctx) {
    try {
      this.drawBackground(ctx);

      const infoWidth = 300;
      const infoHeight = 50;
      const infoX = (this.width - infoWidth) / 2;
      const infoY = this.height - 140;
      drawRoundedRect(ctx, infoX, infoY, infoWidth, infoHeight, 15);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      const difficultyText = `难度: ${this.getPuzzleSize()}×${this.getPuzzleSize()}`;
      const timeText = `时间: ${this.getElapsedTime()}s`;
      const textWidth = ctx.measureText(difficultyText).width;
      ctx.fillText(difficultyText, infoX + infoWidth / 2 - textWidth / 2 - 10, infoY + 27);
      ctx.fillText(timeText, infoX + infoWidth / 2 + textWidth / 2 + 10, infoY + 27);

      const size = this.getPuzzleSize();
      const pieceSize = this.pieceSize;
      const startX = this.boardRect.x;
      const startY = this.boardRect.y;
      const puzzleWidth = this.boardRect.w;
      const puzzleHeight = this.boardRect.h;

      // 绘制拼图容器
      drawRoundedRect(ctx, startX - 10, startY - 10, puzzleWidth + 20, puzzleHeight + 20, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 更新动画
      this.updateAnimations();

      // 绘制拼图块
      this.pieces.forEach(piece => {
        let x = startX + piece.currentCol * pieceSize;
        let y = startY + piece.currentRow * pieceSize;

        // 应用动画
        const animation = this.animations.find(anim => 
          anim.data.piece === piece || anim.data.emptyPiece === piece
        );

        if (animation && animation.type === 'slide') {
          const progress = animation.progress;
          const { startRow, startCol, endRow, endCol, direction } = animation.data;

          if (animation.data.piece === piece) {
            // 正在移动的拼图块
            x = startX + (startCol + (endCol - startCol) * progress) * pieceSize;
            y = startY + (startRow + (endRow - startRow) * progress) * pieceSize;
          }
        }

        if (!piece.isEmpty) {
          // 绘制拼图块 - 玻璃态效果
          drawRoundedRect(ctx, x, y, pieceSize, pieceSize, 8);
          
          // 绘制拼图图片
          if (this.puzzleImage) {
            const imgPieceWidth = this.puzzleImage.width / size;
            const imgPieceHeight = this.puzzleImage.height / size;
            
            // 切割并绘制图片 - 禁用图像平滑保持清晰度
            ctx.save();
            ctx.clip();
            ctx.imageSmoothingEnabled = false; // 禁用图像平滑，保持锐利
            ctx.drawImage(
              this.puzzleImage,
              piece.correctCol * imgPieceWidth,
              piece.correctRow * imgPieceHeight,
              imgPieceWidth,
              imgPieceHeight,
              x,
              y,
              pieceSize,
              pieceSize
            );
            ctx.imageSmoothingEnabled = true;
            ctx.restore();
          } else {
            const colorIndex = (piece.correctRow * size + piece.correctCol) % 3;
            const colors = ['#EF4444', '#F59E0B', '#3B82F6'];
            const color = colors[colorIndex];
            
            const pieceGradient = ctx.createLinearGradient(x, y, x, y + pieceSize);
            pieceGradient.addColorStop(0, color);
            pieceGradient.addColorStop(1, color + '80');
            ctx.fillStyle = pieceGradient;
            ctx.fill();
          }
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      if (this.puzzleImage) {
        const hintWidth = 120;
        const hintHeight = hintWidth * (this.puzzleImage.height / this.puzzleImage.width);
        const hintX = (this.width - hintWidth) / 2;
        const hintY = this.height - 300;
        
        drawRoundedRect(ctx, hintX - 5, hintY - 5, hintWidth + 10, hintHeight + 10, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.drawImage(this.puzzleImage, hintX, hintY, hintWidth, hintHeight);
      }

      const back = this.buttons.back;
      drawRoundedRect(ctx, back.x, back.y, back.w, back.h, 25);
      const backGradient = ctx.createLinearGradient(back.x, back.y, back.x + back.w, back.y + back.h);
      backGradient.addColorStop(0, '#6B7280');
      backGradient.addColorStop(1, '#4B5563');
      ctx.fillStyle = backGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回', back.centerX, back.centerY + 6);

      const difficulty = this.buttons.difficulty;
      drawRoundedRect(ctx, difficulty.x, difficulty.y, difficulty.w, difficulty.h, 25);
      const orangeGradient = ctx.createLinearGradient(difficulty.x, difficulty.y, difficulty.x + difficulty.w, difficulty.y + difficulty.h);
      orangeGradient.addColorStop(0, '#FF9800');
      orangeGradient.addColorStop(1, '#F57C00');
      ctx.fillStyle = orangeGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('难度设置', difficulty.centerX, difficulty.centerY + 6);

      const restart = this.buttons.restart;
      drawRoundedRect(ctx, restart.x, restart.y, restart.w, restart.h, 25);
      const restartGradient = ctx.createLinearGradient(restart.x, restart.y, restart.x + restart.w, restart.y + restart.h);
      restartGradient.addColorStop(0, '#10B981');
      restartGradient.addColorStop(1, '#059669');
      ctx.fillStyle = restartGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', restart.centerX, restart.centerY + 6);

      // State overlays
      const overlays = {
        [this.STATES.COMPLETED]: () => this.renderCompletedOverlay(ctx),
        [this.STATES.DIFFICULTY]: () => this.renderDifficultyDialog(ctx),
      };
      overlays[this.gameStatus]?.();
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  renderCompletedOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const dialogWidth = 300;
    const dialogHeight = 280;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('拼图完成！', this.width / 2, dialogY + 60);

    ctx.font = '20px Arial';
    ctx.fillText(`用时: ${this.getElapsedTime()}秒`, this.width / 2, dialogY + 100);

    drawRoundedRect(ctx, dialogX + 30, dialogY + 140, dialogWidth - 60, 50, 25);
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

    drawRoundedRect(ctx, dialogX + 30, dialogY + 200, dialogWidth - 60, 50, 25);
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

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;

    this.touchStartX = x;
    this.touchStartY = y;

    // State-specific handlers first
    if (this.gameStatus === this.STATES.DIFFICULTY) {
      this.handleDifficultyDialogClick(x, y);
      return;
    }

    if (this.gameStatus === this.STATES.COMPLETED) {
      if (this.completedButtons.replay.contains(x, y)) {
        this.initPuzzle();
      }
      if (this.completedButtons.home.contains(x, y)) {
        this.navigateTo('home');
      }
      return;
    }

    // Buttons available in all active states
    if (this.buttons.back.contains(x, y)) {
      this.navigateTo('home');
      return;
    }
    if (this.buttons.difficulty.contains(x, y)) {
      this.showDifficultyDialog();
      return;
    }
    if (this.buttons.restart.contains(x, y)) {
      this.initPuzzle();
      return;
    }

    // Board click (only in playing state)
    if (this.gameStatus === this.STATES.PLAYING && this.boardRect.contains(x, y)) {
      this.handlePieceClick(x, y);
    }
  }

  loadPuzzleImage() {
    if (typeof wx !== 'undefined' && wx.createImage) {
      const img = wx.createImage();
      img.onload = () => {
        this.puzzleImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load puzzle image:', err);
      };
      img.src = 'images/puzzle/he.jpg';
    } else if (typeof window !== 'undefined' && window.Image) {
      const img = new Image();
      img.onload = () => {
        this.puzzleImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load puzzle image:', err);
      };
      img.src = 'images/puzzle/he.jpg';
    }
  }

  destroy() {
    this.animations = [];
    this.puzzleImage = null;
  }
}

module.exports = PuzzleGame;