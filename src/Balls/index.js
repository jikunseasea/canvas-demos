const { Observable } = Rx;
var canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var ctx = canvas.getContext('2d');


const mouse = { x: undefined, y: undefined };

const maxRadius = 40;
const minRadius = 2;

const ballCnt = 500;

window.addEventListener('mousemove', e => {
  Object.assign(mouse, { x: e.x, y: e.y });
});

window.addEventListener('mouseout', e => {
  mouse.x = undefined;
  mouse.y = undefined;
});
// const mouseMove$ = Obervable.fromEvent(window, 'mousemove')
//   .map(e => ({ x: e.x, y: e.y }))
//   .takUntil(Observable.fromEvent(window, 'mouseleave'))
//   .publishBehavior({ x: null, y: null })
//   .refCount();

window.addEventListener('resize', e => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
// const resize$ = Observable.fromEvent(window, 'resize')
//   .map(() => ({ width: window.innerWidth, height: window.innerHeight }));

// const canvasSize$ = resize$;

const colors = [
  '#df2029',
  '#0084ff',
  '#f57d00',
  '#3b5999',
  '#ff0084',
  '#3aaf85'
];
const randomColor = colors => colors[Math.floor(Math.random() * colors.length)];

function Ball(x, y, vx, vy, radius) {
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.radius = radius;

  const color = randomColor(colors);

  // const update$ = new BehaviorSubject(); // TODO

  // this.draw = () => {
  //   ctx.beginPath();
  //   ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
  //   ctx.closePath();
  //   ctx.fillStyle = color;
  //   ctx.fill();
  // };

  this.update = () => {
    if (this.y + this.vy > canvas.height
      || this.y + this.vy < 0) {
      this.vy = -this.vy;
    }
    if (this.x + this.vx > canvas.width
      || this.x + this.vx < 0) {
      this.vx = -this.vx;
    }
    this.x += this.vx;
    this.y += this.vy;


    if (mouse.x - this.x < 50
      && mouse.x - this.x > -50
      && mouse.y - this.y < 50
      && mouse.y - this.y > -50) {
      if (this.radius < maxRadius) {
        this.radius += 1;
      }
    } else if (this.radius > minRadius) {
      this.radius -= 0.1;
    }

    this.draw();
  };
}

const balls = [];


for (let i = 0; i < ballCnt; ++i) {
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  const vx = (Math.random() - 0.5) * 1;
  const vy = (Math.random() - 0.5) * 1;
  radius = minRadius;
  balls.push(new Ball(x, y, vx, vy, radius));
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let ball of balls) {
    ball.update();
  }
  window.requestAnimationFrame(animate);
}

animate();