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

    this.certBgImage = null;
    if (typeof wx !== 'undefined' && wx.createImage) {
      const img = wx.createImage();
      img.onload = () => { this.certBgImage = img; };
      img.src = 'images/page/achievements/certificate.jpg';
    }

    this._certAvatarSrc = '';
    this._certAvatarImg = null;
    this._certAvatarReady = false;
    this._certAvatarFailed = false;
    this._certShareImagePath = null;
    this._certExportAttempted = false;
    this._certFramesRendered = 0;

    this.updateLayout();
  }

  updateLayout() {
    // Bottom buttons
    const btnW = this.scaleSize(100), btnH = this.scaleSize(50);
    const btnGap = this.scaleSize(10);
    const btnY = this.height - this.scaleSize(70);
    const btnStartX = (this.width - 2 * btnW - btnGap) / 2;
    this.buttons = {
      back:        new LayoutRect(btnStartX, btnY, btnW, btnH),
      certificate: new LayoutRect(btnStartX + btnW + btnGap, btnY, btnW, btnH),
    };

    // Certificate view buttons
    this.certBackBtn = new LayoutRect(this.scaleSize(30), this.scaleSize(30), this.scaleSize(80), this.scaleSize(40));
    const certBtnW = this.scaleSize(140), certBtnGap = this.scaleSize(20), certBtnH = this.scaleSize(50);
    const certBtnY = this.height - this.scaleSize(70);
    this.certShareBtn = new LayoutRect(this.width / 2 - certBtnW - certBtnGap / 2, certBtnY, certBtnW, certBtnH);
    this.certSaveBtn = new LayoutRect(this.width / 2 + certBtnGap / 2, certBtnY, certBtnW, certBtnH);

    // Detail dialog
    const cardW = this.width * 0.8, cardH = this.height * 0.6;
    const cardX = (this.width - cardW) / 2;
    const cardY = (this.height - cardH) / 2;
    const closeBtnW = this.scaleSize(100), closeBtnH = this.scaleSize(40);
    this.detailCloseBtn = new LayoutRect(this.width / 2 - closeBtnW / 2, cardY + cardH - this.scaleSize(60), closeBtnW, closeBtnH);
    this.detailCardRect = { x: cardX, y: cardY, w: cardW, h: cardH };

    // Certificate card rect (for export) — match image aspect ratio (1600x2848 ≈ 0.5618)
    const certCardW = this.width * 0.85;
    const certImgRatio = 1600 / 2848;
    const certMaxH = this.height - this.scaleSize(140);
    let certCardH = certCardW / certImgRatio;
    if (certCardH > certMaxH) {
      certCardH = certMaxH;
    }
    this.certCardRect = {
      x: (this.width - certCardW) / 2,
      y: (this.height - certCardH) / 2,
      w: certCardW,
      h: certCardH,
    };
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

    ctx.font = `${this.scaleSize(28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('成就系统', this.width / 2, this.height * 0.1);

    this.renderAchievementsList(ctx);
    this.renderBottomButtons(ctx);

    if (this.selectedAchievement) {
      this.renderAchievementDetail(ctx);
    }
  }

  renderAchievementsList(ctx) {
    const databus = this.databus;
    const achievementsWithStatus = databus.getAllAchievementsWithStatus();

    const startY = this.height * 0.12;
    const itemHeight = this.scaleSize(80);
    const endY = this.height - this.scaleSize(130);
    this.listStartY = startY;
    this.listItemHeight = itemHeight;
    const viewportHeight = endY - startY;
    
    const totalHeight = achievementsWithStatus.length * itemHeight;
    this.maxScrollY = Math.max(0, totalHeight - viewportHeight);
    
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));

    const listPad = this.scaleSize(20);
    const iconX = listPad + this.scaleSize(30);
    const contentX = listPad + this.scaleSize(70);

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

      drawRoundedRect(ctx, listPad, y, this.width - listPad * 2, itemHeight - this.scaleSize(10), this.scaleSize(15));
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 255, 255, 0.15)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = `${this.scaleSize(24)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
      ctx.fillText(achievement.icon || '🏆', iconX, y + itemHeight * 0.44);

      ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText(achievement.title, contentX, y + itemHeight * 0.35);

      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillText(achievement.description, contentX, y + itemHeight * 0.60);

      const typeBadgeW = this.scaleSize(60), typeBadgeH = this.scaleSize(20);
      drawRoundedRect(ctx, contentX, y + itemHeight * 0.69, typeBadgeW, typeBadgeH, this.scaleSize(10));
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fill();
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.fillText(achievement.type, contentX + typeBadgeW / 2, y + itemHeight * 0.85);

      const statusBadgeW = this.scaleSize(70), statusBadgeH = this.scaleSize(30);
      const statusX = this.width - listPad - statusBadgeW;
      drawRoundedRect(ctx, statusX, y + itemHeight * 0.25, statusBadgeW, statusBadgeH, this.scaleSize(15));
      ctx.fillStyle = isUnlocked ? 'rgba(76, 175, 80, 0.3)' : 'rgba(0, 0, 0, 0.1)';
      ctx.fill();
      ctx.strokeStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = isUnlocked ? '#4CAF50' : 'rgba(0, 0, 0, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText(isUnlocked ? '已解锁' : '未解锁', statusX + statusBadgeW / 2, y + itemHeight * 0.50);

      ctx.restore();
    });

    const unlockedCount = achievementsWithStatus.filter(a => a.isUnlocked).length;
    const totalCount = achievementsWithStatus.length;
    
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(`已解锁: ${unlockedCount}/${totalCount}`, this.width / 2, this.height - this.scaleSize(100));
    
    if (this.maxScrollY > 0) {
      this.drawScrollBar(ctx, startY, viewportHeight);
    }
  }

  drawScrollBar(ctx, startY, viewportHeight) {
    const scrollBarWidth = this.scaleSize(6);
    const scrollBarHeight = (viewportHeight / (viewportHeight + this.maxScrollY)) * viewportHeight;
    const scrollBarY = startY + (this.scrollY / this.maxScrollY) * (viewportHeight - scrollBarHeight);
    const scrollBarX = this.width - this.scaleSize(15);

    drawRoundedRect(ctx, scrollBarX, startY, scrollBarWidth, viewportHeight, this.scaleSize(3));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fill();

    drawRoundedRect(ctx, scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, this.scaleSize(3));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
  }

  renderBottomButtons(ctx) {
    const back = this.buttons.back;
    const cert = this.buttons.certificate;
    const btnRadius = this.scaleSize(25);
    const textBaselineOffset = this.scaleSize(6);

    drawRoundedRect(ctx, back.x, back.y, back.w, back.h, btnRadius);
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
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', back.centerX, back.centerY + textBaselineOffset);

    drawRoundedRect(ctx, cert.x, cert.y, cert.w, cert.h, btnRadius);
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
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('查看证书', cert.centerX, cert.centerY + textBaselineOffset);
  }

  renderAchievementDetail(ctx) {
    const achievement = this.selectedAchievement;
    const isUnlocked = achievement.isUnlocked;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.restore();

    const card = this.detailCardRect;
    const cardRadius = this.scaleSize(20);
    ctx.save();
    ctx.shadowColor = 'rgba(75, 85, 99, 0.3)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 4;
    drawRoundedRect(ctx, card.x, card.y, card.w, card.h, cardRadius);
    ctx.fillStyle = isUnlocked ? '#ffffff' : 'rgba(220, 220, 220, 0.95)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = isUnlocked ? 'rgba(76, 175, 80, 0.5)' : 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, card.x, card.y, card.w, card.h, cardRadius);
    ctx.stroke();
    ctx.restore();

    const cardH = card.h;
    const iconY = card.y + cardH * 0.14;
    if (isUnlocked) {
      ctx.font = `${this.scaleSize(48)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(achievement.icon || '🏆', this.width / 2, iconY);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.font = `${this.scaleSize(48)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000000';
      ctx.fillText(achievement.icon || '🏆', this.width / 2, iconY);
      ctx.restore();

      ctx.font = `${this.scaleSize(36)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillText('🔒', this.width / 2, iconY);
    }

    const titleY = card.y + cardH * 0.29;
    ctx.font = `bold ${this.scaleSize(20)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isUnlocked ? '#000000' : 'rgba(0, 0, 0, 0.4)';
    ctx.fillText(achievement.title, this.width / 2, titleY);

    const descY = card.y + cardH * 0.39;
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.35)';
    ctx.fillText(achievement.description, this.width / 2, descY);

    const typeY = card.y + cardH * 0.49;
    const typeBadgeW = this.scaleSize(70);
    drawRoundedRect(ctx, this.width / 2 - typeBadgeW / 2, typeY - this.scaleSize(12), typeBadgeW, this.scaleSize(24), this.scaleSize(12));
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.fill();
    ctx.font = `${this.scaleSize(12)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = isUnlocked ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText(achievement.type, this.width / 2, typeY + this.scaleSize(4));

    const statusY = card.y + cardH * 0.63;
    const statusW = this.scaleSize(90), statusH = this.scaleSize(30);
    drawRoundedRect(ctx, this.width / 2 - statusW / 2, statusY - this.scaleSize(14), statusW, statusH, this.scaleSize(15));
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
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(isUnlocked ? '已解锁' : '未解锁', this.width / 2, statusY + this.scaleSize(4));

    if (!isUnlocked) {
      const hintY = card.y + cardH * 0.77;
      ctx.font = `${this.scaleSize(13)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.textAlign = 'center';
      ctx.fillText('完成更多挑战来解锁此成就', this.width / 2, hintY);
    }

    const closeBtn = this.detailCloseBtn;
    drawRoundedRect(ctx, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, this.scaleSize(20));
    const closeGradient = ctx.createLinearGradient(closeBtn.x, closeBtn.y, closeBtn.x + closeBtn.w, closeBtn.y + closeBtn.h);
    closeGradient.addColorStop(0, '#6B7280');
    closeGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = closeGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('关闭', closeBtn.centerX, closeBtn.centerY + this.scaleSize(6));
  }

  // 头像加载：本地路径优先，失败回退 HTTP 下载；彻底失败则置失败标记停止重试
  _loadCertAvatar(userInfo) {
    this._certAvatarImg = null;
    this._certAvatarReady = false;
    this._certAvatarFailed = false;

    const tryHttpDownload = () => {
      if (typeof wx === 'undefined' || !wx.downloadFile || !userInfo.avatarUrl) {
        this._certAvatarFailed = true;
        return;
      }
      wx.downloadFile({
        url: userInfo.avatarUrl,
        success: (res) => {
          if (res.statusCode === 200 && res.tempFilePath) {
            const img = wx.createImage();
            img.onload = () => {
              this._certAvatarImg = img;
              this._certAvatarReady = true;
            };
            img.onerror = () => { this._certAvatarFailed = true; };
            img.src = res.tempFilePath;
          } else {
            this._certAvatarFailed = true;
          }
        },
        fail: () => { this._certAvatarFailed = true; }
      });
    };

    const localPath = userInfo.avatarLocalPath;
    if (localPath && typeof wx !== 'undefined' && wx.createImage) {
      const img = wx.createImage();
      img.onload = () => {
        this._certAvatarImg = img;
        this._certAvatarReady = true;
      };
      img.onerror = () => { tryHttpDownload(); };
      img.src = localPath;
    } else {
      tryHttpDownload();
    }
  }

  renderCertificate(ctx) {
    const cert = this.certCardRect;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.certBgImage && this.certBgImage.width) {
      const imgRatio = this.certBgImage.width / this.certBgImage.height;
      let drawW, drawH;
      if (cert.w / cert.h > imgRatio) {
        drawH = cert.h;
        drawW = drawH * imgRatio;
      } else {
        drawW = cert.w;
        drawH = drawW / imgRatio;
      }
      const drawX = cert.x + (cert.w - drawW) / 2;
      const drawY = cert.y + (cert.h - drawH) / 2;
      ctx.drawImage(this.certBgImage, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#f5f0e8';
      ctx.fillRect(cert.x, cert.y, cert.w, cert.h);
      ctx.strokeStyle = '#b8860b';
      ctx.lineWidth = 3;
      ctx.strokeRect(cert.x + 8, cert.y + 8, cert.w - 16, cert.h - 16);
    }

    const databus = this.databus;
    const userInfo = databus.getUserInfo();
    const totalScore = databus.getTotalScore();
    const achievements = databus.scoreManager.getUnlockedAchievements();
    const scores = databus.getAllScores();
    const textFont = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;

    // --- B区: 圆形头像 ---
    const avatarCenterX = cert.x + cert.w * 0.5;
    const avatarCenterY = cert.y + cert.h * 0.27 + this.scaleSize(5);
    const avatarR = cert.w * 0.12;
    const avatarKey = (userInfo && userInfo.avatarUrl) || '';
    if (avatarKey && !this._certAvatarReady && !this._certAvatarFailed && this._certAvatarSrc !== avatarKey) {
      this._certAvatarSrc = avatarKey;
      this._loadCertAvatar(userInfo);
    }
    if (this._certAvatarReady && this._certAvatarImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCenterX, avatarCenterY, avatarR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this._certAvatarImg, avatarCenterX - avatarR, avatarCenterY - avatarR, avatarR * 2, avatarR * 2);
      ctx.restore();
    }

    // --- C区: 昵称 ---
    ctx.font = `bold ${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#2c3e50';
    ctx.textAlign = 'center';
    ctx.fillText(userInfo ? userInfo.nickName : '用户', cert.x + cert.w * 0.5, cert.y + cert.h * 0.40 + 3);

    // --- D区: 统计数据 ---
    const statsX = cert.x + cert.w * 0.08;
    const statsY = cert.y + cert.h * 0.52;
    const statsW = cert.w * 0.84;
    const statsH = cert.h * 0.30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    drawRoundedRect(ctx, statsX, statsY, statsW, statsH, this.scaleSize(12));
    ctx.fill();

    const lineH = statsH / 5;
    ctx.font = textFont;
    ctx.fillStyle = '#34495e';
    ctx.textAlign = 'center';
    ctx.fillText(`总积分：${totalScore}`, cert.x + cert.w * 0.5, statsY + lineH * 1.2);
    ctx.fillText(`解锁成就：${achievements.length}/${this.allAchievements.length}`, cert.x + cert.w * 0.5, statsY + lineH * 2.2);
    ctx.fillText(`游戏次数：${scores.overall.totalGamesPlayed || 0}`, cert.x + cert.w * 0.5, statsY + lineH * 3.2);
    ctx.fillText(`答题正确率：${scores.quiz.accuracy || 0}%`, cert.x + cert.w * 0.5, statsY + lineH * 4.2);

    // --- F区: 颁发日期 ---
    const now = new Date();
    const date = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    ctx.font = textFont;
    ctx.fillStyle = '#7f8c8d';
    ctx.textAlign = 'center';
    ctx.fillText(`颁发日期：${date}`, cert.x + cert.w * 0.5, cert.y + cert.h * 0.94);

    // --- 底部按钮 ---
    const certBtnRadius = this.scaleSize(25);
    const certTextOffset = this.scaleSize(6);

    const share = this.certShareBtn;
    drawRoundedRect(ctx, share.x, share.y, share.w, share.h, certBtnRadius);
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
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('分享证书', share.centerX, share.centerY + certTextOffset);

    const save = this.certSaveBtn;
    drawRoundedRect(ctx, save.x, save.y, save.w, save.h, certBtnRadius);
    const saveGradient = ctx.createLinearGradient(save.x, save.y, save.x + save.w, save.y + save.h);
    saveGradient.addColorStop(0, '#0D9488');
    saveGradient.addColorStop(1, '#0F766E');
    ctx.fillStyle = saveGradient;
    ctx.fill();
    if (this.pressedId === 'certSave') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('保存到相册', save.centerX, save.centerY + certTextOffset);

    const backBtn = this.certBackBtn;
    drawRoundedRect(ctx, backBtn.x, backBtn.y, backBtn.w, backBtn.h, this.scaleSize(20));
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
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', backBtn.centerX, backBtn.centerY + certTextOffset);

    // 预导出证书图：wx.shareAppMessage 必须在点击事件的同步上下文中调用，不能等点击时再异步导出
    this._certFramesRendered++;
    const avatarSettled = !avatarKey || this._certAvatarReady || this._certAvatarFailed;
    if (!this._certExportAttempted && this._certFramesRendered >= 2 && (avatarSettled || this._certFramesRendered > 120)) {
      this._certExportAttempted = true;
      this._exportCertificate((p) => { this._certShareImagePath = p; }, () => {}, true);
    }
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

      this.isDragging = true;
      this.hasMoved = false;
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

    if (Math.abs(deltaY) > 5) {
      this.hasMoved = true;
    }

    let newScrollY = this.startScrollY - deltaY;

    newScrollY = Math.max(0, Math.min(newScrollY, this.maxScrollY));

    this.scrollY = newScrollY;
  }

  handleTouchEnd(e) {
    this.pressedId = null;

    if (this.isDragging && !this.hasMoved && !this.showCertificate && !this.selectedAchievement) {
      const coords = getTouchCoords(e.touches, e.changedTouches);
      if (coords) {
        const { y } = coords;
        if (y >= this.listStartY && y <= this.height - this.scaleSize(130)) {
          const index = Math.floor((y - this.listStartY + this.scrollY) / this.listItemHeight);
          const achievements = this.databus.getAllAchievementsWithStatus();
          if (index >= 0 && index < achievements.length) {
            this.selectedAchievement = achievements[index];
          }
        }
      }
    }

    this.isDragging = false;
    this.hasMoved = false;
  }

  generateCertificate() {
    this.showCertificate = true;
    this._certShareImagePath = null;
    this._certExportAttempted = false;
    this._certFramesRendered = 0;
  }

  _exportCertificate(successCallback, failCallback, silent) {
    const cert = this.certCardRect;
    const cvs = this.app.canvas;
    if (!cvs || !cvs.toTempFilePath) {
      if (!silent) wx.showToast({ title: '当前环境不支持导出', icon: 'none' });
      if (failCallback) failCallback(new Error('canvas.toTempFilePath not available'));
      return;
    }
    const dpr = this.dpr || 1;
    cvs.toTempFilePath({
      x: cert.x * dpr,
      y: cert.y * dpr,
      width: cert.w * dpr,
      height: cert.h * dpr,
      success: (res) => {
        successCallback(res.tempFilePath);
      },
      fail: (err) => {
        console.error('导出证书失败:', err);
        if (!silent) wx.showToast({ title: '导出失败', icon: 'none' });
        if (failCallback) failCallback(err);
      }
    });
  }

  shareCertificate() {
    if (typeof wx === 'undefined' || !wx.shareAppMessage) return;
    const options = {
      title: '我在「三色融澄·数字赋能」获得了数字体验证书，快来挑战吧！',
      fail: () => { wx.showToast({ title: '分享失败', icon: 'none' }); }
    };
    if (this._certShareImagePath) {
      options.imageUrl = this._certShareImagePath;
    }
    wx.shareAppMessage(options);
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
          if (err && err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
            wx.showModal({
              title: '需要授权',
              content: '保存照片需要相册权限，请在设置中开启',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) wx.openSetting();
              }
            });
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' });
          }
        }
      });
    });
  }


}

module.exports = AchievementPage;
