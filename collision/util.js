// 顺时针旋转 angle
const rotate = (dx0, dy0, angle) => {
  const dx = dx0 * Math.cos(angle) - dy0 * Math.sin(angle);
  const dy = dx0 * Math.sin(angle) + dy0 * Math.cos(angle);
  return { dx, dy };
}

// Elastic Collision 公式
const elasticCollision = (m1, m2) => (d1, d2) => (
  d1 * (m1 - m2) / (m1 + m2) + d2 * 2 * m2 / (m1 + m2)
);

function resolveCollision(ball, otherBall) {
  const xVelocityDiff = ball.dx - otherBall.dx;
  const yVelocityDiff = ball.dy - otherBall.dy;

  const xDist = otherBall.x - ball.x;
  const yDist = otherBall.y - ball.y;

  let vFinal1 = null;
  let vFinal2 = null;

  if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

      // 把两个粒子的坐标轴旋转为和x轴平行
      const angle = -Math.atan2(yDist, xDist);

      // 两个粒子的质量
      const m1 = ball.mass;
      const m2 = otherBall.mass;

      // Velocity before equation
      const u1 = rotate(ball.dx, ball.dy, angle);
      const u2 = rotate(otherBall.dx, otherBall.dy, angle);

      // Velocity after 1d collision equation
      const elasticCollisionAsMass = elasticCollision(m1, m2);
      const v1 = {
        dx: elasticCollisionAsMass(u1.dx, u2.dx),
        dy: u1.dy
      };
      const v2 = {
        dx: elasticCollisionAsMass(u2.dx, u1.dx),
        dy: u2.dy
      };

      // 将坐标轴转回去
      vFinal1 = rotate(v1.dx, v1.dy, -angle);
      vFinal2 = rotate(v2.dx, v2.dy, -angle);
  }
  return { vFinal1, vFinal2 };
}