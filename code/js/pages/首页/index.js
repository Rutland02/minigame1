const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class HomePage extends BasePage {
  constructor() {
    super();

    this.assets = {};
    this.loadAssets();

    this.colors = {
      primaryText: '#0F172A',
      subText: '#475569',
      white: '#FFFFFF',
      primaryButton: '#DC2626',
      greenCard: '#86EFAC',
      yellowCard: '#FDE047',
      blueCard: '#93C5FD',
      cardBorder: '#E2E8F0',
      shadow: 'rgba(0, 0, 0, 0.15)'
    };

    this.regions = {
      userCenter: { x: this.scaleSize(20), y: this.scaleSize(40), w: this.scaleSize(150), h: this.scaleSize(60) },

      gameButtons: [
        { id: 'match3', iconId: 'match3', text: '消消乐', sub: '精彩糖巧，轻松消乐！', x: this.scaleSize(25), y: this.height * 0.20, w: this.width - this.scaleSize(50), h: this.scaleSize(80), color: this.colors.greenCard },
        { id: 'puzzle', iconId: 'puzzle', text: '三色拼图', sub: '精彩拼补，三色拼图！', x: this.scaleSize(25), y: this.height * 0.35, w: this.width - this.scaleSize(50), h: this.scaleSize(80), color: this.colors.yellowCard },
        { id: 'quiz', iconId: 'quiz', text: '三色答题', sub: '相约数字，趣味答题！', x: this.scaleSize(25), y: this.height * 0.50, w: this.width - this.scaleSize(50), h: this.scaleSize(80), color: this.colors.blueCard }
      ],

      actionButtons: [
        { id: 'scan', iconId: 'scan', text: '扫码打卡', x: this.width * 0.2, y: this.height * 0.72, r: this.scaleSize(35) },
        { id: 'tour', iconId: 'tour', text: '线上游览', x: this.width * 0.5, y: this.height * 0.72, r: this.scaleSize(35) },
        { id: 'achievement', iconId: 'achievement', text: '成就系统', x: this.width * 0.8, y: this.height * 0.72, r: this.scaleSize(35) }
      ]
    };

    // 排行榜按钮（位于 actionButtons 区域下方）
    this.leaderboardButton = new LayoutRect(
      (this.width - this.scaleSize(160)) / 2, this.height - this.scaleSize(70), this.scaleSize(160), this.scaleSize(44)
    );

    this.selectedId = null;

    // A-2: 难度选择浮层状态
    this.showDifficultyDialog = false;
    this.difficultyButtons = {};

    // A-5: 排行榜浮层状态
    this.showLeaderboard = false;

    this.showTutorial = !this.databus.hasSeenTutorial;
    this.tutorialPage = 0;
    this.tutorialPages = [
      { title: '欢迎来到海澄村', text: '探索三色文化，感受数字赋能的魅力', icon: '🏘️' },
      { title: '三大趣味游戏', text: '消消乐、拼图、答题，寓教于乐', icon: '🎮' },
      { title: '收集成就', text: '完成挑战，解锁成就，获得专属证书', icon: '🏆' }
    ];
  }

  loadAssets() {
    const iconMap = {
      match3: 'images/page/home/icon_0000_match3.png',
      puzzle: 'images/page/home/icon_0001_puzzle.png',
      quiz: 'images/page/home/icon_0002_quiz.png',
      scan: 'images/page/home/icon_0003_scan.png',
      tour: 'images/page/home/icon_0004_virtual_tour.png',
      achievement: 'images/page/home/icon_0005_achievements.png'
    };

    Object.keys(iconMap).forEach(key => {
      const img = (typeof wx !== 'undefined' && wx.createImage) ? wx.createImage() : new Image();
      img.onload = () => {
        this.assets[key] = img;
      };
      img.onerror = (e) => { console.error(`Failed to load: ${key}`, e); };
      img.src = iconMap[key];
    });
  }

  render(ctx) {
    this.drawBackground(ctx);
    this._drawUserCenter(ctx);
    this.drawGameCards(ctx);
    this.drawCircleActions(ctx);
    this._drawLeaderboardButton(ctx);
    if (this.showDifficultyDialog) {
      this._drawDifficultyDialog(ctx);
    }
    if (this.showLeaderboard) {
      this._drawLeaderboard(ctx);
    }
    if (this.showTutorial) {
      this.drawTutorial(ctx);
    }
  }

  drawBackground(ctx) {
    super.drawBackground(ctx, '#E1F5FE', '#E1F5FE');
  }

  drawGameCards(ctx) {
    ctx.imageSmoothingEnabled = false;
    this.regions.gameButtons.forEach(game => {
      if (this.assets[game.iconId]) {
        ctx.drawImage(this.assets[game.iconId], game.x, game.y, game.w, game.h);
      }
    });
    ctx.imageSmoothingEnabled = true;
  }

  drawCircleActions(ctx) {
    const btns = this.regions.actionButtons;
    const pad = this.scaleSize(10);
    const maxR = Math.max(...btns.map(b => b.r));
    const boxX = btns[0].x - maxR - pad;
    const boxY = btns[0].y - maxR - pad;
    const boxW = btns[btns.length - 1].x - btns[0].x + (maxR + pad) * 2;
    const boxH = maxR * 2 + pad * 2 + this.scaleSize(30);

    ctx.save();
    ctx.shadowColor = 'rgba(100, 150, 220, 0.18)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = this.colors.white;
    drawRoundedRect(ctx, boxX, boxY, boxW, boxH, this.scaleSize(20));
    ctx.fill();
    ctx.restore();

    ctx.imageSmoothingEnabled = false;
    btns.forEach(btn => {
      ctx.save();
      ctx.shadowColor = 'rgba(100, 150, 220, 0.12)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.white;
      ctx.fill();
      ctx.strokeStyle = this.colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (this.assets[btn.iconId]) {
        const imgSize = btn.r * 2 - this.scaleSize(10);
        const imgOffset = imgSize / 2;
        ctx.drawImage(this.assets[btn.iconId], btn.x - imgOffset, btn.y - imgOffset, imgSize, imgSize);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = this.colors.primaryText;
      ctx.font = `bold ${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(btn.text, btn.x, btn.y + btn.r + this.scaleSize(15));
    });
    ctx.imageSmoothingEnabled = true;
  }

  drawTutorial(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cardW = this.width * 0.8;
    const cardH = this.height * 0.5;
    const cardX = (this.width - cardW) / 2;
    const cardY = (this.height - cardH) / 2;

    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, this.scaleSize(20));
    ctx.fill();

    const page = this.tutorialPages[this.tutorialPage];

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${this.scaleSize(80)}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(page.icon, this.width / 2, cardY + cardH * 0.25);

    ctx.fillStyle = '#0F172A';
    ctx.font = `bold ${this.scaleSize(24)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(page.title, this.width / 2, cardY + cardH * 0.45);

    ctx.fillStyle = '#475569';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText(page.text, this.width / 2, cardY + cardH * 0.55);

    const btnW = this.scaleSize(200);
    const btnH = this.scaleSize(44);
    const btnX = (this.width - btnW) / 2;
    const btnY = cardY + cardH - this.scaleSize(80);
    const gradient = ctx.createLinearGradient(btnX, btnY, btnX + btnW, btnY + btnH);
    gradient.addColorStop(0, '#DC2626');
    gradient.addColorStop(1, '#B91C1C');
    ctx.fillStyle = gradient;
    drawRoundedRect(ctx, btnX, btnY, btnW, btnH, this.scaleSize(22));
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    const btnText = this.tutorialPage < this.tutorialPages.length - 1 ? '下一步' : '开始体验';
    ctx.fillText(btnText, this.width / 2, btnY + btnH / 2 + 1);

    const dotY = cardY + cardH - this.scaleSize(30);
    const dotSpacing = this.scaleSize(20);
    const dotsStartX = this.width / 2 - dotSpacing;
    for (let i = 0; i < this.tutorialPages.length; i++) {
      ctx.beginPath();
      ctx.arc(dotsStartX + i * dotSpacing, dotY, this.scaleSize(4), 0, Math.PI * 2);
      ctx.fillStyle = i === this.tutorialPage ? '#DC2626' : '#CBD5E1';
      ctx.fill();
    }

    ctx.restore();
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;

    if (this.showTutorial) {
      if (this.tutorialPage < this.tutorialPages.length - 1) {
        this.tutorialPage++;
      } else {
        this.databus.markTutorialSeen();
        this.showTutorial = false;
      }
      return;
    }

    // A-2: 难度选择浮层优先处理
    if (this.showDifficultyDialog) {
      this._handleDifficultyTouch(x, y);
      return;
    }

    // A-5: 排行榜浮层优先处理
    if (this.showLeaderboard) {
      this.showLeaderboard = false;
      return;
    }

    this.regions.gameButtons.forEach(btn => {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this.selectedId = btn.id;
      }
    });
    this.regions.actionButtons.forEach(btn => {
      const dist = Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2);
      if (dist < btn.r + this.scaleSize(10)) this.selectedId = btn.id;
    });

    // A-5: 排行榜按钮触摸判定
    if (this.leaderboardButton.contains(x, y)) {
      this.selectedId = 'leaderboard';
    }
  }

  handleTouchEnd(e) {
    if (this.selectedId) {
      this.navigateToPage(this.selectedId);
      this.selectedId = null;
    }
  }

  navigateToPage(id) {
    const app = this.app;
    if (!app || !app.showPage) return;
    if (['match3', 'puzzle', 'achievement'].includes(id)) {
      app.showPage(id);
    } else if (id === 'quiz') {
      // A-2: 弹出难度选择浮层
      this.showDifficultyDialog = true;
    } else if (id === 'leaderboard') {
      // A-5: 弹出排行榜浮层
      this.showLeaderboard = true;
    } else if (id === 'scan') {
      wx.scanCode({
        onlyFromCamera: true,
        scanType: ['qrCode'],
        success: (res) => {
          console.log('扫码结果:', res);
          wx.showToast({
            title: '打卡成功！',
            icon: 'success',
            duration: 1500
          });
          this.databus.unlockAchievement('check_in_master');
        },
        fail: (err) => {
          console.error('扫码失败:', err);
          if (!err.errMsg.includes('cancel')) {
            wx.showToast({
              title: '扫码失败，请重试',
              icon: 'none',
              duration: 2000
            });
          }
        }
      });
    } else if (id === 'tour') {
      // A-11: 复制 URL 到剪贴板（隐私授权由全局 onNeedPrivacyAuthorization 处理）
      const url = 'https://www.kuleiman.com/tv/183553/index.html';
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none', duration: 3000 });
        },
        fail: (err) => {
          console.error('复制链接失败:', err);
          wx.showToast({ title: '复制失败，请手动访问', icon: 'none', duration: 3000 });
        }
      });
    }
  }

  // A-2: 难度选择触摸处理
  _handleDifficultyTouch(x, y) {
    for (const [key, btn] of Object.entries(this.difficultyButtons)) {
      if (btn.contains(x, y)) {
        this.showDifficultyDialog = false;
        this.app.showPage('quiz', key);
        return;
      }
    }
    // 点击浮层外部关闭
    this.showDifficultyDialog = false;
  }

  // A-4: 用户中心绘制
  _drawUserCenter(ctx) {
    const region = this.regions.userCenter;
    const userInfo = this.databus.getUserInfo();
    const totalScore = this.databus.getTotalScore();

    // 背景卡片
    ctx.save();
    ctx.shadowColor = 'rgba(100, 150, 220, 0.15)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    drawRoundedRect(ctx, region.x, region.y, region.w, region.h, this.scaleSize(15));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.restore();
    drawRoundedRect(ctx, region.x, region.y, region.w, region.h, this.scaleSize(15));
    ctx.strokeStyle = this.colors.cardBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 头像占位圆
    const avatarR = this.scaleSize(20);
    const avatarX = region.x + this.scaleSize(30);
    const avatarY = region.y + region.h / 2;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
    ctx.fillStyle = '#3B82F6';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userInfo ? (userInfo.nickName ? userInfo.nickName[0] : '用') : '用', avatarX, avatarY);

    // 昵称
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = this.colors.primaryText;
    ctx.font = `bold ${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    const displayName = userInfo ? (userInfo.nickName || '用户') : '用户';
    ctx.fillText(displayName, region.x + this.scaleSize(60), region.y + region.h * 0.38);

    // 总积分
    ctx.fillStyle = this.colors.subText;
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('积分: ' + totalScore, region.x + this.scaleSize(60), region.y + region.h * 0.7);
  }

  // A-5: 排行榜按钮绘制
  _drawLeaderboardButton(ctx) {
    const btn = this.leaderboardButton;
    const gradient = ctx.createLinearGradient(btn.x, btn.y, btn.x + btn.w, btn.y + btn.h);
    gradient.addColorStop(0, '#0D9488');
    gradient.addColorStop(1, '#0F766E');
    drawRoundedRect(ctx, btn.x, btn.y, btn.w, btn.h, this.scaleSize(22));
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('挑战记录', btn.centerX, btn.centerY);
    ctx.textBaseline = 'alphabetic';
  }

  // A-2: 难度选择浮层绘制
  _drawDifficultyDialog(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const dlgW = this.width * 0.8;
    const dlgH = this.height * 0.5;
    const dlgX = (this.width - dlgW) / 2;
    const dlgY = (this.height - dlgH) / 2;

    // 卡片背景
    drawRoundedRect(ctx, dlgX, dlgY, dlgW, dlgH, this.scaleSize(20));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
    ctx.fill();

    // 标题
    ctx.fillStyle = this.colors.primaryText;
    ctx.font = `bold ${this.scaleSize(22)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('选择难度', this.width / 2, dlgY + dlgH * 0.14);

    // 难度按钮
    const levels = [
      { key: 'easy', label: '简单 (5题 30s)', color: '#10B981' },
      { key: 'medium', label: '普通 (8题 25s)', color: '#F59E0B' },
      { key: 'hard', label: '困难 (10题 20s)', color: '#EF4444' },
    ];

    this.difficultyButtons = {};
    const btnH = this.scaleSize(50);
    const btnSpacing = this.scaleSize(60);
    levels.forEach((lv, i) => {
      const btnY = dlgY + dlgH * 0.28 + i * btnSpacing;
      const btn = new LayoutRect(dlgX + this.scaleSize(30), btnY, dlgW - this.scaleSize(60), btnH);
      this.difficultyButtons[lv.key] = btn;

      drawRoundedRect(ctx, btn.x, btn.y, btn.w, btn.h, this.scaleSize(25));
      ctx.fillStyle = lv.color;
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = `bold ${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(lv.label, btn.centerX, btn.centerY);
    });

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // A-5: 排行榜浮层绘制
  _drawLeaderboard(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const dlgW = this.width * 0.8;
    const dlgH = this.height * 0.5;
    const dlgX = (this.width - dlgW) / 2;
    const dlgY = (this.height - dlgH) / 2;

    // 卡片背景
    drawRoundedRect(ctx, dlgX, dlgY, dlgW, dlgH, this.scaleSize(20));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.97)';
    ctx.fill();

    // 标题
    ctx.fillStyle = this.colors.primaryText;
    ctx.font = `bold ${this.scaleSize(22)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('挑战记录', this.width / 2, dlgY + dlgH * 0.12);

    // 获取成绩数据
    const match3Scores = this.databus.getMatch3Scores();
    const puzzleScores = this.databus.getPuzzleScores();
    const quizScores = this.databus.getQuizScores();

    const items = [
      { label: '消消乐最高分', value: match3Scores.highestScore ? match3Scores.highestScore + ' 分' : '暂无记录', color: '#10B981' },
      { label: '拼图最佳时间', value: this._formatPuzzleBestTime(puzzleScores.bestTime), color: '#F59E0B' },
      { label: '答题最高分', value: quizScores.bestScore ? quizScores.bestScore + ' 分' : '暂无记录', color: '#3B82F6' },
    ];

    const itemSpacing = dlgH * 0.22;
    items.forEach((item, i) => {
      const itemY = dlgY + dlgH * 0.25 + i * itemSpacing;
      const itemX = dlgX + this.scaleSize(20);
      const itemW = dlgW - this.scaleSize(40);
      const itemH = this.scaleSize(60);

      drawRoundedRect(ctx, itemX, itemY, itemW, itemH, this.scaleSize(12));
      ctx.fillStyle = '#F8FAFC';
      ctx.fill();
      ctx.strokeStyle = this.colors.cardBorder;
      ctx.lineWidth = 1;
      ctx.stroke();

      // 左侧色条
      drawRoundedRect(ctx, itemX, itemY, this.scaleSize(4), itemH, this.scaleSize(2));
      ctx.fillStyle = item.color;
      ctx.fill();

      // 标签
      ctx.textAlign = 'left';
      ctx.fillStyle = this.colors.subText;
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(item.label, itemX + this.scaleSize(16), itemY + itemH * 0.38);

      // 值
      ctx.fillStyle = this.colors.primaryText;
      ctx.font = `bold ${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillText(item.value, itemX + this.scaleSize(16), itemY + itemH * 0.75);
    });

    // 提示关闭
    ctx.textAlign = 'center';
    ctx.fillStyle = this.colors.subText;
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('点击任意位置关闭', this.width / 2, dlgY + dlgH - this.scaleSize(20));

    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // 格式化拼图最佳时间
  _formatPuzzleBestTime(bestTime) {
    if (!bestTime) return '暂无记录';
    const times = Object.values(bestTime).filter(t => t != null);
    if (times.length === 0) return '暂无记录';
    const best = Math.min(...times);
    if (best >= 60) {
      const mins = Math.floor(best / 60);
      const secs = best % 60;
      return mins + '分' + secs + '秒';
    }
    return best + '秒';
  }

}

module.exports = HomePage;