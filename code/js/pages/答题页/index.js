const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');
const QuizViewModel = require('./quizViewModel');

class QuizPage extends BasePage {
  constructor(difficulty) {
    super();
    this.vm = new QuizViewModel(difficulty);
    this._questionsLoading = true;
    this.vm.loadQuestions().then(() => {
      this._questionsLoading = false;
      this.vm._startTimer();
    });

    this.animationFrame = 0;
    this.resultButtonRect = null;
    this.gameOverButtons = {};
    this.pressedId = null;
    this._lastTimeLeft = 30;
    this.hintAnimating = false;
    this.hintFrame = 0;
  }

  getButtonRects() {
    const h = this.height;
    const w = this.width;
    const btnH = this.scaleSize(50);
    const btnY = h - this.scaleSize(70);
    const backW = this.scaleSize(80);
    const hintW = this.scaleSize(100);
    const submitW = this.scaleSize(100);
    return {
      back:    new LayoutRect(20, btnY, backW, btnH),
      hint:    new LayoutRect((w - hintW) / 2, btnY, hintW, btnH),
      submit:  new LayoutRect(w - 20 - submitW, btnY, submitW, btnH),
    };
  }

  render(ctx) {
    this.drawBackground(ctx);
    const { vm } = this;

    if (!vm.questions || vm.questions.length === 0) {
      ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      if (this._questionsLoading) {
        ctx.fillStyle = '#000000';
        ctx.fillText('题目加载中...', this.width / 2, this.height / 2);
      } else {
        ctx.fillStyle = '#FF0000';
        ctx.fillText('题库加载失败，请检查 content/ 目录', this.width / 2, this.height / 2);
      }
      this._drawBackButton(ctx);
      return;
    }

    if (vm.gameOver) {
      this._drawGameOver(ctx);
      return;
    }

    this._drawHeader(ctx);
    this._drawQuestionCard(ctx);
    this._drawOptions(ctx);
    this.animationFrame++;
    if (this.hintAnimating) {
      this.hintFrame++;
      if (this.hintFrame > 60) {
        this.hintAnimating = false;
      }
    }

    if (vm.timeLeft < 5 && this._lastTimeLeft >= 5) {
      try { wx.vibrateShort({ type: 'medium' }); } catch(err) {}
    }
    this._lastTimeLeft = vm.timeLeft;

    if (vm.showResult) {
      this._drawResultOverlay(ctx);
    } else {
      this._drawBottomButtons(ctx);
    }
  }

  _drawHeader(ctx) {
    const { vm } = this;
    const headerY = Math.round(this.height * 0.01);
    const headerH = Math.round(this.height * 0.08);
    const pad = Math.round(this.height * 0.015);
    const headerTextY = headerY + headerH / 2 + 6;
    const badgeW = this.scaleSize(80);
    const badgeH = this.scaleSize(26);
    const badgeY = headerY + (headerH - badgeH) / 2;
    const badgeR = Math.round(badgeH / 2);

    drawRoundedRect(ctx, 20, headerY, this.width - 40, headerH, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(`第${vm.progress}题`, 20 + pad, headerTextY);

    let timerColor = '#000000';
    if (vm.timeLeft > 15) {
      timerColor = '#10B981';
    } else if (vm.timeLeft > 5) {
      timerColor = '#F59E0B';
    } else {
      const blink = Math.sin(this.animationFrame * 0.3) > 0;
      timerColor = blink ? '#EF4444' : '#DC2626';
    }
    ctx.font = `bold ${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = timerColor;
    ctx.textAlign = 'right';
    ctx.fillText(`剩余时间: ${vm.timeLeft}s`, this.width - 20 - badgeW - this.scaleSize(10), headerTextY);

    const question = vm.currentQuestion;
    drawRoundedRect(ctx, this.width - 20 - badgeW, badgeY, badgeW, badgeH, badgeR);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = `${this.scaleSize(12)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(question.type, this.width - 20 - badgeW / 2, headerTextY);
  }

  _drawQuestionCard(ctx) {
    const { vm } = this;
    const question = vm.currentQuestion;
    if (!question) return;
    const cardX = 20;
    const cardY = Math.round(this.height * 0.12);
    const cardW = this.width - 40;
    const cardH = Math.round(this.height * 0.2);
    const pad = this.scaleSize(18);
    const textY = cardY + cardH / 3 + 6;

    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `${this.scaleSize(17)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const maxTextW = cardW - pad * 2;
    this._drawWrappedText(ctx, question.question, cardX + pad, textY, maxTextW, Math.round(this.scaleSize(17) * 1.4));
  }

  _drawOptions(ctx) {
    const { vm } = this;
    const question = vm.currentQuestion;
    if (!question) return;
    const optionYStart = Math.round(this.height * 0.35);
    const optionHeight = this.scaleSize(56) + this.scaleSize(10);

    const options = question.options || [];
    options.forEach((option, index) => {
      let fillColor = 'rgba(255, 255, 255, 0.95)';
      let strokeColor = '#E2E8F0';
      let textColor = '#333333';
      if (vm.isAnswered) {
        if (index === question.correctAnswer) {
          fillColor = 'rgba(76, 175, 80, 0.35)';
          strokeColor = '#4CAF50';
          textColor = '#2E7D32';
        } else if (index === vm.selectedOption) {
          fillColor = 'rgba(244, 67, 54, 0.35)';
          strokeColor = '#EF5350';
          textColor = '#C62828';
        }
      } else if (index === vm.selectedOption) {
        fillColor = 'rgba(16, 185, 129, 0.2)';
        strokeColor = '#10B981';
        textColor = '#065F46';
      }

      if (this.hintAnimating && !vm.isAnswered && index !== vm.selectedOption) {
        fillColor = 'rgba(156, 163, 175, 0.3)';
        strokeColor = 'rgba(156, 163, 175, 0.5)';
        textColor = '#9CA3AF';
      }
      if (this.hintAnimating && !vm.isAnswered && index === vm.selectedOption) {
        const pulse = 0.3 + Math.sin(this.hintFrame * 0.15) * 0.15;
        fillColor = `rgba(76, 175, 80, ${pulse})`;
        strokeColor = '#4CAF50';
        textColor = '#2E7D32';
      }

      let scale = 1;
      if (index === vm.selectedOption && !vm.isAnswered) {
        scale = 1 + Math.sin(this.animationFrame * 0.1) * 0.05;
      }

      ctx.save();
      const optBaseline = this.scaleSize(28);
      ctx.translate(20 + (this.width - 40) / 2, optionYStart + index * optionHeight + optBaseline);
      ctx.scale(scale, scale);
      ctx.translate(-(20 + (this.width - 40) / 2), -(optionYStart + index * optionHeight + optBaseline));

      const optH = this.scaleSize(56);
      drawRoundedRect(ctx, 20, optionYStart + index * optionHeight, this.width - 40, optH, 15);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 40, optionYStart + index * optionHeight + optBaseline);

      if (vm.isAnswered && index === question.correctAnswer) {
        ctx.fillStyle = '#059669';
        ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', this.width - 35, optionYStart + index * optionHeight + optBaseline);
      }

      if (vm.isAnswered && index === vm.selectedOption && !vm.isCorrect) {
        const textY = optionYStart + index * optionHeight + optBaseline;
        ctx.strokeStyle = '#DC2626';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(40, textY);
        ctx.lineTo(this.width - 40, textY);
        ctx.stroke();
        ctx.fillStyle = '#DC2626';
        ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('✗', this.width - 35, textY);
      }

      ctx.restore();
    });
  }

  _drawResultOverlay(ctx) {
    const { vm } = this;
    const question = vm.currentQuestion;
    const alpha = Math.min(vm.resultAnimation * 0.05, 0.7);
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.fillRect(0, 0, this.width, this.height);

    const scale = 0.5 + Math.min(vm.resultAnimation * 0.1, 0.5);
    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-this.width / 2, -this.height / 2);

    const pad = this.scaleSize(18);
    const resultCardH = Math.round(this.height * 0.55);
    const resultCardW = this.width - pad * 2;
    const resultCardX = pad;
    const resultCardY = (this.height - resultCardH) / 2;
    const resultCardCX = this.width / 2;
    const lineH = Math.round(this.scaleSize(17) * 1.4);
    const btnH = this.scaleSize(46);
    const btnW = Math.round(this.width * 0.55);

    drawRoundedRect(ctx, resultCardX, resultCardY, resultCardW, resultCardH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const titleY = resultCardY + Math.round(resultCardH * 0.15) + 6;
    ctx.font = `${this.scaleSize(24)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = vm.isCorrect ? '#4CAF50' : '#F44336';
    ctx.textAlign = 'center';
    ctx.fillText(vm.isCorrect ? '回答正确！' : '回答错误！', resultCardCX, titleY);

    const labelY = resultCardY + Math.round(resultCardH * 0.3) + 6;
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('解析：', resultCardX + pad + this.scaleSize(5), labelY);

    const maxTextW = resultCardW - pad * 2 - this.scaleSize(10);
    const startY = labelY + lineH;
    const endY = this._drawWrappedText(ctx, question.explanation, resultCardX + pad + this.scaleSize(5), startY, maxTextW, lineH);

    const buttonY = endY + this.scaleSize(25);
    this.resultButtonRect = new LayoutRect((this.width - btnW) / 2, buttonY, btnW, btnH);

    const btnText = vm.currentIndex < vm.questions.length - 1 ? '下一题' : '查看成绩';
    drawRoundedRect(ctx, this.resultButtonRect.x, this.resultButtonRect.y, this.resultButtonRect.w, this.resultButtonRect.h, Math.round(btnH / 2));
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    if (this.pressedId === 'result') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(btnText, this.resultButtonRect.centerX, this.resultButtonRect.centerY + 6);

    ctx.restore();

    if (vm.resultAnimation < 20) {
      vm.resultAnimation++;
    }
  }

  _drawBackButton(ctx) {
    const back = this.getButtonRects().back;
    drawRoundedRect(ctx, back.x, back.y, back.w, back.h, 20);
    const backGradient = ctx.createLinearGradient(back.x, back.y, back.x + back.w, back.y + back.h);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    ctx.fill();
    if (this.pressedId === 'back') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('返回', back.centerX, back.centerY + 6);
  }

  _drawBottomButtons(ctx) {
    const { vm } = this;
    const btns = this.getButtonRects();

    this._drawBackButton(ctx);

    drawRoundedRect(ctx, btns.hint.x, btns.hint.y, btns.hint.w, btns.hint.h, 20);
    const orangeGradient = ctx.createLinearGradient(btns.hint.x, btns.hint.y, btns.hint.x + btns.hint.w, btns.hint.y + btns.hint.h);
    orangeGradient.addColorStop(0, '#FF9800');
    orangeGradient.addColorStop(1, '#F57C00');
    ctx.fillStyle = orangeGradient;
    ctx.fill();
    if (this.pressedId === 'hint') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(`提示 (${vm.hintCount})`, btns.hint.centerX, btns.hint.centerY + 6);

    drawRoundedRect(ctx, btns.submit.x, btns.submit.y, btns.submit.w, btns.submit.h, 20);
    const isSelected = vm.selectedOption !== null;
    if (isSelected) {
      const submitGradient = ctx.createLinearGradient(btns.submit.x, btns.submit.y, btns.submit.x + btns.submit.w, btns.submit.y + btns.submit.h);
      submitGradient.addColorStop(0, '#10B981');
      submitGradient.addColorStop(1, '#059669');
      ctx.fillStyle = submitGradient;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    } else {
      ctx.fillStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    }
    ctx.fill();
    if (this.pressedId === 'submit') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
    ctx.font = `${this.scaleSize(14)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('确定', btns.submit.centerX, btns.submit.centerY + 6);
  }

  _drawGameOver(ctx) {
    const { vm } = this;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const cardW = Math.round(this.width * 0.85);
    const cardPadX = Math.round((this.width - cardW) / 2);
    const cardCX = this.width / 2;
    const goBtnH = this.scaleSize(46);
    const goBtnGap = this.scaleSize(14);
    const goBtnW = cardW - this.scaleSize(50);
    const goBtnX = cardPadX + Math.round((cardW - goBtnW) / 2);
    const cardH = Math.round(this.height * 0.55);
    const cardX = cardPadX;
    const cardY = (this.height - cardH) / 2;

    drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    const titleY = cardY + Math.round(cardH * 0.12) + 6;
    ctx.font = `${this.scaleSize(28)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#10B981';
    ctx.textAlign = 'center';
    ctx.fillText('答题完成！', cardCX, titleY);

    const stats = [
      `答对题数: ${vm.correctCount} / ${vm.questions.length}`,
      `得分: ${vm.score}`,
      `正确率: ${vm.accuracy}%`,
      `最高连击: ${vm.maxConsecutiveCorrect}`,
    ];

    ctx.font = `${this.scaleSize(18)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = '#333333';
    const statsBaseY = cardY + Math.round(cardH * 0.25);
    const statsLineH = Math.round(this.scaleSize(18) * 1.8);
    stats.forEach((text, i) => {
      ctx.fillText(text, cardCX, statsBaseY + i * statsLineH);
    });

    const replayY = cardY + Math.round(cardH * 0.6);
    this.gameOverButtons.replay = new LayoutRect(goBtnX, replayY, goBtnW, goBtnH);
    this.gameOverButtons.home = new LayoutRect(goBtnX, replayY + goBtnH + goBtnGap, goBtnW, goBtnH);

    const replay = this.gameOverButtons.replay;
    drawRoundedRect(ctx, replay.x, replay.y, replay.w, replay.h, Math.round(goBtnH / 2));
    const replayGradient = ctx.createLinearGradient(replay.x, replay.y, replay.x + replay.w, replay.y + replay.h);
    replayGradient.addColorStop(0, '#10B981');
    replayGradient.addColorStop(1, '#059669');
    ctx.fillStyle = replayGradient;
    ctx.fill();
    if (this.pressedId === 'go_replay') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('再来一轮', replay.centerX, replay.centerY + 6);

    const home = this.gameOverButtons.home;
    drawRoundedRect(ctx, home.x, home.y, home.w, home.h, Math.round(goBtnH / 2));
    const homeGradient = ctx.createLinearGradient(home.x, home.y, home.x + home.w, home.y + home.h);
    homeGradient.addColorStop(0, '#6B7280');
    homeGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = homeGradient;
    ctx.fill();
    if (this.pressedId === 'go_home') { ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; ctx.fill(); }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `${this.scaleSize(16)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillText('返回首页', home.centerX, home.centerY + 6);
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    if (!text) return y;
    let line = '';
    let currentY = y;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = char;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
  }

  handleTouchStart(e) {
    const coords = getTouchCoords(e.touches, e.changedTouches);
    if (!coords) return;
    const { x, y } = coords;
    const { vm } = this;

    // 题库为空（加载中/加载失败）时仅响应返回按钮，避免用户被困
    if (!vm.questions || vm.questions.length === 0) {
      const backBtn = this.getButtonRects().back;
      if (backBtn.contains(x, y)) {
        this.pressedId = 'back';
        vm._stopTimer();
        this.navigateTo('home');
      }
      return;
    }

    if (vm.gameOver) {
      if (this.gameOverButtons.replay && this.gameOverButtons.replay.contains(x, y)) {
        this.pressedId = 'go_replay';
        this._questionsLoading = true;
        vm.reset();
        vm.loadQuestions().then(() => {
          this._questionsLoading = false;
          vm._startTimer();
        });
      }
      if (this.gameOverButtons.home && this.gameOverButtons.home.contains(x, y)) {
        this.pressedId = 'go_home';
        this.navigateTo('home');
      }
      return;
    }

    if (vm.showResult) {
      if (this.resultButtonRect && this.resultButtonRect.contains(x, y)) {
        this.pressedId = 'result';
        if (vm.currentIndex < vm.questions.length - 1) {
          vm.nextQuestion();
        } else {
          vm.showScore(this.databus);
        }
      }
      return;
    }

    const optionYStart = Math.round(this.height * 0.35);
    const optionHeight = this.scaleSize(56) + this.scaleSize(10);
    const optH = this.scaleSize(56);
    const question = vm.currentQuestion;
    if (!question || !question.options) return;
    for (let i = 0; i < question.options.length; i++) {
      if (x >= 20 && x <= this.width - 20 &&
          y >= optionYStart + i * optionHeight &&
          y <= optionYStart + i * optionHeight + optH) {
        vm.selectOption(i);
        break;
      }
    }

    const btns = this.getButtonRects();
    if (btns.back.contains(x, y)) {
      this.pressedId = 'back';
      vm._stopTimer();
      this.navigateTo('home');
      return;
    }
    if (!vm.isAnswered && vm.selectedOption !== null && btns.submit.contains(x, y)) {
      this.pressedId = 'submit';
      this.hintAnimating = false;
      vm.submitAnswer(this.databus);
      if (!vm.isCorrect) {
        try { wx.vibrateShort({ type: 'medium' }); } catch(err) {}
      }
      return;
    }
    if (!vm.isAnswered && btns.hint.contains(x, y)) {
      this.pressedId = 'hint';
      const hinted = vm.useHint();
      if (hinted) {
        this.hintAnimating = true;
        this.hintFrame = 0;
        try { wx.showToast({ title: '已使用提示', icon: 'none', duration: 1000 }); } catch(e) {}
      } else if (vm.hintCount <= 0) {
        try { wx.showToast({ title: '提示次数已用完', icon: 'none', duration: 1000 }); } catch(e) {}
      }
    }
  }

  handleTouchEnd(e) {
    this.pressedId = null;
  }

  destroy() {
    this.vm.destroy();
  }
}

module.exports = QuizPage;
