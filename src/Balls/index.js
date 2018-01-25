const { Observable, BehaviorSubject, Subject } = Rx;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

const maxRadius = 70;
const minRadius = 3;

const ballCnt = 500;


const mouse$ = Observable.fromEvent(window, 'mousemove')
  .map(e => ({ x: e.x, y: e.y }))
  .takeUntil(Observable.fromEvent(window, 'mouseleave'))
  .publishBehavior({ x: null, y: null })
  .refCount();

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

function Ball(x, y, vx, vy, radius) {

  const color = randomColor(colors);

  const update$ = new Subject();

  const mouseX$ = new BehaviorSubject();
  const mouseY$ = new BehaviorSubject();

  const canvasWidth$ = new BehaviorSubject();
  const canvasHeight$ = new BehaviorSubject();

  const vx$ = new BehaviorSubject(vx);
  const vy$ = new BehaviorSubject(vy);

  const x$ = update$
    .withLatestFrom(vx$, (_, vx) => vx)
    .scan((x, vx) => x + vx, x)
    .publishBehavior(x)
    .refCount();

  x$
    .withLatestFrom(vx$, canvasWidth$)
    .subscribe(([x, vx, canvasWidth]) => {
      if (x + vx > canvasWidth
        || x + vx < 0) {
        vx$.next(-vx)
      }
    });

  const y$ = update$
    .withLatestFrom(vy$, (_, vy) => vy)
    .scan((y, vy) => y + vy, y)
    .publishBehavior(y)
    .refCount();

  y$
    .withLatestFrom(vy$, canvasHeight$)
    .subscribe(([y, vy, canvasHeight]) => {
      if (y + vy > canvasHeight
        || y + vy < 0) {
        vy$.next(-vy)
      }
    });

  const radius$ = Observable
    .combineLatest(mouseX$, mouseY$, x$, y$)
    .scan((r, [mouseX, mouseY, x, y]) => {
      if (mouseX - x < 50
        && mouseX - x > -50
        && mouseY - y < 50
        && mouseY - y > -50) {
        if (r < maxRadius) {
          return r + 1;
        }
      } else if (r > minRadius) {
        return r - 1;
      }
      return r;
    }, radius);

  Observable
    .combineLatest(x$, y$, radius$)
    .subscribe(([x, y, radius]) => {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    });


  this.update = (mouseX, mouseY, canvasWidth, canvasHeight) => {
    mouseX$.next(mouseX);
    mouseY$.next(mouseY);
    canvasWidth$.next(canvasWidth);
    canvasHeight$.next(canvasHeight);
    update$.next();
  }
}

const balls$ = Observable.range(0, ballCnt - 1)
  .withLatestFrom(canvasSize$, (_, { width, height }) => ({ width, height }))
  .map(({ width, height }) => {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const vx = (Math.random() - 0.5) * 4;
    const vy = (Math.random() - 0.5) * 4;
    const radius = minRadius;
    const ball = new Ball(x, y, vx, vy, radius);
    return ball;
  })
  .scan((balls, ball) => [...balls, ball], []);


Observable
  .interval(0, Rx.Scheduler.animationFrame)
  .withLatestFrom(mouse$, canvasSize$, balls$,  (_, mouse, canvasSize, balls) => ({
    mouseX: mouse.x,
    mouseY: mouse.y,
    canvasWidth: canvasSize.width,
    canvasHeight: canvasSize.height,
    balls
  }))
  .subscribe(({ mouseX, mouseY, canvasWidth, canvasHeight, balls }) => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    balls.forEach(b => {
      b.update(mouseX, mouseY, canvasWidth, canvasHeight);
    })
  });