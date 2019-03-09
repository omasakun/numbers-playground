/** @type {Game} */
let game;

function setup() {
  var canvas = createCanvas(windowWidth, windowHeight);
  canvas.canvas.oncontextmenu = e => e.preventDefault();
  canvas.parent("canvas");
  game = new Game();
}

function windowResized() {
  const scale = {
    x: windowWidth / width,
    y: windowHeight / height
  };
  resizeCanvas(windowWidth, windowHeight);
  game.onResize(scale);
}

function draw() {
  game.update();

  textFont(P.font);
  noStroke();

  game.draw();
}












class Game {
  constructor() {
    this.lv = 1;
    this.stage = new Stage(this.lv, 0);
  }
  draw() {
    background(0xee);
    this.stage.draw();
  }
  update() {
    this.stage.update();
  }
  onResize(scale) {
    this.stage.onResize(scale);
  }
}

//#region BallNum fn Family

function getTargetNum(lv) {
  return random(2 * lv, 3 * lv) << 0;
}

function getBallNumMax(lv) {
  return Math.max(10, lv * 20);
}

function getBallNum(lv) {
  return random(2, getBallNumMax(lv)) << 0;
}

function getBallCount(lv, target) {
  const mn = Math.max(
    10, // 個数の下限
    (target / getBallNumMax(lv) * 1.3) << 0, // 個数の下限
  );
  const mx = Math.min(mn * 1.5, 50);
  return random(mn, mx) << 0;
}

function isPossibleNums(lv, target, nums) {
  // TODO: Refine.
  let sum = 0;
  nums.forEach(_ => sum += _);
  return sum >= target;
}

function getStageNums(lv) {
  const target = getTargetNum(lv);
  let nums = [];
  let sum = 0;
  let count = getBallCount(lv, target);
  while (true) {
    for (let i = 0; i < 100; i++) { // 試行回数に制限をつけることで、生成を強制的に完了させる
      nums = [];
      for (let k = 0; k < count; k++) {
        const num = getBallNum(lv);
        nums.push(num);
      }
      if (isPossibleNums(lv, target, nums))
        return {
          nums,
          target
        };
    }
    count++;
  }
}

//#endregion

const P = {
  font: 'Source Sans Pro',
  stage: {
    centerFg: [179, 179, 179],
    tSize: 30,
    tMargin: 10,
    nSize: 100,
    fg: [146, 146, 146],
    lvSize: 35,
    lvRMargin: 10,
    lvTMargin: 20,
    timeSize: 20,
    timeTMargin: 10
  },
  nb: {
    speed: 2,
    bg: [146, 146, 146, 200],
    fg: [0xff, 0xff, 0xff],
    fontSize: 24,
    joinCountdown: 30,
    cursorFactor: 0.2
  },
  cursor: {
    bgAttr: [146, 146, 146, 80],
    bgRepu: [146, 146, 146, 80],
    stroke: [146, 146, 146],
    size: 200,
    sizeAcc: 10
  }
}

function timeString(time) {
  time /= 1000;
  const min = (time / 60) << 0;
  const sec = time % 60 << 0;
  const tmp = ((time % 1) * 100) << 0;
  return min.toString().padStart(2, "0") + ":" +
    sec.toString().padStart(2, "0") + "." +
    tmp.toString().padStart(2, "0");
}

class Stage {
  constructor(lv, timeOffset) {
    this.lv = lv;
    this.timeOffset = timeOffset;
    this.startTime = performance.now();
    this.time = timeOffset;
    this.cursor = new Cursor();

    const {
      nums,
      target
    } = getStageNums(lv);

    this.targetNum = target;
    const fns = {
      addNumBall: (num, pos, vel) => {
        this.numBalls.push(new NumBall(num, fns, pos, vel));
      },
      removeNumBall: (item) => {
        this.numBalls.splice(this.numBalls.indexOf(item), 1);
      },
      cursor: this.cursor
    };
    /** @type {NumBall[]} */
    this.numBalls = nums.map(_ => new NumBall(_, fns));
  }
  draw() {
    textSize(P.stage.nSize);
    textAlign(CENTER, CENTER);

    fill(...P.stage.centerFg);
    text(this.targetNum.toString(), width / 2, height / 2);

    textSize(P.stage.tSize);
    text("TARGET", width / 2, height / 2 - (P.stage.nSize + P.stage.tSize) / 2 - P.stage.tMargin);

    fill(...P.stage.fg);
    textAlign(RIGHT, TOP);

    textSize(P.stage.lvSize);
    text("Lv." + this.lv, width - P.stage.lvRMargin, P.stage.lvTMargin);

    textSize(P.stage.timeSize);
    text(timeString(this.time), width - P.stage.lvRMargin, P.stage.lvTMargin + P.stage.timeSize + P.stage.timeTMargin);

    this.numBalls.forEach(_ => _.draw());
    this.cursor.draw();
  }
  update() {
    this.time = this.timeOffset + performance.now() - this.startTime;

    this.numBalls.slice().forEach(_ => _.update());
    this.cursor.update();
    const nB = this.numBalls.slice();
    for (let i = 0; i < nB.length; i++) {
      const _ = nB[i];
      for (let j = 0; j < i; j++) {
        const $ = nB[j];
        if (_.isHit($)) {
          _.onHit($, true);
          $.onHit(_, false);
        }
      }
    }
  }
  onResize(scale) {
    this.numBalls.forEach(_ => _.onResize(scale));
    this.cursor.onResize();
  }
}

function num2size(num) {
  if (num < 10) return 48;
  if (num < 100) return 64;
  return 96;
}

function isPrime(n) {
  for (let i = 2; i <= Math.sqrt(n); i++)
    if (n % i == 0) return false;
  return true;
}

function split2Primes(n) {
  for (let i = Math.sqrt(n) << 0; i >= 0; i--) {
    if (n % i == 0) return [i, n / i];
  }
  return [0, 0];
}

function num2splitCountdown(n) {
  if (isPrime(n)) return Infinity;
  return random(100, 300) << 0;
}


class NumBall {
  /**
   * 
   * @param {number} num 
   * @param {{addNumBall:(...args:any[])=>void,removeNumBall:(item:NumBall)=>void,cursor:Cursor}} fns 
   * @param {{x:number,y:number}|undefined} pos 
   */
  constructor(num, fns, pos, vel) {
    this.num = num;
    this.splitCountdown = num2splitCountdown(num);
    this.joinCountdown = P.nb.joinCountdown;
    this.isHitted = false;
    const size = this.size = num2size(num);
    this.pos = {
      x: pos ? pos.x : random(size, width - size),
      y: pos ? pos.y : random(size, height - size)
    };
    const angle = random(0, Math.PI * 2);
    const speed = P.nb.speed;
    this.vel = {
      x: vel ? vel.x : Math.cos(angle) * speed,
      y: vel ? vel.y : Math.sin(angle) * speed
    }
    this.fns = fns;
  }
  draw() {
    fill(...P.nb.bg);
    ellipse(this.pos.x, this.pos.y, this.size);
    textSize(P.nb.fontSize);
    textAlign(CENTER, CENTER);
    fill(...P.nb.fg);
    text(this.num.toString(), this.pos.x, this.pos.y);
  }
  update() {
    if (this.pos.x - this.size / 2 < 0) this.vel.x = Math.abs(this.vel.x);
    if (this.pos.y - this.size / 2 < 0) this.vel.y = Math.abs(this.vel.y);
    if (this.pos.x + this.size / 2 > width) this.vel.x = -Math.abs(this.vel.x);
    if (this.pos.y + this.size / 2 > height) this.vel.y = -Math.abs(this.vel.y);
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    this.joinCountdown--;

    this.splitCountdown--;
    if (this.splitCountdown == 0) {
      this.fns.removeNumBall(this);
      const nums = split2Primes(this.num);
      this.fns.addNumBall(nums[0], this.pos, {
        x: this.vel.y,
        y: -this.vel.x
      });
      this.fns.addNumBall(nums[1], this.pos, {
        x: -this.vel.y,
        y: this.vel.x
      });
    }

    if (this.fns.cursor.mode != "idle" && this.isHit(this.fns.cursor)) {
      const cPos = this.fns.cursor.pos;
      const tPos = this.pos;
      const speed = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
      const mode = this.fns.cursor.mode;
      const tmpVec = {
        x: (mode == "arrtaction" ? 1 : -1) * (cPos.x - tPos.x) * P.nb.cursorFactor + this.vel.x,
        y: (mode == "arrtaction" ? 1 : -1) * (cPos.y - tPos.y) * P.nb.cursorFactor + this.vel.y
      };
      const tmpVecLen = Math.sqrt(tmpVec.x ** 2 + tmpVec.y ** 2);
      const factor = speed / tmpVecLen;
      this.vel = {
        x: tmpVec.x * factor,
        y: tmpVec.y * factor
      };
    }

    this.isHitted = false;
  }
  /**
   * 
   * @param {NumBall} item 
   * @param {boolean} first 
   */
  onHit(item, first) {
    if (item.isHitted || this.isHitted) return;
    if (item.joinCountdown > 0 || this.joinCountdown > 0) return;
    this.fns.removeNumBall(this);
    if (first) {
      const speed = (
        Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2) +
        Math.sqrt(item.vel.x ** 2 + item.vel.y ** 2)
      ) / 2;
      const tmpVel = {
        x: this.vel.x + item.vel.x,
        y: this.vel.y + item.vel.y
      };
      const tmpVelSpeed = Math.sqrt(tmpVel.x ** 2 + tmpVel.y ** 2);
      const factor = speed / tmpVelSpeed;
      this.fns.addNumBall(this.num + item.num, {
        x: (this.pos.x + item.pos.x) / 2,
        y: (this.pos.y + item.pos.y) / 2
      }, {
        x: tmpVel.x * factor,
        y: tmpVel.y * factor
      });
    } else {
      item.isHitted = true;
      this.isHitted = true;
    }
  }
  /**
   * 
   * @param {{pos:{x:number,y:number},size:number}} item 
   */
  isHit(item) {
    return (item.pos.x - this.pos.x) ** 2 + (item.pos.y - this.pos.y) ** 2 <=
      ((this.size + item.size) / 2) ** 2;
  }
  onResize(scale) {
    this.pos.x *= scale.x;
    this.pos.y *= scale.y;
  }
}

class Cursor {
  constructor() {
    this.pos = {
      x: 0,
      y: 0
    };
    this.size = 0;
    this.sizeVel = 0;
    /** @type {"idle"|"arrtaction"|"repulsion"} */
    this.mode = "idle";
  }
  draw() {
    if (this.mode == "arrtaction") {
      fill(...P.cursor.bgAttr);
      stroke(...P.cursor.stroke);
      ellipse(this.pos.x, this.pos.y, this.size);
      noStroke();
    } else if (this.mode == "repulsion") {
      fill(...P.cursor.bgRepu);
      stroke(...P.cursor.stroke);
      ellipse(this.pos.x, this.pos.y, this.size);
      noStroke();
    }
  }
  update() {
    this.pos = {
      x: mouseX,
      y: mouseY
    };
    let mode = "";
    if (mouseIsPressed) {
      if (mouseButton == "left") {
        mode = "repulsion";
      } else {
        mode = "arrtaction";
      }
    } else {
      mode = "idle";
    }
    if (mode != this.mode) {
      this.size = 0;
      this.sizeVel = 0;
    }
    this.mode = mode;
    if (this.size < P.cursor.size) {
      this.sizeVel += P.cursor.sizeAcc;
      this.size = Math.min(this.size + this.sizeVel, P.cursor.size);
    }
  }
  onResize() {
    // Do nothing
  }
}