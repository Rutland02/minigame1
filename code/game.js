import App from './js/common/app';

wx.onShow(function() {
  if (!GameGlobal.app) {
    new App();
  }
});

if (!GameGlobal.app) {
  new App();
}
