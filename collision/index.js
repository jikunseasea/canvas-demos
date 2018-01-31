const { Observable } = Rx;
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const mouse$ = Observable.fromEvent(window, 'mousemove')
  .map(e => ({ x: e.x, y: e.y }));

const canvasSize$ = Observable.fromEvent(window, 'resize')
  .map(() => ({ width: window.innerWidth, height: window.innerHeight }))
  .publishBehavior({ width: window.innerWidth, height: window.innerHeight })
  .refCount();
  
canvasSize$
  .subscribe(({ width, height }) => {
    Object.assign(canvas, { width, height });
  });

const colors = [
  '#df2029',
  '#f57d00',
  '#0084ff',
  '#3b5999',
  '#ff0084',
  '#3aaf85'
];

const randomColor = colors => colors[Math.floor(Math.random() * colors.length)];

const randomFromRange = (min, max) => Math.random() * (max - min) + min;

const randomIntFromRange = (min, max) => Math.floor(randomFromRange(min, max));

const distance = (x1, y1, x2, y2) => Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);

const updateVelocityForBound = radius => (coor, d, low, up) => (
  coor + radius >= up || coor - radius <= low ? -d : d
);

class Ball {
  constructor(x, y, radius, vmax) {
    Object.assign(this, {
      x, y, radius,
      dx: randomFromRange(-vmax, vmax),
      dy: randomFromRange(-vmax, vmax),
      color: randomColor(colors),
      mouseX: 0,
      mouseY: 0,
      canvasWidth: 0,
      canvasHeight: 0,
      balls: [],
      mass: 1,
      opacity: 0
    });
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.strokeStyle = this.color;
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }

  detectCollision() {
    const hasCollisionTo = ball => (
      distance(this.x, this.y, ball.x, ball.y) < this.radius + ball.radius
    );
    for (let ball of this.balls) {
      if (ball !== this && hasCollisionTo(ball)) {
        const { vFinal1, vFinal2 } = resolveCollision(this, ball);
        Object.assign(this, vFinal1);
        Object.assign(ball, vFinal2);
      }
    }
  }

  detectBound() {
    const updateAsRadius = updateVelocityForBound(this.radius);
    this.dx = updateAsRadius(this.x, this.dx, 0, this.canvasWidth);
    this.dy = updateAsRadius(this.y, this.dy, 0, this.canvasHeight);
  }

  detectMouse() {
    const willFill = () => (
      distance(this.x, this.y, this.mouseX, this.mouseY) < 120
    );
    if (willFill() && this.opacity < 0.7) {
      this.opacity += 0.02;
    } else if (this.opacity && this.opacity > 0) {
      this.opacity = Math.max(0, this.opacity - 0.02);
    }
  }

  updateCoor() {
    this.x += this.dx;
    this.y += this.dy;
  }

  update(balls, mouseX, mouseY, canvasWidth, canvasHeight) {
    Object.assign(this, {
      balls, mouseX, mouseY, canvasWidth, canvasHeight
    });
    this.detectCollision();
    this.detectBound();
    this.detectMouse();
    this.updateCoor();
    this.draw();
  }

}

const BALL_CNT = 180;
const RADIUS = 30;
const V_MAX = 3;

// 生成无碰撞坐标
const genNoCollisionCoor = (balls, radius, width, height) => {
  const m = new Array(balls.length).fill(0);
  let x = randomFromRange(0, width);
  let y = randomFromRange(0, width);
  for (let i = 0, len = balls.length; i < len; ++i) {
    const ball = balls[i];
    if (distance(x, y, ball.x, ball.y) < radius + ball.radius) {
      x = randomIntFromRange(0, width);
      y = randomIntFromRange(0, height);
      i = -1;
    }
  }
  return { x, y };
};

const balls$ = canvasSize$
  .map(({ width, height }) => {
    const balls = [];
    for (let i = 0; i < BALL_CNT; ++i) {
      const { x, y } = genNoCollisionCoor(balls, RADIUS, width, height);
      balls.push(new Ball(x, y, RADIUS, V_MAX));
    }
    return balls;
  });

Observable
  .interval(0, Rx.Scheduler.animationFrame)
  .withLatestFrom(mouse$, canvasSize$, balls$, (_, mouse, canvasSize, balls) => ({
    mouseX: mouse.x,
    mouseY: mouse.y,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    balls
  }))
  .subscribe(({ mouseX, mouseY, canvasWidth, canvasHeight, balls }) => {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    balls.forEach((b, _, balls) => {
      b.update(balls, mouseX, mouseY, canvasWidth, canvasHeight);
    })
  });