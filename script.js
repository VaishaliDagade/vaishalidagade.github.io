const canvas = document.getElementById("hero-structure");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function initIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }

  window.addEventListener("load", () => {
    if (window.lucide) window.lucide.createIcons();
  });
}

function drawFallback() {
  if (!canvas) return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth || 720;
  const height = canvas.clientHeight || 460;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const centerX = width * 0.52;
  const centerY = height * 0.52;
  context.lineWidth = 1.1;

  for (let row = -8; row <= 8; row += 1) {
    context.beginPath();
    for (let col = -12; col <= 12; col += 1) {
      const x = centerX + col * 22 + row * 7;
      const y = centerY + row * 16 + Math.sin((col * 0.35) + (row * 0.25)) * 18;
      if (col === -12) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "rgba(17,17,17,0.48)";
    context.stroke();
  }

  for (let col = -12; col <= 12; col += 2) {
    context.beginPath();
    for (let row = -8; row <= 8; row += 1) {
      const x = centerX + col * 22 + row * 7;
      const y = centerY + row * 16 + Math.sin((col * 0.35) + (row * 0.25)) * 18;
      if (row === -8) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "rgba(49,95,114,0.58)";
    context.stroke();
  }
}

async function initStructureScene() {
  if (!canvas) return;

  try {
    const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0xf6f2e9, 0);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0.25, 2.5, 8.4);
    camera.lookAt(0, 0, 0);

    const ambient = new THREE.AmbientLight(0xffffff, 1.85);
    const key = new THREE.DirectionalLight(0xffffff, 2.8);
    key.position.set(3.5, 5, 5);
    const rim = new THREE.DirectionalLight(0x9fc4d1, 1.35);
    rim.position.set(-4, 2, -5);
    scene.add(ambient, key, rim);

    const group = new THREE.Group();
    scene.add(group);

    const segmentsX = 34;
    const segmentsY = 20;
    const width = 6.2;
    const depth = 4.15;
    const vertices = [];
    const gridPoints = [];
    const indices = [];

    for (let y = 0; y <= segmentsY; y += 1) {
      for (let x = 0; x <= segmentsX; x += 1) {
        const u = x / segmentsX - 0.5;
        const v = y / segmentsY - 0.5;
        const px = u * width;
        const py = v * depth;
        const pz =
          Math.sin(u * Math.PI * 1.18) * 0.34 +
          Math.cos(v * Math.PI * 1.42) * 0.24 +
          Math.sin((u + v) * Math.PI * 1.2) * 0.1;
        vertices.push(px, py, pz);
        gridPoints.push(new THREE.Vector3(px, py, pz));
      }
    }

    for (let y = 0; y < segmentsY; y += 1) {
      for (let x = 0; x < segmentsX; x += 1) {
        const a = y * (segmentsX + 1) + x;
        const b = a + 1;
        const c = a + segmentsX + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const shellGeometry = new THREE.BufferGeometry();
    shellGeometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    shellGeometry.setIndex(indices);
    shellGeometry.computeVertexNormals();

    const shell = new THREE.Mesh(
      shellGeometry,
      new THREE.MeshStandardMaterial({
        color: 0xf8f1e4,
        roughness: 0.68,
        metalness: 0.08,
        transparent: true,
        opacity: 0.76,
        side: THREE.DoubleSide
      })
    );
    group.add(shell);

    const lineVertices = [];
    for (let y = 0; y <= segmentsY; y += 1) {
      for (let x = 0; x < segmentsX; x += 1) {
        const a = gridPoints[y * (segmentsX + 1) + x];
        const b = gridPoints[y * (segmentsX + 1) + x + 1];
        lineVertices.push(a.x, a.y, a.z + 0.012, b.x, b.y, b.z + 0.012);
      }
    }
    for (let x = 0; x <= segmentsX; x += 1) {
      for (let y = 0; y < segmentsY; y += 1) {
        const a = gridPoints[y * (segmentsX + 1) + x];
        const b = gridPoints[(y + 1) * (segmentsX + 1) + x];
        lineVertices.push(a.x, a.y, a.z + 0.012, b.x, b.y, b.z + 0.012);
      }
    }

    const gridGeometry = new THREE.BufferGeometry();
    gridGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lineVertices, 3));
    const grid = new THREE.LineSegments(
      gridGeometry,
      new THREE.LineBasicMaterial({ color: 0x161616, transparent: true, opacity: 0.42 })
    );
    group.add(grid);

    const nodeGeometry = new THREE.SphereGeometry(0.032, 14, 14);
    const nodeBlue = new THREE.MeshStandardMaterial({ color: 0x315f72, roughness: 0.42, metalness: 0.2 });
    const nodeRust = new THREE.MeshStandardMaterial({ color: 0xa65f3d, roughness: 0.45, metalness: 0.18 });
    const nodes = new THREE.Group();
    gridPoints.forEach((point, index) => {
      const xIndex = index % (segmentsX + 1);
      const yIndex = Math.floor(index / (segmentsX + 1));
      if (xIndex % 5 !== 0 || yIndex % 4 !== 0) return;
      const node = new THREE.Mesh(nodeGeometry, (xIndex + yIndex) % 3 === 0 ? nodeRust : nodeBlue);
      node.position.set(point.x, point.y, point.z + 0.045);
      nodes.add(node);
    });
    group.add(nodes);

    const frameMaterial = new THREE.LineBasicMaterial({ color: 0x315f72, transparent: true, opacity: 0.3 });
    const frameGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-width / 2, -depth / 2, -0.1),
      new THREE.Vector3(width / 2, -depth / 2, -0.1),
      new THREE.Vector3(width / 2, depth / 2, -0.1),
      new THREE.Vector3(-width / 2, depth / 2, -0.1),
      new THREE.Vector3(-width / 2, -depth / 2, -0.1)
    ]);
    group.add(new THREE.Line(frameGeometry, frameMaterial));

    group.rotation.x = -0.58;
    group.rotation.z = -0.1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const widthPx = Math.max(320, rect.width || canvas.clientWidth || 720);
      const heightPx = Math.max(320, rect.height || canvas.clientHeight || 480);
      renderer.setSize(widthPx, heightPx, false);
      camera.aspect = widthPx / heightPx;
      camera.updateProjectionMatrix();
      camera.lookAt(0, 0, 0);
    }

    function render(time = 0) {
      const t = time * 0.001;
      if (!reducedMotion) {
        group.rotation.y = Math.sin(t * 0.3) * 0.3;
        group.rotation.z = -0.1 + Math.sin(t * 0.24) * 0.045;
        nodes.children.forEach((node, index) => {
          const pulse = 1 + Math.sin(t * 1.2 + index * 0.28) * 0.13;
          node.scale.setScalar(pulse);
        });
      }

      renderer.render(scene, camera);
      if (!reducedMotion) requestAnimationFrame(render);
    }

    resize();
    window.addEventListener("resize", resize);
    render();
  } catch (error) {
    drawFallback();
    window.addEventListener("resize", drawFallback);
  }
}

initIcons();
initStructureScene();
