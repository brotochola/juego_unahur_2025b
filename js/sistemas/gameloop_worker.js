let lastTime = performance.now();
let framenum = 0;
let deltaTime = 0;
let fps = 0;

function gameLoopInWorker() {
  let currentTime = performance.now();
  deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  framenum++;
  fps = 1000 / deltaTime;
  postMessage({ framenum, deltaTime, fps });
  requestAnimationFrame(gameLoopInWorker);
}
gameLoopInWorker();
