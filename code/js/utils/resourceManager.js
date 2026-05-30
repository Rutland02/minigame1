class ResourceManager {
  constructor() {
    this.images = {};
    this.loaded = false;
  }

  loadImages(imageList) {
    return new Promise((resolve, reject) => {
      console.log('Skipping image loading');
      this.loaded = true;
      resolve();
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
