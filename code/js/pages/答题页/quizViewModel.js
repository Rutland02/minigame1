class QuizViewModel {
  constructor(difficulty = 'easy') {
    this.questions = [];
    this.currentIndex = 0;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;
    this.showResult = false;
    this.score = 0;
    this.difficulty = difficulty;
    this.consecutiveCorrect = 0;
    this.hintCount = 1;
    this.timeLeft = 30;
    this.timePerQuestion = 30;
    this.questionCount = 5;
    this.resultAnimation = 0;

    this._timer = null;
    this._setupDifficulty(difficulty);
  }

  _setupDifficulty(difficulty) {
    switch (difficulty) {
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
    const categories = [
      { file: 'content/heritage/题库.json', type: '非遗', idOffset: 0 },
      { file: 'content/nature/题库.json', type: '自然', idOffset: 100 },
      { file: 'content/red/题库.json', type: '红色', idOffset: 200 }
    ];

    const fs = wx.getFileSystemManager();

    const loadCategory = (cat) => new Promise((resolve) => {
      fs.readFile({
        filePath: cat.file,
        encoding: 'utf8',
        success(res) {
          try {
            const data = JSON.parse(res.data);
            const questions = data.questions || data;
            const mapped = questions.map(q => ({
              id: q.id + cat.idOffset,
              type: cat.type,
              question: q.question,
              options: q.options,
              correctAnswer: q.answer,
              explanation: q.explanation
            }));
            resolve(mapped);
          } catch (e) {
            console.error(`解析题库失败: ${cat.file}`, e);
            resolve([]);
          }
        },
        fail(e) {
          console.error(`加载题库失败: ${cat.file}`, e);
          resolve([]);
        }
      });
    });

    return Promise.all(categories.map(loadCategory)).then(results => {
      const allQuestions = results.flat();
      this.questions = this._shuffleArray(allQuestions).slice(0, this.questionCount);
      return this.questions;
    });
  }

  _shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  selectOption(index) {
    if (this.isAnswered) return;
    this.selectedOption = index;
  }

  submitAnswer(databus) {
    if (this.selectedOption === null || this.isAnswered) return;
    const question = this.questions[this.currentIndex];
    this.isAnswered = true;
    this.isCorrect = this.selectedOption === question.correctAnswer;

    if (this.isCorrect) {
      this.score += 10;
      this.consecutiveCorrect++;
    } else {
      this.consecutiveCorrect = 0;
    }

    this.showResult = true;
    this._stopTimer();

    if (databus) {
      databus.updateQuizData(this.isCorrect);
    }
  }

  useHint() {
    if (this.hintCount <= 0 || this.isAnswered) return;
    this.hintCount--;
    this.selectedOption = this.questions[this.currentIndex].correctAnswer;
  }

  nextQuestion() {
    this.currentIndex++;
    this.selectedOption = null;
    this.isAnswered = false;
    this.isCorrect = false;
    this.showResult = false;
    this.resultAnimation = 0;
    this.timeLeft = this.timePerQuestion;
    this._startTimer();
  }

  skipQuestion() {
    if (!this.isAnswered) {
      this.selectedOption = -1;
      this.isAnswered = true;
      this.isCorrect = false;
      this.showResult = true;
      this._stopTimer();
    }
  }

  showScore(databus) {
    const correctCount = Math.floor(this.score / 10);
    const totalQuestions = this.questions.length;

    if (databus) {
      databus.recordQuizScore(correctCount, totalQuestions, this.score);
    }

    console.log('答题完成！');
    console.log(`答对题数：${correctCount}/${totalQuestions}`);
    console.log(`得分：${this.score}`);
  }

  _startTimer() {
    this._stopTimer();
    this._timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this._stopTimer();
        this.skipQuestion();
      }
    }, 1000);
  }

  _stopTimer() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  get currentQuestion() {
    return this.questions[this.currentIndex] || null;
  }

  get isGameOver() {
    return this.currentIndex >= this.questions.length;
  }

  get correctCount() {
    return Math.floor(this.score / 10);
  }

  get progress() {
    return `${this.currentIndex + 1}/${this.questions.length}`;
  }

  destroy() {
    this._stopTimer();
  }
}

module.exports = QuizViewModel;
