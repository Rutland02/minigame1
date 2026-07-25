class BasePage {
  constructor() {
    const sys = GameGlobal.systemInfo || wx.getSystemInfoSync();
    this.width = sys.windowWidth;
    this.height = sys.windowHeight;
    this.app = GameGlobal.app;
    this.databus = GameGlobal.databus;
    this.resourceManager = GameGlobal.resourceManager;
    this.eventBus = GameGlobal.eventBus;
    this.backgroundImage = null;
    this.loadBackgroundImage();
  }

  loadBackgroundImage() {
    const resourceManager = this.resourceManager;
    if (resourceManager) {
      this.backgroundImage = resourceManager.getImage('bg');
    }
    if (!this.backgroundImage) {
      let img;
      if (typeof wx !== 'undefined' && wx.createImage) {
        img = wx.createImage();
      } else if (typeof window !== 'undefined' && window.Image) {
        img = new Image();
      }
      if (img) {
        img.onload = () => { this.backgroundImage = img; };
        img.onerror = (err) => { console.error('Failed to load background image:', err); };
        img.src = 'images/ui/bg2.jpg';
      }
    }
  }

  drawBackground(ctx, fallbackColor1, fallbackColor2) {
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, fallbackColor1 || '#4a6fa5');
      gradient.addColorStop(1, fallbackColor2 || '#6e5b7b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  navigateTo(pageName) {
    if (this.app && this.app.showPage) {
      this.app.showPage(pageName);
    }
  }

  update() {}

  render() {}

  handleTouchStart(e) {}

  handleTouchMove(e) {}

  handleTouchEnd(e) {}

  destroy() {}
}

module.exports = BasePage;
