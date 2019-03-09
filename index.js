// TODO: MaxScore の計算: 競技プログラミング感

//#region Entry point
/** @type {Game} */
let game;
/** @type {MouseButtonInput} */
let mouse;

let bgm, se,se2;

function preload() {
  // bgm = loadSound('bgm.mp3');
  se = loadSound('se.mp3');
  se2 = loadSound('se2.mp3');
}

function setup() {
  mouse = new MouseButtonInput();
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.canvas.oncontextmenu = e => e.preventDefault();
  canvas.parent("canvas");
  const ev = {
    onEndGame: () => {
      game = new Game(ev); // new Game(ev, false);
    }
  };
  game = new Game(ev, true);

  // bgm.setVolume(0.3);
  // bgm.loop();
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
  // fill(0);
  // rect(0, 0, width, height);
}
//#endregion




function getNumCount(lv) {
  return Math.max(5,
    Math.min(30, lv * 2)
  );
}

function getStageNums(lv) {
  const nums = [];
  const count = getNumCount(lv);
  for (let i = lv; true; i++) {
    if (isPrime(i)) continue;
    nums.push(i);
    if (nums.length >= count) return nums;
  }
}
const P = {
  font: 'Source Sans Pro',
  game: {
    maxLv: 5 // TODO 10
  },
  start: {
    fg: [120, 120, 120],
    bg: [230, 238, 238, 170],
    titleSize: 60,
    fgMsg: [146, 146, 146],
    msgSize: 23,
    msgMarginT: 80,
    previewLv: 10
  },
  trans: {
    bg: [146, 146, 146],
    tickCount: 20
  },
  fin: {
    marginT: 30,
    width: 150,
    lineWidth: 350,
    fg: [146, 146, 146],
    bg: [230, 238, 238],
    captionSize: 25,
    scoreMarginL: 2,
    scoreSize: 70,
    logMarginT: 30,
    logItemMarginT: 20,
    logSize: 25,
    logMaxScoreSize: 15,
    logIndexW: 90,
    logMaxScoreX: 160,
    logMaxScoreY: -5,
    logAveScoreX: 160,
    logAveScoreY: 10,
    msgSize: 20,
    msgMarginB: 25
  },
  stage: {
    bg: [238, 238, 238],
    scoreFg: [179, 179, 179],
    titleSize: 30,
    tMargin: 10,
    nSize: 100,
    fg: [146, 146, 146],
    lvSize: 35,
    lvRMargin: 20,
    lvTMargin: 20,
    timeSize: 20,
    timeTMargin: 20
  },
  nb: {
    speed: 4, // 3,
    bg: [146, 146, 146, 200],
    fg: [0xff, 0xff, 0xff],
    fontSize: 24,
    cursorFactor: 0.02, // 0.01,
    fissionCooldown: 20
  },
  cursor: {
    bgAttr: [146, 146, 146, 50],
    bgRepu: [146, 146, 146, 50],
    stroke: [146, 146, 146],
    sizeCore: 150, // 150,
    size: 450, // 400,
    sizeAcc: 5
  }
}

class Game {
  constructor(ev, withStart) {
    this.ev = ev;
    this.lv = 1;
    /** @tyoe {number[]} */
    this.scores = [];
    this.stage = new Stage(this, this.lv);
    this.transition = new Transition(this);
    this.fin = new Fin(this);
    /** @type {"start"|"game"|"transition"|"trans-fin"|"fin"} */
    this.state = withStart ? "start" : "game";
    this.scoreSt = new ScoreStorage();
    this.start = new Start();
  }
  draw() {
    this.stage.draw();
    if (this.state == "start") {
      this.start.draw();
    }
    if (this.state == "transition") this.transition.draw();
    if (this.state == "trans-fin") {
      this.fin.draw();
      this.transition.draw();
    }
    if (this.state == "fin") this.fin.draw();
  }
  update() {
    this.stage.update();
    if (this.state == "start") {
      this.start.update();
    }
    if (this.state == "transition") this.transition.update();
    if (this.state == "trans-fin") {
      this.fin.update();
      this.transition.update();
    }
    if (this.state == "fin") this.fin.update();
  }
  onResize(scale) {
    this.start.onResize(scale);
    this.fin.onResize(scale);
    this.stage.onResize(scale);
    this.transition.onResize(scale);
  }
  onStartEnd() {
    this.state = "game";
  }
  onStageEnd() {
    if (this.state == "game") {
      this.scores.push(this.stage.score);
      this.scoreSt.add(this.lv, this.stage.score);
      this.state = "transition";
    }
  }
  onEndTransition1() {
    if (this.lv == P.game.maxLv)
      this.state = "trans-fin";
    else {
      this.lv++;
      this.stage = new Stage(this, this.lv);
    }
  }
  onEndTransition2() {
    if (this.state == "transition") {
      this.transition = new Transition(this);
      this.state = "game";
    }
    if (this.state == "trans-fin") {
      this.state = "fin";
    }
  }
  onEndFin() {
    this.ev.onEndGame();
  }
}

class Start {
  /** @param {Game} game */
  constructor(game) {
    this.game = game;
    this.pressed = false;
    this.sp = new StagePreview(game, P.start.previewLv);
  }
  update() {
    this.sp.update();
    if (mouse.l) this.pressed = true;
    else if (this.pressed) game.onStartEnd();
  }
  draw() {
    this.sp.draw();
    fill(...P.start.bg);
    rect(0, 0, width, height);

    textAlign(CENTER, CENTER);
    fill(...P.start.fg);

    textSize(P.start.titleSize);
    let x = width / 2,
      y = (height - P.start.titleSize) / 2;
    text("Numbers' Playground", x, y);
    y += P.start.titleSize;

    y += P.start.msgMarginT;
    fill(...P.start.fgMsg);
    textSize(P.start.msgSize);
    text("CLICK TO PLAY", x, y);
    noStroke();
  }
  onResize(scale) {
    this.sp.onResize(scale);
  }
}

class Fin {
  /** @param {Game} game */
  constructor(game) {
    this.game = game;
    this.hasBeenLeft = false;
  }
  update() {
    if (!mouse.l) this.hasBeenLeft = true;
    if (mouse.l && this.hasBeenLeft) game.onEndFin();
  }
  draw() {
    if (this.game.scores.length == 0) this.game.scores = [37, 137, 1037, 13, 13, 13, 13, 13, 13, 13]; // TODO
    fill(...P.fin.bg);
    rect(0, 0, width, height);

    textAlign(LEFT, TOP);
    fill(...P.fin.fg);

    const w = P.fin.width;
    let y = P.fin.marginT;
    let x = (width - w) / 2;
    textSize(P.fin.captionSize);
    text("SCORE", x + P.fin.scoreMarginL, y);
    y += P.fin.captionSize;
    textSize(P.fin.scoreSize);
    text(this.game.scores.reduce((a, b) => a + b).toString(), x, y);
    y += P.fin.scoreSize;

    stroke(...P.fin.fg);
    const lWidth = P.fin.lineWidth;
    line((width - lWidth) / 2, y, (width + lWidth) / 2, y);

    y += P.fin.logMarginT;
    this.game.scores.forEach((score, lv) => {
      textSize(P.fin.logSize);
      text("Lv." + (lv + 1).toString().padStart(2, "0"), x, y);
      textFont("monospace");
      text(score.toString().padStart(4, " "), x + P.fin.logIndexW, y);
      textSize(P.fin.logMaxScoreSize);
      text("max " + this.game.scoreSt.getHigh(lv + 1).toString().padStart(4, " "), x + P.fin.logMaxScoreX, y + P.fin.logMaxScoreY);
      text("ave " + this.game.scoreSt.getAve(lv + 1).toFixed(1).toString().padStart(6, " "), x + P.fin.logAveScoreX, y + P.fin.logAveScoreY);
      y += P.fin.logSize + P.fin.logItemMarginT;
      textFont(P.font);
      // TODO: 理論値の表示
    });

    textAlign(CENTER, BOTTOM);
    textSize(P.fin.msgSize);
    text("CLICK TO PLAY AGAIN", width / 2, height - P.fin.msgMarginB);

    noStroke();
  }
  onResize() {
    // Do nothing
  }
}

class Transition {
  /** @param {Game} game */
  constructor(game) {
    this.game = game;
    this.ticks = 0;
  }
  update() {
    this.ticks++;
    if (this.ticks == P.trans.tickCount)
      this.game.onEndTransition1();
    if (this.ticks == P.trans.tickCount * 2)
      this.game.onEndTransition2();
  }
  draw() {
    fill(...P.trans.bg);
    if (this.ticks <= P.trans.tickCount)
      rect(0, 0, width * this.ticks / P.trans.tickCount, height);
    else
      rect(width * this.ticks / P.trans.tickCount - width, 0, width, height);
  }
  onResize() {
    // Do nothing
  }
}

class Stage {
  constructor(game, lv) {
    this.game = game;
    this.lv = lv;
    this.startTime = performance.now();
    this.time = 0;
    this.cursor = new Cursor();
    this.score = 0;

    /** @type {NumBall[]} */
    this._numBalls = getStageNums(lv).map(_ => new NumBall(this, _));
  }
  draw() {
    background(P.stage.bg);

    textSize(P.stage.nSize);
    textAlign(CENTER, CENTER);

    fill(...P.stage.scoreFg);
    text(this.score.toString(), width / 2, height / 2);

    textSize(P.stage.titleSize);
    text("SCORE", width / 2, height / 2 - (P.stage.nSize + P.stage.titleSize) / 2 - P.stage.tMargin);

    fill(...P.stage.fg);
    textAlign(RIGHT, TOP);

    textSize(P.stage.lvSize);
    text("Lv." + this.lv, width - P.stage.lvRMargin, P.stage.lvTMargin);

    textSize(P.stage.timeSize);
    text(timeString(this.time), width - P.stage.lvRMargin, P.stage.lvTMargin + P.stage.timeSize + P.stage.timeTMargin);

    this._numBalls.forEach(_ => _.draw());
    this.cursor.draw();
  }
  update() {
    this.time = performance.now() - this.startTime;

    this._numBalls.slice().forEach(_ => _.update());
    this.cursor.update();
    const nB = this._numBalls.slice();
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
    if (this._numBalls.length == 1 && (isPrime(this._numBalls[0].num) || this._numBalls[0].num == 4)) this.game.onStageEnd();
  }
  onResize(scale) {
    this._numBalls.forEach(_ => _.onResize(scale));
    this.cursor.onResize();
  }
  /** @param {NumBall} item */
  removeNumBall(item) {
    this._numBalls.splice(this._numBalls.indexOf(item), 1);
  }
  addNumBall(item) {
    this._numBalls.push(item);
  }
}

class StagePreview {
  constructor(game, lv) {
    this.game = game;
    this.lv = lv;
    this.cursor = {
      pos: {
        x: 0,
        y: 0
      },
      size: 0,
      sizeCore: 0,
      sizeVel: 0,
      mode: "idle"
    };

    /** @type {NumBall[]} */
    this._numBalls = getStageNums(lv).map(_ => new NumBall(this, _));
  }
  draw() {
    background(P.stage.bg);

    this._numBalls.forEach(_ => _.draw());
  }
  update() {
    this._numBalls.slice().forEach(_ => _.update());
  }
  onResize(scale) {
    this._numBalls.forEach(_ => _.onResize(scale));
  }
  /** @param {NumBall} item */
  removeNumBall(item) {
    this._numBalls.splice(this._numBalls.indexOf(item), 1);
  }
  addNumBall(item) {
    this._numBalls.push(item);
  }
}

function num2size(num) {
  if (num < 10) return 48;
  if (num < 100) return 64;
  return 96;
}

function split2Primes(n) {
  for (let i = Math.sqrt(n) << 0; i >= 0; i--) {
    if (n % i == 0) return [i, n / i];
  }
  return [0, 0];
}

class NumBall {
  /**
   * @param {Stage} stage 
   * @param {number} num 
   * @param {{x:number,y:number}|undefined} pos 
   */
  constructor(stage, num, pos, vel) {
    this.num = num;
    this.isHitted = false;
    this.stage = stage;
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
    this.fissionCooldown = P.nb.fissionCooldown;

    if (isPrime(num)) stage.score = Math.max(stage.score, num);
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
    const cur = this.stage.cursor;
    if (this.pos.x - this.size / 2 < 0) this.vel.x = Math.abs(this.vel.x);
    if (this.pos.y - this.size / 2 < 0) this.vel.y = Math.abs(this.vel.y);
    if (this.pos.x + this.size / 2 > width) this.vel.x = -Math.abs(this.vel.x);
    if (this.pos.y + this.size / 2 > height) this.vel.y = -Math.abs(this.vel.y);
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    this.fissionCooldown--;
    if (this.isHitCore(cur) && cur.mode == "repulsion" && !isPrime(this.num) && this.fissionCooldown <= 0) {
      this.stage.removeNumBall(this);
      const nums = split2Primes(this.num);
      window.nums = nums;
      this.stage.addNumBall(new NumBall(this.stage, nums[0], this.pos, {
        x: this.vel.y,
        y: -this.vel.x
      }));
      this.stage.addNumBall(new NumBall(this.stage, nums[1], this.pos, {
        x: -this.vel.y,
        y: this.vel.x
      }));
      se2.play();
    }

    if (cur.mode != "idle" && this.isHit(cur)) {
      const cPos = cur.pos;
      const tPos = this.pos;
      const speed = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
      const mode = cur.mode;
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
   * @param {NumBall} item 
   * @param {boolean} first 
   */
  onHit(item, first) {
    if (item.isHitted || this.isHitted) return;
    if (item.stage.cursor.mode != "arrtaction" || this.stage.cursor.mode != "arrtaction") return;
    if (!item.isHitCore(item.stage.cursor) || !this.isHitCore(this.stage.cursor)) return;
    this.stage.removeNumBall(this);
    if (first) {
      se.play();
      const speed = (
        Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2) +
        Math.sqrt(item.vel.x ** 2 + item.vel.y ** 2)
      ) / 2;
      const tmpVel = {
        x: this.vel.x + item.vel.x,
        y: this.vel.y + item.vel.y
      };
      const tmpVelSpeed = Math.sqrt(tmpVel.x ** 2 + tmpVel.y ** 2);
      if (tmpVelSpeed == 0) { // ちょうど反対方向に向かう奴らが衝突したときは
        this.stage.addNumBall(new NumBall(this.stage, this.num + item.num, {
          x: (this.pos.x + item.pos.x) / 2,
          y: (this.pos.y + item.pos.y) / 2
        })); // ランダムな方向へ飛ばす
      } else {
        const factor = speed / tmpVelSpeed;
        this.stage.addNumBall(new NumBall(this.stage, this.num + item.num, {
          x: (this.pos.x + item.pos.x) / 2,
          y: (this.pos.y + item.pos.y) / 2
        }, {
          x: tmpVel.x * factor,
          y: tmpVel.y * factor
        }));
      }
    } else {
      item.isHitted = true;
      this.isHitted = true;
    }
  }
  /** @param {{pos:{x:number,y:number},size:number}} item */
  isHit(item) {
    return (item.pos.x - this.pos.x) ** 2 + (item.pos.y - this.pos.y) ** 2 <=
      ((this.size + item.size) / 2) ** 2;
  }
  isHitCore(item) {
    return (item.pos.x - this.pos.x) ** 2 + (item.pos.y - this.pos.y) ** 2 <=
      ((this.size + item.sizeCore) / 2) ** 2;
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
    this.sizeCore = 0;
    this.sizeVel = 0;
    /** @type {"idle"|"arrtaction"|"repulsion"} */
    this.mode = "idle";
  }
  draw() {
    if (this.mode != "idle") {
      if (this.mode == "arrtaction") {
        fill(...P.cursor.bgAttr);
      } else if (this.mode == "repulsion") {
        fill(...P.cursor.bgRepu);
      } else throw "BUG";
      stroke(...P.cursor.stroke);
      ellipse(this.pos.x, this.pos.y, this.sizeCore);
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
    if (mouse.r) { // repulsion と attraction の優先順序が影響する
      mode = "repulsion";
    } else if (mouse.l) {
      mode = "arrtaction";
    } else {
      mode = "idle";
    }
    if (mode != this.mode) {
      this.sizeVel = 0;
      this.sizeCore = 0;
    }
    this.mode = mode;
    if (this.sizeCore < P.cursor.sizeCore) {
      this.sizeVel += P.cursor.sizeAcc;
      this.sizeCore = Math.min(this.sizeCore + this.sizeVel, P.cursor.sizeCore);
    }
    this.size = this.sizeCore / P.cursor.sizeCore * P.cursor.size;
  }
  onResize() {
    // Do nothing
  }
}

function isPrime(n) {
  for (let i = 2; i <= Math.sqrt(n); i++)
    if (n % i == 0) return false;
  return true;
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
class MouseButtonInput {
  constructor() {
    this.l = false;
    this.r = false;
    const self = this;
    const updater = e => {
      self.l = (e.buttons & 1) != 0;
      self.r = (e.buttons & 2) != 0;
    }
    window.addEventListener("mousedown", updater);
    window.addEventListener("mouseup", updater);
  }
}

// class Effect {
//   /** @param {Stage} stage */
//   constructor(stage, pos, vel) {
//     this.stage = stage;
//     this.pos = {
//       x: pos.x,
//       y: pos.y
//     };
//     this.vel = {
//       x: vel.x,
//       y: vel.y
//     };
//   }
// update(){
// 
// }
// draw(){
// 
// }
// onResize(){
//   
// }
// }

class ScoreStorage {
  getHigh(lv) {
    return parseInt(localStorage.getItem("score-high-lv-" + lv) || "0");
  }
  getCount(lv) {
    return parseInt(localStorage.getItem("score-count-lv-" + lv) || "0");
  }
  getSum(lv) {
    return parseInt(localStorage.getItem("score-sum-lv-" + lv) || "0");
  }
  getAve(lv) {
    const cnt = this.getCount(lv);
    const sum = this.getSum(lv);
    if (cnt == 0) return 0;
    return sum / cnt;
  }
  add(lv, score) {
    const pvHigh = this.getHigh(lv);
    const pvCount = this.getCount(lv);
    const pvSum = this.getSum(lv);
    localStorage.setItem("score-high-lv-" + lv, Math.max(pvHigh, score));
    localStorage.setItem("score-count-lv-" + lv, pvCount + 1);
    localStorage.setItem("score-sum-lv-" + lv, pvSum + score);
  }
  clear() {
    // TODO: 必要なのだけ消すようにする
    localStorage.clear();
  }
}

window["clearScoreStorage"] = () => new ScoreStorage().clear();