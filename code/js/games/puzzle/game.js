const { drawRoundedRect, getTouchCoords } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class PuzzleGame extends BasePage {
  constructor() {
    super();

    this.level = 1;
    this.pieces = [];
    this.gameStatus = 'playing';
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
    this.gameStatus = 'playing';
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
    if (this.gameStatus !== 'playing') return;

    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

    if (x < startX || x > startX + pieceSize * size || y < startY || y > startY + pieceSize * size) {
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
      this.gameStatus = 'completed';
      this.endTime = Date.now();
      this.saveGameScore();
    }
  }

  saveGameScore() {
    const time = this.getElapsedTime();
    if (typeof GameGlobal !== 'undefined' && GameGlobal.app && GameGlobal.app.databus) {
      GameGlobal.app.databus.recordPuzzleScore(this.level, time, true);
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
    if (this.gameStatus !== 'playing') return;

    const buttonHeight = 50;
    const buttonWidth = 100;
    const buttonSpacing = 20;
    const totalButtonWidth = (buttonWidth * 3) + (buttonSpacing * 2);
    const buttonStartX = (this.width - totalButtonWidth) / 2;
    const buttonY = this.height - buttonHeight - 20;

    if (this.touchStartY >= buttonY && this.touchStartY <= buttonY + buttonHeight &&
        this.touchStartX >= buttonStartX && this.touchStartX <= buttonStartX + totalButtonWidth) {
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
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

    if (this.touchStartX < startX || this.touchStartX > startX + pieceSize * size || 
        this.touchStartY < startY || this.touchStartY > startY + pieceSize * size) {
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
        this.gameStatus = 'completed';
        this.endTime = Date.now();
        this.saveGameScore();
      }
    }
  }

  showDifficultyDialog() {
    this.gameStatus = 'showing_difficulty';
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
    const dialogWidth = 320;
    const dialogHeight = 280;
    const dialogX = (this.width - dialogWidth) / 2;
    const dialogY = (this.height - dialogHeight) / 2;

    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 100 && y <= dialogY + 150) {
      this.changeLevel(1);
      this.gameStatus = 'playing';
      return;
    }

    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 160 && y <= dialogY + 210) {
      this.changeLevel(2);
      this.gameStatus = 'playing';
      return;
    }

    if (x >= dialogX + 30 && x <= dialogX + dialogWidth - 30 && y >= dialogY + 220 && y <= dialogY + 270) {
      this.changeLevel(3);
      this.gameStatus = 'playing';
      return;
    }

    if (x < dialogX || x > dialogX + dialogWidth || y < dialogY || y > dialogY + dialogHeight) {
      this.gameStatus = 'playing';
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
      const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
      const startX = (this.width - pieceSize * size) / 2;
      const startY = 130;
      const puzzleWidth = pieceSize * size;
      const puzzleHeight = pieceSize * size;

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

      const buttonHeight = 50;
      const buttonWidth = 100;
      const buttonSpacing = 20;
      const totalButtonWidth = (buttonWidth * 3) + (buttonSpacing * 2);
      const buttonStartX = (this.width - totalButtonWidth) / 2;
      const buttonY = this.height - buttonHeight - 20;
      
      drawRoundedRect(ctx, buttonStartX, buttonY, buttonWidth, buttonHeight, 25);
      const backGradient = ctx.createLinearGradient(buttonStartX, buttonY, buttonStartX + buttonWidth, buttonY + buttonHeight);
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
      ctx.fillText('返回', buttonStartX + buttonWidth / 2, buttonY + 32);

      const difficultyX = buttonStartX + buttonWidth + buttonSpacing;
      drawRoundedRect(ctx, difficultyX, buttonY, buttonWidth, buttonHeight, 25);
      const orangeGradient = ctx.createLinearGradient(difficultyX, buttonY, difficultyX + buttonWidth, buttonY + buttonHeight);
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
      ctx.fillText('难度设置', difficultyX + buttonWidth / 2, buttonY + 32);

      const restartX = difficultyX + buttonWidth + buttonSpacing;
      drawRoundedRect(ctx, restartX, buttonY, buttonWidth, buttonHeight, 25);
      const restartGradient = ctx.createLinearGradient(restartX, buttonY, restartX + buttonWidth, buttonY + buttonHeight);
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
      ctx.fillText('重新开始', restartX + buttonWidth / 2, buttonY + 32);

      if (this.gameStatus === 'completed') {
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

      if (this.gameStatus === 'showing_difficulty') {
        this.renderDifficultyDialog(ctx);
      }
    } catch (error) {
      console.error('Render error:', error);
    }
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;

    this.touchStartX = x;
    this.touchStartY = y;

    if (this.gameStatus === 'showing_difficulty') {
      this.handleDifficultyDialogClick(x, y);
      return;
    }

    const buttonHeight = 50;
    const buttonWidth = 100;
    const buttonSpacing = 20;
    const totalButtonWidth = (buttonWidth * 3) + (buttonSpacing * 2);
    const buttonStartX = (this.width - totalButtonWidth) / 2;
    const buttonY = this.height - buttonHeight - 20;
    const buttonAreaTop = buttonY;
    const buttonAreaBottom = buttonY + buttonHeight;

    if (y >= buttonAreaTop && y <= buttonAreaBottom) {
      if (x >= buttonStartX && x <= buttonStartX + buttonWidth) {
        GameGlobal.app.showPage('home');
        return;
      }

      const difficultyX = buttonStartX + buttonWidth + buttonSpacing;
      if (x >= difficultyX && x <= difficultyX + buttonWidth) {
        this.showDifficultyDialog();
        return;
      }

      const restartX = difficultyX + buttonWidth + buttonSpacing;
      if (x >= restartX && x <= restartX + buttonWidth) {
        this.initPuzzle();
        return;
      }
    }

    const size = this.getPuzzleSize();
    const pieceSize = Math.min((this.width - 60) / size, (this.height - 220) / size);
    const startX = (this.width - pieceSize * size) / 2;
    const startY = 130;

    if (x >= startX && x <= startX + pieceSize * size && y >= startY && y <= startY + pieceSize * size) {
      this.handlePieceClick(x, y);
    }

    if (this.gameStatus === 'completed') {
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 60 && y <= this.height / 2 + 110) {
        this.initPuzzle();
      }
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height / 2 + 120 && y <= this.height / 2 + 170) {
        GameGlobal.app.showPage('home');
      }
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