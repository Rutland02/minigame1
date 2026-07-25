const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class AchievementPage extends BasePage {
  constructor() {
    super();

    this.scrollY = 0;
    this.maxScrollY = 0;
    this.isDragging = false;
    this.startY = 0;
    this.startScrollY = 0;
    this.showCertificate = false;

    this.allAchievements = this.getAllAchievements();
    this.updateLayout();
  }

  updateLayout() {
    const btnH = 50, btnW = 100;
    const btnY = this.height - btnH - 30;
    this.buttons = {
      back:        new LayoutRect(40, btnY, btnW, btnH),
      certificate: new LayoutRect(this.width - 140, btnY, btnW, btnH),
    };
    this.certBackBtn = new LayoutRect(30, 30, 80, 40);
    this.certShareBtn = new LayoutRect(this.width / 2 - 80, this.height - 90, 160, 50);
  }
  
  getAllAchievements() {
    return this.databus.scoreManager.getAllAchievementDefinitions();
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
    const databus = this.databus;
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
    const back = this.buttons.back;
    const cert = this.buttons.certificate;

    drawRoundedRect(ctx, back.x, back.y, back.w, back.h, 25);
    const backGradient = ctx.createLinearGradient(back.x, back.y, back.x + back.w, back.y + back.h);
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
    ctx.fillText('返回', back.centerX, back.centerY + 6);

    drawRoundedRect(ctx, cert.x, cert.y, cert.w, cert.h, 25);
    const certGradient = ctx.createLinearGradient(cert.x, cert.y, cert.x + cert.w, cert.y + cert.h);
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
    ctx.fillText('查看证书', cert.centerX, cert.centerY + 6);
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
    
    const databus = this.databus;
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.scoreManager.getUnlockedAchievements();
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
    
    const share = this.certShareBtn;
    drawRoundedRect(ctx, share.x, share.y, share.w, share.h, 25);
    const shareGradient = ctx.createLinearGradient(share.x, share.y, share.x + share.w, share.y + share.h);
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
    ctx.fillText('分享证书', share.centerX, share.centerY + 6);

    const backBtn = this.certBackBtn;
    drawRoundedRect(ctx, backBtn.x, backBtn.y, backBtn.w, backBtn.h, 20);
    const backGradient = ctx.createLinearGradient(backBtn.x, backBtn.y, backBtn.x + backBtn.w, backBtn.y + backBtn.h);
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
    ctx.fillText('返回', backBtn.centerX, backBtn.centerY + 6);
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;

    if (this.showCertificate) {
      if (this.certBackBtn.contains(x, y)) {
        this.showCertificate = false;
      }
      if (this.certShareBtn.contains(x, y)) {
        this.shareCertificate();
      }
    } else {
      if (this.buttons.back.contains(x, y)) {
        this.navigateTo('home');
        return;
      }

      if (this.buttons.certificate.contains(x, y)) {
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


}

module.exports = AchievementPage;
