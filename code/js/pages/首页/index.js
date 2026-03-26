// 首页 - 适配现代插画设计图风格
const DataBus = require('../../databus');
const databus = new DataBus();

class HomePage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.pixelRatio = wx.getSystemInfoSync().pixelRatio || 1;
    
    // 背景图与素材加载容器
    this.assets = {};
    this.loadAssets();
    
    // 颜色配置 - 优化对比度和可读性
    this.colors = {
      primaryText: '#0F172A',      // 深 slate-900，确保高对比度
      subText: '#475569',          // slate-600，次要文字
      white: '#FFFFFF',
      primaryButton: '#DC2626',    // 更鲜艳的红色
      greenCard: '#86EFAC',        // 更鲜艳的绿色
      yellowCard: '#FDE047',       // 更鲜艳的黄色
      blueCard: '#93C5FD',         // 更鲜艳的蓝色
      cardBorder: '#E2E8F0',       // 卡片边框色
      shadow: 'rgba(0, 0, 0, 0.15)' // 阴影色
    };

    const baseW = 375; 
    const scale = this.width / baseW;

    // 定义区域与图标 ID 映射
    this.regions = {
      userCenter: { x: 20 * scale, y: 40, w: 150 * scale, h: 60 },
      
      gameButtons: [
        { id: 'match3', iconId: 'match3', text: '消消乐', sub: '精彩糖巧，清洁消乐！', x: 25 * scale, y: 180, w: 325 * scale, h: 80, color: this.colors.greenCard },
        { id: 'puzzle', iconId: 'puzzle', text: '三色拼图', sub: '精彩缝补，三色拼图！', x: 25 * scale, y: 280, w: 325 * scale, h: 80, color: this.colors.yellowCard },
        { id: 'quiz', iconId: 'quiz', text: '三色答题', sub: '详漫数字，问答答题！', x: 25 * scale, y: 380, w: 325 * scale, h: 80, color: this.colors.blueCard }
      ],
      
      actionButtons: [
        { id: 'scan', iconId: 'scan', text: '扫码打卡', x: 80 * scale, y: 640, r: 35 },
        { id: 'tour', iconId: 'tour', text: '线上游览', x: 187 * scale, y: 640, r: 35 },
        { id: 'achievement', iconId: 'achievement', text: '成就系统', x: 295 * scale, y: 640, r: 35 }
      ],

      notice: { x: 25 * scale, y: 760, w: 325 * scale, h: 45 }
    };

    this.selectedId = null;
  }

  loadAssets() {
    // 1. 定义背景图
    const bg = wx.createImage();
    bg.onload = () => { this.assets.bg = bg; };
    bg.src = 'images/ui/bg2.jpg';

    // 2. 定义图标映射表（使用你提供的最新英文路径）
    const iconMap = {
      match3: 'images/page/home/icon_0000_match3.png',
      puzzle: 'images/page/home/icon_0001_puzzle.png',
      quiz: 'images/page/home/icon_0002_quiz.png',
      scan: 'images/page/home/icon_0003_scan.png',
      tour: 'images/page/home/icon_0004_virtual_tour.png',
      achievement: 'images/page/home/icon_0005_achievements.png'
    };

    // 3. 批量加载图标
    Object.keys(iconMap).forEach(key => {
      const img = wx.createImage();
      img.onload = () => { 
        this.assets[key] = img; 
        console.log(`Resource Loaded: ${key}`); 
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
    this.drawBottomNotice(ctx);
  }

  drawBackground(ctx) {
    if (this.assets.bg) {
      ctx.drawImage(this.assets.bg, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#E1F5FE';
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  drawUserInfo(ctx) {
    // 移除顶部文字和个人中心文字
  }

  drawGameCards(ctx) {
    this.regions.gameButtons.forEach(game => {
      // 直接绘制游戏图标，完全覆盖按钮区域
      if (this.assets[game.iconId]) {
        ctx.imageSmoothingEnabled = false; // 禁用图像平滑，保持锐利
        ctx.drawImage(this.assets[game.iconId], game.x, game.y, game.w, game.h);
        ctx.imageSmoothingEnabled = true;
      }
    });
  }

  drawCircleActions(ctx) {
    // 绘制底部功能区白色背板 - 添加阴影增强层次感
    ctx.save();
    ctx.shadowColor = this.colors.shadow;
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = this.colors.white;
    this.drawRoundRect(ctx, 25, 610, this.width - 50, 120, 20, true);
    ctx.restore();

    this.regions.actionButtons.forEach(btn => {
      // 绘制圆形图标背景 - 增强清晰度
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;
      
      // 绘制圆形背景
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, 35, 0, Math.PI * 2);
      ctx.fillStyle = this.colors.white;
      ctx.fill();
      ctx.strokeStyle = this.colors.cardBorder;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // 绘制圆形图标 - 禁用图像平滑保持清晰度
      if (this.assets[btn.iconId]) {
        ctx.imageSmoothingEnabled = false; // 禁用图像平滑，保持锐利
        ctx.drawImage(this.assets[btn.iconId], btn.x - 30, btn.y - 30, 60, 60);
        ctx.imageSmoothingEnabled = true;
      }

      // 绘制标签文字 - 优化字体
      ctx.textAlign = 'center';
      ctx.fillStyle = this.colors.primaryText;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(btn.text, btn.x, btn.y + 50);
    });
  }

  drawBottomNotice(ctx) {
    const n = this.regions.notice;
    
    // 添加阴影增强按钮视觉效果
    ctx.save();
    ctx.shadowColor = 'rgba(220, 38, 38, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = this.colors.primaryButton;
    this.drawRoundRect(ctx, n.x, n.y, n.w, n.h, 22, true);
    ctx.restore();
    
    // 绘制通知文字 - 优化字体
    ctx.fillStyle = this.colors.white;
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('最新活动：海澄村秋季丰收节，答题赢好礼！', n.x + 20, n.y + 28);
  }

  drawRoundRect(ctx, x, y, w, h, r, fill = false, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
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
      wx.scanCode({ success: () => wx.showToast({ title: '打卡成功' }) });
    } else if (id === 'tour') {
      console.log('开始打开线上游览链接');
      if (typeof wx.openUrl === 'function') {
        console.log('wx.openUrl 方法存在');
        wx.openUrl({
          url: 'https://www.kuleiman.com/tv/183553/index.html',
          success: function(res) {
            console.log('打开网页成功:', res);
          },
          fail: function(res) {
            console.log('打开网页失败:', res);
            wx.showToast({ title: '跳转失败，请检查网络或稍后重试', icon: 'none' });
          }
        });
      } else {
        console.log('wx.openUrl 方法不存在');
        wx.showToast({ title: '当前环境不支持打开链接', icon: 'none' });
      }
    }
  }

  destroy() {}
}

module.exports = HomePage;