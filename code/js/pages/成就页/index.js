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

    // 绘制背景
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.font = '24px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, 80);

    // 绘制返回按钮
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(20, 20, 80, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText('返回', 60, 45);

    // 绘制生成证书按钮
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(this.width - 100, 20, 80, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('生成证书', this.width - 60, 45);

    // 从databus获取成就列表
    const unlockedAchievements = databus.getAchievements();
    const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

    // 绘制成就列表
    const startY = 120;
    const itemHeight = 80;
    
    this.allAchievements.forEach((achievement, index) => {
      const y = startY + index * itemHeight;
      const isUnlocked = unlockedIds.has(achievement.id);
      
      // 绘制成就项背景
      ctx.fillStyle = isUnlocked ? '#e8f5e8' : '#f5f5f5';
      ctx.fillRect(20, y, this.width - 40, itemHeight - 10);
      
      // 绘制成就标题
      ctx.font = '16px Arial';
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, 30, y + 25);
      
      // 绘制成就描述
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666';
      ctx.fillText(achievement.description, 30, y + 45);
      
      // 绘制成就类型
      ctx.font = '12px Arial';
      ctx.fillStyle = '#999';
      ctx.fillText(achievement.type, 30, y + 65);
      
      // 绘制解锁状态
      ctx.font = '14px Arial';
      ctx.fillStyle = isUnlocked ? '#4CAF50' : '#999';
      ctx.textAlign = 'right';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width - 30, y + 35);
    });
  }

  renderCertificate(ctx) {
    // 绘制证书背景
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制证书边框
    ctx.strokeStyle = '#2196F3';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, this.width - 40, this.height - 40);
    
    // 绘制证书标题
    ctx.font = '28px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('数字体验证书', this.width / 2, 100);
    
    // 绘制证书内容
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.getAchievements();
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText(`兹证明 ${userInfo ? userInfo.nickname : '用户'} 在三色融澄·数字赋能活动中`, this.width / 2, 180);
    ctx.fillText('积极参与，表现优异，特此颁发此证。', this.width / 2, 220);
    
    // 绘制统计信息
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(`总积分: ${totalScore}`, this.width / 2, 280);
    ctx.fillText(`解锁成就: ${achievements.length}/${this.allAchievements.length}`, this.width / 2, 320);
    
    // 绘制印章
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(this.width / 2, 380, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('海澄村', this.width / 2, 370);
    ctx.fillText('数字赋能', this.width / 2, 400);
    
    // 绘制日期
    const date = new Date().toLocaleDateString();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#666';
    ctx.textAlign = 'center';
    ctx.fillText(`颁发日期: ${date}`, this.width / 2, 480);
    
    // 绘制分享按钮
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(this.width / 2 - 80, this.height - 80, 160, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('分享证书', this.width / 2, this.height - 55);
    
    // 绘制返回按钮
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(20, 20, 80, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 60, 45);
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