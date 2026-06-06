const { getTouchCoords } = require('../../utils/canvasUtils');

class LoginPage {
  constructor() {
    const sys = GameGlobal.systemInfo || wx.getSystemInfoSync();
    this.width = sys.windowWidth;
    this.height = sys.windowHeight;
    this.isLoading = false;
    this._loginTimer = null;
    this.backgroundImage = null;
    this.logoImage = null;
    this.loginButtonImage = null;
    
    this.loadImages();
  }
  
  loadImages() {
    const loadBackground = () => {
      const resourceManager = GameGlobal.resourceManager;
      if (resourceManager) {
        this.backgroundImage = resourceManager.getImage('bg');
      }
      if (!this.backgroundImage) {
        const img = wx.createImage();
        img.onload = () => {
          this.backgroundImage = img;
        };
        img.onerror = (err) => {
          console.error('Failed to load background image:', err);
        };
        img.src = 'images/ui/bg2.jpg';
      }
    };

    const loadLogo = () => {
      const resourceManager = GameGlobal.resourceManager;
      if (resourceManager) {
        this.logoImage = resourceManager.getImage('logo');
      }
      if (!this.logoImage) {
        const img = wx.createImage();
        img.onload = () => { this.logoImage = img; };
        img.onerror = (err) => { console.error('Failed to load logo image:', err); };
        img.src = 'images/logo/icon_0000_logo.png';
      }
    };

    const loadLoginButton = () => {
      const resourceManager = GameGlobal.resourceManager;
      if (resourceManager) {
        this.loginButtonImage = resourceManager.getImage('loginButton');
      }
      if (!this.loginButtonImage) {
        const img = wx.createImage();
        img.onload = () => { this.loginButtonImage = img; };
        img.onerror = (err) => { console.error('Failed to load login button image:', err); };
        img.src = 'images/logo/icon_0001_log_in.png';
      }
    };

    loadBackground();
    loadLogo();
    loadLoginButton();
  }

  render(ctx) {
    try {
      if (this.backgroundImage) {
        const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
        const scaledWidth = this.backgroundImage.width * scale;
        const scaledHeight = this.backgroundImage.height * scale;
        const offsetX = (this.width - scaledWidth) / 2;
        const offsetY = (this.height - scaledHeight) / 2;
        ctx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
      } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, this.width, this.height);
      }

      this.drawLogo(ctx);
      this.drawLoginButton(ctx);

      if (this.isLoading) {
        this.drawLoading(ctx);
      }
    } catch (error) {
      console.error('Login page render error:', error);
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

  drawLogo(ctx) {
    if (this.logoImage) {
      const logoWidth = this.width * 0.5;
      const logoHeight = logoWidth * (this.logoImage.height / this.logoImage.width);
      const logoX = (this.width - logoWidth) / 2;
      const logoY = this.height * 0.15;
      
      ctx.drawImage(this.logoImage, logoX, logoY, logoWidth, logoHeight);
    }
  }

  drawLoginButton(ctx) {
    if (this.loginButtonImage) {
      const buttonWidth = this.width * 0.5;
      const buttonHeight = buttonWidth * (this.loginButtonImage.height / this.loginButtonImage.width);
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = this.height * 0.8;
      
      ctx.drawImage(this.loginButtonImage, buttonX, buttonY, buttonWidth, buttonHeight);
    } else {
      ctx.fillStyle = '#C41E3A';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      
      const x = this.width / 2 - 100;
      const y = this.height * 0.8;
      const width = 200;
      const height = 45;
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

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Inter, Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1;
      ctx.fillText('立即登录', this.width / 2, y + height / 2 + 5);
      ctx.shadowBlur = 0;
    }
  }

  drawLoading(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
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
    
    ctx.fillStyle = '#2563EB';
    ctx.font = '16px Inter, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('登录中...', this.width / 2, this.height / 2 + 5);
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;
    
    if (this.loginButtonImage) {
      const buttonWidth = this.width * 0.5;
      const buttonHeight = buttonWidth * (this.loginButtonImage.height / this.loginButtonImage.width);
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = this.height * 0.8;
      
      if (x >= buttonX && x <= buttonX + buttonWidth && y >= buttonY && y <= buttonY + buttonHeight) {
        this.login();
      }
    } else {
      const buttonY = this.height * 0.8;
      if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= buttonY && y <= buttonY + 45) {
        this.login();
      }
    }
  }

  login() {
    this.isLoading = true;
    
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('登录成功，获取到code:', loginRes.code);
          this.sendCodeToServer(loginRes.code);
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
  
  sendCodeToServer(code) {
    console.log('发送code到服务器:', code);

    this._loginTimer = setTimeout(() => {
      this._loginTimer = null;
      const userInfo = {
        nickName: '微信用户',
        avatarUrl: '',
        gender: 1,
        province: '广东',
        city: '深圳',
        country: '中国',
        openid: 'o1234567890',
        sessionKey: 'session_key_123456'
      };

      GameGlobal.databus.setUserInfo(userInfo);
      console.log('登录成功，获取到用户信息:', userInfo);

      if (GameGlobal.app && typeof GameGlobal.app.showPage === 'function') {
        GameGlobal.app.showPage('home');
      } else {
        console.error('GameGlobal.app 或 showPage 方法不存在');
      }

      this.isLoading = false;
    }, 1000);
  }

  destroy() {
    if (this._loginTimer) {
      clearTimeout(this._loginTimer);
      this._loginTimer = null;
    }
  }
}

module.exports = LoginPage;