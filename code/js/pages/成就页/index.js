// 成就页
const DataBus = require('../../databus');

const databus = new DataBus();

class AchievementPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.showCertificate = false;
    this.certificateData = null;
    // 定义所有可能的成就
    this.allAchievements = [
      {
        id: 'first_game',
        title: '初次尝试',
        description: '完成第一局游戏',
        type: '基础'
      },
      {
        id: 'match3_master',
        title: '消消乐大师',
        description: '消消乐得分超过1000',
        type: '游戏'
      },
      {
        id: 'puzzle_master',
        title: '拼图大师',
        description: '完成所有拼图',
        type: '游戏'
      },
      {
        id: 'quiz_master',
        title: '知识达人',
        description: '答题正确率达到80%',
        type: '知识'
      },
      {
        id: 'check_in_master',
        title: '打卡达人',
        description: '完成所有线下打卡点',
        type: '线下'
      },
      {
        id: 'collector',
        title: '收藏家',
        description: '解锁所有成就',
        type: '综合'
      }
    ];
  }

  render(ctx) {
    if (this.showCertificate) {
      this.renderCertificate(ctx);
      return;
    }

    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#4a6fa5');
    gradient.addColorStop(1, '#6e5b7b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.font = '28px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, 80);

    // 绘制返回按钮
    this.drawRoundedRect(ctx, 20, 20, 80, 40, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 60, 45);

    // 绘制生成证书按钮
    this.drawRoundedRect(ctx, this.width - 100, 20, 80, 40, 20);
    const certificateGradient = ctx.createLinearGradient(this.width - 100, 20, this.width - 20, 60);
    certificateGradient.addColorStop(0, '#4CAF50');
    certificateGradient.addColorStop(1, '#45a049');
    ctx.fillStyle = certificateGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('生成证书', this.width - 60, 45);

    // 从databus获取成就列表
    const unlockedAchievements = databus.getAchievements();
    const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

    // 绘制成就列表
    const startY = 120;
    const itemHeight = 90;
    
    this.allAchievements.forEach((achievement, index) => {
      const y = startY + index * itemHeight;
      const isUnlocked = unlockedIds.has(achievement.id);
      
      // 绘制成就项背景
      this.drawRoundedRect(ctx, 20, y, this.width - 40, itemHeight - 10, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制成就标题
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, 30, y + 25);
      
      // 绘制成就描述
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(achievement.description, 30, y + 45);
      
      // 绘制成就类型
      this.drawRoundedRect(ctx, 30, y + 55, 80, 25, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.font = '12px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(achievement.type, 70, y + 72);
      
      // 绘制解锁状态
      this.drawRoundedRect(ctx, this.width - 100, y + 15, 80, 30, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '14px Arial';
      ctx.fillStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width - 60, y + 35);
    });
  }

  // 绘制圆角矩形（兼容不同Canvas API）
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  renderCertificate(ctx) {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#4a6fa5');
    gradient.addColorStop(1, '#6e5b7b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制证书背景
    this.drawRoundedRect(ctx, 30, 30, this.width - 60, this.height - 60, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#4a6fa5';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // 绘制证书标题
    ctx.font = '32px Arial';
    ctx.fillStyle = '#4a6fa5';
    ctx.textAlign = 'center';
    ctx.fillText('数字体验证书', this.width / 2, 120);
    
    // 绘制证书内容
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.getAchievements();
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(`兹证明 ${userInfo ? userInfo.nickname : '用户'} 在三色融澄·数字赋能活动中`, this.width / 2, 200);
    ctx.fillText('积极参与，表现优异，特此颁发此证。', this.width / 2, 240);
    
    // 绘制统计信息
    this.drawRoundedRect(ctx, this.width / 2 - 120, 280, 240, 80, 15);
    ctx.fillStyle = 'rgba(74, 111, 165, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 111, 165, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#4a6fa5';
    ctx.textAlign = 'center';
    ctx.fillText(`总积分: ${totalScore}`, this.width / 2, 310);
    ctx.fillText(`解锁成就: ${achievements.length}/${this.allAchievements.length}`, this.width / 2, 340);
    
    // 绘制印章
    ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.beginPath();
    ctx.arc(this.width / 2, 420, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('海澄村', this.width / 2, 410);
    ctx.fillText('数字赋能', this.width / 2, 440);
    
    // 绘制日期
    const date = new Date().toLocaleDateString();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(`颁发日期: ${date}`, this.width / 2, 520);
    
    // 绘制分享按钮
    this.drawRoundedRect(ctx, this.width / 2 - 80, this.height - 90, 160, 50, 25);
    const shareGradient = ctx.createLinearGradient(this.width / 2 - 80, this.height - 90, this.width / 2 + 80, this.height - 40);
    shareGradient.addColorStop(0, '#4CAF50');
    shareGradient.addColorStop(1, '#45a049');
    ctx.fillStyle = shareGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('分享证书', this.width / 2, this.height - 60);
    
    // 绘制返回按钮
    this.drawRoundedRect(ctx, 30, 30, 80, 40, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 70, 55);
  }

  handleTouchStart(e) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    if (this.showCertificate) {
      // 检查是否点击了返回按钮
      if (x >= 20 && x <= 100 && y >= 20 && y <= 60) {
        this.showCertificate = false;
      }
      // 检查是否点击了分享按钮
      if (x >= this.width / 2 - 80 && x <= this.width / 2 + 80 && y >= this.height - 80 && y <= this.height - 40) {
        this.shareCertificate();
      }
    } else {
      // 检查是否点击了返回按钮
      if (x >= 20 && x <= 100 && y >= 20 && y <= 60) {
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('home');
        }
      }
      // 检查是否点击了生成证书按钮
      if (x >= this.width - 100 && x <= this.width - 20 && y >= 20 && y <= 60) {
        this.generateCertificate();
      }
    }
  }

  generateCertificate() {
    this.showCertificate = true;
  }

  shareCertificate() {
    // 模拟分享功能
    wx.showToast({
      title: '证书分享功能已触发',
      icon: 'success',
      duration: 2000
    });
    // 实际项目中，这里可以使用wx.canvasToTempFilePath将证书转换为图片，然后分享
  }

  destroy() {
    // 清理资源
  }
}

module.exports = AchievementPage;