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
    this.pressedId = null;
    this.selectedAchievement = null;

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
    const certBtnW = 140, certBtnGap = 20;
    const certBtnY = this.height - 90;
    this.certShareBtn = new LayoutRect(this.width / 2 - certBtnW - certBtnGap / 2, certBtnY, certBtnW, 50);
    this.certSaveBtn = new LayoutRect(this.width / 2 + certBtnGap / 2, certBtnY, certBtnW, 50);

    const cardW = 300, cardH = 350;
    const cardX = (this.width - cardW) / 2;
    const cardY = (this.height - cardH) / 2;
    this.detailCloseBtn = new LayoutRect(this.width / 2 - 50, cardY + cardH - 60, 100, 40);
    this.detailCardRect = { x: cardX, y: cardY, w: cardW, h: cardH };
  }
  
  getAllAchievements() {
    return this.databus.scoreManager.getAllAchievementDefinitions();
  }

  render(ctx) {
    if (this.showCertificate) {
      this.renderCertificate(ctx);
      return;
    }

    this.drawBackground(ctx);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.font = `${this.scaleSize(28)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, 80);

    this.renderAchievementsList(ctx);
    this.renderBottomButtons(ctx);

    if (this.selectedAchievement) {
      this.renderAchievementDetail(ctx);
    }
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
      
      ctx.font = `${this.scaleSize(24)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(achievement.icon || '🏆', 50, y + 35);
      
      ctx.font = `${this.scaleSize(16)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, 90, y + 28);
      
      ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(achievement.description, 90, y + 48);
      
      drawRoundedRect(ctx, 90, y + 55, 60, 20, 10);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.type, 120, y + 68);
      
      drawRoundedRect(ctx, this.width - 90, y + 20, 70, 30, 15);
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width - 55, y + 40);
      
      ctx.restore();
    });

    const unlockedCount = achievementsWithStatus.filter(a => a.isUnlocked).length;
    const totalCount = achievementsWithStatus.length;
    
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
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
    if (this.pressedId === 'back') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', back.centerX, back.centerY + 6);

    drawRoundedRect(ctx, cert.x, cert.y, cert.w, cert.h, 25);
    const certGradient = ctx.createLinearGradient(cert.x, cert.y, cert.x + cert.w, cert.y + cert.h);
    certGradient.addColorStop(0, '#10B981');
    certGradient.addColorStop(1, '#059669');
    ctx.fillStyle = certGradient;
    ctx.fill();
    if (this.pressedId === 'certificate') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('查看证书', cert.centerX, cert.centerY + 6);
  }

  renderAchievementDetail(ctx) {
    const achievement = this.selectedAchievement;
    const isUnlocked = achievement.isUnlocked;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    const card = this.detailCardRect;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    drawRoundedRect(ctx, card.x, card.y, card.w, card.h, 20);
    ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(220, 220, 220, 0.95)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = isUnlocked ? 'rgba(76, 175, 80, 0.5)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, card.x, card.y, card.w, card.h, 20);
    ctx.stroke();
    ctx.restore();

    const iconY = card.y + 50;
    if (isUnlocked) {
      ctx.font = `${this.scaleSize(48)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(achievement.icon || '🏆', this.width / 2, iconY);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.font = `${this.scaleSize(48)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(achievement.icon || '🏆', this.width / 2, iconY);
      ctx.restore();

      ctx.font = `${this.scaleSize(36)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillText('🔒', this.width / 2, iconY);
    }

    const titleY = card.y + 100;
    ctx.font = `bold ${this.scaleSize(20)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
    ctx.fillText(achievement.title, this.width / 2, titleY);

    const descY = card.y + 135;
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText(achievement.description, this.width / 2, descY);

    const typeY = card.y + 170;
    const typeBadgeW = 70;
    drawRoundedRect(ctx, this.width / 2 - typeBadgeW / 2, typeY - 12, typeBadgeW, 24, 12);
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.fill();
    ctx.font = `${this.scaleSize(12)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.type, this.width / 2, typeY + 4);

    const statusY = card.y + 220;
    const statusW = 90, statusH = 30;
    drawRoundedRect(ctx, this.width / 2 - statusW / 2, statusY - 14, statusW, statusH, 15);
    if (isUnlocked) {
      ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#4CAF50';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    }
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width / 2, statusY + 4);

    if (!isUnlocked) {
      const hintY = card.y + 270;
      ctx.font = `${this.scaleSize(13)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.textAlign = 'center';
      ctx.fillText('完成更多挑战来解锁此成就', this.width / 2, hintY);
    }

    const closeBtn = this.detailCloseBtn;
    drawRoundedRect(ctx, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, 20);
    const closeGradient = ctx.createLinearGradient(closeBtn.x, closeBtn.y, closeBtn.x + closeBtn.w, closeBtn.y + closeBtn.h);
    closeGradient.addColorStop(0, '#6B7280');
    closeGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = closeGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('关闭', closeBtn.centerX, closeBtn.centerY + 6);
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
    
    ctx.font = `${this.scaleSize(32)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#4a6fa5';
    ctx.textAlign = 'center';
    ctx.fillText('数字体验证书', this.width / 2, 120);
    
    const databus = this.databus;
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.scoreManager.getUnlockedAchievements();
    const scores = databus.getAllScores();
    
    ctx.font = `${this.scaleSize(18)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
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
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
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
    ctx.font = `${this.scaleSize(20)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('海澄村', this.width / 2, 440);
    ctx.fillText('数字赋能', this.width / 2, 470);
    
    const date = new Date().toLocaleDateString();
    ctx.font = `${this.scaleSize(16)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
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
    if (this.pressedId === 'certShare') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('分享证书', share.centerX, share.centerY + 6);

    const save = this.certSaveBtn;
    drawRoundedRect(ctx, save.x, save.y, save.w, save.h, 25);
    const saveGradient = ctx.createLinearGradient(save.x, save.y, save.x + save.w, save.y + save.h);
    saveGradient.addColorStop(0, '#3B82F6');
    saveGradient.addColorStop(1, '#2563EB');
    ctx.fillStyle = saveGradient;
    ctx.fill();
    if (this.pressedId === 'certSave') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('保存到相册', save.centerX, save.centerY + 6);

    const backBtn = this.certBackBtn;
    drawRoundedRect(ctx, backBtn.x, backBtn.y, backBtn.w, backBtn.h, 20);
    const backGradient = ctx.createLinearGradient(backBtn.x, backBtn.y, backBtn.x + backBtn.w, backBtn.y + backBtn.h);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    ctx.fill();
    if (this.pressedId === 'certBack') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px Arial, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', backBtn.centerX, backBtn.centerY + 6);
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;

    if (this.selectedAchievement) {
      if (this.detailCloseBtn.contains(x, y)) {
        this.selectedAchievement = null;
        return;
      }
      const card = this.detailCardRect;
      if (x < card.x || x > card.x + card.w || y < card.y || y > card.y + card.h) {
        this.selectedAchievement = null;
        return;
      }
      return;
    }

    if (this.showCertificate) {
      if (this.certBackBtn.contains(x, y)) {
        this.pressedId = 'certBack';
        this.showCertificate = false;
      } else if (this.certShareBtn.contains(x, y)) {
        this.pressedId = 'certShare';
        this.shareCertificate();
      } else if (this.certSaveBtn.contains(x, y)) {
        this.pressedId = 'certSave';
        this.saveCertificate();
      }
    } else {
      if (this.buttons.back.contains(x, y)) {
        this.pressedId = 'back';
        this.navigateTo('home');
        return;
      }

      if (this.buttons.certificate.contains(x, y)) {
        this.pressedId = 'certificate';
        this.generateCertificate();
        return;
      }

      if (y >= 180 && y <= this.height - 130) {
        const index = Math.floor((y - 180 + this.scrollY) / 80);
        const achievements = this.databus.getAllAchievementsWithStatus();
        if (index >= 0 && index < achievements.length) {
          this.selectedAchievement = achievements[index];
          return;
        }
      }

      this.isDragging = true;
      this.startY = y;
      this.startScrollY = this.scrollY;
    }
  }

  handleTouchMove(e) {
    if (!this.isDragging || this.showCertificate || this.selectedAchievement) return;

    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { y } = coords;
    const deltaY = y - this.startY;
    
    let newScrollY = this.startScrollY - deltaY;
    
    newScrollY = Math.max(0, Math.min(newScrollY, this.maxScrollY));
    
    this.scrollY = newScrollY;
  }

  handleTouchEnd(e) {
    this.pressedId = null;
    this.isDragging = false;
  }

  generateCertificate() {
    this.showCertificate = true;
  }

  _exportCertificate(successCallback, failCallback) {
    wx.canvasToTempFilePath({
      x: 30,
      y: 30,
      width: this.width - 60,
      height: this.height - 60,
      success: (res) => {
        successCallback(res.tempFilePath);
      },
      fail: (err) => {
        console.error('导出证书失败:', err);
        wx.showToast({ title: '导出失败', icon: 'none' });
        if (failCallback) failCallback(err);
      }
    });
  }

  shareCertificate() {
    this._exportCertificate((tempFilePath) => {
      wx.shareAppMessage({
        imageUrl: tempFilePath,
        success: () => {
          wx.showToast({ title: '分享成功', icon: 'success' });
        },
        fail: () => {
          wx.showToast({ title: '分享失败', icon: 'none' });
        }
      });
    });
  }

  saveCertificate() {
    this._exportCertificate((tempFilePath) => {
      wx.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          wx.showToast({ title: '已保存到相册', icon: 'success' });
        },
        fail: (err) => {
          console.error('保存到相册失败:', err);
          if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
            wx.showToast({ title: '请授权相册权限', icon: 'none' });
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      });
    });
  }


}

module.exports = AchievementPage;
