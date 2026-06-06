class ResourceManager {
  constructor() {
    this.images = {};
    this.loaded = false;
  }

  /**
   * 预加载图片列表
   * @param {Array<{key: string, src: string}>} imageList
   */
  loadImages(imageList) {
    if (!imageList || imageList.length === 0) {
      this.loaded = true;
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let loaded = 0;
      const total = imageList.length;

      imageList.forEach(({ key, src }) => {
        if (this.images[key]) {
          loaded++;
          if (loaded >= total) {
            this.loaded = true;
            resolve();
          }
          return;
        }

        const img = wx.createImage();
        img.onload = () => {
          this.images[key] = img;
          loaded++;
          if (loaded >= total) {
            this.loaded = true;
            resolve();
          }
        };
        img.onerror = () => {
          console.error('Failed to load image:', key, src);
          loaded++;
          if (loaded >= total) {
            this.loaded = true;
            resolve();
          }
        };
        img.src = src;
      });
    });
  }

  getImage(key) {
    return this.images[key];
  }

  isLoaded() {
    return this.loaded;
  }

  clear() {
    this.images = {};
    this.loaded = false;
  }
}

module.exports = ResourceManager;
