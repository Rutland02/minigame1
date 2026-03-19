import App from './js/common/app';

// 微信小游戏的生命周期函数
wx.onShow(function() {
  // 当游戏显示时创建应用实例
  if (!GameGlobal.app) {
    new App();
  }
});

// 确保应用被创建
if (!GameGlobal.app) {
  new App();
}
