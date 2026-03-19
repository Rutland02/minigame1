// 资源管理器，负责预加载和管理所有图片资源
class ResourceManager {
  constructor() {
    this.images = {};
    this.loaded = false;
  }

  // 加载图片资源
  loadImages(imageList) {
    return new Promise((resolve, reject) => {
      console.log('Skipping image loading');
      // 直接返回成功，不尝试加载任何图片
      this.loaded = true;
      resolve();
    });
  }

  // 获取图片资源
  getImage(key) {
    return this.images[key];
  }

  // 检查资源是否加载完成
  isLoaded() {
    return this.loaded;
  }

  // 清除所有资源
  clear() {
    this.images = {};
    this.loaded = false;
  }
}

module.exports = ResourceManager;
