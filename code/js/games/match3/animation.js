class ObjectPool {
  constructor() {
    this.pool = [];
  }

  get() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    return null;
  }

  recycle(obj) {
    this.pool.push(obj);
  }
}

class AnimationManager {
  constructor() {
    this.pool = new ObjectPool();
    this.animations = [];
    this.isAnimating = false;
    this._pendingCallbacks = null;
  }

  addAnimation(type, data, duration = 0.3) {
    let anim = this.pool.get();
    if (!anim) {
      anim = {
        type: '',
        data: null,
        progress: 0,
        duration: 0
      };
    }

    anim.type = type;
    anim.data = data;
    anim.progress = 0;
    anim.duration = duration;

    this.animations.push(anim);
    this.isAnimating = true;
  }

  updateAnimations(deltaTime) {
    if (this.isAnimating) {
      let allDone = true;
      const completedAnims = [];

      for (let i = 0; i < this.animations.length; i++) {
        const anim = this.animations[i];
        anim.progress += deltaTime / anim.duration;
        if (anim.progress < 1) {
          allDone = false;
        } else {
          anim.progress = 1;
          completedAnims.push(anim);
        }
      }

      if (allDone) {
        for (const anim of this.animations) {
          this.pool.recycle(anim);
        }
        this.animations = [];
        this.isAnimating = false;
        this._flushPendingCallbacks();
      } else if (completedAnims.length > 0) {
        this.animations = this.animations.filter(anim => !completedAnims.includes(anim));
        for (const anim of completedAnims) {
          this.pool.recycle(anim);
        }
      }
    }
  }

  waitForAnimations(callback) {
    if (!this.isAnimating) {
      callback();
      return;
    }
    if (!this._pendingCallbacks) {
      this._pendingCallbacks = [];
    }
    this._pendingCallbacks.push(callback);
  }

  _flushPendingCallbacks() {
    if (this._pendingCallbacks && this._pendingCallbacks.length > 0) {
      const callbacks = this._pendingCallbacks;
      this._pendingCallbacks = null;
      callbacks.forEach(cb => cb());
    }
  }

  clear() {
    for (const anim of this.animations) {
      this.pool.recycle(anim);
    }
    this.animations = [];
    this.isAnimating = false;
    this._pendingCallbacks = null;
  }
}

// 缓动函数
function easeOutQuad(t) {
  return t * (2 - t);
}

function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

module.exports = {
  ObjectPool,
  AnimationManager,
  easeOutQuad,
  easeOutElastic,
  easeOutBounce
};
