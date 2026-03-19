// 首页
const DataBus = require('../../databus');

const databus = new DataBus();

class HomePage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.buttons = [
      {
        id: 'match3',
        text: '三色消消乐',
        x: this.width / 2 - 100,
        y: this.height / 2 - 120,
        width: 200,
        height: 60
      },
      {
        id: 'puzzle',
        text: '三色拼图',
        x: this.width / 2 - 100,
        y: this.height / 2 - 40,
        width: 200,
        height: 60
      },
      {
        id: 'quiz',
        text: '三色答题',
        x: this.width / 2 - 100,
        y: this.height / 2 + 40,
        width: 200,
        height: 60
      },
      {
        id: 'achievement',
        text: '成就系统',
        x: this.width / 2 - 100,
        y: this.height / 2 + 120,
        width: 200,
        height: 60
      }
    ];
    this.selectedButton = null;
  }

  render(ctx) {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#2563EB');
    gradient.addColorStop(1, '#3B82F6');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.font = '32px Inter, Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillText('三色融澄·数字赋能', this.width / 2, 80);
    ctx.shadowBlur = 0;

    // 绘制用户信息区域
    this.drawUserInfo(ctx);

    // 绘制游戏按钮
    this.drawGameButtons(ctx);

    // 绘制文化元素装饰
    this.drawCulturalElements(ctx);
  }

  drawUserInfo(ctx) {
    const userInfo = databus.getUserInfo();
    if (userInfo) {
      // 绘制用户信息卡片
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      // 绘制圆角矩形
      const x = 20;
      const y = 100;
      const width = this.width - 40;
      const height = 80;
      const radius = 15;
      
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
      ctx.lineTo(x + radius, y + height);
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
      ctx.lineTo(x, y + radius);
      ctx.arcTo(x, y, x + radius, y, radius);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();

      // 绘制用户头像
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(60, y + 40, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '24px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText(userInfo.nickName.charAt(0), 60, y + 45);
      ctx.restore();
      
      // 绘制用户昵称
      ctx.font = '18px Inter, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`欢迎，${userInfo.nickName}`, 110, y + 35);
      
      // 绘制总积分
      const totalScore = databus.getTotalScore();
      ctx.font = '16px Inter, Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(`总积分: ${totalScore}`, 110, y + 65);
    }
  }

  drawGameButtons(ctx) {
    this.buttons.forEach(buttonData => {
      // 按钮背景
      const gradient = ctx.createLinearGradient(buttonData.x, buttonData.y, buttonData.x + buttonData.width, buttonData.y);
      gradient.addColorStop(0, buttonData.id === this.selectedButton ? '#10B981' : '#3B82F6');
      gradient.addColorStop(1, buttonData.id === this.selectedButton ? '#059669' : '#2563EB');
      ctx.fillStyle = gradient;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      // 绘制圆角矩形
      const radius = 30;
      ctx.beginPath();
      ctx.moveTo(buttonData.x + radius, buttonData.y);
      ctx.lineTo(buttonData.x + buttonData.width - radius, buttonData.y);
      ctx.arcTo(buttonData.x + buttonData.width, buttonData.y, buttonData.x + buttonData.width, buttonData.y + radius, radius);
      ctx.lineTo(buttonData.x + buttonData.width, buttonData.y + buttonData.height - radius);
      ctx.arcTo(buttonData.x + buttonData.width, buttonData.y + buttonData.height, buttonData.x + buttonData.width - radius, buttonData.y + buttonData.height, radius);
      ctx.lineTo(buttonData.x + radius, buttonData.y + buttonData.height);
      ctx.arcTo(buttonData.x, buttonData.y + buttonData.height, buttonData.x, buttonData.y + buttonData.height - radius, radius);
      ctx.lineTo(buttonData.x, buttonData.y + radius);
      ctx.arcTo(buttonData.x, buttonData.y, buttonData.x + radius, buttonData.y, radius);
      ctx.closePath();
      
      ctx.fill();
      ctx.stroke();

      // 按钮文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '18px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.fillText(buttonData.text, buttonData.x + buttonData.width / 2, buttonData.y + buttonData.height / 2 + 5);
      ctx.shadowBlur = 0;
    });
  }

  drawCulturalElements(ctx) {
    // 绘制古树装饰元素
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(50, 50, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 绘制河流装饰元素
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 80);
    ctx.quadraticCurveTo(this.width / 2, this.height - 120, this.width, this.height - 80);
    ctx.stroke();
    ctx.restore();
  }

  handleTouchStart(e) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    this.buttons.forEach(button => {
      if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
        this.selectedButton = button.id;
      }
    });
  }

  handleTouchEnd(e) {
    if (this.selectedButton) {
      this.navigateToPage(this.selectedButton);
      this.selectedButton = null;
    }
  }

  navigateToPage(pageId) {
    switch (pageId) {
      case 'match3':
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('match3');
        }
        break;
      case 'puzzle':
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('puzzle');
        }
        break;
      case 'quiz':
        if (GameGlobal.app && GameGlobal.app.showPage) {
          console.log('Navigating to quiz');
          GameGlobal.app.showPage('quiz');
        }
        break;
      case 'achievement':
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('achievement');
        }
        break;
    }
  }

  destroy() {
    // 清理资源
  }
}

module.exports = HomePage;