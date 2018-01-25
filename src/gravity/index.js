const { Observable, BehaviorSubject, Subject } = Rx;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');


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
  '#0084ff',
  '#f57d00',
  '#3b5999',
  '#ff0084',
  '#3aaf85'
];

const randomColor = colors => colors[Math.floor(Math.random() * colors.length)];

const randomIntFromRange = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

const GRAVITY = 0.2;
const FRICTION = 0.99;

const accScaleFromVelocity = (update$, d$, initial) => (
  update$.withLatestFrom(d$, (_, d) => d).scan((a, d) => a + d, initial)
);

const updateVelocity = (scale$, d$, radius$, bound$, gravity, friction) => {
  scale$
    .withLatestFrom(d$, radius$, bound$)
    .subscribe(([scale, d, radius, bound]) => {
      if (scale + radius > bound || scale + radius < 0) {
        d$.next(-d);
      } else {
        d$.next(d * friction + gravity);
      }
    });
};

class Ball {
  constructor(x, y, dx, dy, radius, color) {
    this.x$ = new BehaviorSubject(x);

    this.radius$ = Observable.of(radius);
    this.color$ = Observable.of(color);

    this.dx$ = new BehaviorSubject(dx);
    this.dy$ = new BehaviorSubject(dy);

    this.canvasWidth$ = new BehaviorSubject();
    this.canvasHeight$ = new BehaviorSubject();

    this.updateX$ = new Subject();
    this.x$ = accScaleFromVelocity(this.updateX$, this.dx$, x);
    updateVelocity(this.x$, this.dx$, this.radius$, this.canvasWidth$, 0, 1);


    this.updateY$ = new Subject();
    this.y$ = accScaleFromVelocity(this.updateY$, this.dy$, y);
    updateVelocity(this.y$, this.dy$, this.radius$, this.canvasHeight$, GRAVITY, FRICTION);


    Observable
      .combineLatest(this.x$, this.y$, this.radius$, this.color$)
      .subscribe(([x, y, radius, color]) => {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      });
  }

  update(canvasWidth, canvasHeight) {
    this.canvasWidth$.next(canvasWidth);
    this.canvasHeight$.next(canvasHeight);
    this.updateX$.next();
    this.updateY$.next();
  }

}

const ballCnt = 100;
const click$ = Observable.fromEvent(document, 'click').startWith(null);
const balls$ = canvasSize$
  .combineLatest(click$, ({ width, height }, click) => ({ width, height }))
  .map(({ width, height }) => (
    Array
      .from({ length: ballCnt })
      .map(() => {
        const x = randomIntFromRange(0, width);
        const y = randomIntFromRange(height * 1 / 4, height * 3 / 4);
        const dy = randomIntFromRange(-2, 2);
        const dx = randomIntFromRange(-2, 2);
        const radius = randomIntFromRange(10, 20);
        const color = randomColor(colors);
        return new Ball(x, y, dx, dy, radius, color);
      })
  ));

Observable
  .interval(0, Rx.Scheduler.animationFrame)
  .withLatestFrom(canvasSize$, balls$, (_, canvasSize, balls) => ({
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    balls
  }))
  .subscribe(({ canvasWidth, canvasHeight, balls }) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    balls.forEach(b => {
      b.update(canvasWidth, canvasHeight);
    })
  });
