const DEFAULT_ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_game', title: '初次尝试', description: '完成第一局游戏', type: '基础', icon: '🎮' },
  { id: 'match3_master', title: '消消乐大师', description: '消消乐得分超过1000', type: '游戏', icon: '🍬' },
  { id: 'match3_legend', title: '消消乐传奇', description: '消消乐得分超过10000', type: '游戏', icon: '👑' },
  { id: 'level_master', title: '等级达人', description: '消消乐达到10级', type: '游戏', icon: '📈' },
  { id: 'puzzle_beginner', title: '拼图入门', description: '完成简单难度拼图', type: '游戏', icon: '🧩' },
  { id: 'puzzle_intermediate', title: '拼图高手', description: '完成中等难度拼图', type: '游戏', icon: '🎲' },
  { id: 'puzzle_master', title: '拼图大师', description: '完成困难难度拼图', type: '游戏', icon: '🎨' },
  { id: 'quiz_master', title: '知识达人', description: '答题正确率达到80%', type: '知识', icon: '📚' },
  { id: 'quiz_perfect', title: '学霸', description: '单次答题全对', type: '知识', icon: '💯' },
  { id: 'game_enthusiast', title: '游戏爱好者', description: '累计游玩10次', type: '综合', icon: '🎮' },
  { id: 'check_in_master', title: '打卡达人', description: '完成所有线下打卡点', type: '线下', icon: '📍' },
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

// 成绩管理系统
class ScoreManager {
  constructor() {
    this.scores = this.load();
    this.achievements = {
      unlocked: this.scores.achievements.unlocked || [],
      unlockDates: this.scores.achievements.unlockDates || {}
    };
  }

  // 加载数据
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

  // 保存数据
  save() {
    try {
      wx.setStorageSync('gameScores', this.scores);
    } catch (error) {
      console.error('Failed to save scores:', error);
    }
  }

  // 获取默认成绩数据
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

  // 记录消消乐成绩
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

  // 记录拼图成绩
  recordPuzzleScore(level, time, isCompleted) {
    const puzzle = this.scores.puzzle;
    puzzle.gamesPlayed++;
    
    if (isCompleted) {
      puzzle.completedCount++;
      
      // 更新最佳时间
      if (!puzzle.bestTime[level] || time < puzzle.bestTime[level]) {
        puzzle.bestTime[level] = time;
      }
    }
    
    this.scores.overall.totalGamesPlayed++;
    
    this.checkPuzzleAchievements(level, time, isCompleted);
    this.checkOverallAchievements();
    this.save();
  }

  // 记录答题成绩
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

  // 检查消消乐成就
  checkMatch3Achievements(score, level) {
    const match3 = this.scores.match3;

    // 初次尝试
    this.unlockAchievement('first_game');

    // 消消乐大师 - 得分超过1000
    if (score >= 1000) {
      this.unlockAchievement('match3_master');
    }

    // 消消乐传奇 - 得分超过10000
    if (score >= 10000) {
      this.unlockAchievement('match3_legend');
    }

    // 等级达人 - 达到10级
    if (level >= 10) {
      this.unlockAchievement('level_master');
    }
  }

  // 检查拼图成就
  checkPuzzleAchievements(level, time, isCompleted) {
    const puzzle = this.scores.puzzle;

    if (!isCompleted) return;

    // 初次尝试
    this.unlockAchievement('first_game');

    // 拼图入门 - 完成简单难度
    if (level === 1) {
      this.unlockAchievement('puzzle_beginner');
    }

    // 拼图高手 - 完成中等难度
    if (level === 2) {
      this.unlockAchievement('puzzle_intermediate');
    }

    // 拼图大师 - 完成困难难度
    if (level === 3) {
      this.unlockAchievement('puzzle_master');
    }
  }

  // 检查答题成就
  checkQuizAchievements(correctCount, totalQuestions, score) {
    const quiz = this.scores.quiz;

    // 初次尝试
    this.unlockAchievement('first_game');

    // 知识达人 - 正确率达到80%
    if (quiz.accuracy >= 80) {
      this.unlockAchievement('quiz_master');
    }

    // 学霸 - 正确率达到100%
    if (correctCount === totalQuestions) {
      this.unlockAchievement('quiz_perfect');
    }
  }

  // 检查综合成就
  checkOverallAchievements() {
    const overall = this.scores.overall;

    // 打卡达人 - 完成所有线下打卡点（需要在打卡功能中调用）
    // 这里只检查游戏相关的综合成就

    // 游戏爱好者 - 游玩10次
    if (overall.totalGamesPlayed >= 10) {
      this.unlockAchievement('game_enthusiast');
    }

    // 收藏家 - 解锁所有成就（在解锁成就时检查）
    this.checkCollectorAchievement();
  }

  // 检查收藏家成就
  checkCollectorAchievement() {
    const allAchievements = this.getAllAchievementDefinitions();
    const unlockedCount = this.achievements.unlocked.length;
    
    if (unlockedCount >= allAchievements.length - 1) { // -1 因为收藏家本身不计入
      this.unlockAchievement('collector');
    }
  }

  // 解锁成就
  unlockAchievement(achievementId) {
    if (!this.achievements.unlocked.includes(achievementId)) {
      this.achievements.unlocked.push(achievementId);
      this.achievements.unlockDates[achievementId] = Date.now();
      
      // 显示解锁提示
      this.showAchievementUnlockNotification(achievementId);
      
      // 检查收藏家成就
      this.checkCollectorAchievement();
      
      this.save();
      return true;
    }
    return false;
  }

  // 显示成就解锁提示
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

  // 获取所有成就定义
  getAllAchievementDefinitions() {
    return ACHIEVEMENT_DEFINITIONS;
  }

  // 获取成就定义
  getAchievementDefinition(achievementId) {
    return this.getAllAchievementDefinitions().find(a => a.id === achievementId);
  }

  // 获取所有成就及其状态
  getAllAchievementsWithStatus() {
    return this.getAllAchievementDefinitions().map(achievement => ({
      ...achievement,
      isUnlocked: this.achievements.unlocked.includes(achievement.id),
      unlockDate: this.achievements.unlockDates[achievement.id]
    }));
  }

  // 获取已解锁的成就
  getUnlockedAchievements() {
    return this.achievements.unlocked.map(id => {
      const achievement = this.getAchievementDefinition(id);
      return {
        ...achievement,
        unlockDate: this.achievements.unlockDates[id]
      };
    }).filter(Boolean);
  }

  // 获取所有成绩
  getAllScores() {
    return this.scores;
  }

  // 获取总分数
  getTotalScore() {
    return this.scores.match3.totalScore + this.scores.quiz.bestScore;
  }

  // 重置所有数据
  resetAll() {
    this.scores = this.getDefaultScores();
    this.achievements = {
      unlocked: [],
      unlockDates: {}
    };
    this.save();
  }

  // 获取消消乐成绩
  getMatch3Scores() {
    return this.scores.match3;
  }

  // 获取拼图成绩
  getPuzzleScores() {
    return this.scores.puzzle;
  }

  // 获取答题成绩
  getQuizScores() {
    return this.scores.quiz;
  }

  // 获取总体统计
  getOverallStats() {
    return this.scores.overall;
  }

  // 更新游戏时长
  updatePlayTime(minutes) {
    this.scores.overall.totalPlayTime += minutes * 60; // 转换为秒
    this.save();
  }

  // 重置所有成绩
  resetAllScores() {
    this.resetAll();
  }
}

module.exports = ScoreManager;
