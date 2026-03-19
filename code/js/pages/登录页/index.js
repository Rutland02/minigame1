// 登录页
const DataBus = require('../../databus');

const databus = new DataBus();

class LoginPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.isLoading = false;
    this.backgroundImage = null;
    
    // 加载背景图
    this.loadBackgroundImage();
  }
  
  loadBackgroundImage() {
    // 使用资源管理器加载背景图
    const resourceManager = GameGlobal.resourceManager;
    if (resourceManager) {
      // 检查是否已经加载了背景图
      this.backgroundImage = resourceManager.getImage('loginBackground');
      if (!this.backgroundImage) {
        // 如果没有加载，创建并加载图片
        const img = wx.createImage();
        img.onload = () => {
          this.backgroundImage = img;
          // 将图片保存到资源管理器中
          resourceManager.images['loginBackground'] = img;
          console.log('Background image loaded successfully:', this.backgroundImage.width, 'x', this.backgroundImage.height);
        };
        img.onerror = (err) => {
          console.error('Failed to load background image:', err);
          // 即使图片加载失败，也继续显示登录按钮
        };
        // 使用相对路径
        img.src = 'images/ui/bg1.jpg';
      }
    } else {
      // 如果没有资源管理器，直接加载图片
      const img = wx.createImage();
      img.onload = () => {
        this.backgroundImage = img;
        console.log('Background image loaded successfully:', this.backgroundImage.width, 'x', this.backgroundImage.height);
      };
      img.onerror = (err) => {
        console.error('Failed to load background image:', err);
        // 即使图片加载失败，也继续显示登录按钮
      };
      // 使用相对路径
      img.src = 'images/ui/bg1.jpg';
    }
  }

  render(ctx) {
    try {
      // 绘制背景图
      if (this.backgroundImage) {
        // 缩放背景图以适应屏幕
        const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        const offsetX = (this.width - scaledWidth) / 2;
        const offsetY = (this.height - scaledHeight) / 2;
        ctx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        // 如果背景图未加载，使用默认背景
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, this.width, this.height);
      }

      // 绘制登录按钮
      this.drawLoginButton(ctx);

      // 绘制加载状态
      if (this.isLoading) {
        this.drawLoading(ctx);
      }
    } catch (error) {
      console.error('Login page render error:', error);
      // 即使渲染失败，也绘制基本的登录界面
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.fillStyle = '#C41E3A';
      ctx.fillRect(this.width / 2 - 120, this.height * 0.75, 240, 50);
      ctx.fillStyle = '#fff';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('立即登录', this.width / 2, this.height * 0.75 + 25);
    }
  }

  drawLoginButton(ctx) {
    // 按钮背景 - 红色，与图片中的按钮颜色匹配
    ctx.fillStyle = '#C41E3A';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    // 绘制圆角矩形 - 调整位置和大小以匹配图片中的按钮
    const x = this.width / 2 - 120;
    const y = this.height * 0.75;
    const width = 240;
    const height = 50;
    const radius = 25;
    
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

    // 按钮文字 - 与图片中的文字匹配
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;
    ctx.fillText('立即登录', this.width / 2, y + height / 2 + 5);
    ctx.shadowBlur = 0;
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
    
    // 检查是否点击了登录按钮 - 与新的按钮位置匹配
    const buttonY = this.height * 0.75;
    if (x >= this.width / 2 - 120 && x <= this.width / 2 + 120 && y >= buttonY && y <= buttonY + 50) {
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