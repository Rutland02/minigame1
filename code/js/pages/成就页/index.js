// 成就页
const DataBus = require('../../databus');

const databus = new DataBus();

class AchievementPage {
  constructor() {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.backgroundImage = null;
    
    // 滑动相关变量
    this.scrollY = 0;
    this.maxScrollY = 0;
    this.isDragging = false;
    this.startY = 0;
    this.startScrollY = 0;
    
    // 加载背景图
    this.loadBackgroundImage();
    
    // 获取所有成就定义
    this.allAchievements = this.getAllAchievements();
  }



  // 获取所有成就定义
  getAllAchievements() {
    return [
      // 基础成就
      { id: 'first_game', title: '初次尝试', description: '完成第一局游戏', type: '基础', icon: '🎮' },
      
      // 消消乐成就
      { id: 'match3_master', title: '消消乐大师', description: '消消乐得分超过1000', type: '游戏', icon: '🍬' },
      { id: 'match3_legend', title: '消消乐传奇', description: '消消乐得分超过10000', type: '游戏', icon: '👑' },
      { id: 'level_master', title: '等级达人', description: '消消乐达到10级', type: '游戏', icon: '📈' },
      
      // 拼图成就
      { id: 'puzzle_beginner', title: '拼图入门', description: '完成简单难度拼图', type: '游戏', icon: '🧩' },
      { id: 'puzzle_intermediate', title: '拼图高手', description: '完成中等难度拼图', type: '游戏', icon: '🎲' },
      { id: 'puzzle_master', title: '拼图大师', description: '完成困难难度拼图', type: '游戏', icon: '🎨' },
      
      // 答题成就
      { id: 'quiz_master', title: '知识达人', description: '答题正确率达到80%', type: '知识', icon: '📚' },
      { id: 'quiz_perfect', title: '学霸', description: '单次答题全对', type: '知识', icon: '💯' },
      
      // 综合成就
      { id: 'game_enthusiast', title: '游戏爱好者', description: '累计游玩10次', type: '综合', icon: '🎮' },
      { id: 'check_in_master', title: '打卡达人', description: '完成所有线下打卡点', type: '线下', icon: '📍' },
      { id: 'collector', title: '收藏家', description: '解锁所有成就', type: '综合', icon: '💎' }
    ];
  }

  render(ctx) {
    // 绘制背景图
    if (this.backgroundImage) {
      const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      const offsetX = (this.width - scaledWidth) / 2;
      const offsetY = (this.height - scaledHeight) / 2;
      ctx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#4a6fa5');
      gradient.addColorStop(1, '#6e5b7b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制标题
    ctx.font = '28px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, 80);

    // 直接绘制成就列表
    this.renderAchievementsList(ctx);

    // 绘制底部按钮
    this.renderBottomButtons(ctx);
  }



  // 绘制成就列表
  renderAchievementsList(ctx) {
    const achievementsWithStatus = databus.getAllAchievementsWithStatus();
    const unlockedIds = new Set(achievementsWithStatus.filter(a => a.isUnlocked).map(a => a.id));

    const startY = 180; // 增加顶部间距，避免覆盖标签页
    const itemHeight = 80; // 调整成就项高度
    const endY = this.height - 130; // 增加底部间距，避免覆盖底部按钮
    const viewportHeight = endY - startY;
    const visibleCount = Math.floor(viewportHeight / itemHeight);
    
    // 计算最大滚动距离
    const totalHeight = achievementsWithStatus.length * itemHeight;
    this.maxScrollY = Math.max(0, totalHeight - viewportHeight);
    
    // 限制滚动范围
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));

    achievementsWithStatus.forEach((achievement, index) => {
      const y = startY + index * itemHeight - this.scrollY;
      
      // 扩展绘制范围，允许成就项在边界外一定距离内仍然绘制
      if (y < startY - itemHeight * 2 || y > endY + itemHeight) return;
      
      const isUnlocked = achievement.isUnlocked;
      
      // 计算透明度，实现平滑的淡入淡出效果
      let opacity = 1;
      if (y < startY) {
        // 顶部边界
        opacity = Math.max(0, (y - (startY - itemHeight)) / itemHeight);
      } else if (y > endY - itemHeight) {
        // 底部边界
        opacity = Math.max(0, (endY - y) / itemHeight);
      }
      
      // 保存当前状态
      ctx.save();
      
      // 设置透明度
      ctx.globalAlpha = opacity;
      
      // 绘制成就项背景
      this.drawRoundedRect(ctx, 20, y, this.width - 40, itemHeight - 10, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制成就图标
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(achievement.icon || '🏆', 50, y + 35);
      
      // 绘制成就标题
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, 80, y + 25);
      
      // 绘制成就描述
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(achievement.description, 80, y + 45);
      
      // 绘制成就类型
      this.drawRoundedRect(ctx, 80, y + 52, 60, 20, 10);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.type, 110, y + 66);
      
      // 绘制解锁状态
      this.drawRoundedRect(ctx, this.width - 90, y + 20, 70, 30, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '12px Arial';
      ctx.fillStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width - 55, y + 40);
      
      // 恢复状态
      ctx.restore();
    });

    // 绘制成就统计摘要
    const unlockedCount = achievementsWithStatus.filter(a => a.isUnlocked).length;
    const totalCount = achievementsWithStatus.length;
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(`已解锁: ${unlockedCount}/${totalCount}`, this.width / 2, this.height - 100);
    
    // 绘制滚动条
    if (this.maxScrollY > 0) {
      this.drawScrollBar(ctx, startY, viewportHeight);
    }
  }

  // 绘制滚动条
  drawScrollBar(ctx, startY, viewportHeight) {
    const scrollBarWidth = 6;
    const scrollBarHeight = (viewportHeight / (viewportHeight + this.maxScrollY)) * viewportHeight;
    const scrollBarY = startY + (this.scrollY / this.maxScrollY) * (viewportHeight - scrollBarHeight);
    
    // 滚动条背景
    this.drawRoundedRect(ctx, this.width - 15, startY, scrollBarWidth, viewportHeight, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    
    // 滚动条滑块
    this.drawRoundedRect(ctx, this.width - 15, scrollBarY, scrollBarWidth, scrollBarHeight, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
  }



  // 绘制底部按钮
  renderBottomButtons(ctx) {
    const buttonHeight = 50;
    const buttonWidth = 100;
    const buttonY = this.height - buttonHeight - 30;
    
    // 绘制返回按钮 - 底部左侧
    this.drawRoundedRect(ctx, 40, buttonY, buttonWidth, buttonHeight, 25);
    const backGradient = ctx.createLinearGradient(40, buttonY, 140, buttonY + buttonHeight);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', 90, buttonY + 32);
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
    // 绘制背景图
    if (this.backgroundImage) {
      const scale = Math.max(this.width / this.backgroundImage.width, this.height / this.backgroundImage.height);
      const scaledWidth = this.backgroundImage.width * scale;
      const scaledHeight = this.backgroundImage.height * scale;
      const offsetX = (this.width - scaledWidth) / 2;
      const offsetY = (this.height - scaledHeight) / 2;
      ctx.drawImage(this.backgroundImage, offsetX, offsetY, scaledWidth, scaledHeight);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#4a6fa5');
      gradient.addColorStop(1, '#6e5b7b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }

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
    const scores = databus.getAllScores();
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(`兹证明 ${userInfo ? userInfo.nickname : '用户'} 在三色融澄·数字赋能活动中`, this.width / 2, 200);
    ctx.fillText('积极参与，表现优异，特此颁发此证。', this.width / 2, 240);
    
    // 绘制统计信息
    this.drawRoundedRect(ctx, this.width / 2 - 140, 280, 280, 120, 15);
    ctx.fillStyle = 'rgba(74, 111, 165, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(74, 111, 165, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#4a6fa5';
    ctx.textAlign = 'center';
    ctx.fillText(`总积分: ${totalScore}`, this.width / 2, 310);
    ctx.fillText(`解锁成就: ${achievements.length}/${this.allAchievements.length}`, this.width / 2, 335);
    ctx.fillText(`游戏次数: ${scores.overall.totalGamesPlayed || 0}`, this.width / 2, 360);
    ctx.fillText(`答题正确率: ${scores.quiz.accuracy || 0}%`, this.width / 2, 385);
    
    // 绘制印章
    ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.beginPath();
    ctx.arc(this.width / 2, 450, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('海澄村', this.width / 2, 440);
    ctx.fillText('数字赋能', this.width / 2, 470);
    
    // 绘制日期
    const date = new Date().toLocaleDateString();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(`颁发日期: ${date}`, this.width / 2, 550);
    
    // 绘制分享按钮
    this.drawRoundedRect(ctx, this.width / 2 - 80, this.height - 90, 160, 50, 25);
    const shareGradient = ctx.createLinearGradient(this.width / 2 - 80, this.height - 90, this.width / 2 + 80, this.height - 40);
    shareGradient.addColorStop(0, '#10B981');
    shareGradient.addColorStop(1, '#059669');
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
    const backGradient = ctx.createLinearGradient(30, 30, 110, 70);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
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
      if (x >= 30 && x <= 110 && y >= 30 && y <= 70) {
        this.showCertificate = false;
      }
      // 检查是否点击了分享按钮
      if (x >= this.width / 2 - 80 && x <= this.width / 2 + 80 && y >= this.height - 90 && y <= this.height - 40) {
        this.shareCertificate();
      }
    } else {
      // 检查是否点击了返回按钮 - 底部左侧
      if (x >= 40 && x <= 140 && y >= this.height - 80 && y <= this.height - 30) {
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('home');
        }
        return;
      }
      // 检查是否点击了生成证书按钮 - 底部右侧
      if (x >= this.width - 140 && x <= this.width - 40 && y >= this.height - 80 && y <= this.height - 30) {
        this.generateCertificate();
        return;
      }
      
      // 开始拖动
      this.isDragging = true;
      this.startY = y;
      this.startScrollY = this.scrollY;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.showCertificate) return;
    
    const y = e.touches[0].clientY;
    const deltaY = y - this.startY;
    
    // 计算新的滚动位置
    let newScrollY = this.startScrollY - deltaY;
    
    // 限制滚动范围
    newScrollY = Math.max(0, Math.min(newScrollY, this.maxScrollY));
    
    this.scrollY = newScrollY;
  }

  handleTouchEnd(e) {
    this.isDragging = false;
  }

  generateCertificate() {
    this.showCertificate = true;
  }

  shareCertificate() {
    wx.showToast({
      title: '证书分享功能已触发',
      icon: 'success',
      duration: 2000
    });
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

  update() {
    // 页面更新逻辑
  }

  destroy() {
    // 清理资源
  }
}

module.exports = AchievementPage;
