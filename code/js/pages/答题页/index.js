const { drawRoundedRect, getTouchCoords } = require('../../utils/canvasUtils');

class QuizPage {
  constructor(difficulty = 'easy') {
    const sys = GameGlobal.systemInfo || wx.getSystemInfoSync();
    this.width = sys.windowWidth;
    this.height = sys.windowHeight;
    this.pixelRatio = sys.pixelRatio || 1;
    this.currentQuestion = 0;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;
    this.showResult = false;
    this.score = 0;
    this.difficulty = difficulty;
    this.consecutiveCorrect = 0;
    this.backgroundImage = null;
    
    this.loadBackgroundImage();
    
    this.animationFrame = 0;
    this.showResult = false;
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
    
    const heritageQuestions = [
      {
        id: 1,
        question: "三灶鹤舞起源于哪个朝代？",
        options: ["唐代", "清代", "明代", "宋代"],
        answer: 1,
        explanation: "三灶鹤舞起源于清代，已有200多年历史，是珠海市金湾区三灶镇的传统民间舞蹈。"
      },
      {
        id: 2,
        question: "三灶鹤舞被列入哪级非物质文化遗产名录？",
        options: ["国家级", "省级", "市级", "区级"],
        answer: 1,
        explanation: "三灶鹤舞被列入广东省非物质文化遗产名录，是珠海市重要的文化遗产。"
      },
      {
        id: 3,
        question: "海澄村竹编工艺的主要原料是什么？",
        options: ["竹子", "木材", "藤条", "草绳"],
        answer: 0,
        explanation: "海澄村竹编工艺以当地盛产的竹子为原料，制作各种生活用具和工艺品。"
      },
      {
        id: 4,
        question: "海澄村传统制糖技艺的主要原料是什么？",
        options: ["甜菜", "甘蔗", "玉米", "红薯"],
        answer: 1,
        explanation: "海澄村传统制糖技艺以甘蔗为原料，采用传统工艺制糖，包括榨汁、熬煮、结晶等步骤。"
      },
      {
        id: 5,
        question: "海澄村渔家文化不包括以下哪项？",
        options: ["渔网编织", "渔船制作", "海鲜烹饪", "陶瓷制作"],
        answer: 3,
        explanation: "海澄村渔家文化包括渔网编织、渔船制作、海鲜烹饪技艺、渔家祭海仪式等，不包括陶瓷制作。"
      }
    ];
    
    const natureQuestions = [
      {
        id: 1,
        question: "海澄村的标志性古树是什么树？",
        options: ["榕树", "松树", "银杏", "槐树"],
        answer: 0,
        explanation: "海澄村的标志性古树是榕树，树龄超过百年，是村庄的象征。"
      },
      {
        id: 2,
        question: "海澄村的主要自然景观不包括以下哪项？",
        options: ["海滩", "山林", "湖泊", "沙漠"],
        answer: 3,
        explanation: "海澄村位于沿海地区，拥有海滩、山林、湖泊等自然景观，沙漠不属于其自然景观。"
      },
      {
        id: 3,
        question: "海澄村的生态保护重点是什么？",
        options: ["保护古树", "保护海洋", "保护森林", "保护耕地"],
        answer: 0,
        explanation: "海澄村的生态保护重点是保护古树，尤其是那些树龄超过百年的榕树。"
      }
    ];
    
    const redQuestions = [
      {
        id: 1,
        question: "海澄村的红色遗址是？",
        options: ["革命纪念馆", "抗战遗址", "红军指挥部", "烈士墓"],
        answer: 2,
        explanation: "海澄村的红色遗址是红军指挥部，记录了革命时期的重要历史。"
      },
      {
        id: 2,
        question: "海澄村在革命时期的主要贡献是什么？",
        options: ["提供物资", "提供情报", "作为根据地", "以上都是"],
        answer: 3,
        explanation: "海澄村在革命时期为红军提供物资、情报，并作为根据地，为革命事业做出了重要贡献。"
      }
    ];
    
    heritageQuestions.forEach(q => {
      allQuestions.push({
        id: q.id,
        type: '非遗',
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        explanation: q.explanation
      });
    });
    
    natureQuestions.forEach(q => {
      allQuestions.push({
        id: q.id + 100,
        type: '自然',
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        explanation: q.explanation
      });
    });
    
    redQuestions.forEach(q => {
      allQuestions.push({
        id: q.id + 200,
        type: '红色',
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        explanation: q.explanation
      });
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
    if (this.backgroundImage) {
      ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#4a6fa5');
      gradient.addColorStop(1, '#6e5b7b');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
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
      
      const hintButtonX = this.width / 2 - 50;
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
      ctx.fillText(`提示 (${this.hintCount})`, this.width / 2, this.height - 38);
      
      if (this.selectedOption !== null) {
        const submitButtonX = this.width / 2 - 50;
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
        ctx.fillText('提交答案', this.width / 2, this.height - 38);
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

      if (!this.isAnswered && this.selectedOption !== null && x >= this.width / 2 - 50 && x <= this.width / 2 + 50 && y >= this.height - 60 && y <= this.height - 20) {
        this.submitAnswer();
      }

      if (x >= this.width / 2 - 50 && x <= this.width / 2 + 50 && y >= this.height - 60 && y <= this.height - 20) {
        this.useHint();
      }

      if (x >= this.width - 120 && x <= this.width - 20 && y >= this.height - 60 && y <= this.height - 20) {
        this.skipQuestion();
      }
    } else {
      if (x >= this.width / 2 - 110 && x <= this.width / 2 + 90 && y >= this.height / 2 + 60 && y <= this.height - 50) {
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
      if (this.consecutiveCorrect >= 3) {
        GameGlobal.databus.setKnowledgeBuff(true);
      }
    } else {
      this.consecutiveCorrect = 0;
      GameGlobal.databus.setKnowledgeBuff(false);
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

  loadBackgroundImage() {
    const resourceManager = GameGlobal.resourceManager;
    if (resourceManager) {
      this.backgroundImage = resourceManager.getImage('bg');
    }
    if (!this.backgroundImage) {
      const img = wx.createImage();
      img.onload = () => { this.backgroundImage = img; };
      img.onerror = (err) => { console.error('Failed to load background image:', err); };
      img.src = 'images/ui/bg2.jpg';
    }
  }

  destroy() {
    this.stopTimer();
  }
}

module.exports = QuizPage;