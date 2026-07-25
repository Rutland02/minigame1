const { getTouchCoords, drawRoundedRect, drawButton } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class LoginPage extends BasePage {
  constructor() {
    super();

    this.isLoading = false;
    this._loginTimer = null;
    this.logoImage = null;
    this.loginButtonImage = null;
    this.loginButtonRect = null;

    this.loadImages();
  }
  
  loadImages() {
    const loadLogo = () => {
      const resourceManager = this.resourceManager;
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
      const resourceManager = this.resourceManager;
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

    loadLogo();
    loadLoginButton();
  }

  render(ctx) {
    try {
      this.drawBackground(ctx, '#f0f0f0', '#f0f0f0');

      this.drawLogo(ctx);
      this.drawLoginButton(ctx);

      if (this.isLoading) {
        this.drawLoading(ctx);
      }
    } catch (error) {
      console.error('Login page render error:', error);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
      const errBtnW = this.scaleSize(240);
      const errBtnH = this.scaleSize(50);
      ctx.fillStyle = '#0D9488';
      ctx.fillRect((this.width - errBtnW) / 2, this.height * 0.75, errBtnW, errBtnH);
      ctx.fillStyle = '#fff';
      ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('立即登录', this.width / 2, this.height * 0.75 + errBtnH / 2);
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
      this.loginButtonRect = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
    } else {
      const buttonWidth = this.scaleSize(200);
      const buttonHeight = this.scaleSize(45);
      const buttonX = (this.width - buttonWidth) / 2;
      const buttonY = this.height * 0.8;
      drawButton(ctx, buttonX, buttonY, buttonWidth, buttonHeight, this.scaleSize(20), '#0D9488', '#0F766E', '立即登录', {
        font: `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`,
        strokeColor: 'rgba(255, 255, 255, 0.3)'
      });
      this.loginButtonRect = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
    }
  }

  drawLoading(ctx) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    
    const width = this.scaleSize(200);
    const height = this.scaleSize(100);
    const x = (this.width - width) / 2;
    const y = (this.height - height) / 2;
    const radius = this.scaleSize(15);

    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#0D9488';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('登录中...', this.width / 2, this.height / 2 + this.scaleSize(5));
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;
    
    const rect = this.loginButtonRect;
    if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      this.login();
    }
  }

  login() {
    if (this.isLoading) return;
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

      if (!this.databus) {
        console.error('databus not initialized');
        this.isLoading = false;
        return;
      }

      this.databus.setUserInfo(userInfo);
      console.log('登录成功，获取到用户信息:', userInfo);

      this.navigateTo('home');

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