// 登录页
const DataBus = require('../../databus');

const databus = new DataBus();

class LoginPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.isLoading = false;
    this.backgroundImage = null;
  }

  render(ctx) {
    try {
      // 绘制默认背景
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#2563EB');
      gradient.addColorStop(1, '#3B82F6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制半透明遮罩
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, this.width, this.height);

      // 绘制玻璃态容器
      this.drawGlassContainer(ctx);

      // 绘制标题
      ctx.font = '32px Inter, Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.fillText('三色融澄·数字赋能', this.width / 2, this.height / 2 - 120);

      // 绘制副标题
      ctx.font = '16px Inter, Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.shadowBlur = 0;
      ctx.fillText('非遗·自然·红色，在游戏中读懂海澄村', this.width / 2, this.height / 2 - 80);

      // 绘制Logo
      this.drawLogo(ctx);

      // 绘制登录按钮
      this.drawLoginButton(ctx);

      // 绘制文化元素装饰
      this.drawCulturalElements(ctx);

      // 绘制加载状态
      if (this.isLoading) {
        this.drawLoading(ctx);
      }
    } catch (error) {
      console.error('Login page render error:', error);
      // 即使渲染失败，也绘制基本的登录界面
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.font = '24px Arial';
      ctx.fillStyle = '#2563EB';
      ctx.textAlign = 'center';
      ctx.fillText('三色融澄·数字赋能', this.width / 2, 150);
      ctx.fillStyle = '#F97316';
      ctx.fillRect(this.width / 2 - 100, this.height - 150, 200, 60);
      ctx.fillStyle = '#fff';
      ctx.font = '16px Arial';
      ctx.fillText('微信登录', this.width / 2, this.height - 115);
    }
  }

  drawGlassContainer(ctx) {
    // 玻璃态容器背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    // 绘制圆角矩形
    const x = this.width / 2 - 150;
    const y = this.height / 2 - 180;
    const width = 300;
    const height = 320;
    const radius = 20;
    
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
  }

  drawLogo(ctx) {
    try {
      const resourceManager = GameGlobal.resourceManager;
      const logo = resourceManager ? resourceManager.getImage('logo') : null;
      if (logo) {
        const logoSize = 100;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(logo, this.width / 2 - logoSize / 2, this.height / 2 - 50, logoSize, logoSize);
        ctx.restore();
      } else {
        // 绘制海澄村特色Logo
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '36px Inter, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('海', this.width / 2, this.height / 2 + 10);
        ctx.restore();
      }
    } catch (error) {
      // 即使Logo加载失败，也继续显示默认Logo
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.arc(this.width / 2, this.height / 2, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '36px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.fillText('海', this.width / 2, this.height / 2 + 10);
      ctx.restore();
    }
  }

  drawLoginButton(ctx) {
    // 按钮背景
    const gradient = ctx.createLinearGradient(this.width / 2 - 120, this.height / 2 + 80, this.width / 2 + 120, this.height / 2 + 80);
    gradient.addColorStop(0, '#F97316');
    gradient.addColorStop(1, '#FB923C');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // 绘制圆角矩形
    const x = this.width / 2 - 120;
    const y = this.height / 2 + 80;
    const width = 240;
    const height = 60;
    const radius = 30;
    
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

    // 按钮文字
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('微信登录', this.width / 2, this.height / 2 + 110);
    ctx.shadowBlur = 0;
  }

  drawCulturalElements(ctx) {
    // 绘制古树装饰元素
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(50, 50, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 绘制河流装饰元素
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 100);
    ctx.quadraticCurveTo(this.width / 2, this.height - 150, this.width, this.height - 100);
    ctx.stroke();
    ctx.restore();
  }

  drawLoading(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 加载框
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // 绘制圆角矩形
    const x = this.width / 2 - 100;
    const y = this.height / 2 - 50;
    const width = 200;
    const height = 100;
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
    
    // 加载文字
    ctx.fillStyle = '#2563EB';
    ctx.font = '16px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('登录中...', this.width / 2, this.height / 2 + 5);
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
    if (x >= this.width / 2 - 120 && x <= this.width / 2 + 120 && y >= this.height / 2 + 80 && y <= this.height / 2 + 140) {
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