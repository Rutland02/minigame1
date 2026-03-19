// 登录页
const DataBus = require('../../databus');

const databus = new DataBus();

class LoginPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.isLoading = false;
  }

  render(ctx) {
    try {
      // 绘制背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制标题
      ctx.font = '24px Arial';
      ctx.fillStyle = '#5cec98ff';
      ctx.textAlign = 'center';
      ctx.fillText('三色融澄·数字赋能', this.width / 2, 150);

      // 绘制Logo
      try {
        const resourceManager = GameGlobal.resourceManager;
        const logo = resourceManager ? resourceManager.getImage('logo') : null;
        if (logo) {
          const logoSize = 160;
          ctx.drawImage(logo, this.width / 2 - logoSize / 2, 200, logoSize, logoSize);
        } else {
          ctx.fillStyle = '#2196F3';
          ctx.beginPath();
          ctx.arc(this.width / 2, 250, 80, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = '48px Arial';
          ctx.fillText('海', this.width / 2, 270);
        }
      } catch (error) {
        // 即使Logo加载失败，也继续显示默认Logo
        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(this.width / 2, 250, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.fillText('海', this.width / 2, 270);
      }

      // 绘制登录按钮
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(this.width / 2 - 100, this.height - 150, 200, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText('微信登录', this.width / 2, this.height - 115);

      // 绘制项目简介
      ctx.fillStyle = '#5cec98ff';
      ctx.font = '14px Arial';
      ctx.fillText('非遗·自然·红色，在游戏中读懂海澄村', this.width / 2, this.height - 50);

      // 绘制加载状态
      if (this.isLoading) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#fff';
        ctx.font = '16px Arial';
        ctx.fillText('登录中...', this.width / 2, this.height / 2);
      }
    } catch (error) {
      console.error('Login page render error:', error);
      // 即使渲染失败，也绘制基本的登录界面
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = '24px Arial';
      ctx.fillStyle = '#5cec98ff';
      ctx.textAlign = 'center';
      ctx.fillText('三色融澄·数字赋能', this.width / 2, 150);
      ctx.fillStyle = '#4CAF50';
      ctx.fillRect(this.width / 2 - 100, this.height - 150, 200, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText('微信登录', this.width / 2, this.height - 115);
    }
  }

  handleTouchStart(e) {
    // 直接使用标准的触摸事件属性
    let x, y;
    if (e.touches && e.touches[0]) {
      x = e.touches[0].x || e.touches[0].clientX || e.touches[0].pageX || 0;
      y = e.touches[0].y || e.touches[0].clientY || e.touches[0].pageY || 0;
    } else if (e.changedTouches && e.changedTouches[0]) {
      x = e.changedTouches[0].x || e.changedTouches[0].clientX || e.changedTouches[0].pageX || 0;
      y = e.changedTouches[0].y || e.changedTouches[0].clientY || e.changedTouches[0].pageY || 0;
    } else {
      return;
    }
    
    // 检查是否点击了登录按钮
    if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= this.height - 150 && y <= this.height - 90) {
      this.login();
    }
  }

  login() {
    this.isLoading = true;
    
    // 微信登录
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('登录成功，获取到code:', loginRes.code);
          
          // 模拟用户信息（在小游戏环境中可能无法获取真实用户信息）
          const mockUserInfo = {
            nickName: '测试用户',
            avatarUrl: '',
            gender: 1,
            province: '广东',
            city: '深圳',
            country: '中国'
          };
          
          // 保存用户信息到databus
          databus.setUserInfo(mockUserInfo);
          console.log('登录成功，使用模拟用户信息:', mockUserInfo);
          
          // 跳转到首页
          if (GameGlobal.app && typeof GameGlobal.app.showPage === 'function') {
            GameGlobal.app.showPage('home');
          } else {
            console.error('GameGlobal.app 或 showPage 方法不存在');
          }
        } else {
          console.error('登录失败，无法获取code');
          this.isLoading = false;
          wx.showToast({
            title: '登录失败，请重新尝试',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        console.error('登录失败:', err);
        this.isLoading = false;
        wx.showToast({
          title: '登录失败，请重新尝试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }

  destroy() {
    // 清理资源
  }
}

module.exports = LoginPage;