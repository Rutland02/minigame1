const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');
const { easeOutCubic } = require('../match3/animation');

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
    this.pressedId = null;
    this.earnedScore = 0;
    this.celebrating = false;
    this.celebrationParticles = [];
    this.celebrationStartTime = 0;
    this.puzzleImages = [
      'images/puzzle/he.jpg',
    ];
    this.currentImageIndex = Math.floor(Math.random() * this.puzzleImages.length);
    this.initPuzzle();
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
    this.earnedScore = 0;
    this.celebrating = false;
    this.celebrationParticles = [];
    this.loadPuzzleImage();
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
    const boardMarginH = this.width * 0.08;
    const boardMarginV = this.height * 0.08;
    const startY = this.height * 0.12;
    const pieceSize = Math.min((this.width - boardMarginH) / size, (this.height - startY - boardMarginV) / size);
    const startX = (this.width - pieceSize * size) / 2;

    this.boardRect = new LayoutRect(startX, startY, pieceSize * size, pieceSize * size);
    this.pieceSize = pieceSize;

    const btnW = this.scaleSize(90), btnH = this.scaleSize(50), btnGap = this.scaleSize(17);
    const totalW = btnW * 3 + btnGap * 2;
    const btnStartX = (this.width - totalW) / 2;
    const btnY = this.height - this.scaleSize(70);
    this.buttons = {
      back:       new LayoutRect(btnStartX, btnY, btnW, btnH),
      difficulty: new LayoutRect(btnStartX + btnW + btnGap, btnY, btnW, btnH),
      restart:    new LayoutRect(btnStartX + (btnW + btnGap) * 2, btnY, btnW, btnH),
    };

    // Completed dialog buttons
    const dlgW = this.width * 0.8, dlgH = this.height * 0.45;
    const dlgX = (this.width - dlgW) / 2;
    const dlgY = (this.height - dlgH) / 2;
    const dlgBtnMargin = dlgW * 0.1;
    const dlgBtnW = dlgW - dlgBtnMargin * 2;
    const dlgBtnH = this.scaleSize(50);
    const dlgBtnGap = this.scaleSize(15);
    this.completedButtons = {
      replay: new LayoutRect(dlgX + dlgBtnMargin, dlgY + dlgH * 0.55, dlgBtnW, dlgBtnH),
      home:   new LayoutRect(dlgX + dlgBtnMargin, dlgY + dlgH * 0.55 + dlgBtnH + dlgBtnGap, dlgBtnW, dlgBtnH),
    };

    // Difficulty dialog buttons
    const diffDlgW = this.width * 0.8, diffDlgH = this.height * 0.45;
    const diffDlgX = (this.width - diffDlgW) / 2;
    const diffDlgY = (this.height - diffDlgH) / 2;
    const diffBtnMargin = diffDlgW * 0.1;
    const diffBtnW = diffDlgW - diffBtnMargin * 2;
    const diffBtnH = this.scaleSize(50);
    const diffBtnGap = this.scaleSize(15);
    const diffBtnStartY = diffDlgY + diffDlgH * 0.3;
    this.difficultyButtons = {
      easy:   new LayoutRect(diffDlgX + diffBtnMargin, diffBtnStartY, diffBtnW, diffBtnH),
      medium: new LayoutRect(diffDlgX + diffBtnMargin, diffBtnStartY + diffBtnH + diffBtnGap, diffBtnW, diffBtnH),
      hard:   new LayoutRect(diffDlgX + diffBtnMargin, diffBtnStartY + (diffBtnH + diffBtnGap) * 2, diffBtnW, diffBtnH),
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
    if (this.gameStatus !== this.STATES.PLAYING || this.celebrating) return;

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
      this.endTime = Date.now();
      this.saveGameScore();
      this.celebrating = true;
      this.celebrationStartTime = Date.now();
      this.celebrationParticles = this._generateParticles();
      try { wx.vibrateShort({ type: 'heavy' }); } catch(e) {}
    }
  }

  saveGameScore() {
    const time = this.getElapsedTime();
    this.earnedScore = this._calculatePuzzleScore(time);
    if (this.databus) {
      this.databus.recordPuzzleScore(this.level, time, true);
    }
  }

  _calculatePuzzleScore(time) {
    const baseScores = { 1: 100, 2: 200, 3: 300 };
    const base = baseScores[this.level] || 100;
    const penalty = time * 2;
    const minScores = { 1: 20, 2: 40, 3: 60 };
    const min = minScores[this.level] || 20;
    return Math.max(base - penalty, min);
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
    this.pressedId = null;
    if (this.gameStatus !== this.STATES.PLAYING || this.celebrating) return;

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
        this.endTime = Date.now();
        this.saveGameScore();
        this.celebrating = true;
        this.celebrationStartTime = Date.now();
        this.celebrationParticles = this._generateParticles();
        try { wx.vibrateShort({ type: 'heavy' }); } catch(e) {}
      }
    }
  }

  showDifficultyDialog() {
    this.gameStatus = this.STATES.DIFFICULTY;
  }

  renderDifficultyDialog(ctx) {
    const dialogWidth = this.width * 0.8;
    const dialogHeight = this.height * 0.45;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, this.scaleSize(20));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(24)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('选择难度', this.width / 2, dialogY + dialogHeight * 0.18);

    const easy = this.difficultyButtons.easy;
    drawRoundedRect(ctx, easy.x, easy.y, easy.w, easy.h, this.scaleSize(25));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    if (this.pressedId === 'easy') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('简单 (3×3)', easy.centerX, easy.centerY + 6);

    const medium = this.difficultyButtons.medium;
    drawRoundedRect(ctx, medium.x, medium.y, medium.w, medium.h, this.scaleSize(25));
    const mediumGradient = ctx.createLinearGradient(medium.x, medium.y, medium.x + medium.w, medium.y + medium.h);
    mediumGradient.addColorStop(0, '#4a6fa5');
    mediumGradient.addColorStop(1, '#6e5b7b');
    ctx.fillStyle = mediumGradient;
    ctx.fill();
    if (this.pressedId === 'medium') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('中等 (4×4)', medium.centerX, medium.centerY + 6);

    const hard = this.difficultyButtons.hard;
    drawRoundedRect(ctx, hard.x, hard.y, hard.w, hard.h, this.scaleSize(25));
    const hardGradient = ctx.createLinearGradient(hard.x, hard.y, hard.x + hard.w, hard.y + hard.h);
    hardGradient.addColorStop(0, '#F44336');
    hardGradient.addColorStop(1, '#D32F2F');
    ctx.fillStyle = hardGradient;
    ctx.fill();
    if (this.pressedId === 'hard') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('困难 (5×5)', hard.centerX, hard.centerY + 6);
  }

  handleDifficultyDialogClick(x, y) {
    if (this.difficultyButtons.easy.contains(x, y)) {
      this.pressedId = 'easy';
      this.changeLevel(1);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }
    if (this.difficultyButtons.medium.contains(x, y)) {
      this.pressedId = 'medium';
      this.changeLevel(2);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }
    if (this.difficultyButtons.hard.contains(x, y)) {
      this.pressedId = 'hard';
      this.changeLevel(3);
      this.gameStatus = this.STATES.PLAYING;
      return;
    }

    // Click outside dialog -> close
    const diffDlgW = this.width * 0.8, diffDlgH = this.height * 0.45;
    const diffDlgX = (this.width - diffDlgW) / 2;
    const diffDlgY = (this.height - diffDlgH) / 2;
    if (x < diffDlgX || x > diffDlgX + diffDlgW || y < diffDlgY || y > diffDlgY + diffDlgH) {
      this.gameStatus = this.STATES.PLAYING;
    }
  }

  render(ctx) {
    try {
      this.drawBackground(ctx);

      const infoWidth = this.width * 0.8;
      const infoHeight = this.scaleSize(50);
      const infoX = (this.width - infoWidth) / 2;
      const infoY = this.buttons.back.y - infoHeight - this.scaleSize(15);
      drawRoundedRect(ctx, infoX, infoY, infoWidth, infoHeight, this.scaleSize(15));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#333333';
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
      const containerPad = this.scaleSize(10);
      drawRoundedRect(ctx, startX - containerPad, startY - containerPad, puzzleWidth + containerPad * 2, puzzleHeight + containerPad * 2, this.scaleSize(20));
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
          drawRoundedRect(ctx, x, y, pieceSize, pieceSize, this.scaleSize(8));
          
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
        const hintWidth = this.scaleSize(120);
        const hintHeight = hintWidth * (this.puzzleImage.height / this.puzzleImage.width);
        const hintX = (this.width - hintWidth) / 2;
        const hintY = this.boardRect.y + this.boardRect.h + (this.buttons.back.y - this.boardRect.y - this.boardRect.h) / 2 - hintHeight / 2;

        const hintPad = this.scaleSize(5);
        drawRoundedRect(ctx, hintX - hintPad, hintY - hintPad, hintWidth + hintPad * 2, hintHeight + hintPad * 2, this.scaleSize(10));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.drawImage(this.puzzleImage, hintX, hintY, hintWidth, hintHeight);
      }

      const back = this.buttons.back;
      drawRoundedRect(ctx, back.x, back.y, back.w, back.h, this.scaleSize(25));
      const backGradient = ctx.createLinearGradient(back.x, back.y, back.x + back.w, back.y + back.h);
      backGradient.addColorStop(0, '#6B7280');
      backGradient.addColorStop(1, '#4B5563');
      ctx.fillStyle = backGradient;
      ctx.fill();
      if (this.pressedId === 'back') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('返回', back.centerX, back.centerY + 6);

      const difficulty = this.buttons.difficulty;
      drawRoundedRect(ctx, difficulty.x, difficulty.y, difficulty.w, difficulty.h, this.scaleSize(25));
      const orangeGradient = ctx.createLinearGradient(difficulty.x, difficulty.y, difficulty.x + difficulty.w, difficulty.y + difficulty.h);
      orangeGradient.addColorStop(0, '#FF9800');
      orangeGradient.addColorStop(1, '#F57C00');
      ctx.fillStyle = orangeGradient;
      ctx.fill();
      if (this.pressedId === 'difficulty') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('难度设置', difficulty.centerX, difficulty.centerY + 6);

      const restart = this.buttons.restart;
      drawRoundedRect(ctx, restart.x, restart.y, restart.w, restart.h, this.scaleSize(25));
      const restartGradient = ctx.createLinearGradient(restart.x, restart.y, restart.x + restart.w, restart.y + restart.h);
      restartGradient.addColorStop(0, '#10B981');
      restartGradient.addColorStop(1, '#059669');
      ctx.fillStyle = restartGradient;
      ctx.fill();
      if (this.pressedId === 'restart') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('重新开始', restart.centerX, restart.centerY + 6);

      if (this.celebrating) {
        this._drawCelebration(ctx);
      }

      const overlays = {
        [this.STATES.DIFFICULTY]: () => this.renderDifficultyDialog(ctx),
      };
      if (this.gameStatus === this.STATES.COMPLETED && !this.celebrating) {
        overlays[this.STATES.COMPLETED] = () => this.renderCompletedOverlay(ctx);
      }
      overlays[this.gameStatus]?.();
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  renderCompletedOverlay(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const dialogWidth = this.width * 0.8;
    const dialogHeight = this.height * 0.45;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    drawRoundedRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, this.scaleSize(20));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `${this.scaleSize(28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('拼图完成！', this.width / 2, dialogY + dialogHeight * 0.18);

    ctx.font = `${this.scaleSize(20)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(`用时: ${this.getElapsedTime()}秒`, this.width / 2, dialogY + dialogHeight * 0.3);

    if (this.earnedScore > 0) {
      ctx.font = `${this.scaleSize(20)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`积分: +${this.earnedScore}`, this.width / 2, dialogY + dialogHeight * 0.4);
      ctx.fillStyle = '#fff';
    }

    const replay = this.completedButtons.replay;
    drawRoundedRect(ctx, replay.x, replay.y, replay.w, replay.h, this.scaleSize(25));
    const replayGradient = ctx.createLinearGradient(replay.x, replay.y, replay.x + replay.w, replay.y + replay.h);
    replayGradient.addColorStop(0, '#10B981');
    replayGradient.addColorStop(1, '#059669');
    ctx.fillStyle = replayGradient;
    ctx.fill();
    if (this.pressedId === 'replay') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('再玩一次', replay.centerX, replay.centerY + 6);

    const home = this.completedButtons.home;
    drawRoundedRect(ctx, home.x, home.y, home.w, home.h, this.scaleSize(25));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    if (this.pressedId === 'home') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回首页', home.centerX, home.centerY + 6);
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
        this.pressedId = 'replay';
        this.initPuzzle();
      }
      if (this.completedButtons.home.contains(x, y)) {
        this.pressedId = 'home';
        this.navigateTo('home');
      }
      return;
    }

    // Buttons available in all active states
    if (this.buttons.back.contains(x, y)) {
      this.pressedId = 'back';
      this.navigateTo('home');
      return;
    }
    if (this.buttons.difficulty.contains(x, y)) {
      this.pressedId = 'difficulty';
      this.showDifficultyDialog();
      return;
    }
    if (this.buttons.restart.contains(x, y)) {
      this.pressedId = 'restart';
      this.initPuzzle();
      return;
    }

    // Board click (only in playing state)
    if (this.gameStatus === this.STATES.PLAYING && this.boardRect.contains(x, y)) {
      this.handlePieceClick(x, y);
    }
  }

  loadPuzzleImage() {
    const images = this.puzzleImages || ['images/puzzle/he.jpg'];
    // Cycle to next image each time
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
    const imgSrc = images[this.currentImageIndex];

    if (typeof wx !== 'undefined' && wx.createImage) {
      const img = wx.createImage();
      img.onload = () => {
        this.puzzleImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load puzzle image:', imgSrc, err);
      };
      img.src = imgSrc;
    } else if (typeof window !== 'undefined' && window.Image) {
      const img = new Image();
      img.onload = () => {
        this.puzzleImage = img;
      };
      img.onerror = (err) => {
        console.error('Failed to load puzzle image:', imgSrc, err);
      };
      img.src = imgSrc;
    }
  }

  _generateParticles() {
    const particles = [];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: this.width / 2 + (Math.random() - 0.5) * 100,
        y: this.height / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 8 - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        life: 1
      });
    }
    return particles;
  }

  _drawCelebration(ctx) {
    const elapsed = Date.now() - this.celebrationStartTime;
    const progress = Math.min(elapsed / 2000, 1);
    const easedAlpha = 1 - easeOutCubic(progress);

    ctx.save();
    ctx.globalAlpha = easedAlpha;

    for (let i = this.celebrationParticles.length - 1; i >= 0; i--) {
      const p = this.celebrationParticles[i];
      p.vy += 0.15;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.life = Math.max(0, p.life - 0.008);

      if (p.life <= 0) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = easedAlpha * p.life;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    ctx.restore();

    if (progress >= 1) {
      this.celebrating = false;
      this.celebrationParticles = [];
      this.gameStatus = this.STATES.COMPLETED;
    }
  }

  destroy() {
    this.animations = [];
    this.puzzleImage = null;
    this.celebrating = false;
    this.celebrationParticles = [];
  }
}

module.exports = PuzzleGame;