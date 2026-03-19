// 首页 - 适配设计图风格
const DataBus = require('../../databus');
const databus = new DataBus();

class HomePage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    
    // 颜色配置
    this.colors = {
      bg: '#F5F2E9',      // 宣纸背景色
      primary: '#A3262A', // 红色主题
      gold: '#D4AF37',    // 金色点缀
      text: '#333333',    // 深色文字
      border: '#E2D8C0'   // 浅淡边框
    };

    // 交互区域定义
    this.regions = {
      actionButtons: [
        { id: 'tour', text: '线上游览', x: this.width * 0.25, y: 370, r: 45 },
        { id: 'scan', text: '扫码打卡', x: this.width * 0.75, y: 370, r: 45 }
      ],
      listItems: [
        { id: 'info1', text: '老区概况', x: this.width * 0.1 - 25, y: 470, w: 50, h: 130 },
        { id: 'info2', text: '革命旧址', x: this.width * 0.3 - 25, y: 470, w: 50, h: 130 },
        { id: 'info3', text: '烈士纪念碑', x: this.width * 0.5 - 25, y: 470, w: 50, h: 130 },
        { id: 'info4', text: '红色故事', x: this.width * 0.7 - 25, y: 470, w: 50, h: 130 },
        { id: 'info5', text: '文化展览', x: this.width * 0.9 - 25, y: 470, w: 50, h: 130 }
      ],
      gameButtons: [
        { id: 'match3', text: '三色消消乐', x: this.width * 0.2 - 50, y: 650, w: 100, h: 90, color: '#DC2626' },
        { id: 'puzzle', text: '三色拼图', x: this.width * 0.5 - 50, y: 650, w: 100, h: 90, color: '#D97706' },
        { id: 'quiz', text: '三色答题', x: this.width * 0.8 - 50, y: 650, w: 100, h: 90, color: '#1D4ED8' }
      ]
    };

    this.selectedId = null;
  }

  render(ctx) {
    // 1. 全局背景
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. 绘制顶部Banner (红色卷轴风格)
    this.drawTopBanner(ctx);

    // 3. 绘制"红色行动"板块
    this.drawSectionHeader(ctx, '红色行动', 270);
    this.drawActionButtons(ctx);

    // 4. 绘制"红色清单"板块
    this.drawSectionHeader(ctx, '红色清单', 450);
    this.drawVerticalList(ctx);

    // 5. 绘制"三色演武场"板块 (游戏区)
    this.drawSectionHeader(ctx, '三色演武场', 630);
    this.drawGameEntry(ctx);
  }

  // 绘制带有传统装饰的标题
  drawSectionHeader(ctx, title, y) {
    ctx.textAlign = 'center';
    ctx.fillStyle = this.colors.primary;
    ctx.font = 'bold 16px sans-serif';
    
    // 绘制标题旁边的装饰线
    const textWidth = ctx.measureText(title).width;
    ctx.strokeStyle = this.colors.primary;
    ctx.lineWidth = 1;
    
    // 左装饰
    ctx.beginPath();
    ctx.moveTo(this.width / 2 - textWidth / 2 - 40, y);
    ctx.lineTo(this.width / 2 - textWidth / 2 - 10, y);
    ctx.stroke();
    
    // 标题文字
    ctx.fillText(title, this.width / 2, y + 6);
    
    // 右装饰
    ctx.beginPath();
    ctx.moveTo(this.width / 2 + textWidth / 2 + 10, y);
    ctx.lineTo(this.width / 2 + textWidth / 2 + 40, y);
    ctx.stroke();
  }

  drawTopBanner(ctx) {
    const margin = 15;
    const bannerH = 160;
    
    // 红色背景底色
    ctx.fillStyle = this.colors.primary;
    this.drawRoundRect(ctx, margin, 90, this.width - margin * 2, bannerH, 10, true);
    
    // 模拟建筑插画区域 (中间白色或浅色)
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(margin + 10, 100, this.width - margin * 2 - 20, bannerH - 40);
    
    // 文字标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('海澄村革命老区概况', this.width / 2, 125);

    // 绘制底部三个小标签 (设计图上卷轴下方的三个小标题)
    const labels = ['历史起源', '主要事迹', '精神传承'];
    ctx.font = '12px sans-serif';
    labels.forEach((text, i) => {
      ctx.fillText(text, (this.width / 4) * (i + 1), 225);
    });
  }

  drawActionButtons(ctx) {
    this.regions.actionButtons.forEach(btn => {
      // 绘制圆形外框
      ctx.strokeStyle = this.colors.primary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2);
      ctx.stroke();
      
      // 内部填充
      ctx.fillStyle = btn.id === 'scan' ? this.colors.primary : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(btn.x, btn.y, btn.r - 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 文字
      ctx.fillStyle = btn.id === 'scan' ? '#FFFFFF' : this.colors.primary;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(btn.text, btn.x, btn.y + 5);
    });
  }

  drawVerticalList(ctx) {
    ctx.font = '16px serif';
    this.regions.listItems.forEach(item => {
      // 绘制竖向矩形
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = this.colors.border;
      this.drawRoundRect(ctx, item.x, item.y, item.w, item.h, 6, true, true);
      
      // 竖排文字
      ctx.fillStyle = this.colors.text;
      const chars = item.text.split('');
      chars.forEach((c, i) => {
        ctx.fillText(c, item.x + item.w / 2, item.y + 30 + i * 20);
      });
    });
  }

  drawGameEntry(ctx) {
    this.regions.gameButtons.forEach(game => {
      // 游戏方块背景
      ctx.fillStyle = game.color;
      this.drawRoundRect(ctx, game.x, game.y, game.w, game.h, 8, true);
      
      // 装饰小图标 (简单模拟)
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.arc(game.x + game.w/2, game.y + 40, 18, 0, Math.PI*2);
      ctx.fill();

      // 游戏名称
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px sans-serif';
      ctx.fillText(game.text, game.x + game.w / 2, game.y + game.h - 12);
    });
  }

  drawBottomNotice(ctx) {
    const y = this.height - 40;
    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(0, y, this.width, 40);
    
    // 文字
    ctx.fillStyle = this.colors.primary;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏆 恭喜用户 XXX 获得“红色传承人”勋章', 20, y + 25);
  }

  // 工具方法：绘制圆角矩形
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

    // 检查动作按钮 (圆形)
    this.regions.actionButtons.forEach(btn => {
      const dist = Math.sqrt((x - btn.x) ** 2 + (y - btn.y) ** 2);
      if (dist < btn.r) this.selectedId = btn.id;
    });

    // 检查游戏按钮 (矩形)
    this.regions.gameButtons.forEach(btn => {
      if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
        this.selectedId = btn.id;
      }
    });

    // 检查清单项 (矩形)
    this.regions.listItems.forEach(btn => {
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
          this.selectedId = btn.id;
        }
      });
  }

  handleTouchEnd(e) {
    if (this.selectedId) {
      console.log('Navigate to:', this.selectedId);
      this.navigateToPage(this.selectedId);
      this.selectedId = null;
    }
  }

  navigateToPage(id) {
    // 保持原有逻辑并扩展
    const app = GameGlobal.app;
    if (!app || !app.showPage) return;

    if (['match3', 'puzzle', 'quiz'].includes(id)) {
      app.showPage(id);
    } else if (id === 'scan') {
      this.scanQRCode();
    } else {
      // 处理其他页面跳转，如详情页
      wx.showToast({ title: '详情开发中', icon: 'none' });
    }
  }

  scanQRCode() {
    wx.scanCode({
      onlyFromCamera: true,
      success: () => wx.showToast({ title: '打卡成功', icon: 'success' })
    });
  }

  destroy() {}
}

module.exports = HomePage;