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
    const resourceManager = GameGlobal.resourceManager;
    // 绘制背景
    const background = resourceManager ? resourceManager.getImage('background') : null;
    if (background) {
      ctx.drawImage(background, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 绘制标题
    ctx.font = '24px Arial';
    ctx.fillStyle = '#5cec98ff';
    ctx.textAlign = 'center';
    ctx.fillText('三色融澄·数字赋能', this.width / 2, 80);

    // 绘制用户信息
    const userInfo = databus.getUserInfo();
    if (userInfo) {
      // 绘制用户头像
      const avatarFrame = resourceManager ? resourceManager.getImage('achievement_icon') : null; // 暂时使用成就图标作为头像框
      if (avatarFrame) {
        ctx.drawImage(avatarFrame, 20, 100, 60, 60);
      } else {
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(50, 120, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(userInfo.nickname.charAt(0), 50, 125);
      
      // 绘制用户昵称
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(`欢迎，${userInfo.nickname}`, 100, 115);
      
      // 绘制总积分
      const totalScore = databus.getTotalScore();
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(`总积分: ${totalScore}`, 100, 140);
    }

    // 绘制按钮
    const button = resourceManager ? resourceManager.getImage('button') : null;
    this.buttons.forEach(buttonData => {
      if (button) {
        ctx.drawImage(button, buttonData.x, buttonData.y, buttonData.width, buttonData.height);
      } else {
        ctx.fillStyle = buttonData.id === this.selectedButton ? '#4CAF50' : '#2196F3';
        ctx.fillRect(buttonData.x, buttonData.y, buttonData.width, buttonData.height);
      }
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(buttonData.text, buttonData.x + buttonData.width / 2, buttonData.y + buttonData.height / 2 + 5);
    });
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