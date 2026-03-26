GameGlobal.canvas = wx.createCanvas();

const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
const DPR = windowInfo.pixelRatio || 1;

// 按照 DPR 缩放 canvas 尺寸以保证清晰度
canvas.width = windowInfo.screenWidth * DPR;
canvas.height = windowInfo.screenHeight * DPR;

// 获取 canvas 上下文并进行缩放
const ctx = canvas.getContext('2d');
ctx.scale(DPR, DPR);

export const SCREEN_WIDTH = windowInfo.screenWidth;
export const SCREEN_HEIGHT = windowInfo.screenHeight;
export const DPR = DPR;