// 打卡页
import DataBus from '../../databus';

const databus = new DataBus();

class CheckInPage {
  // 定义打卡点数据
  getCheckInPoints() {
    return [
      {
        id: 'ancient_tree',
        name: '千年古树',
        description: '海澄村的标志性古树，树龄超过500年',
        location: { latitude: 24.4798, longitude: 118.0819 }, // 模拟位置
        radius: 50, // 打卡半径（米）
        skinId: 'ancient_tree_skin',
        skinName: '古树守护者'
      },
      {
        id: 'red_site',
        name: '红色遗址',
        description: '革命时期的重要历史遗址',
        location: { latitude: 24.4808, longitude: 118.0829 }, // 模拟位置
        radius: 50,
        skinId: 'red_site_skin',
        skinName: '红色记忆'
      },
      {
        id: 'intangible_heritage',
        name: '非遗工坊',
        description: '传统手工艺制作工坊',
        location: { latitude: 24.4818, longitude: 118.0839 }, // 模拟位置
        radius: 50,
        skinId: 'heritage_skin',
        skinName: '非遗传承'
      }
    ];
  }

  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.checkInPoints = this.getCheckInPoints();
    this.backgroundImage = null;
    this.animation = {
      scanButtonScale: 1,
      scanButtonPulse: true,
      listItems: []
    };
    
    // 初始化列表项动画状态
    this.checkInPoints.forEach(() => {
      this.animation.listItems.push({ opacity: 0, y: 50 });
    });
    
    // 加载背景图
    this.loadBackgroundImage();
    
    // 启动动画
    this.startAnimations();
  }

  // 启动动画
  startAnimations() {
    setInterval(() => {
      if (this.animation.scanButtonPulse) {
        this.animation.scanButtonScale = Math.max(0.95, this.animation.scanButtonScale - 0.01);
        if (this.animation.scanButtonScale <= 0.95) {
          this.animation.scanButtonPulse = false;
        }
      } else {
        this.animation.scanButtonScale = Math.min(1.05, this.animation.scanButtonScale + 0.01);
        if (this.animation.scanButtonScale >= 1.05) {
          this.animation.scanButtonPulse = true;
        }
      }
    }, 30);
    
    // 列表项入场动画
    this.checkInPoints.forEach((_, index) => {
      setTimeout(() => {
        this.animation.listItems[index].opacity = 1;
        this.animation.listItems[index].y = 0;
      }, 100 * index);
    });
  }

  render(ctx) {
    // 绘制背景图
    if (this.backgroundImage) {
      // 缩放背景图以适应屏幕
      const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      const offsetX = (this.width - scaledWidth) / 2;
      const offsetY = (this.height - scaledHeight) / 2;
      ctx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
    } else {
      // 如果背景图未加载，使用默认背景
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 绘制标题
    ctx.font = '28px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
    ctx.fillText('线下打卡', this.width / 2, 80);
    ctx.shadowBlur = 0;

    // 绘制返回按钮
    ctx.fillStyle = '#C41E3A';
    this.roundRect(ctx, 20, 20, 80, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 60, 45);

    // 绘制扫码打卡按钮（带动画）
    const buttonX = this.width / 2 - 100;
    const buttonY = 120;
    const buttonWidth = 200;
    const buttonHeight = 60;
    
    // 按钮背景
    ctx.fillStyle = '#C41E3A';
    this.roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 30);
    ctx.fill();
    
    // 按钮发光效果
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX + buttonWidth, buttonY + buttonHeight);
    gradient.addColorStop(0, 'rgba(196, 30, 58, 0.3)');
    gradient.addColorStop(1, 'rgba(196, 30, 58, 0)');
    ctx.fillStyle = gradient;
    this.roundRect(ctx, buttonX - 5, buttonY - 5, buttonWidth + 10, buttonHeight + 10, 35);
    ctx.fill();
    
    // 按钮文字
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('扫码打卡', this.width / 2, buttonY + buttonHeight / 2);

    // 绘制打卡点列表
    const startY = 220;
    const itemHeight = 100;
    
    this.checkInPoints.forEach((point, index) => {
      const y = startY + index * itemHeight;
      const isCheckedIn = databus.isCheckedIn(point.id);
      const anim = this.animation.listItems[index];
      
      // 应用动画
      ctx.save();
      ctx.globalAlpha = anim.opacity;
      ctx.translate(0, anim.y);
      
      // 绘制打卡点项背景
      ctx.fillStyle = isCheckedIn ? '#e8f5e8' : '#f5f5f5';
      this.roundRect(ctx, 20, y, this.width - 40, itemHeight - 10, 12);
      ctx.fill();
      
      // 绘制打卡点名称
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(point.name, 30, y + 25);
      
      // 绘制打卡点描述
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(point.description, 30, y + 50);
      
      // 绘制解锁皮肤
      if (isCheckedIn) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#4CAF50';
        ctx.fillText(`已解锁皮肤: ${point.skinName}`, 30, y + 75);
        
        // 绘制已打卡标记
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.moveTo(this.width - 50, y + 30);
        ctx.lineTo(this.width - 40, y + 40);
        ctx.lineTo(this.width - 25, y + 25);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#4CAF50';
        ctx.stroke();
      }
      
      // 绘制打卡状态
      ctx.font = '14px Arial';
      ctx.fillStyle = isCheckedIn ? '#4CAF50' : '#999';
      ctx.textAlign = 'right';
      ctx.fillText(isCheckedIn ? '已打卡' : '未打卡', this.width - 30, y + 35);
      
      ctx.restore();
    });
  }

  handleTouchStart(e) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    // 检查是否点击了返回按钮
    if (x >= 20 && x <= 100 && y >= 20 && y <= 60) {
      if (GameGlobal.app && GameGlobal.app.showPage) {
        GameGlobal.app.showPage('home');
      }
    }
    
    // 检查是否点击了扫码打卡按钮
    if (x >= this.width / 2 - 100 && x <= this.width / 2 + 100 && y >= 120 && y <= 180) {
      this.scanQRCode();
    }
  }

  // 扫码功能
  scanQRCode() {
    // 检查相机权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.camera']) {
          wx.authorize({
            scope: 'scope.camera',
            success: () => {
              this.startScan();
            },
            fail: () => {
              wx.showModal({
                title: '权限提示',
                content: '需要相机权限才能扫码打卡',
                confirmText: '去设置',
                cancelText: '取消',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.startScan();
        }
      }
    });
  }

  // 开始扫码
  startScan() {
    wx.showLoading({
      title: '正在扫码...',
      mask: true
    });
    
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['qrCode'],
      success: (res) => {
        wx.hideLoading();
        console.log('扫码结果:', res);
        // 解析扫码结果，获取打卡点ID
        const checkInPointId = this.parseQRCodeResult(res.result);
        if (checkInPointId) {
          this.verifyLocation(checkInPointId);
        } else {
          wx.showToast({
            title: '无效的打卡二维码',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('扫码失败:', err);
        if (err.errMsg.includes('cancel')) {
          // 用户取消扫码
          return;
        }
        wx.showToast({
          title: '扫码失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }

  // 解析二维码结果
  parseQRCodeResult(result) {
    // 支持多种二维码格式
    // 格式1: checkin://point/{id}
    // 格式2: https://example.com/checkin/{id}
    // 格式3: 直接是打卡点ID
    
    // 格式1
    const match1 = result.match(/checkin:\/\/point\/(\w+)/);
    if (match1) {
      return match1[1];
    }
    
    // 格式2
    const match2 = result.match(/checkin\/(\w+)/);
    if (match2) {
      return match2[1];
    }
    
    // 格式3: 直接检查是否是有效的打卡点ID
    const checkInPoint = this.checkInPoints.find(p => p.id === result);
    if (checkInPoint) {
      return result;
    }
    
    return null;
  }

  // 验证地理位置
  verifyLocation(pointId) {
    const checkInPoint = this.checkInPoints.find(p => p.id === pointId);
    if (!checkInPoint) {
      wx.showToast({
        title: '无效的打卡点',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 检查位置权限
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.getLocationAndVerify(checkInPoint);
            },
            fail: () => {
              wx.showModal({
                title: '权限提示',
                content: '需要位置权限才能进行打卡验证',
                confirmText: '去设置',
                cancelText: '取消',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.getLocationAndVerify(checkInPoint);
        }
      }
    });
  }

  // 获取位置并验证
  getLocationAndVerify(checkInPoint) {
    wx.showLoading({
      title: '正在验证位置...',
      mask: true
    });

    wx.getLocation({
      type: 'wgs84',
      altitude: true,
      success: (res) => {
        wx.hideLoading();
        console.log('获取位置成功:', res);
        
        const distance = this.calculateDistance(
          res.latitude, res.longitude,
          checkInPoint.location.latitude, checkInPoint.location.longitude
        );
        
        console.log('距离打卡点:', distance.toFixed(2), '米');
        
        if (distance <= checkInPoint.radius) {
          // 位置验证成功，执行打卡
          this.checkIn(checkInPoint);
        } else {
          wx.showToast({
            title: `距离打卡点${distance.toFixed(0)}米，请靠近后再试`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取位置失败:', err);
        
        if (err.errMsg.includes('permission')) {
          wx.showModal({
            title: '位置权限',
            content: '请在设置中开启位置权限',
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else if (err.errMsg.includes('timeout')) {
          wx.showToast({
            title: '获取位置超时，请重试',
            icon: 'none',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '获取位置失败，请检查网络',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  }

  // 计算两点之间的距离（米）
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // 执行打卡
  checkIn(checkInPoint) {
    // 检查是否已经打卡
    if (databus.isCheckedIn(checkInPoint.id)) {
      wx.showToast({
        title: '您已经在此处打卡过了',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 添加打卡点
    databus.addCheckInPoint({
      id: checkInPoint.id,
      name: checkInPoint.name,
      location: checkInPoint.location,
      timestamp: new Date().getTime()
    });

    // 解锁专属皮肤
    databus.unlockExclusiveSkin(checkInPoint.skinId);

    // 显示打卡成功提示
    wx.showToast({
      title: `打卡成功！`,
      icon: 'success',
      duration: 1500
    });

    // 延迟显示皮肤解锁提示
    setTimeout(() => {
      wx.showToast({
        title: `已解锁${checkInPoint.skinName}皮肤`,
        icon: 'none',
        duration: 2000
      });
    }, 1500);

    // 检查是否解锁了打卡达人成就
    const checkInData = databus.getCheckInData();
    if (checkInData.length >= this.checkInPoints.length) {
      databus.addAchievement({
        id: 'check_in_master',
        title: '打卡达人',
        description: '完成所有线下打卡点',
        timestamp: new Date().getTime()
      });
      
      // 显示成就解锁提示
      setTimeout(() => {
        wx.showToast({
          title: '恭喜解锁打卡达人成就！',
          icon: 'none',
          duration: 2000
        });
      }, 3500);
    }
  }

  loadBackgroundImage() {
    const img = wx.createImage();
    img.onload = () => {
      this.backgroundImage = img;
    };
    img.onerror = (err) => {
      console.error('Failed to load background image:', err);
    };
    img.src = 'images/ui/bg2.jpg';
  }

  // 绘制圆角矩形
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  destroy() {
    // 清理资源
  }
}

export default CheckInPage;