// 首页逻辑
class HomeScene {
  constructor(ctx) {
    this.ctx = ctx;
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.buttons = [
      {
        id: 'match3',
        text: '三色消消乐',
        x: this.width / 2 - 100,
        y: this.height / 2 - 80,
        width: 200,
        height: 60
      },
      {
        id: 'puzzle',
        text: '三色拼图',
        x: this.width / 2 - 100,
        y: this.height / 2,
        width: 200,
        height: 60
      },
      {
        id: 'achievement',
        text: '成就系统',
        x: this.width / 2 - 100,
        y: this.height / 2 + 80,
        width: 200,
        height: 60
      }
    ];
    this.selectedButton = null;
  }

  render() {
    // 绘制背景
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    this.ctx.font = '24px Arial';
    this.ctx.fillStyle = '#333';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('三色融澄·数字赋能', this.width / 2, 100);

    // 绘制按钮
    this.buttons.forEach(button => {
      this.ctx.fillStyle = button.id === this.selectedButton ? '#4CAF50' : '#2196F3';
      this.ctx.fillRect(button.x, button.y, button.width, button.height);
      this.ctx.fillStyle = '#fff';
      this.ctx.font = '16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(button.text, button.x + button.width / 2, button.y + button.height / 2 + 5);
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
      this.navigateToGame(this.selectedButton);
      this.selectedButton = null;
    }
  }

  navigateToGame(gameId) {
    switch (gameId) {
      case 'match3':
        // 跳转到消消乐游戏
        break;
      case 'puzzle':
        // 跳转到拼图游戏
        break;
      case 'achievement':
        // 跳转到成就系统
        break;
    }
  }
}

export default HomeScene;