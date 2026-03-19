// 打卡页
import DataBus from '../../databus';

const databus = new DataBus();

class CheckInPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.checkInPoints = this.getCheckInPoints();
  }

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

  render(ctx) {
    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.font = '24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('线下打卡', this.width / 2, 80);

    // 绘制返回按钮
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(20, 20, 80, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('返回', 60, 45);

    // 绘制扫码打卡按钮
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(this.width / 2 - 100, 120, 200, 60);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('扫码打卡', this.width / 2, 155);

    // 绘制打卡点列表
    const startY = 220;
    const itemHeight = 100;
    
    this.checkInPoints.forEach((point, index) => {
      const y = startY + index * itemHeight;
      const isCheckedIn = databus.isCheckedIn(point.id);
      
      // 绘制打卡点项背景
      ctx.fillStyle = isCheckedIn ? '#e8f5e8' : '#f5f5f5';
      ctx.fillRect(20, y, this.width - 40, itemHeight - 10);
      
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
      }
      
      // 绘制打卡状态
      ctx.font = '14px Arial';
      ctx.fillStyle = isCheckedIn ? '#4CAF50' : '#999';
      ctx.textAlign = 'right';
      ctx.fillText(isCheckedIn ? '已打卡' : '未打卡', this.width - 30, y + 35);
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
    wx.scanCode({
      success: (res) => {
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
        console.error('扫码失败:', err);
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
    // 假设二维码内容格式为: checkin://point/{id}
    const match = result.match(/checkin:\/\/point\/(\w+)/);
    return match ? match[1] : null;
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

    wx.getLocation({
      type: 'wgs84',
      success: (res) => {
        const distance = this.calculateDistance(
          res.latitude, res.longitude,
          checkInPoint.location.latitude, checkInPoint.location.longitude
        );
        
        if (distance <= checkInPoint.radius) {
          // 位置验证成功，执行打卡
          this.checkIn(checkInPoint);
        } else {
          wx.showToast({
            title: '距离打卡点太远，请靠近后再试',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        console.error('获取位置失败:', err);
        wx.showToast({
          title: '获取位置失败，请检查定位权限',
          icon: 'none',
          duration: 2000
        });
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
      location: checkInPoint.location
    });

    // 解锁专属皮肤
    databus.unlockExclusiveSkin(checkInPoint.skinId);

    // 显示打卡成功提示
    wx.showToast({
      title: `打卡成功！已解锁${checkInPoint.skinName}皮肤`,
      icon: 'success',
      duration: 2000
    });

    // 检查是否解锁了打卡达人成就
    const checkInData = databus.getCheckInData();
    if (checkInData.checkInPoints.length >= this.checkInPoints.length) {
      databus.addAchievement({
        id: 'check_in_master',
        title: '打卡达人',
        description: '完成所有线下打卡点'
      });
    }
  }

  destroy() {
    // 清理资源
  }
}

export default CheckInPage;