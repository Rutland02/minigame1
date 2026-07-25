const { drawRoundedRect, getTouchCoords, LayoutRect } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');
const QuizViewModel = require('./quizViewModel');

class QuizPage extends BasePage {
  constructor(difficulty) {
    super();
    this.vm = new QuizViewModel(difficulty);
    this.vm.loadQuestions().then(questions => {
      this.vm.questions = questions;
      this.vm._startTimer();
    });

    this.animationFrame = 0;
    this.resultButtonRect = null;
  }

  getButtonRects() {
    const h = this.height;
    const w = this.width;
    return {
      back:    new LayoutRect(20, h - 60, 80, 40),
      hint:    new LayoutRect(w / 2 - 50, h - 60, 100, 40),
      submit:  new LayoutRect(w - 120, h - 60, 100, 40),
    };
  }

  render(ctx) {
    this.drawBackground(ctx);
    const { vm } = this;

    if (!vm.questions || vm.questions.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#FF0000';
      ctx.textAlign = 'center';
      ctx.fillText('题库加载失败，请检查 content/ 目录', this.width / 2, this.height / 2);
      return;
    }

    this._drawHeader(ctx);
    this._drawQuestionCard(ctx);
    this._drawOptions(ctx);
    this.animationFrame++;

    if (vm.showResult) {
      this._drawResultOverlay(ctx);
    } else {
      this._drawBottomButtons(ctx);
    }
  }

  _drawHeader(ctx) {
    const { vm } = this;
    drawRoundedRect(ctx, 20, 20, this.width - 40, 60, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '18px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(`第${vm.progress}题`, 40, 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.fillText(`剩余时间: ${vm.timeLeft}s`, this.width - 140, 50);

    const question = vm.currentQuestion;
    drawRoundedRect(ctx, this.width - 120, 25, 100, 30, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText(question.type, this.width - 70, 45);
  }

  _drawQuestionCard(ctx) {
    const { vm } = this;
    const question = vm.currentQuestion;

    drawRoundedRect(ctx, 20, 100, this.width - 40, 120, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '17px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(question.question, 40, 160);
  }

  _drawOptions(ctx) {
    const { vm } = this;
    const question = vm.currentQuestion;
    const optionYStart = 240;
    const optionHeight = 60;

    question.options.forEach((option, index) => {
      let fillColor = 'rgba(255, 255, 255, 0.15)';
      let strokeColor = '#ffffff';
      if (vm.isAnswered) {
        if (index === question.correctAnswer) {
          fillColor = 'rgba(76, 175, 80, 0.15)';
          strokeColor = '#ffffff';
        } else if (index === vm.selectedOption) {
          fillColor = 'rgba(244, 67, 54, 0.15)';
          strokeColor = '#ffffff';
        }
      } else if (index === vm.selectedOption) {
        fillColor = 'rgba(33, 150, 243, 0.15)';
        strokeColor = '#ffffff';
      }

      let scale = 1;
      if (index === vm.selectedOption && !vm.isAnswered) {
        scale = 1 + Math.sin(this.animationFrame * 0.1) * 0.05;
      }

      ctx.save();
      ctx.translate(20 + (this.width - 40) / 2, optionYStart + index * optionHeight + 25);
      ctx.scale(scale, scale);
      ctx.translate(-(20 + (this.width - 40) / 2), -(optionYStart + index * optionHeight + 25));

      drawRoundedRect(ctx, 20, optionYStart + index * optionHeight, this.width - 40, 50, 15);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      let textColor = '#000000';
      if (vm.isAnswered) {
        if (index === question.correctAnswer) textColor = '#059669';
        else if (index === vm.selectedOption) textColor = '#DC2626';
      }
      ctx.fillStyle = textColor;
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 40, optionYStart + index * optionHeight + 25);

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

    drawRoundedRect(ctx, 40, this.height / 2 - 100, this.width - 80, 200, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '24px Arial';
    ctx.fillStyle = vm.isCorrect ? '#4CAF50' : '#F44336';
    ctx.textAlign = 'center';
    ctx.fillText(vm.isCorrect ? '回答正确！' : '回答错误！', this.width / 2, this.height / 2 - 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('解析：', 60, this.height / 2);

    const maxWidth = this.width - 120;
    const lineHeight = 25;
    const startY = this.height / 2 + 30;
    const endY = this._drawWrappedText(ctx, question.explanation, 60, startY, maxWidth, lineHeight);

    const buttonY = endY + 40;
    this.resultButtonRect = new LayoutRect(this.width / 2 - 110, buttonY, 200, 50);

    const btnText = vm.currentIndex < vm.questions.length - 1 ? '下一题' : '查看成绩';
    drawRoundedRect(ctx, this.resultButtonRect.x, this.resultButtonRect.y, this.resultButtonRect.w, this.resultButtonRect.h, 25);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(btnText, this.resultButtonRect.centerX, this.resultButtonRect.centerY + 6);

    ctx.restore();

    if (vm.resultAnimation < 20) {
      vm.resultAnimation++;
    }
  }

  _drawBottomButtons(ctx) {
    const { vm } = this;
    const btns = this.getButtonRects();

    drawRoundedRect(ctx, btns.back.x, btns.back.y, btns.back.w, btns.back.h, 20);
    const backGradient = ctx.createLinearGradient(btns.back.x, btns.back.y, btns.back.x + btns.back.w, btns.back.y + btns.back.h);
    backGradient.addColorStop(0, '#6B7280');
    backGradient.addColorStop(1, '#4B5563');
    ctx.fillStyle = backGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('返回', btns.back.centerX, btns.back.centerY + 6);

    drawRoundedRect(ctx, btns.hint.x, btns.hint.y, btns.hint.w, btns.hint.h, 20);
    const orangeGradient = ctx.createLinearGradient(btns.hint.x, btns.hint.y, btns.hint.x + btns.hint.w, btns.hint.y + btns.hint.h);
    orangeGradient.addColorStop(0, '#FF9800');
    orangeGradient.addColorStop(1, '#F57C00');
    ctx.fillStyle = orangeGradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
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
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('确定', btns.submit.centerX, btns.submit.centerY + 6);
  }

  _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
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
    if (!this.vm.questions || this.vm.questions.length === 0) return;
    const { x, y } = coords;
    const { vm } = this;

    if (vm.showResult) {
      if (this.resultButtonRect && this.resultButtonRect.contains(x, y)) {
        if (vm.currentIndex < vm.questions.length - 1) {
          vm.nextQuestion();
        } else {
          vm.showScore(this.databus);
          this.navigateTo('home');
        }
      }
      return;
    }

    const optionYStart = 240;
    const optionHeight = 60;
    const question = vm.currentQuestion;
    for (let i = 0; i < question.options.length; i++) {
      if (x >= 20 && x <= this.width - 20 &&
          y >= optionYStart + i * optionHeight &&
          y <= optionYStart + i * optionHeight + 50) {
        vm.selectOption(i);
        break;
      }
    }

    const btns = this.getButtonRects();
    if (btns.back.contains(x, y)) {
      vm._stopTimer();
      this.navigateTo('home');
      return;
    }
    if (!vm.isAnswered && vm.selectedOption !== null && btns.submit.contains(x, y)) {
      vm.submitAnswer(this.databus);
      return;
    }
    if (!vm.isAnswered && btns.hint.contains(x, y)) {
      vm.useHint();
    }
  }

  destroy() {
    this.vm.destroy();
  }
}

module.exports = QuizPage;
