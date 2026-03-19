// 答题页
const DataBus = require('../../databus');

const databus = new DataBus();

class QuizPage {
  constructor(difficulty = 'easy') {
    this.width = wx.getSystemInfoSync().windowWidth;
    this.height = wx.getSystemInfoSync().windowHeight;
    this.currentQuestion = 0;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;
    this.showResult = false;
    this.score = 0;
    this.difficulty = difficulty;
    this.consecutiveCorrect = 0;
    
    // 动画相关
    this.animationFrame = 0;
    this.showResult = false;
    this.resultAnimation = 0;
    
    // 根据难度设置参数
    this.setupDifficulty();
    
    this.questions = this.loadQuestions();
    this.timer = null;
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

  // 加载题库数据
  loadQuestions() {
    let allQuestions = [];
    
    // 非遗题库
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
    
    // 自然题库
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
    
    // 红色题库
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
    
    // 处理非遗题目
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
    
    // 处理自然题目
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
    
    // 处理红色题目
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
    
    // 根据难度选择题目数量
    return this.shuffleArray(allQuestions).slice(0, this.questionCount);
  }
  
  // 数组打乱函数
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  render(ctx) {
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#4a6fa5');
    gradient.addColorStop(1, '#6e5b7b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, 0, this.width, this.height);

    // 绘制顶部信息栏 - 玻璃态效果
    this.drawRoundedRect(ctx, 20, 20, this.width - 40, 60, 15);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 左侧：题目序号
    ctx.font = '18px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`第${this.currentQuestion + 1}/${this.questions.length}题`, 40, 55);

    // 右侧：计时显示
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(`剩余时间: ${this.timeLeft}s`, this.width - 140, 55);

    // 右侧：资源类别标识
    const question = this.questions[this.currentQuestion];
    let typeColor = '#FF5722'; // 非遗默认橙色
    if (question.type === '自然') typeColor = '#4CAF50';
    else if (question.type === '红色') typeColor = '#F44336';
    
    // 绘制类别标签
    this.drawRoundedRect(ctx, this.width - 120, 30, 100, 30, 15);
    ctx.fillStyle = typeColor + '40';
    ctx.fill();
    ctx.strokeStyle = typeColor;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(question.type, this.width - 70, 50);

    // 绘制题目内容卡片 - 玻璃态效果
    this.drawRoundedRect(ctx, 20, 100, this.width - 40, 120, 20);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(question.question, 40, 140);

    // 绘制选项
    const optionYStart = 240;
    const optionHeight = 60;
    question.options.forEach((option, index) => {
      // 绘制选项背景
      let fillColor = 'rgba(255, 255, 255, 0.15)';
      let strokeColor = 'rgba(255, 255, 255, 0.3)';
      if (this.isAnswered) {
        if (index === question.correctAnswer) {
          fillColor = 'rgba(76, 175, 80, 0.2)'; // 正确选项绿色背景
          strokeColor = '#4CAF50';
        } else if (index === this.selectedOption) {
          fillColor = 'rgba(244, 67, 54, 0.2)'; // 错误选项红色背景
          strokeColor = '#F44336';
        }
      } else if (index === this.selectedOption) {
        fillColor = 'rgba(33, 150, 243, 0.2)';
        strokeColor = '#2196F3';
      }
      
      // 选项选中动画
      let scale = 1;
      if (index === this.selectedOption && !this.isAnswered) {
        scale = 1 + Math.sin(this.animationFrame * 0.1) * 0.05;
      }
      
      ctx.save();
      ctx.translate(20 + (this.width - 40) / 2, optionYStart + index * optionHeight + 25);
      ctx.scale(scale, scale);
      ctx.translate(-(20 + (this.width - 40) / 2), -(optionYStart + index * optionHeight + 25));
      
      this.drawRoundedRect(ctx, 20, optionYStart + index * optionHeight, this.width - 40, 50, 15);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制选项文字
      let textColor = '#ffffff';
      if (this.isAnswered) {
        if (index === question.correctAnswer) {
          textColor = '#4CAF50';
        } else if (index === this.selectedOption) {
          textColor = '#F44336';
        }
      }
      ctx.fillStyle = textColor;
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, 40, optionYStart + index * optionHeight + 35);
      
      ctx.restore();
    });
    
    // 更新动画帧
    this.animationFrame++;

    // 绘制解析
    if (this.showResult) {
      // 背景渐入动画
      const alpha = Math.min(this.resultAnimation * 0.05, 0.7);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
      
      // 结果卡片缩放动画
      const scale = 0.5 + Math.min(this.resultAnimation * 0.1, 0.5);
      ctx.save();
      ctx.translate(this.width / 2, this.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-this.width / 2, -this.height / 2);
      
      // 绘制玻璃态结果卡片
      this.drawRoundedRect(ctx, 40, this.height / 2 - 100, this.width - 80, 200, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 显示答题结果
      ctx.font = '24px Arial';
      ctx.fillStyle = this.isCorrect ? '#4CAF50' : '#F44336';
      ctx.textAlign = 'center';
      ctx.fillText(this.isCorrect ? '回答正确！' : '回答错误！', this.width / 2, this.height / 2 - 50);
      
      // 显示解析
      ctx.font = '16px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText('解析：', 60, this.height / 2);
      
      // 绘制换行解析文本
      const maxWidth = this.width - 120; // 最大宽度
      const lineHeight = 25; // 行高
      const startY = this.height / 2 + 30;
      const endY = this.drawWrappedText(ctx, question.explanation, 60, startY, maxWidth, lineHeight);
      
      // 绘制按钮
      // 计算按钮位置，确保与解析文本有足够间距
      const buttonY = endY + 40; // 增加40px的间距
      
      // 下一题按钮 - 主按钮
      if (this.currentQuestion < this.questions.length - 1) {
        this.drawRoundedRect(ctx, this.width / 2 - 110, buttonY, 200, 50, 25);
        const mainButtonGradient = ctx.createLinearGradient(this.width / 2 - 110, buttonY, this.width / 2 + 90, buttonY + 50);
        mainButtonGradient.addColorStop(0, '#4a6fa5');
        mainButtonGradient.addColorStop(1, '#6e5b7b');
        ctx.fillStyle = mainButtonGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('下一题', this.width / 2, buttonY + 30);
      } else {
        // 答题完成按钮 - 成功按钮
        this.drawRoundedRect(ctx, this.width / 2 - 110, buttonY, 200, 50, 25);
        const successButtonGradient = ctx.createLinearGradient(this.width / 2 - 110, buttonY, this.width / 2 + 90, buttonY + 50);
        successButtonGradient.addColorStop(0, '#4CAF50');
        successButtonGradient.addColorStop(1, '#45a049');
        ctx.fillStyle = successButtonGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('查看成绩', this.width / 2, buttonY + 30);
      }
      
      ctx.restore();
      
      // 更新动画帧
      if (this.resultAnimation < 20) {
        this.resultAnimation++;
      }
    }

    // 绘制底部功能区
    if (!this.showResult) {
      // 返回按钮 - 次要按钮
      this.drawRoundedRect(ctx, 20, this.height - 60, 80, 40, 20);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('返回', 60, this.height - 35);
      
      // 提示按钮 - 提示按钮
      this.drawRoundedRect(ctx, 120, this.height - 60, 100, 40, 20);
      const hintGradient = ctx.createLinearGradient(120, this.height - 60, 220, this.height - 20);
      hintGradient.addColorStop(0, '#9C27B0');
      hintGradient.addColorStop(1, '#7B1FA2');
      ctx.fillStyle = hintGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`提示 (${this.hintCount})`, 170, this.height - 35);
      
      // 提交按钮 - 成功按钮
      if (this.selectedOption !== null) {
        this.drawRoundedRect(ctx, this.width / 2 - 75, this.height - 60, 150, 40, 20);
        const submitGradient = ctx.createLinearGradient(this.width / 2 - 75, this.height - 60, this.width / 2 + 75, this.height - 20);
        submitGradient.addColorStop(0, '#4CAF50');
        submitGradient.addColorStop(1, '#45a049');
        ctx.fillStyle = submitGradient;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('提交答案', this.width / 2, this.height - 35);
      }
      
      // 跳过按钮 - 警告按钮
      this.drawRoundedRect(ctx, this.width - 120, this.height - 60, 100, 40, 20);
      const skipGradient = ctx.createLinearGradient(this.width - 120, this.height - 60, this.width - 20, this.height - 20);
      skipGradient.addColorStop(0, '#FF9800');
      skipGradient.addColorStop(1, '#F57C00');
      ctx.fillStyle = skipGradient;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('跳过', this.width - 70, this.height - 35);
    }
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

  // 绘制换行文本
  drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
    let line = '';
    let currentY = y;

    // 处理中文文本，按字符分割
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
    
    // 绘制最后一行
    ctx.fillText(line, x, currentY);
    return currentY;
  }

  handleTouchStart(e) {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    // 检查是否点击了选项
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

      // 检查是否点击了返回按钮
      if (x >= 20 && x <= 100 && y >= this.height - 60 && y <= this.height - 20) {
        this.returnToHome();
      }

      // 检查是否点击了提示按钮
      if (x >= 120 && x <= 220 && y >= this.height - 60 && y <= this.height - 20) {
        this.useHint();
      }

      // 检查是否点击了提交按钮
      if (!this.isAnswered && this.selectedOption !== null && x >= this.width / 2 - 75 && x <= this.width / 2 + 75 && y >= this.height - 60 && y <= this.height - 20) {
        this.submitAnswer();
      }

      // 检查是否点击了跳过按钮
      if (x >= this.width - 120 && x <= this.width - 20 && y >= this.height - 60 && y <= this.height - 20) {
        this.skipQuestion();
      }
    } else {
      // 检查是否点击了下一题/查看成绩按钮
      // 由于解析文本长度不同，按钮位置会变化
      // 使用一个更宽松的点击区域检查，确保在合理范围内都能点击
      // 按钮大致位于屏幕下方区域
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
      // 连续答对3题获得知识达人buff
      if (this.consecutiveCorrect >= 3) {
        databus.setKnowledgeBuff(true);
      }
    } else {
      this.consecutiveCorrect = 0;
      databus.setKnowledgeBuff(false);
    }
    
    // 更新答题数据
    databus.updateQuizData(this.isCorrect);
    
    // 显示结果和解析
    this.showResult = true;
    this.stopTimer();
  }

  nextQuestion() {
    this.currentQuestion++;
    if (this.currentQuestion >= this.questions.length) {
      // 答题结束，显示成绩
      this.showScore();
    } else {
      // 重置状态
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
      // 这里可以实现具体的提示逻辑，比如高亮正确选项
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
    // 显示答题完成界面
    const correctCount = this.questions.filter((_, index) => {
      const q = this.questions[index];
      // 这里需要根据实际情况判断是否答对
      return index < this.currentQuestion && this.isCorrect;
    }).length;

    // 这里可以实现成绩显示界面
    console.log('答题完成！');
    console.log(`答对题数：${correctCount}/${this.questions.length}`);
    console.log(`得分：${this.score}`);

    // 返回首页
    if (GameGlobal.app && GameGlobal.app.showPage) {
      GameGlobal.app.showPage('home');
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
    // 清理资源
  }
}

module.exports = QuizPage;