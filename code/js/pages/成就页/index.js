const { drawRoundedRect, drawButton, getTouchCoords } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class AchievementPage extends BasePage {
  constructor() {
    super();

    this.scrollY = 0;
    this.maxScrollY = 0;
    this.isDragging = false;
    this.startY = 0;
    this.startScrollY = 0;

    this.allAchievements = this.getAllAchievements();
  }
  
  getDatabus() {
    return GameGlobal.databus;
  }

  getAllAchievements() {
    const databus = this.getDatabus();
    return databus.scoreManager.getAllAchievementDefinitions();
  }

  render(ctx) {
    this.drawBackground(ctx);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = '28px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, 80);

    this.renderAchievementsList(ctx);
    this.renderBottomButtons(ctx);
  }

  renderAchievementsList(ctx) {
    const databus = this.getDatabus();
    const achievementsWithStatus = databus.getAllAchievementsWithStatus();

    const startY = 180;
    const itemHeight = 80;
    const endY = this.height - 130;
    const viewportHeight = endY - startY;
    
    const totalHeight = achievementsWithStatus.length * itemHeight;
    this.maxScrollY = Math.max(0, totalHeight - viewportHeight);
    
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));

    achievementsWithStatus.forEach((achievement, index) => {
      const y = startY + index * itemHeight - this.scrollY;
      
      if (y < startY - itemHeight * 2 || y > endY + itemHeight) return;
      
      const isUnlocked = achievement.isUnlocked;
      
      let opacity = 1;
      if (y < startY) {
        opacity = Math.max(0, (y - (startY - itemHeight)) / itemHeight);
      } else if (y > endY - itemHeight) {
        opacity = Math.max(0, (endY - y) / itemHeight);
      }
      
      ctx.save();
      
      ctx.globalAlpha = opacity;
      
      drawRoundedRect(ctx, 20, y, this.width - 40, itemHeight - 10, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(achievement.icon || '🏆', 50, y + 35);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, 90, y + 28);
      
      ctx.font = '12px Arial';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(achievement.description, 90, y + 48);
      
      drawRoundedRect(ctx, 90, y + 55, 60, 20, 10);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.font = '10px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.type, 120, y + 68);
      
      drawRoundedRect(ctx, this.width - 90, y + 20, 70, 30, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = '12px Arial';
      ctx.fillStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width - 55, y + 40);
      
      ctx.restore();
    });

    const unlockedCount = achievementsWithStatus.filter(a => a.isUnlocked).length;
    const totalCount = achievementsWithStatus.length;
    
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(`已解锁: ${unlockedCount}/${totalCount}`, this.width / 2, this.height - 100);
    
    if (this.maxScrollY > 0) {
      this.drawScrollBar(ctx, startY, viewportHeight);
    }
  }

  drawScrollBar(ctx, startY, viewportHeight) {
    const scrollBarWidth = 6;
    const scrollBarHeight = (viewportHeight / (viewportHeight + this.maxScrollY)) * viewportHeight;
    const scrollBarY = startY + (this.scrollY / this.maxScrollY) * (viewportHeight - scrollBarHeight);
    
    drawRoundedRect(ctx, this.width - 15, startY, scrollBarWidth, viewportHeight, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();
    
    drawRoundedRect(ctx, this.width - 15, scrollBarY, scrollBarWidth, scrollBarHeight, 3);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
  }

  renderBottomButtons(ctx) {
    const buttonHeight = 50;
    const buttonWidth = 100;
    const buttonY = this.height - buttonHeight - 30;

    drawRoundedRect(ctx, 40, buttonY, buttonWidth, buttonHeight, 25);
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
    ctx.fillText('返回', 90, buttonY + 28);

    const certX = this.width - 140;
    drawRoundedRect(ctx, certX, buttonY, buttonWidth, buttonHeight, 25);
    const certGradient = ctx.createLinearGradient(certX, buttonY, certX + buttonWidth, buttonY + buttonHeight);
    certGradient.addColorStop(0, '#10B981');
    certGradient.addColorStop(1, '#059669');
    ctx.fillStyle = certGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('查看证书', certX + 50, buttonY + 28);
  }

  renderCertificate(ctx) {
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

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);
    
    drawRoundedRect(ctx, 30, 30, this.width - 60, this.height - 60, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#4a6fa5';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    ctx.font = '32px Arial';
    ctx.fillStyle = '#4a6fa5';
    ctx.textAlign = 'center';
    ctx.fillText('数字体验证书', this.width / 2, 120);
    
    const databus = this.getDatabus();
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.scoreManager.achievements.unlocked;
    const scores = databus.getAllScores();
    
    ctx.font = '18px Arial';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(`兹证明 ${userInfo ? userInfo.nickName : '用户'} 在三色融澄·数字赋能活动中`, this.width / 2, 200);
    ctx.fillText('积极参与，表现优异，特此颁发此证。', this.width / 2, 240);
    
    drawRoundedRect(ctx, this.width / 2 - 140, 280, 280, 120, 15);
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
    
    ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.beginPath();
    ctx.arc(this.width / 2, 450, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('海澄村', this.width / 2, 440);
    ctx.fillText('数字赋能', this.width / 2, 470);
    
    const date = new Date().toLocaleDateString();
    ctx.font = '16px Arial';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(`颁发日期: ${date}`, this.width / 2, 550);
    
    drawRoundedRect(ctx, this.width / 2 - 80, this.height - 90, 160, 50, 25);
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
    ctx.fillText('分享证书', this.width / 2, this.height - 63);
    
    drawRoundedRect(ctx, 30, 30, 80, 40, 20);
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
    ctx.fillText('返回', 70, 52);
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;
    
    if (this.showCertificate) {
      if (x >= 30 && x <= 110 && y >= 30 && y <= 70) {
        this.showCertificate = false;
      }
      if (x >= this.width / 2 - 80 && x <= this.width / 2 + 80 && y >= this.height - 90 && y <= this.height - 40) {
        this.shareCertificate();
      }
    } else {
      if (x >= 40 && x <= 140 && y >= this.height - 80 && y <= this.height - 30) {
        if (GameGlobal.app && GameGlobal.app.showPage) {
          GameGlobal.app.showPage('home');
        }
        return;
      }

      if (x >= this.width - 140 && x <= this.width - 40 && y >= this.height - 80 && y <= this.height - 30) {
        this.generateCertificate();
        return;
      }
      
      this.isDragging = true;
      this.startY = y;
      this.startScrollY = this.scrollY;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.showCertificate) return;

    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { y } = coords;
    const deltaY = y - this.startY;
    
    let newScrollY = this.startScrollY - deltaY;
    
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

  clearAllAchievements() {
    const databus = this.getDatabus();
    const clearedCount = databus.clearAllAchievements();
    
    wx.showToast({
      title: `已清除 ${clearedCount} 个成就`,
      icon: 'success',
      duration: 2000
    });
    
    console.log('[成就页面] 已清除成就:', clearedCount);
  }

}

module.exports = AchievementPage;
