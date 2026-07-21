const DEFAULT_ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_game', title: '初次尝试', description: '完成第一局游戏', type: '基础', icon: '🎮' },
  
  // 消消乐成就
  { id: 'match3_master', title: '消消乐大师', description: '消消乐得分超过1000', type: '游戏', icon: '🍬' },
  { id: 'match3_legend', title: '消消乐传奇', description: '消消乐得分超过10000', type: '游戏', icon: '👑' },
  { id: 'level_master', title: '等级达人', description: '消消乐达到10级', type: '游戏', icon: '📈' },
  
  // 拼图成就
  { id: 'puzzle_beginner', title: '拼图入门', description: '完成简单难度拼图', type: '游戏', icon: '🧩' },
  { id: 'puzzle_intermediate', title: '拼图高手', description: '完成中等难度拼图', type: '游戏', icon: '🎲' },
  { id: 'puzzle_master', title: '拼图大师', description: '完成困难难度拼图', type: '游戏', icon: '🎨' },
  
  // 答题成就
  { id: 'quiz_master', title: '知识达人', description: '答题正确率达到80%', type: '知识', icon: '📚' },
  { id: 'quiz_perfect', title: '学霸', description: '单次答题全对', type: '知识', icon: '💯' },
  
  // 综合成就
  { id: 'game_enthusiast', title: '游戏爱好者', description: '累计游玩10次', type: '综合', icon: '🎮' },
  { id: 'check_in_master', title: '打卡达人', description: '完成线下打卡', type: '线下', icon: '📍' },
  { id: 'collector', title: '收藏家', description: '解锁所有成就', type: '综合', icon: '💎' }
];

function loadAchievementDefinitions() {
  try {
    const definitions = require('../../content/achievements/userAchievements.json');
    if (Array.isArray(definitions)) {
      return definitions;
    }
  } catch (error) {
    // ignore and fallback
  }
  return DEFAULT_ACHIEVEMENT_DEFINITIONS;
}

const ACHIEVEMENT_DEFINITIONS = loadAchievementDefinitions();

class ScoreManager {
  constructor() {
    this.scores = this.load();
    this.achievements = {
      unlocked: this.scores.achievements.unlocked || [],
      unlockDates: this.scores.achievements.unlockDates || {}
    };
  }

  load() {
    try {
      const data = wx.getStorageSync('gameScores');
      if (data) {
        return data;
      }
    } catch (error) {
      console.error('Failed to load scores:', error);
    }
    return this.getDefaultScores();
  }

  save() {
    try {
      wx.setStorageSync('gameScores', this.scores);
    } catch (error) {
      console.error('Failed to save scores:', error);
    }
  }

  getDefaultScores() {
    return {
      match3: {
        gamesPlayed: 0,
        highestScore: 0,
        totalScore: 0,
        averageScore: 0,
        bestLevel: 0
      },
      puzzle: {
        gamesPlayed: 0,
        completedCount: 0,
        bestTime: { 1: null, 2: null, 3: null }
      },
      quiz: {
        gamesPlayed: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        bestScore: 0
      },
      overall: {
        totalGamesPlayed: 0,
        totalPlayTime: 0
      },
      achievements: {
        unlocked: [],
        unlockDates: {}
      }
    };
  }

  recordMatch3Score(score, level) {
    const match3 = this.scores.match3;
    match3.gamesPlayed++;
    match3.totalScore += score;
    match3.averageScore = Math.round(match3.totalScore / match3.gamesPlayed);
    
    if (score > match3.highestScore) {
      match3.highestScore = score;
    }
    
    if (level > match3.bestLevel) {
      match3.bestLevel = level;
    }
    
    this.scores.overall.totalGamesPlayed++;

    this.checkMatch3Achievements(score, level);
    this.checkOverallAchievements();
    this.save();
  }

  recordPuzzleScore(level, time, isCompleted) {
    const puzzle = this.scores.puzzle;
    puzzle.gamesPlayed++;
    
    if (isCompleted) {
      puzzle.completedCount++;
      
      if (!puzzle.bestTime[level] || time < puzzle.bestTime[level]) {
        puzzle.bestTime[level] = time;
      }
    }
    
    this.scores.overall.totalGamesPlayed++;

    this.checkPuzzleAchievements(level, time, isCompleted);
    this.checkOverallAchievements();
    this.save();
  }

  recordQuizScore(correctCount, totalQuestions, score) {
    const quiz = this.scores.quiz;
    quiz.gamesPlayed++;
    quiz.totalQuestions += totalQuestions;
    quiz.correctAnswers += correctCount;
    quiz.accuracy = totalQuestions > 0 ? Math.round((quiz.correctAnswers / quiz.totalQuestions) * 100) : 0;
    
    if (score > quiz.bestScore) {
      quiz.bestScore = score;
    }
    
    this.scores.overall.totalGamesPlayed++;

    this.checkQuizAchievements(correctCount, totalQuestions, score);
    this.checkOverallAchievements();
    this.save();
  }

  checkMatch3Achievements(score, level) {
    const match3 = this.scores.match3;

    this.unlockAchievement('first_game');

    if (score >= 1000) {
      this.unlockAchievement('match3_master');
    }

    if (score >= 10000) {
      this.unlockAchievement('match3_legend');
    }

    if (level >= 10) {
      this.unlockAchievement('level_master');
    }
  }

  checkPuzzleAchievements(level, time, isCompleted) {
    const puzzle = this.scores.puzzle;

    if (!isCompleted) {
      return;
    }

    this.unlockAchievement('first_game');

    if (level === 1) {
      this.unlockAchievement('puzzle_beginner');
    }

    if (level === 2) {
      this.unlockAchievement('puzzle_intermediate');
    }

    if (level === 3) {
      this.unlockAchievement('puzzle_master');
    }
  }

  checkQuizAchievements(correctCount, totalQuestions, score) {
    const quiz = this.scores.quiz;

    this.unlockAchievement('first_game');

    if (quiz.accuracy >= 80) {
      this.unlockAchievement('quiz_master');
    }

    if (correctCount === totalQuestions) {
      this.unlockAchievement('quiz_perfect');
    }
  }

  checkOverallAchievements() {
    const overall = this.scores.overall;

    if (overall.totalGamesPlayed >= 10) {
      this.unlockAchievement('game_enthusiast');
    }

    this.checkCollectorAchievement();
  }

  checkCollectorAchievement() {
    const allAchievements = this.getAllAchievementDefinitions();
    const unlockedCount = this.achievements.unlocked.length;
    
    if (unlockedCount >= allAchievements.length - 1) { // -1 因为收藏家本身不计入
      this.unlockAchievement('collector');
    }
  }

  unlockAchievement(achievementId) {
    if (!this.achievements.unlocked.includes(achievementId)) {
      this.achievements.unlocked.push(achievementId);
      this.achievements.unlockDates[achievementId] = Date.now();
      
      this.showAchievementUnlockNotification(achievementId);
      
      this.checkCollectorAchievement();
      
      this.save();

      return true;
    }
    return false;
  }

  showAchievementUnlockNotification(achievementId) {
    const achievement = this.getAchievementDefinition(achievementId);
    if (achievement) {
      wx.showToast({
        title: `解锁成就: ${achievement.title}`,
        icon: 'success',
        duration: 2000
      });
    }
  }

  getAllAchievementDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
  }

  getAchievementDefinition(achievementId) {
    return this.getAllAchievementDefinitions().find(a => a.id === achievementId);
  }

  getAllAchievementsWithStatus() {
    return this.getAllAchievementDefinitions().map(achievement => ({
      ...achievement,
      isUnlocked: this.achievements.unlocked.includes(achievement.id),
      unlockDate: this.achievements.unlockDates[achievement.id]
    }));
  }

  getUnlockedAchievements() {
    return this.achievements.unlocked.map(id => {
      const achievement = this.getAchievementDefinition(id);
      return {
        ...achievement,
        unlockDate: this.achievements.unlockDates[id]
      };
    }).filter(Boolean);
  }

  getAllScores() {
    return this.scores;
  }

  getTotalScore() {
    return this.scores.match3.totalScore + this.scores.quiz.bestScore;
  }

  resetAll() {
    this.scores = this.getDefaultScores();
    this.achievements = {
      unlocked: [],
      unlockDates: {}
    };
    this.save();
    console.log('[成就系统] 已重置所有数据');
  }

  clearAllAchievements() {
    const clearedCount = this.achievements.unlocked.length;
    this.achievements.unlocked = [];
    this.achievements.unlockDates = {};
    this.scores.achievements.unlocked = [];
    this.scores.achievements.unlockDates = {};
    this.save();
    console.log('[成就系统] 已清除所有成就:', { clearedCount, currentUnlocked: this.achievements.unlocked.length });
    return clearedCount;
  }

  getMatch3Scores() {
    return this.scores.match3;
  }

  getPuzzleScores() {
    return this.scores.puzzle;
  }

  getQuizScores() {
    return this.scores.quiz;
  }

  getOverallStats() {
    return this.scores.overall;
  }

  updatePlayTime(minutes) {
    this.scores.overall.totalPlayTime += minutes * 60; 
    this.save();
  }

  resetAllScores() {
    this.resetAll();
  }
}

module.exports = ScoreManager;
