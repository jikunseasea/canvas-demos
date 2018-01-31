const { Observable, BehaviorSubject, Subject } = Rx;
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

const center$ = new BehaviorSubject({
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
});

const mouse$ = Observable.fromEvent(canvas, 'mousemove')
  .map(e => ({ x: e.x, y: e.y }))
  .merge(center$)
  .publishReplay(1)
  .refCount();

Observable.fromEvent(canvas, 'mouseleave')
  .subscribe(() => {
    center$.next({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    });
  });

const canvasSize$ = Observable.fromEvent(window, 'resize')
  .map(() => ({ width: window.innerWidth, height: window.innerHeight }))
  .publishBehavior({ width: window.innerWidth, height: window.innerHeight })
  .refCount();
  
canvasSize$
  .subscribe(({ width, height }) => {
    Object.assign(canvas, { width, height });
    center$.next({ x: width / 2, y: height / 2});
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

const randomFromRange = (min, max) => Math.random() * (max - min) + min;

const randomIntFromRange = (min, max) => Math.floor(randomFromRange(min, max));


class Particle {
  constructor(x, y, radius, color) {

    this.radius$ = Observable.of(radius);
    this.color$ = Observable.of(color);
    this.velocity$ = Observable.of(randomFromRange(0.01, 0.03));
    this.circularRadius$ = Observable.of(randomFromRange(80, 200));

    this.updateRadian$ = new Subject();
    this.updateX$ = new Subject();
    this.updateY$ = new Subject();

    this.radian$ = this.updateRadian$
      .withLatestFrom(this.velocity$)
      .scan((r, [_, v]) => r + v, randomFromRange(0, 2 * Math.PI)); // 角度

    // 为了过度流畅，必需
    this.centerX$ = this.updateX$
      .scan((old, mouseX) => {
        const curCenterX = old.length > 0
          ? (mouseX - old[old.length - 1]) * 0.05 + old[old.length - 1]
          : mouseX;
        return [...old, curCenterX];
      }, [])
      .map(arr => arr[arr.length - 1]);

    this.x$ = this.centerX$
      .withLatestFrom(this.radian$, this.circularRadius$)
      .map(([centerX, r, circularRadius]) => centerX + Math.cos(r) * circularRadius)
      .scan((old, x) => [...old, x], []);

    this.centerY$ = this.updateY$
      .scan((old, mouseY) => {
        const curCenterY = old.length > 0
          ? (mouseY - old[old.length - 1]) * 0.05 + old[old.length - 1]
          : mouseY;
        return [...old, curCenterY];
      }, [])
      .map(arr => arr[arr.length - 1]);

    this.y$ = this.centerY$
      .withLatestFrom(this.radian$, this.circularRadius$)
      .map(([centerY, r, circularRadius]) => centerY + Math.sin(r) * circularRadius)
      .scan((old, y) => [...old, y], []);


    Observable
      .combineLatest(this.x$, this.y$, this.radius$, this.color$)
      .subscribe(([x, y, radius, color]) => {
        const [lastX, curX] = [x[x.length - 2], x[x.length - 1]];
        const [lastY, curY] = [y[y.length - 2], y[y.length - 1]];
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(curX, curY);
        ctx.closePath(); 
        ctx.strokeStyle = color;
        ctx.lineWidth = radius;
        ctx.stroke();
      });
  }

  update(mouseX, mouseY) {
    this.updateRadian$.next();
    this.updateX$.next(mouseX);
    this.updateY$.next(mouseY);
  }

}

const particleCnt = 100;

const particles$ = center$
  .map(({ x, y }) => (
    Array
      .from({ length: particleCnt })
      .map(() => {
        const radius = randomFromRange(1, 3);
        const color = randomColor(colors);
        return new Particle(x, y, radius, color);
      })
  ));

Observable
  .interval(0, Rx.Scheduler.animationFrame)
  .withLatestFrom(mouse$, canvasSize$, particles$)
  .subscribe(([_, mouse, canvasSize, particles]) => {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    particles.forEach(p => {
      p.update(mouse.x, mouse.y);
    })
  });
