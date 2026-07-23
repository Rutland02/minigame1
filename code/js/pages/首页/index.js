const { drawRoundedRect } = require('../../utils/canvasUtils');
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

    const baseW = 375; 
    const scale = this.width / baseW;

    this.regions = {
      userCenter: { x: 20 * scale, y: 40, w: 150 * scale, h: 60 },
      
      gameButtons: [
        { id: 'match3', iconId: 'match3', text: '消消乐', sub: '精彩糖巧，轻松消乐！', x: 25 * scale, y: 180, w: 325 * scale, h: 80, color: this.colors.greenCard },
        { id: 'puzzle', iconId: 'puzzle', text: '三色拼图', sub: '精彩拼补，三色拼图！', x: 25 * scale, y: 280, w: 325 * scale, h: 80, color: this.colors.yellowCard },
        { id: 'quiz', iconId: 'quiz', text: '三色答题', sub: '相约数字，趣味答题！', x: 25 * scale, y: 380, w: 325 * scale, h: 80, color: this.colors.blueCard }
      ],
      
      actionButtons: [
        { id: 'scan', iconId: 'scan', text: '扫码打卡', x: 80 * scale, y: 640, r: 35 },
        { id: 'tour', iconId: 'tour', text: '线上游览', x: 187 * scale, y: 640, r: 35 },
        { id: 'achievement', iconId: 'achievement', text: '成就系统', x: 295 * scale, y: 640, r: 35 }
      ]
    };

    this.selectedId = null;
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
      const img = wx.createImage();
      img.onload = () => {
        this.assets[key] = img;
      };
      img.onerror = (e) => { console.error(`Failed to load: ${key}`, e); };
      img.src = iconMap[key];
    });
  }

  render(ctx) {
    this.drawBackground(ctx);
    this.drawUserInfo(ctx);
    this.drawGameCards(ctx);
    this.drawCircleActions(ctx);
  }

  drawBackground(ctx) {
    super.drawBackground(ctx, '#E1F5FE', '#E1F5FE');
  }

  drawUserInfo(ctx) {
  }

  drawGameCards(ctx) {
    this.regions.gameButtons.forEach(game => {
      if (this.assets[game.iconId]) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.assets[game.iconId], game.x, game.y, game.w, game.h);
        ctx.imageSmoothingEnabled = true;
      }
    });
  }

  drawCircleActions(ctx) {
    ctx.save();
    ctx.shadowColor = this.colors.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = this.colors.white;
    drawRoundedRect(ctx, 25, 610, this.width - 50, 120, 20);
    ctx.fill();
    ctx.restore();

    this.regions.actionButtons.forEach(btn => {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.white;
      ctx.fill();
      ctx.strokeStyle = this.colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      if (this.assets[btn.iconId]) {
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(this.assets[btn.iconId], btn.x - 30, btn.y - 30, 60, 60);
        ctx.imageSmoothingEnabled = true;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = this.colors.primaryText;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(btn.text, btn.x, btn.y + 50);
    });
  }

  handleTouchStart(e) {
    const touch = e.touches[0];
    const { clientX: x, clientY: y } = touch;
    this.regions.gameButtons.forEach(btn => {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this.selectedId = btn.id;
      }
    });
    this.regions.actionButtons.forEach(btn => {
      const dist = Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2);
      if (dist < 40) this.selectedId = btn.id;
    });
  }

  handleTouchEnd(e) {
    if (this.selectedId) {
      this.navigateToPage(this.selectedId);
      this.selectedId = null;
    }
  }

  navigateToPage(id) {
    const app = GameGlobal.app;
    if (!app || !app.showPage) return;
    if (['match3', 'puzzle', 'quiz', 'achievement'].includes(id)) {
      app.showPage(id);
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
          GameGlobal.databus.unlockAchievement('check_in_master');
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
      console.log('显示线上游览链接');
      const url = 'https://www.kuleiman.com/tv/183553/index.html';
      
      wx.showModal({
        title: '线上游览',
        content: '请复制以下链接到浏览器打开:\n' + url,
        showCancel: false,
        confirmText: '确定'
      });
    }
  }

}

module.exports = HomePage;