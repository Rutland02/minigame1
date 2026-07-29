const { getTouchCoords, drawRoundedRect, drawButton } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

const STATES = Object.freeze({
  IDLE: 'idle',
  USER_AUTHORIZED: 'user_authorized',
  DOWNLOADING_AVATAR: 'downloading',
});

class LoginPage extends BasePage {
  constructor() {
    super();

    this.logoImage = null;
    this.loginButtonImage = null;
    this.loginButtonRect = null;

    this.authState = STATES.IDLE;
    this._userInfoButton = null;
    this._authResult = { nickName: '微信用户', avatarUrl: '', gender: 0 };

    this.loadImages();
  }

  loadImages() {
    const loadLogo = () => {
      const resourceManager = this.resourceManager;
      if (resourceManager) {
        this.logoImage = resourceManager.getImage('logo');
      }
      if (!this.logoImage) {
        const img = (typeof wx !== 'undefined' && wx.createImage) ? wx.createImage() : new Image();
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
        const img = (typeof wx !== 'undefined' && wx.createImage) ? wx.createImage() : new Image();
        img.onload = () => { this.loginButtonImage = img; };
        img.onerror = (err) => { console.error('Failed to load login button image:', err); };
        img.src = 'images/logo/icon_0001_log_in.png';
      }
    };

    loadLogo();
    loadLoginButton();

    // 等第一次渲染确定登录按钮位置后，创建透明原生按钮覆盖
    this._needSetupButton = true;
  }

  _setupUserInfoButton() {
    if (typeof wx === 'undefined' || typeof wx.createUserInfoButton !== 'function') {
      return;
    }

    const rect = this.loginButtonRect;
    if (!rect) return;

    try {
      if (wx.requirePrivacyAuthorize) {
        wx.requirePrivacyAuthorize({
          success: () => { this._createNativeButton(rect); },
          fail: () => { this._createNativeButton(rect); }
        });
      } else {
        this._createNativeButton(rect);
      }
    } catch (err) {
      console.error('createUserInfoButton 异常:', err);
    }
  }

  _createNativeButton(rect) {
    this._userInfoButton = wx.createUserInfoButton({
      type: 'text',
      text: ' ',
      style: {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: 'transparent',
        color: 'transparent',
        fontSize: 1,
        textAlign: 'center',
        lineHeight: rect.height,
      }
    });

    this._userInfoButton.onTap((res) => {
      this._destroyUserInfoButton();

      if (res.userInfo) {
        const info = res.userInfo;
        this._authResult = {
          nickName: info.nickName || '微信用户',
          avatarUrl: info.avatarUrl || '',
          gender: info.gender || 0,
        };
      }

      // 头像昵称授权完成，现在执行登录 + 其他权限
      this.authState = STATES.USER_AUTHORIZED;
      this._loginAndFinish();
    });
  }

  render(ctx) {
    try {
      this.drawBackground(ctx, '#f0f0f0', '#f0f0f0');
      this.drawLogo(ctx);
      this.drawLoginButton(ctx);

      // 第一次渲染后创建透明原生按钮
      if (this._needSetupButton && this.loginButtonRect) {
        this._needSetupButton = false;
        this._setupUserInfoButton();
      }

      if (this.authState !== STATES.IDLE) {
        this.drawLoading(ctx);
      }
    } catch (error) {
      console.error('Login page render error:', error);
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
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
    // 降级方案：如果 createUserInfoButton 未创建成功，点击登录按钮走 Canvas 触摸
    if (this._userInfoButton) return;
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;
    const rect = this.loginButtonRect;
    if (rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
      this.authState = STATES.USER_AUTHORIZED;
      this._loginAndFinish();
    }
  }

  // ========== 登录 + 完成流程 ==========

  _loginAndFinish() {
    // wx.login 获取 code
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          this._sendCodeToServer(loginRes.code);
        } else {
          console.error('登录失败，无法获取code');
          this.authState = STATES.IDLE;
          this._setupUserInfoButton();
          wx.showToast({ title: '登录失败，请重新尝试', icon: 'none', duration: 2000 });
        }
      },
      fail: (err) => {
        console.error('登录失败:', err);
        this.authState = STATES.IDLE;
        this._setupUserInfoButton();
        wx.showToast({ title: '登录失败，请重新尝试', icon: 'none', duration: 2000 });
      }
    });
  }

  _sendCodeToServer(code) {
    if (typeof wx !== 'undefined' && wx.cloud) {
      wx.cloud.callFunction({
        name: 'login',
        success: (res) => {
          const { openid } = res.result || {};
          if (openid) {
            this._onLoginSuccess(openid);
          } else {
            console.error('云函数返回数据异常:', res);
            this._fallbackLogin(code);
          }
        },
        fail: (err) => {
          console.error('云函数调用失败:', err);
          this._fallbackLogin(code);
        }
      });
    } else {
      this._fallbackLogin(code);
    }
  }

  _fallbackLogin(code) {
    console.warn('使用模拟登录（降级方案）');
    setTimeout(() => {
      const openid = 'sim_' + (code || Date.now());
      this._onLoginSuccess(openid);
    }, 1000);
  }

  _onLoginSuccess(openid) {
    this._authorizeOtherScopes(openid);
  }

  _authorizeOtherScopes(openid) {
    if (typeof wx === 'undefined') {
      this._downloadAvatarAndFinish(openid);
      return;
    }

    const scopes = ['scope.camera', 'scope.clipboardData', 'scope.writePhotosAlbum'];
    let done = 0;
    const total = scopes.length;

    const onDone = () => {
      done++;
      if (done >= total) {
        this._downloadAvatarAndFinish(openid);
      }
    };

    scopes.forEach((scope) => {
      wx.authorize({
        scope,
        success: () => { onDone(); },
        fail: () => { onDone(); }
      });
    });
  }

  _downloadAvatarAndFinish(openid) {
    if (this._authResult.avatarUrl) {
      wx.downloadFile({
        url: this._authResult.avatarUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            wx.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                this._authResult.avatarUrl = saveRes.savedFilePath;
                this._saveAndNavigate(openid);
              },
              fail: () => {
                this._authResult.avatarUrl = res.tempFilePath;
                this._saveAndNavigate(openid);
              }
            });
          } else {
            this._authResult.avatarUrl = '';
            this._saveAndNavigate(openid);
          }
        },
        fail: () => {
          this._authResult.avatarUrl = '';
          this._saveAndNavigate(openid);
        }
      });
    } else {
      this._saveAndNavigate(openid);
    }
  }

  _saveAndNavigate(openid) {
    if (!this.databus) {
      console.error('databus not initialized');
      return;
    }
    const userInfo = {
      nickName: this._authResult.nickName || '微信用户',
      avatarUrl: this._authResult.avatarUrl || '',
      gender: this._authResult.gender || 0,
      openid: openid,
    };
    this.databus.setUserInfo(userInfo);
    this.navigateTo('home');
  }

  _destroyUserInfoButton() {
    if (this._userInfoButton) {
      try { this._userInfoButton.destroy(); } catch (_) {}
      this._userInfoButton = null;
    }
  }

  destroy() {
    this._destroyUserInfoButton();
  }
}

module.exports = LoginPage;
