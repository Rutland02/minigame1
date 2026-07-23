const { drawRoundedRect, getTouchCoords } = require('../../utils/canvasUtils');
const BasePage = require('../../common/basePage');

class QuizPage extends BasePage {
  constructor(difficulty = 'easy') {
    super();

    this.currentQuestion = 0;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;
    this.showResult = false;
    this.score = 0;
    this.difficulty = difficulty;
    this.consecutiveCorrect = 0;

    this.animationFrame = 0;
    this.resultAnimation = 0;
    
    this.setupDifficulty();
    
    this.questions = this.loadQuestions();
    this.timer = null;
    this.startTimer();
  }
  
  setupDifficulty() {
    switch (this.difficulty) {
      case 'easy':
        this.questionCount = 5;
        this.timePerQuestion = 30;
        this.hintCount = 1;
        break;
      case 'medium':
        this.questionCount = 8;
        this.timePerQuestion = 25;
        this.hintCount = 1;
        break;
      case 'hard':
        this.questionCount = 10;
        this.timePerQuestion = 20;
        this.hintCount = 1;
        break;
      default:
        this.questionCount = 5;
        this.timePerQuestion = 30;
        this.hintCount = 1;
    }
    this.timeLeft = this.timePerQuestion;
  }

  loadQuestions() {
    let allQuestions = [];

    const categories = [
      { file: 'content/heritage/题库.json', type: '非遗', idOffset: 0 },
      { file: 'content/nature/题库.json', type: '自然', idOffset: 100 },
      { file: 'content/red/题库.json', type: '红色', idOffset: 200 }
    ];

    categories.forEach(cat => {
      try {
        const fs = wx.getFileSystemManager();
        const raw = fs.readFileSync(cat.file, 'utf8');
        const data = JSON.parse(raw);
        const questions = data.questions || data;
        questions.forEach(q => {
          allQuestions.push({
            id: q.id + cat.idOffset,
            type: cat.type,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer,
            explanation: q.explanation
          });
        });
      } catch (e) {
        console.error(`加载题库失败: ${cat.file}`, e);
      }
    });

    return this.shuffleArray(allQuestions).slice(0, this.questionCount);
  }
  
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  render(ctx) {
    this.drawBackground(ctx);

    if (!this.questions || this.questions.length === 0) {
      ctx.font = '16px Arial';
      ctx.fillStyle = '#FF0000';
      ctx.textAlign = 'center';
      ctx.fillText('题库加载失败，请检查 content/ 目录', this.width / 2, this.height / 2);
      return;
    }

    drawRoundedRect(ctx, 20, 20, this.width - 40, 60, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '18px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText(`第${this.currentQuestion + 1}/${this.questions.length}题`, 40, 50);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'right';
    ctx.fillText(`剩余时间: ${this.timeLeft}s`, this.width - 140, 50);

    const question = this.questions[this.currentQuestion];
    let typeColor = '#FF5722';
    if (question.type === '自然') typeColor = '#4CAF50';
    else if (question.type === '红色') typeColor = '#F44336';
    
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

    const optionYStart = 240;
    const optionHeight = 60;
    question.options.forEach((option, index) => {
      let fillColor = 'rgba(255, 255, 255, 0.15)';
      let strokeColor = '#ffffff';
      if (this.isAnswered) {
        if (index === question.correctAnswer) {
          fillColor = 'rgba(76, 175, 80, 0.15)';
          strokeColor = '#ffffff';
        } else if (index === this.selectedOption) {
          fillColor = 'rgba(244, 67, 54, 0.15)';
          strokeColor = '#ffffff';
        }
      } else if (index === this.selectedOption) {
        fillColor = 'rgba(33, 150, 243, 0.15)';
        strokeColor = '#ffffff';
      }
      
      let scale = 1;
      if (index === this.selectedOption && !this.isAnswered) {
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
      if (this.isAnswered) {
        if (index === question.correctAnswer) {
          textColor = '#059669';
        } else if (index === this.selectedOption) {
          textColor = '#DC2626';
        }
      }
      ctx.fillStyle = textColor;
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 40, optionYStart + index * optionHeight + 25);
      
      ctx.restore();
    });
    
    this.animationFrame++;

    if (this.showResult) {
      const alpha = Math.min(this.resultAnimation * 0.05, 0.7);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
      
      const scale = 0.5 + Math.min(this.resultAnimation * 0.1, 0.5);
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
      ctx.fillStyle = this.isCorrect ? '#4CAF50' : '#F44336';
      ctx.textAlign = 'center';
      ctx.fillText(this.isCorrect ? '回答正确！' : '回答错误！', this.width / 2, this.height / 2 - 50);
      
      ctx.font = '16px Arial';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'left';
      ctx.fillText('解析：', 60, this.height / 2);
      
      const maxWidth = this.width - 120;
      const lineHeight = 25;
      const startY = this.height / 2 + 30;
      const endY = this.drawWrappedText(ctx, question.explanation, 60, startY, maxWidth, lineHeight);
      
      const buttonY = endY + 40;
      this.resultButtonRect = { x: this.width / 2 - 110, y: buttonY, w: 200, h: 50 };

      if (this.currentQuestion < this.questions.length - 1) {
        drawRoundedRect(ctx, this.width / 2 - 110, buttonY, 200, 50, 25);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('下一题', this.width / 2, buttonY + 30);
      } else {
        drawRoundedRect(ctx, this.width / 2 - 110, buttonY, 200, 50, 25);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('查看成绩', this.width / 2, buttonY + 30);
      }
      
      ctx.restore();
      
      if (this.resultAnimation < 20) {
        this.resultAnimation++;
      }
    }

    if (!this.showResult) {
      drawRoundedRect(ctx, 20, this.height - 60, 80, 40, 20);
      const backGradient = ctx.createLinearGradient(20, this.height - 60, 100, this.height - 20);
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
      ctx.fillText('返回', 60, this.height - 38);
      
      const hintButtonX = this.width / 2 - 110;
      drawRoundedRect(ctx, hintButtonX, this.height - 60, 100, 40, 20);
      const orangeGradient = ctx.createLinearGradient(hintButtonX, this.height - 60, hintButtonX + 100, this.height - 20);
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
      ctx.fillText(`提示 (${this.hintCount})`, hintButtonX + 50, this.height - 38);

      if (this.selectedOption !== null) {
        const submitButtonX = this.width / 2 + 10;
        drawRoundedRect(ctx, submitButtonX, this.height - 60, 100, 40, 20);
        const submitGradient = ctx.createLinearGradient(submitButtonX, this.height - 60, submitButtonX + 100, this.height - 20);
        submitGradient.addColorStop(0, '#10B981');
        submitGradient.addColorStop(1, '#059669');
        ctx.fillStyle = submitGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('提交答案', submitButtonX + 50, this.height - 38);
      }
      
      drawRoundedRect(ctx, this.width - 120, this.height - 60, 100, 40, 20);
      const skipGradient = ctx.createLinearGradient(this.width - 120, this.height - 60, this.width - 20, this.height - 20);
      skipGradient.addColorStop(0, '#10B981');
      skipGradient.addColorStop(1, '#059669');
      ctx.fillStyle = skipGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('跳过', this.width - 70, this.height - 38);
    }
  }

  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let currentY = y;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const testLine = line + char;
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && i > 0) {
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
    
    if (!this.showResult) {
      const optionYStart = 240;
      const optionHeight = 60;
      const question = this.questions[this.currentQuestion];
      
      question.options.forEach((_, index) => {
        if (x >= 20 && x <= this.width - 20 && y >= optionYStart + index * optionHeight && y <= optionYStart + index * optionHeight + 50) {
          if (!this.isAnswered) {
            this.selectedOption = index;
          }
        }
      });

      if (x >= 20 && x <= 100 && y >= this.height - 60 && y <= this.height - 20) {
        this.returnToHome();
      }

      if (!this.isAnswered && this.selectedOption !== null && x >= this.width / 2 + 10 && x <= this.width / 2 + 110 && y >= this.height - 60 && y <= this.height - 20) {
        this.submitAnswer();
      }

      if (!this.isAnswered && this.selectedOption === null && x >= this.width / 2 - 110 && x <= this.width / 2 - 10 && y >= this.height - 60 && y <= this.height - 20) {
        this.useHint();
      }

      if (x >= this.width - 120 && x <= this.width - 20 && y >= this.height - 60 && y <= this.height - 20) {
        this.skipQuestion();
      }
    } else {
      const rect = this.resultButtonRect;
      if (rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        if (this.currentQuestion < this.questions.length - 1) {
          this.nextQuestion();
        } else {
          this.showScore();
        }
      }
    }
  }

  submitAnswer() {
    const question = this.questions[this.currentQuestion];
    this.isAnswered = true;
    this.isCorrect = this.selectedOption === question.correctAnswer;
    
    if (this.isCorrect) {
      this.score += 10;
      this.consecutiveCorrect++;
    } else {
      this.consecutiveCorrect = 0;
    }

    GameGlobal.databus.updateQuizData(this.isCorrect);
    
    this.showResult = true;
    this.stopTimer();
  }

  nextQuestion() {
    this.currentQuestion++;
    if (this.currentQuestion >= this.questions.length) {
      this.showScore();
    } else {
      this.selectedOption = null;
      this.isAnswered = false;
      this.isCorrect = false;
      this.showResult = false;
      this.resultAnimation = 0;
      this.animationFrame = 0;
      this.timeLeft = this.timePerQuestion;
      this.startTimer();
    }
  }

  useHint() {
    if (this.hintCount > 0 && !this.isAnswered) {
      this.hintCount--;
      const question = this.questions[this.currentQuestion];
      this.selectedOption = question.correctAnswer;
    }
  }

  skipQuestion() {
    if (!this.isAnswered) {
      this.isAnswered = true;
      this.isCorrect = false;
      this.showResult = true;
      this.stopTimer();
    }
  }

  showScore() {
    const correctCount = Math.floor(this.score / 10);
    const totalQuestions = this.questions.length;

    this.saveQuizScore(correctCount, totalQuestions, this.score);

    console.log('答题完成！');
    console.log(`答对题数：${correctCount}/${totalQuestions}`);
    console.log(`得分：${this.score}`);

    if (GameGlobal.app && GameGlobal.app.showPage) {
      GameGlobal.app.showPage('home');
    }
  }

  saveQuizScore(correctCount, totalQuestions, score) {
    if (GameGlobal.app && GameGlobal.app.databus) {
      GameGlobal.app.databus.recordQuizScore(correctCount, totalQuestions, score);
    }
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.stopTimer();
        this.skipQuestion();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  returnToHome() {
    this.stopTimer();
    if (GameGlobal.app && GameGlobal.app.showPage) {
      GameGlobal.app.showPage('home');
    }
  }

  destroy() {
    this.stopTimer();
  }
}

module.exports = QuizPage;