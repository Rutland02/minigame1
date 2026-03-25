// webview 页面 - 用于加载外部网页
Page({
  data: {
    url: ''
  },
  
  onLoad(options) {
    // 获取传递过来的 url 参数
    if (options.url) {
      this.setData({
        url: options.url
      });
    }
  }
});