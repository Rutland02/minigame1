// 游戏配置常量
const BOARD_SIZE = 8;
const INITIAL_TIME = 45;
const SCORE_PER_REMOVE = 10;
const CHAIN_SCORE_MULTIPLIER = 15;
const LEVEL_UP_TIME_BONUS = 5;
const LEVEL_TARGET_MULTIPLIER = 100;
const LEVEL_TIME_DECAY = 0.5;
const INVALID_SWAP_PENALTY = 3;
const SWIPE_THRESHOLD = 20;

const ColorType = {
    RED: 0,
    YELLOW: 1,
    WHITE: 2,
    PINK: 3,
    BLUE: 4,
    GREEN: 5,
    COUNT: 6
};

const COLORS = [
    '#EF4444',
    '#F59E0B',
    '#94A3B8',
    '#EC4899',
    '#3B82F6',
    '#10B981'
];

const ICONS = [
    'images/match3/icon_0000_red.png',
    'images/match3/icon_0001_yellow.png',
    'images/match3/icon_0002_white.png',
    'images/match3/icon_0003_pink.png',
    'images/match3/icon_0004_blue.png',
    'images/match3/icon_0005_green.png'
];

module.exports = {
  BOARD_SIZE,
  INITIAL_TIME,
  SCORE_PER_REMOVE,
  CHAIN_SCORE_MULTIPLIER,
  LEVEL_UP_TIME_BONUS,
  LEVEL_TARGET_MULTIPLIER,
  LEVEL_TIME_DECAY,
  INVALID_SWAP_PENALTY,
  SWIPE_THRESHOLD,
  ColorType,
  COLORS,
  ICONS
};
