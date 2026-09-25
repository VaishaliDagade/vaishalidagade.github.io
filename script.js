const canvas = document.getElementById("hero-structure");
const shellFallback = document.querySelector(".shell-fallback");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function showShellFallback() {
  if (shellFallback) shellFallback.removeAttribute("data-rendered");
}

function hideShellFallback() {
  if (shellFallback) shellFallback.dataset.rendered = "true";
}

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }

  window.addEventListener("load", () => {
    if (window.lucide) window.lucide.createIcons();
  });
}

const heroShellColumns = 9;
const heroShellRows = 6;

function heroShellPoint(column, row, phase) {
  const u = column / heroShellColumns;
  const v = row / heroShellRows;
  const theta = -1.05 + v * 2.1;
  const x = (u - 0.5) * 6.35;
  const y = Math.sin(theta) * 1.72;
  const crown = Math.cos(theta) * 1.08 + Math.sin(u * Math.PI) * 0.26;
  const modeShape = Math.sin(phase + u * Math.PI * 1.7) * Math.sin(v * Math.PI) * 0.14;

  return { x, y, z: crown + modeShape };
}

function createHeroProjection(width, height) {
  const scale = Math.min(width / 720, height / 440) * 1.08;
  const originX = width * 0.5;
  const originY = height * 0.72;

  return (point) => ({
    x: originX + (point.x * 64 + point.y * 30) * scale,
    y: originY + (point.x * -5 + point.y * 34 - point.z * 92) * scale
  });
}

function drawProjectedPolyline(context, points) {
  points.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x, point.y);
    else context.lineTo(point.x, point.y);
  });
}

function drawArrow(context, from, to, color, width) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = Math.max(7, width * 4.2);

  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = width;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.beginPath();
  context.moveTo(to.x, to.y);
  context.lineTo(to.x - Math.cos(angle - 0.55) * head, to.y - Math.sin(angle - 0.55) * head);
  context.lineTo(to.x - Math.cos(angle + 0.55) * head, to.y - Math.sin(angle + 0.55) * head);
  context.closePath();
  context.fill();
  context.restore();
}

function drawHeroShell(time = 0) {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 450;
  const targetWidth = Math.floor(width * ratio);
  const targetHeight = Math.floor(height * ratio);

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const phase = reducedMotion ? 0.85 : time * 0.0018;
  const project = createHeroProjection(width, height);
  const grid = Array.from({ length: heroShellRows + 1 }, (_, row) =>
    Array.from({ length: heroShellColumns + 1 }, (_, column) =>
      project(heroShellPoint(column, row, phase))
    )
  );
  const shellScale = Math.min(width / 720, height / 440);
  const fontSize = Math.max(10, Math.min(13, 12 * shellScale));

  context.save();
  context.shadowColor = "rgba(17, 24, 32, 0.12)";
  context.shadowBlur = 28 * shellScale;
  context.shadowOffsetY = 18 * shellScale;
  context.fillStyle = "rgba(255, 255, 255, 0.74)";
  context.beginPath();
  drawProjectedPolyline(context, grid[0]);
  for (let row = 1; row <= heroShellRows; row += 1) context.lineTo(grid[row][heroShellColumns].x, grid[row][heroShellColumns].y);
  for (let column = heroShellColumns - 1; column >= 0; column -= 1) context.lineTo(grid[heroShellRows][column].x, grid[heroShellRows][column].y);
  for (let row = heroShellRows - 1; row > 0; row -= 1) context.lineTo(grid[row][0].x, grid[row][0].y);
  context.closePath();
  context.fill();
  context.restore();

  context.lineJoin = "round";
  context.lineCap = "round";

  for (let row = 0; row <= heroShellRows; row += 1) {
    context.beginPath();
    drawProjectedPolyline(context, grid[row]);
    context.strokeStyle = row === 0 || row === heroShellRows ? "rgba(17, 24, 32, 0.55)" : "rgba(17, 24, 32, 0.26)";
    context.lineWidth = row === 0 || row === heroShellRows ? 1.7 : 1.15;
    context.stroke();
  }

  for (let column = 0; column <= heroShellColumns; column += 1) {
    context.beginPath();
    drawProjectedPolyline(
      context,
      Array.from({ length: heroShellRows + 1 }, (_, row) => grid[row][column])
    );
    context.strokeStyle = column === 0 || column === heroShellColumns ? "rgba(17, 24, 32, 0.55)" : "rgba(15, 91, 115, 0.33)";
    context.lineWidth = column === 0 || column === heroShellColumns ? 1.7 : 1.15;
    context.stroke();
  }

  for (let row = 0; row <= heroShellRows; row += 1) {
    for (let column = 0; column <= heroShellColumns; column += 1) {
      if ((row + column) % 2 === 1 && row !== 0 && row !== heroShellRows) continue;
      const point = grid[row][column];
      const accent = row === heroShellRows || (column + row) % 5 === 0;
      context.beginPath();
      context.fillStyle = accent ? "#b65f30" : "#2f52ff";
      context.strokeStyle = "rgba(255, 255, 255, 0.92)";
      context.lineWidth = 1.5;
      context.arc(point.x, point.y, accent ? 4.1 : 4.5, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  }

  const surfaceStart = grid[1][2];
  const surfaceEnd = grid[1][7];
  drawArrow(
    context,
    { x: surfaceStart.x - 4, y: surfaceStart.y - 16 * shellScale },
    { x: surfaceEnd.x + 8, y: surfaceEnd.y - 18 * shellScale },
    "rgba(17, 24, 32, 0.62)",
    1.2
  );

  context.fillStyle = "rgba(17, 24, 32, 0.76)";
  context.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = "center";
  context.fillText("surface coordinate", (surfaceStart.x + surfaceEnd.x) / 2, Math.min(surfaceStart.y, surfaceEnd.y) - 26 * shellScale);

  const globalBase = {
    x: grid[heroShellRows][0].x - 46 * shellScale,
    y: grid[heroShellRows][0].y + 30 * shellScale
  };
  drawArrow(context, globalBase, { x: globalBase.x + 54 * shellScale, y: globalBase.y }, "rgba(17, 24, 32, 0.72)", 1.25);
  drawArrow(context, globalBase, { x: globalBase.x + 23 * shellScale, y: globalBase.y - 28 * shellScale }, "rgba(17, 24, 32, 0.72)", 1.25);
  drawArrow(context, globalBase, { x: globalBase.x, y: globalBase.y - 58 * shellScale }, "rgba(17, 24, 32, 0.72)", 1.25);

  context.fillStyle = "rgba(17, 24, 32, 0.84)";
  context.font = `800 ${fontSize}px Inter, Arial, sans-serif`;
  context.textAlign = "left";
  context.fillText("x", globalBase.x + 58 * shellScale, globalBase.y + 4 * shellScale);
  context.fillText("y", globalBase.x + 27 * shellScale, globalBase.y - 31 * shellScale);
  context.fillText("z", globalBase.x + 4 * shellScale, globalBase.y - 62 * shellScale);
  context.font = `700 ${Math.max(9, fontSize - 1)}px Inter, Arial, sans-serif`;
  context.fillText("global coordinate", globalBase.x + 26 * shellScale, globalBase.y + 32 * shellScale);

  const localBase = {
    x: grid[heroShellRows - 1][heroShellColumns - 1].x + 26 * shellScale,
    y: grid[heroShellRows - 1][heroShellColumns - 1].y + 40 * shellScale
  };
  drawArrow(context, localBase, { x: localBase.x + 42 * shellScale, y: localBase.y + 4 * shellScale }, "rgba(17, 24, 32, 0.7)", 1.15);
  drawArrow(context, localBase, { x: localBase.x + 16 * shellScale, y: localBase.y - 30 * shellScale }, "rgba(17, 24, 32, 0.7)", 1.15);
  drawArrow(context, localBase, { x: localBase.x, y: localBase.y - 42 * shellScale }, "rgba(17, 24, 32, 0.7)", 1.15);
  context.font = `800 ${Math.max(9, fontSize - 1)}px Inter, Arial, sans-serif`;
  context.fillText("x'", localBase.x + 46 * shellScale, localBase.y + 8 * shellScale);
  context.fillText("y'", localBase.x + 20 * shellScale, localBase.y - 33 * shellScale);
  context.fillText("z'", localBase.x + 4 * shellScale, localBase.y - 45 * shellScale);

  hideShellFallback();
}

function initStructureScene() {
  if (!canvas) return;

  showShellFallback();

  function render(time = 0) {
    drawHeroShell(time);
    if (!reducedMotion) requestAnimationFrame(render);
  }

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => drawHeroShell(performance.now()));
    observer.observe(canvas);
  } else {
    window.addEventListener("resize", () => drawHeroShell(performance.now()));
  }

  render();
}

function modeShapeValue(set, mode, u, v) {
  const pi = Math.PI;

  if (set === "cantilever") {
    const free = Math.max(0, (u + 1) / 2);
    const envelope = free * free;

    switch (mode) {
      case 1:
        return envelope * (0.78 + 0.22 * Math.cos(pi * v));
      case 2:
        return envelope * v;
      case 3:
        return envelope * Math.sin(pi * free) * (0.7 + 0.3 * Math.cos(pi * v));
      case 4:
        return envelope * Math.sin(pi * v) * Math.cos(pi * free * 0.72);
      case 5:
        return envelope * Math.sin(2 * pi * v + free * 1.4);
      default:
        return envelope * Math.cos(2 * pi * v) * (0.45 + 0.55 * free);
    }
  }

  const envelope = Math.max(0, (1 - u * u) * (1 - v * v));

  switch (mode) {
    case 1:
      return envelope * Math.cos(0.5 * pi * u) * Math.cos(0.5 * pi * v);
    case 2:
      return envelope * Math.sin(pi * u) * Math.cos(0.5 * pi * v);
    case 3:
      return envelope * Math.cos(0.5 * pi * u) * Math.sin(pi * v);
    case 4:
      return envelope * Math.sin(pi * u) * Math.sin(pi * v);
    case 5:
      return envelope * Math.sin(2 * pi * u) * Math.cos(0.5 * pi * v);
    default:
      return envelope * Math.cos(pi * u) * Math.cos(pi * v);
  }
}

function modeShapeColor(value) {
  const clamped = Math.max(-1, Math.min(1, value));
  if (clamped < -0.25) return "rgba(18, 84, 124, 0.76)";
  if (clamped < 0.15) return "rgba(98, 154, 88, 0.6)";
  if (clamped < 0.55) return "rgba(235, 196, 58, 0.64)";
  return "rgba(182, 95, 48, 0.76)";
}

function drawModePanel(context, cell, set, mode, time) {
  const rows = 7;
  const cols = 9;
  const phase = time * 0.001 + mode * 0.62;
  const oscillation = reducedMotion ? 0.55 : Math.sin(phase);
  const points = [];

  function pointAt(xIndex, yIndex) {
    const u = (xIndex / cols) * 2 - 1;
    const v = (yIndex / rows) * 2 - 1;
    const value = modeShapeValue(set, mode, u, v);
    const warped = value * oscillation;
    const curl = set === "cantilever" ? (u + 1) * 0.04 : Math.sin(u * Math.PI) * 0.03;

    return {
      x: cell.x + cell.width * 0.5 + u * cell.width * 0.28 + v * cell.width * 0.08,
      y: cell.y + cell.height * 0.48 + v * cell.height * 0.18 - warped * cell.height * 0.28 + curl * cell.height,
      value: warped
    };
  }

  for (let y = 0; y <= rows; y += 1) {
    const row = [];
    for (let x = 0; x <= cols; x += 1) row.push(pointAt(x, y));
    points.push(row);
  }

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const a = points[y][x];
      const b = points[y][x + 1];
      const c = points[y + 1][x + 1];
      const d = points[y + 1][x];
      const average = (a.value + b.value + c.value + d.value) / 4;
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.lineTo(c.x, c.y);
      context.lineTo(d.x, d.y);
      context.closePath();
      context.fillStyle = modeShapeColor(average);
      context.fill();
    }
  }

  context.lineWidth = 0.85;
  context.strokeStyle = "rgba(17, 24, 32, 0.42)";
  for (let y = 0; y <= rows; y += 1) {
    context.beginPath();
    points[y].forEach((point, index) => {
      if (index === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    });
    context.stroke();
  }

  context.strokeStyle = "rgba(15, 91, 115, 0.46)";
  for (let x = 0; x <= cols; x += 1) {
    context.beginPath();
    for (let y = 0; y <= rows; y += 1) {
      const point = points[y][x];
      if (y === 0) context.moveTo(point.x, point.y);
      else context.lineTo(point.x, point.y);
    }
    context.stroke();
  }

  for (let y = 0; y <= rows; y += 3) {
    for (let x = 0; x <= cols; x += 3) {
      const point = points[y][x];
      context.beginPath();
      context.arc(point.x, point.y, 2.3, 0, Math.PI * 2);
      context.fillStyle = (x + y + mode) % 2 === 0 ? "#0f5b73" : "#b65f30";
      context.fill();
      context.lineWidth = 0.8;
      context.strokeStyle = "#ffffff";
      context.stroke();
    }
  }

  context.fillStyle = "rgba(17, 24, 32, 0.7)";
  context.font = "700 11px Inter, Arial, sans-serif";
  context.textAlign = "center";
  context.fillText(`Mode ${mode}`, cell.x + cell.width * 0.5, cell.y + cell.height - 8);
}

function drawModeShapeSet(model, time = 0) {
  const { canvas: modeCanvas, context, set } = model;
  const width = modeCanvas.clientWidth || 560;
  const height = modeCanvas.clientHeight || 210;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);

  if (modeCanvas.width !== Math.floor(width * ratio) || modeCanvas.height !== Math.floor(height * ratio)) {
    modeCanvas.width = Math.floor(width * ratio);
    modeCanvas.height = Math.floor(height * ratio);
  }

  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f8fbfa";
  context.fillRect(0, 0, width, height);

  const gutter = Math.max(10, width * 0.025);
  const rowGap = Math.max(8, height * 0.04);
  const cellWidth = (width - gutter * 4) / 3;
  const cellHeight = (height - rowGap * 3) / 2;

  for (let index = 0; index < 6; index += 1) {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const cell = {
      x: gutter + col * (cellWidth + gutter),
      y: rowGap + row * (cellHeight + rowGap),
      width: cellWidth,
      height: cellHeight
    };
    drawModePanel(context, cell, set, index + 1, time);
  }
}

function initModeShapeCanvases() {
  const modeCanvases = Array.from(document.querySelectorAll(".mode-shape-canvas"));
  if (!modeCanvases.length) return;

  const models = modeCanvases
    .map((modeCanvas) => ({
      canvas: modeCanvas,
      context: modeCanvas.getContext("2d"),
      set: modeCanvas.dataset.modeSet || "clamped"
    }))
    .filter((model) => model.context);

  if (!models.length) return;

  function frame(time = 0) {
    models.forEach((model) => drawModeShapeSet(model, time));
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  if (window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      models.forEach((model) => drawModeShapeSet(model, performance.now()));
    });
    models.forEach((model) => observer.observe(model.canvas));
  } else {
    window.addEventListener("resize", () => {
      models.forEach((model) => drawModeShapeSet(model, performance.now()));
    });
  }

  frame();
}

initIcons();
initStructureScene();
initModeShapeCanvases();
