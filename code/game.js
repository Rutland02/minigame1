const App = require('./js/common/app');
const errorCapture = require('./js/utils/errorCapture');

errorCapture.init();
GameGlobal.errorCapture = errorCapture;

wx.onShow(function() {
  if (!GameGlobal.app) {
    new App();
  }
});

if (!GameGlobal.app) {
  new App();
}
