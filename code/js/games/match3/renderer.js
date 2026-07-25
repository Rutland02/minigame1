const { drawRoundedRect, LayoutRect } = require('../../utils/canvasUtils');
const { COLORS, ICONS } = require('./constants');
const { easeOutQuad, easeOutElastic, easeOutBounce, easeOutCubic } = require('./animation');

const COLOR_INDEX_MAP = {};
COLORS.forEach((color, i) => {
  COLOR_INDEX_MAP[color] = i;
});

const iconCache = [];

class Match3Renderer {
  constructor(game) {
    this.game = game;
    this.loadIcons();
  }

  scaleSize(base) {
    return this.game.scaleSize(base);
  }

  loadIcons() {
    for (let i = 0; i < ICONS.length; i++) {
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

  drawPieceIcon(ctx, icon, pieceColor, x, y, cellSize) {
    const iconSize = Math.floor(cellSize * 2 / 3);
    const iconX = Math.floor(x + (cellSize - iconSize) / 2);
    const iconY = Math.floor(y + (cellSize - iconSize) / 2);

    if (icon) {
      const scaleRatio = iconSize / icon.width;
      ctx.imageSmoothingEnabled = scaleRatio >= 0.5;
      if (scaleRatio < 0.5) {
        ctx.imageSmoothingQuality = 'high';
      }
      ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      ctx.imageSmoothingEnabled = true;
    } else {
      this.drawPieceFallback(ctx, pieceColor, x + cellSize / 2, y + cellSize / 2, cellSize / 3);
    }
  }

  drawPieceFallback(ctx, color, cx, cy, radius) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGameInfo(ctx) {
    const game = this.game;

    const x = game.width * 0.03;
    const y = game._infoBarY !== undefined ? game._infoBarY : game.height * 0.02;
    const width = game.width * 0.94;
    const height = game.height * 0.06;
    const radius = this.scaleSize(15);

    ctx.save();
    ctx.shadowColor = 'rgba(75, 85, 99, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const textY1 = y + height * 0.35;
    const textY2 = y + height * 0.7;
    const colWidth = width / 3;

    ctx.font = `bold ${this.scaleSize(17)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#1E293B';
    ctx.textAlign = 'center';
    ctx.fillText(`得分: ${game.score}`, x + colWidth * 0.5, textY1);
    ctx.fillText(`等级: ${game.level}`, x + colWidth * 1.5, textY1);
    ctx.fillText(`时间: ${Math.ceil(game.time)}s`, x + colWidth * 2.5, textY1);

    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#64748B';
    ctx.fillText('SCORE', x + colWidth * 0.5, textY2);
    ctx.fillText('LEVEL', x + colWidth * 1.5, textY2);
    ctx.fillText('TIME', x + colWidth * 2.5, textY2);
  }

  _buildAnimatingCellsSet() {
    const set = new Set();
    const animations = this.game.anim.animations;
    animations.forEach(anim => {
      if (anim.type === 'swap') {
        const { row1, col1, row2, col2 } = anim.data;
        set.add(row1 + ',' + col1);
        set.add(row2 + ',' + col2);
      } else if (anim.type === 'drop') {
        set.add(anim.data.targetRow + ',' + anim.data.targetCol);
      } else if (anim.type === 'pop' || anim.type === 'elimination' || anim.type === 'special') {
        set.add(anim.data.row + ',' + anim.data.col);
      }
    });
    return set;
  }

  _drawSpecialIndicator(ctx, piece, cx, cy, cellSize) {
    ctx.fillStyle = '#fff';
    const barHalf = this.scaleSize(5);
    const barFull = this.scaleSize(10);
    if (piece.specialType === 'row_clear') {
      ctx.fillRect(cx - cellSize / 4, cy - barHalf, cellSize / 2, barFull);
    } else if (piece.specialType === 'column_clear') {
      ctx.fillRect(cx - barHalf, cy - cellSize / 4, barFull, cellSize / 2);
    }
  }

  _drawStaticPiece(ctx, piece, x, y, cellSize) {
    const icon = iconCache[COLOR_INDEX_MAP[piece.color]];

    if (piece.special) {
      switch (piece.specialType) {
        case 'row_clear':
        case 'column_clear':
          this.drawPieceIcon(ctx, icon, piece.color, x, y, cellSize);
          this._drawSpecialIndicator(ctx, piece, x + cellSize / 2, y + cellSize / 2, cellSize);
          break;
        case 'rainbow':
          const g = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
          g.addColorStop(0, '#FF0000'); g.addColorStop(0.2, '#FF7F00');
          g.addColorStop(0.4, '#FFFF00'); g.addColorStop(0.6, '#00FF00');
          g.addColorStop(0.8, '#0000FF'); g.addColorStop(1, '#8B00FF');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
          ctx.fill();
          break;
        default:
          this.drawPieceIcon(ctx, icon, piece.color, x, y, cellSize);
      }
    } else {
      this.drawPieceIcon(ctx, icon, piece.color, x, y, cellSize);
    }
  }

  // ── 动画绘制辅助方法 ──

  _drawEliminationAnim(ctx, anim, startX, startY, cellSize) {
    const { row, col } = anim.data;
    const x = startX + col * cellSize;
    const y = startY + row * cellSize;
    const t = easeOutQuad(anim.progress);
    const scale = 1 + t * 1.5;
    const opacity = 1 - t;
    ctx.globalAlpha = opacity;

    const icon = iconCache[COLOR_INDEX_MAP[anim.data.color || '#ffffff']];
    if (icon) {
      const shrink = (cellSize / 6) * (scale - 1);
      ctx.drawImage(icon, x + cellSize / 6 - shrink, y + cellSize / 6 - shrink,
        cellSize * 2 / 3 * scale, cellSize * 2 / 3 * scale);
    } else {
      ctx.fillStyle = anim.data.color || '#ffffff';
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    // 粒子
    ctx.fillStyle = anim.data.color || '#ffffff';
    for (let p = 0; p < 6; p++) {
      const angle = (p / 6) * Math.PI * 2;
      const dist = t * cellSize;
      ctx.beginPath();
      ctx.arc(x + cellSize / 2 + Math.cos(angle) * dist,
        y + cellSize / 2 + Math.sin(angle) * dist,
        (1 - t) * (cellSize / 6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawSwapAnim(ctx, anim, startX, startY, cellSize) {
    const { row1, col1, row2, col2, piece1, piece2 } = anim.data;
    const t = easeOutBounce(anim.progress);
    const x1 = startX + col1 * cellSize + cellSize / 2;
    const y1 = startY + row1 * cellSize + cellSize / 2;
    const x2 = startX + col2 * cellSize + cellSize / 2;
    const y2 = startY + row2 * cellSize + cellSize / 2;

    const drawPieceAt = (piece, fromX, fromY, toX, toY) => {
      if (!piece) return;
      const cx = fromX + (toX - fromX) * t;
      const cy = fromY + (toY - fromY) * t;
      const icon = iconCache[COLOR_INDEX_MAP[piece.color]];
      if (icon) {
        ctx.drawImage(icon, cx - cellSize / 3, cy - cellSize / 3, cellSize * 2 / 3, cellSize * 2 / 3);
      } else {
        ctx.fillStyle = piece.color;
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (piece.special) this._drawSpecialIndicator(ctx, piece, cx, cy, cellSize);
    };

    drawPieceAt(piece1, x1, y1, x2, y2);
    drawPieceAt(piece2, x2, y2, x1, y1);
  }

  _drawDropAnim(ctx, anim, startX, startY, cellSize) {
    const { row, col, targetRow, piece } = anim.data;
    const t = easeOutBounce(anim.progress);
    const startYPos = row === -1 ? startY - cellSize : startY + row * cellSize + cellSize / 2;
    const targetYPos = startY + targetRow * cellSize + cellSize / 2;
    const cx = startX + col * cellSize + cellSize / 2;
    const cy = startYPos + (targetYPos - startYPos) * t;

    const icon = iconCache[COLOR_INDEX_MAP[piece.color]];
    if (icon) {
      ctx.drawImage(icon, cx - cellSize / 3, cy - cellSize / 3, cellSize * 2 / 3, cellSize * 2 / 3);
    } else {
      ctx.fillStyle = piece.color;
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (piece.special) this._drawSpecialIndicator(ctx, piece, cx, cy, cellSize);
  }

  _drawPopAnim(ctx, anim, startX, startY, cellSize) {
    const { row, col } = anim.data;
    const x = startX + col * cellSize;
    const y = startY + row * cellSize;
    const t = easeOutElastic(anim.progress);
    const scale = 1 + t * 0.3;
    const piece = this.game.board[row]?.[col];
    if (!piece) return;
    const icon = iconCache[COLOR_INDEX_MAP[piece.color]];
    if (icon) {
      const shrink = (cellSize / 6) * (scale - 1);
      ctx.drawImage(icon, x + cellSize / 6 - shrink, y + cellSize / 6 - shrink,
        cellSize * 2 / 3 * scale, cellSize * 2 / 3 * scale);
    } else {
      ctx.fillStyle = piece.color;
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 3) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawSpecialAnim(ctx, anim, startX, startY, cellSize) {
    const { row, col, specialType, color } = anim.data;
    const x = startX + col * cellSize;
    const y = startY + row * cellSize;
    const t = easeOutQuad(anim.progress);
    const scale = 1 + t * 2;
    const opacity = 1 - t;

    if (specialType === 'level_up') {
      const game = this.game;
      const flashAlpha = 0.3 * (1 - anim.progress);
      ctx.fillStyle = `rgba(255, 215, 0, ${flashAlpha})`;
      ctx.fillRect(0, 0, game.width, game.height);

      let textScale;
      if (anim.progress < 0.4) {
        textScale = 0.5 + 0.7 * easeOutElastic(anim.progress / 0.4);
      } else {
        textScale = 1.2 - 0.2 * easeOutQuad((anim.progress - 0.4) / 0.6);
      }

      const centerX = game.width / 2;
      const centerY = game.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(textScale, textScale);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold ${this.scaleSize(42)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fillText('LEVEL UP!', 0, 14);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = opacity * 0.9;
      ctx.fillText('LEVEL UP!', -1, 12);
      ctx.restore();
      return;
    }

    ctx.globalAlpha = opacity;
    const icon = iconCache[COLOR_INDEX_MAP[color || '#ffffff']];
    if (icon) {
      const shrink = (cellSize / 6) * (scale - 1);
      ctx.drawImage(icon, x + cellSize / 6 - shrink, y + cellSize / 6 - shrink,
        cellSize * 2 / 3 * scale, cellSize * 2 / 3 * scale);
    } else {
      ctx.fillStyle = color || '#ffffff';
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2) * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    const ringOffset = this.scaleSize(10);
    for (let r = 0; r < 3; r++) {
      ctx.strokeStyle = color || '#ffffff';
      ctx.lineWidth = 2;
      ctx.globalAlpha = opacity * (1 - r * 0.3);
      ctx.beginPath();
      ctx.arc(x + cellSize / 2, y + cellSize / 2, (cellSize / 2 + r * ringOffset) * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ── 主绘制方法 ──

  drawGameBoard(ctx) {
    const game = this.game;
    const size = game.board.length;
    const cellSize = game.cellSize;
    const startX = game.startX;
    const startY = game.startY;

    // 棋盘背景
    const boardWidth = cellSize * size;
    const boardHeight = cellSize * size;
    const pad = this.scaleSize(10);
    ctx.save();
    ctx.shadowColor = 'rgba(75, 85, 99, 0.15)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    drawRoundedRect(ctx, startX - pad, startY - pad, boardWidth + pad * 2, boardHeight + pad * 2, this.scaleSize(20));
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    const animatingCells = this._buildAnimatingCellsSet();

    // 第一趟：网格背景 + 静态棋子  O(cells)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const x = startX + j * cellSize;
        const y = startY + i * cellSize;

        ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);

        if (game.board[i][j] && !animatingCells.has(i + ',' + j)) {
          this._drawStaticPiece(ctx, game.board[i][j], x, y, cellSize);
        }
      }
    }

    // 第二趟：只遍历动画数组  O(animations)
    for (const anim of game.anim.animations) {
      switch (anim.type) {
        case 'elimination': this._drawEliminationAnim(ctx, anim, startX, startY, cellSize); break;
        case 'swap':        this._drawSwapAnim(ctx, anim, startX, startY, cellSize); break;
        case 'drop':        this._drawDropAnim(ctx, anim, startX, startY, cellSize); break;
        case 'pop':         this._drawPopAnim(ctx, anim, startX, startY, cellSize); break;
        case 'special':     this._drawSpecialAnim(ctx, anim, startX, startY, cellSize); break;
      }
    }

    this.drawFloatingScores(ctx);
  }

  drawFloatingScores(ctx) {
    const game = this.game;
    const scores = game.floatingScores;
    if (!scores || scores.length === 0) return;
    const cellSize = game.cellSize;
    const startX = game.startX;
    const startY = game.startY;

    for (let i = 0; i < scores.length; i++) {
      const fs = scores[i];
      const t = easeOutCubic(fs.progress);
      const px = startX + fs.x * cellSize + cellSize / 2;
      const py = startY + fs.y * cellSize - t * this.scaleSize(60);
      const alpha = 1 - fs.progress;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = fs.isChain
        ? `bold ${this.scaleSize(22)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`
        : `bold ${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = fs.isChain ? '#FFD700' : '#10B981';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      const text = fs.isChain ? '连击! +' + fs.score : '+' + fs.score;
      ctx.fillText(text, px, py);
      ctx.restore();
    }
  }

  getButtonRects() {
    const game = this.game;
    if (!this._buttonRects) {
      const btnW = this.scaleSize(100);
      const btnH = this.scaleSize(40);
      const btnY = game.height - this.scaleSize(60);
      this._buttonRects = {
        back:    new LayoutRect(this.scaleSize(40), btnY, btnW, btnH),
        restart: new LayoutRect(game.width - this.scaleSize(40) - btnW, btnY, btnW, btnH),
      };
    }
    return this._buttonRects;
  }

  getGameOverRects() {
    const game = this.game;
    if (!this._gameOverRects) {
      const cardW = game.width * 0.8;
      const cardH = this.scaleSize(300);
      const cardY = (game.height - cardH) / 2;
      const cardBottom = cardY + cardH;
      const btnW = this.scaleSize(200);
      const btnH = this.scaleSize(50);
      const btnX = game.width / 2 - btnW / 2;
      this._gameOverRects = {
        restart: new LayoutRect(btnX, cardBottom + this.scaleSize(15), btnW, btnH),
        home:    new LayoutRect(btnX, cardBottom + this.scaleSize(75), btnW, btnH),
      };
    }
    return this._gameOverRects;
  }

  drawBottomButtons(ctx) {
    const game = this.game;
    const btns = this.getButtonRects();
    const back = btns.back;
    const restart = btns.restart;
    const radius = this.scaleSize(20);

    ctx.save();
    ctx.shadowColor = 'rgba(75, 85, 99, 0.2)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    const backGradient = ctx.createLinearGradient(back.x, back.y, back.x + back.w, back.y);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;

    drawRoundedRect(ctx, back.x, back.y, back.w, back.h, radius);
    ctx.fill();
    ctx.restore();
    if (game.pressedId === 'back') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${this.scaleSize(15)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', back.centerX, back.centerY + 6);

    ctx.save();
    ctx.shadowColor = 'rgba(16, 185, 129, 0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;

    const restartGradient = ctx.createLinearGradient(restart.x, restart.y, restart.x + restart.w, restart.y);
    restartGradient.addColorStop(0, '#10B981');
    restartGradient.addColorStop(1, '#059669');
    ctx.fillStyle = restartGradient;

    drawRoundedRect(ctx, restart.x, restart.y, restart.w, restart.h, radius);
    ctx.fill();
    ctx.restore();
    if (game.pressedId === 'restart') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${this.scaleSize(15)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('重新开始', restart.centerX, restart.centerY + 6);
  }

  drawGameOver(ctx) {
    const game = this.game;
    const progress = Math.min(game._gameOverAnimProgress || 0, 1.0);

    const maskAlpha = 0.7 * easeOutQuad(progress);
    ctx.fillStyle = `rgba(0, 0, 0, ${maskAlpha})`;
    ctx.fillRect(0, 0, game.width, game.height);

    const cardScale = easeOutElastic(progress);
    const cardWidth = game.width * 0.8;
    const cardHeight = this.scaleSize(300);
    const cardX = (game.width - cardWidth) / 2;
    const cardY = (game.height - cardHeight) / 2;
    const cardCenterX = cardX + cardWidth / 2;
    const cardCenterY = cardY + cardHeight / 2;

    ctx.save();
    ctx.translate(cardCenterX, cardCenterY);
    ctx.scale(cardScale, cardScale);
    ctx.translate(-cardCenterX, -cardCenterY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, this.scaleSize(20));
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0D9488';
    ctx.font = `${this.scaleSize(28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(75, 85, 99, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('游戏结束', game.width / 2, cardCenterY - this.scaleSize(40));

    ctx.font = `${this.scaleSize(20)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#1E293B';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;
    ctx.fillText(`最终得分: ${game.score}`, game.width / 2, cardCenterY);
    ctx.fillText(`等级: ${game.level}`, game.width / 2, cardCenterY + this.scaleSize(30));

    ctx.restore();

    const buttonAlpha = easeOutQuad(Math.max(0, (progress - 0.4) / 0.6));
    if (buttonAlpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = buttonAlpha;

    const btns = this.getGameOverRects();
    const restart = btns.restart;
    const home = btns.home;

    const restartGradient = ctx.createLinearGradient(restart.x, restart.y, restart.x + restart.w, restart.y);
    restartGradient.addColorStop(0, '#10B981');
    restartGradient.addColorStop(1, '#059669');
    ctx.fillStyle = restartGradient;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';

    const goBtnRadius = this.scaleSize(25);

    drawRoundedRect(ctx, restart.x, restart.y, restart.w, restart.h, goBtnRadius);
    ctx.fill();
    if (game.pressedId === 'go_restart') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(75, 85, 99, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('重新开始', restart.centerX, restart.centerY + 6);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;

    const homeGradient = ctx.createLinearGradient(home.x, home.y, home.x + home.w, home.y);
    homeGradient.addColorStop(0, '#6B7280');
    homeGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = homeGradient;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';

    drawRoundedRect(ctx, home.x, home.y, home.w, home.h, goBtnRadius);
    ctx.fill();
    if (game.pressedId === 'go_home') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(75, 85, 99, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('返回首页', home.centerX, home.centerY + 6);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetY = 0;

    ctx.restore();
  }

  drawCulturalElements(ctx) {
    const game = this.game;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(game.width * 0.13, game.height * 0.075, this.scaleSize(20), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, game.height - this.scaleSize(80));
    ctx.quadraticCurveTo(game.width / 2, game.height - this.scaleSize(120), game.width, game.height - this.scaleSize(80));
    ctx.stroke();
    ctx.restore();
  }
}

module.exports = Match3Renderer;
