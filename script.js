const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const glow = document.querySelector(".cursor-glow");
const revealItems = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll(".filter-button");
const stackItems = document.querySelectorAll(".stack-item");
const tiltCards = document.querySelectorAll("[data-tilt]");

if (toggle) {
  toggle.addEventListener("click", () => {
    root.classList.toggle("dark");
  });
}

window.addEventListener("pointermove", (event) => {
  glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
});

function startHeroTypewriter() {
  const title = document.querySelector(".hero-title");
  if (!title) return;

  const line1 = title.querySelector("span:first-child");
  const line2 = title.querySelector("span:last-child");
  if (!line1 || !line2) return;

  const text1 = "Hello";
  const text2 = "World";

  line1.innerHTML = "";
  line2.innerHTML = "";

  const cursor1 = document.createElement("span");
  cursor1.className = "typewriter-cursor";
  line1.appendChild(cursor1);

  const cursor2 = document.createElement("span");
  cursor2.className = "typewriter-cursor";
  cursor2.style.display = "none";
  line2.appendChild(cursor2);

  let i = 0;
  function typeLine1() {
    if (i < text1.length) {
      cursor1.before(text1.charAt(i));
      i++;
      setTimeout(typeLine1, 35 + Math.random() * 20);
    } else {
      cursor1.remove();
      cursor2.style.display = "inline-block";
      let j = 0;
      function typeLine2() {
        if (j < text2.length) {
          cursor2.before(text2.charAt(j));
          j++;
          setTimeout(typeLine2, 35 + Math.random() * 20);
        } else {
          const exclamation = document.createElement("span");
          exclamation.className = "accent-mark";
          exclamation.textContent = "!";
          cursor2.before(exclamation);
          
          setTimeout(() => {
            cursor2.style.animation = "none";
            cursor2.style.opacity = "0";
          }, 2000);
        }
      }
      setTimeout(typeLine2, 100);
    }
  }
  setTimeout(typeLine1, 150);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        if (entry.target.classList.contains("hero-title")) {
          startHeroTypewriter();
        }
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.18 }
);

revealItems.forEach((item) => revealObserver.observe(item));

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    stackItems.forEach((item) => {
      const isVisible = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-muted", !isVisible);
    });
  });
});

stackItems.forEach((item) => {
  item.addEventListener("click", () => {
    stackItems.forEach((entry) => entry.classList.remove("is-active"));
    item.classList.add("is-active");
  });
});

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -7;
    const rotateY = ((x / rect.width) - 0.5) * 7;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
  });

  card.addEventListener("pointerleave", () => {
    card.style.transform = "";
  });
});

const canvas = document.querySelector("#videoCanvas");
const video = document.querySelector(".hero-video");
const ctx = canvas.getContext("2d", { colorSpace: "display-p3" });
const pointer = { x: -1000, y: -1000 };
const fov = 1.8;

let lastFrameTime = 0;
let backgroundParticles = [];
let particles = [];
let techDataStreams = [];

let epochCounter = 1948;
let globalLoss = 0.0028;
let globalAccuracy = 99.74;

let hoveredNode = null;

// Interactive 3D drag-to-rotate state (momentum-based)
let baseRotationX = 0.24;
let baseRotationY = 0.0;
let rotationX = 0.24;
let rotationY = 0.0;
let rotationZ = 0.0;
let velocityX = 0.0;
let velocityY = 0.0016; // default auto-rotation speed
let isDragging = false;
let lastPointerPos = { x: 0, y: 0 };

// Brain configuration and generator
function getRandomColorType() {
  const rand = Math.random();
  if (rand < 0.45) {
    // Pure Black (Faded)
    return {
      highlight: "rgba(80, 80, 80, 0.45)",
      base: "rgba(30, 30, 30, 0.5)",
      saturated: "rgba(0, 0, 0, 0.7)",
      glowStart: "rgba(0, 0, 0, 0.15)",
      gradientEnd: "rgba(0, 0, 0, 0.55)",
      specular: "#ffffff",
      stroke: "rgba(0, 0, 0, 0.45)"
    };
  } else if (rand < 0.75) {
    // Charcoal / Ink (Faded)
    return {
      highlight: "rgba(90, 90, 90, 0.42)",
      base: "rgba(45, 45, 45, 0.48)",
      saturated: "rgba(21, 21, 21, 0.65)",
      glowStart: "rgba(21, 21, 21, 0.12)",
      gradientEnd: "rgba(21, 21, 21, 0.5)",
      specular: "#ffffff",
      stroke: "rgba(21, 21, 21, 0.42)"
    };
  } else if (rand < 0.9) {
    // Deep Slate (Faded)
    return {
      highlight: "rgba(100, 105, 115, 0.38)",
      base: "rgba(60, 65, 75, 0.44)",
      saturated: "rgba(40, 44, 52, 0.6)",
      glowStart: "rgba(40, 44, 52, 0.1)",
      gradientEnd: "rgba(40, 44, 52, 0.46)",
      specular: "#ffffff",
      stroke: "rgba(40, 44, 52, 0.38)"
    };
  } else {
    // Dark Graphite (Faded)
    return {
      highlight: "rgba(110, 110, 110, 0.35)",
      base: "rgba(75, 75, 75, 0.4)",
      saturated: "rgba(60, 60, 60, 0.55)",
      glowStart: "rgba(60, 60, 60, 0.1)",
      gradientEnd: "rgba(60, 60, 60, 0.42)",
      specular: "#ffffff",
      stroke: "rgba(60, 60, 60, 0.35)"
    };
  }
}

function generateBrain() {
  const clusters = [
    // Frontal Lobe Left
    { cx: -0.38, cy: -0.18, cz: 0.42, count: 8, rx: 0.22, ry: 0.22, rz: 0.22, region: "FRONTAL_LOBE" },
    // Frontal Lobe Right
    { cx: 0.38, cy: -0.18, cz: 0.42, count: 8, rx: 0.22, ry: 0.22, rz: 0.22, region: "FRONTAL_LOBE" },
    // Parietal Lobe Left
    { cx: -0.38, cy: -0.28, cz: -0.12, count: 9, rx: 0.24, ry: 0.22, rz: 0.24, region: "PARIETAL_LOBE" },
    // Parietal Lobe Right
    { cx: 0.38, cy: -0.28, cz: -0.12, count: 9, rx: 0.24, ry: 0.22, rz: 0.24, region: "PARIETAL_LOBE" },
    // Occipital Lobe Left
    { cx: -0.34, cy: -0.06, cz: -0.55, count: 7, rx: 0.2, ry: 0.2, rz: 0.2, region: "OCCIPITAL_LOBE" },
    // Occipital Lobe Right
    { cx: 0.34, cy: -0.06, cz: -0.55, count: 7, rx: 0.2, ry: 0.2, rz: 0.2, region: "OCCIPITAL_LOBE" },
    // Temporal Lobe Left
    { cx: -0.58, cy: 0.1, cz: 0.12, count: 8, rx: 0.22, ry: 0.2, rz: 0.22, region: "TEMPORAL_LOBE" },
    // Temporal Lobe Right
    { cx: 0.58, cy: 0.1, cz: 0.12, count: 8, rx: 0.22, ry: 0.2, rz: 0.22, region: "TEMPORAL_LOBE" },
    // Cerebellum Left
    { cx: -0.28, cy: 0.38, cz: -0.45, count: 6, rx: 0.18, ry: 0.18, rz: 0.18, region: "CEREBELLUM" },
    // Cerebellum Right
    { cx: 0.28, cy: 0.38, cz: -0.45, count: 6, rx: 0.18, ry: 0.18, rz: 0.18, region: "CEREBELLUM" },
    // Brainstem
    { cx: 0.0, cy: 0.52, cz: -0.08, count: 8, rx: 0.07, ry: 0.25, rz: 0.07, region: "BRAINSTEM" }
  ];

  const nodes = [];
  let nodeId = 0;

  clusters.forEach(c => {
    for (let i = 0; i < c.count; i++) {
      let attempts = 0;
      let valid = false;
      let x = 0, y = 0, z = 0;

      while (!valid && attempts < 100) {
        attempts++;
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        
        // Distribute nodes wider to avoid crowding near center
        const r = Math.sqrt(Math.random()) * 0.4 + 0.6;

        const dx = r * Math.sin(phi) * Math.cos(theta) * c.rx;
        const dy = r * Math.sin(phi) * Math.sin(theta) * c.ry;
        const dz = r * Math.cos(phi) * c.rz;

        x = c.cx + dx;
        y = c.cy + dy;
        z = c.cz + dz;

        // Verify minimum distance from existing nodes to enforce sparsity
        valid = true;
        for (let j = 0; j < nodes.length; j++) {
          const ex = nodes[j].x - x;
          const ey = nodes[j].y - y;
          const ez = nodes[j].z - z;
          const dist = Math.sqrt(ex*ex + ey*ey + ez*ez);
          if (dist < 0.09) {
            valid = false;
            break;
          }
        }
      }

      const sizeRand = Math.random();
      let baseSize = 3;
      if (sizeRand < 0.1) {
        baseSize = 9 + Math.random() * 5; // Large node
      } else if (sizeRand < 0.75) {
        baseSize = 4.5 + Math.random() * 3.5; // Medium node
      } else {
        baseSize = 2.2 + Math.random() * 1.8; // Small node
      }

      nodes.push({
        id: nodeId++,
        x: x,
        y: y,
        z: z,
        baseSize: baseSize,
        colorType: getRandomColorType(),
        region: c.region,
        pulseProgress: 0,
        hoverEffect: 0,
        screenX: 0,
        screenY: 0,
        xRot: 0,
        yRot: 0,
        zRot: 0,
        projectedRadius: 0
      });
    }
  });

  return nodes;
}

function generateConnections(nodes) {
  const connections = [];
  const maxDistance = 0.52;

  for (let i = 0; i < nodes.length; i++) {
    const candidates = [];
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      if (dist < maxDistance) {
        candidates.push({ nodeB: nodes[j], dist });
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);
    const connectionsToMake = Math.min(candidates.length, 3);
    for (let k = 0; k < connectionsToMake; k++) {
      const target = candidates[k].nodeB;
      const isAccent = Math.random() < 0.15;
      connections.push({
        source: nodes[i],
        target: target,
        dist: candidates[k].dist,
        isAccent,
        zDepth: 0
      });
    }
  }

  // Ensure connectivity
  nodes.forEach(node => {
    const hasConnection = connections.some(c => c.source.id === node.id || c.target.id === node.id);
    if (!hasConnection) {
      let nearest = null;
      let minDist = Infinity;
      nodes.forEach(other => {
        if (other.id === node.id) return;
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const dz = node.z - other.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < minDist) {
          minDist = dist;
          nearest = other;
        }
      });
      if (nearest) {
        connections.push({
          source: node,
          target: nearest,
          dist: minDist,
          isAccent: false,
          zDepth: 0
        });
      }
    }
  });

  return connections;
}

let neuralNodes = generateBrain();
let neuralConnections = generateConnections(neuralNodes);

const floatingLabels = [
  { text: "L01: FRONTAL_LOBE", cx: 0.52, cy: -0.22, cz: 0.42, targetRegion: "FRONTAL_LOBE" },
  { text: "L02: PARIETAL_LOBE", cx: 0.52, cy: -0.32, cz: -0.12, targetRegion: "PARIETAL_LOBE" },
  { text: "L03: OCCIPITAL_LOBE", cx: -0.52, cy: -0.06, cz: -0.52, targetRegion: "OCCIPITAL_LOBE" },
  { text: "L04: CEREBELLUM", cx: -0.52, cy: 0.36, cz: -0.42, targetRegion: "CEREBELLUM" },
  { text: "L05: COGNITIVE_STEM", cx: 0.0, cy: 0.72, cz: -0.1, targetRegion: "BRAINSTEM" }
];

function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  backgroundParticles = [];
  techDataStreams = [];
  const bgCount = rect.width < 768 ? 20 : 45;
  for (let i = 0; i < bgCount; i++) {
    backgroundParticles.push({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 1.5 + 0.5,
    });
  }
}

function rotate3D(x, y, z, ax, ay, az) {
  // Rotate X
  const cosX = Math.cos(ax);
  const sinX = Math.sin(ax);
  let y1 = y * cosX - z * sinX;
  let z1 = y * sinX + z * cosX;
  let x1 = x;

  // Rotate Y
  const cosY = Math.cos(ay);
  const sinY = Math.sin(ay);
  let x2 = x1 * cosY + z1 * sinY;
  let z2 = -x1 * sinY + z1 * cosY;
  let y2 = y1;

  // Rotate Z
  const cosZ = Math.cos(az);
  const sinZ = Math.sin(az);
  let x3 = x2 * cosZ - y2 * sinZ;
  let y3 = x2 * sinZ + y2 * cosZ;
  let z3 = z2;

  return { x: x3, y: y3, z: z3 };
}

function initTechDataStreams(rect) {
  techDataStreams = [];
  const isMobile = rect.width < 768;
  const maxWidth = isMobile ? rect.width : rect.width * 0.48;
  const colCount = Math.max(2, Math.floor(maxWidth / 140));

  for (let i = 0; i < colCount; i++) {
    techDataStreams.push({
      x: 32 + i * 140 + Math.random() * 40,
      y: Math.random() * rect.height,
      speed: 0.25 + Math.random() * 0.35,
      opacity: 0.035 + Math.random() * 0.065, // between 3.5% and 10%
      words: [
        "RETRIEVING", "EMBEDDING", "TRANSFORMER", "OPTIMIZING", 
        "LOSS_FUNC", "GRADIENT", "PIPELINE", "VERTEX_AI", 
        "AGENT_RAG", "VECTOR_DB", "INFERENCE", "COGNITIVE_NODE", 
        "EPOCH_RUN", "LEARN_RATE", "DEEP_LEARN", "NEURAL_NET",
        "SYNC_ENGINE", "PROMPT_TEMP", "LANGCHAIN", "LLAMA_INDEX"
      ],
      currentWord: "",
      wordChangeCounter: 0,
      fontSize: 8 + Math.floor(Math.random() * 3)
    });
  }
}

function updateAndDrawBackground(ctx, rect) {
  const isMobile = rect.width < 768;

  // 1. Draw subtle coordinate tech grid in the background
  const gridSpacing = 95;
  const endX = isMobile ? rect.width : rect.width * 0.52;
  
  ctx.strokeStyle = "rgba(22, 106, 79, 0.025)"; // grid lines (subtle green)
  ctx.lineWidth = 0.5;
  for (let x = gridSpacing; x < endX; x += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = gridSpacing; y < rect.height; y += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(endX, y);
    ctx.stroke();
  }

  // Draw small '+' crosshairs at intersections and print coordinates
  ctx.textAlign = "left";
  for (let x = gridSpacing; x < endX; x += gridSpacing) {
    for (let y = gridSpacing; y < rect.height; y += gridSpacing) {
      ctx.strokeStyle = "rgba(21, 21, 21, 0.08)"; // crosshair
      ctx.beginPath();
      ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
      ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
      ctx.stroke();

      // Occasionally draw coordinates label
      if ((x + y) % (gridSpacing * 3) === 0) {
        ctx.font = "8px 'JetBrains Mono', monospace";
        ctx.fillStyle = "rgba(21, 21, 21, 0.24)"; // coordinate label
        const labelX = (x * 0.12).toFixed(1);
        const labelY = (y * 0.12).toFixed(1);
        ctx.fillText(`[${labelX}, ${labelY}]`, x + 6, y - 4);
      }
    }
  }

  // 2. Initialize and draw tech data streams
  if (techDataStreams.length === 0) {
    initTechDataStreams(rect);
  }

  techDataStreams.forEach(stream => {
    stream.y += stream.speed;
    if (stream.y > rect.height + 60) {
      stream.y = -60;
      stream.speed = 0.25 + Math.random() * 0.35;
    }

    stream.wordChangeCounter++;
    if (stream.currentWord === "" || stream.wordChangeCounter > 200) {
      stream.currentWord = stream.words[Math.floor(Math.random() * stream.words.length)];
      stream.wordChangeCounter = 0;
    }

    // Trace vertical circuit lines
    ctx.strokeStyle = `rgba(22, 106, 79, ${stream.opacity * 0.22})`;
    ctx.beginPath();
    ctx.moveTo(stream.x, stream.y - 80);
    ctx.lineTo(stream.x, stream.y + 30);
    ctx.stroke();

    ctx.font = `${stream.fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = `rgba(22, 106, 79, ${stream.opacity * 0.7})`;
    ctx.fillText(`▶ ${stream.currentWord}`, stream.x + 6, stream.y);

    // Draw auxiliary numbers
    ctx.fillStyle = `rgba(21, 21, 21, ${stream.opacity * 0.4})`;
    const fakeData = (Math.random() * 1000).toFixed(0).padStart(3, '0');
    ctx.fillText(`0x${fakeData}`, stream.x + 6, stream.y + 12);
  });

  // 3. Draw standard space constellation particles (original logic)
  backgroundParticles.forEach((p, idx) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > rect.width) p.vx *= -1;
    if (p.y < 0 || p.y > rect.height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 240, 255, 0.08)";
    ctx.fill();

    for (let j = idx + 1; j < backgroundParticles.length; j++) {
      const p2 = backgroundParticles[j];
      const dx = p.x - p2.x;
      const dy = p.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 80) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 240, 255, ${(80 - dist) / 80 * 0.03})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  });
}

function updateAndDrawParticles(ctx, angleX, angleY, angleZ, centerX, centerY, scale) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.progress += p.speed;

    if (p.progress >= 1) {
      p.target.pulseProgress = 1.0;
      particles.splice(i, 1);
    } else {
      const x = p.source.x + (p.target.x - p.source.x) * p.progress;
      const y = p.source.y + (p.target.y - p.source.y) * p.progress;
      const z = p.source.z + (p.target.z - p.source.z) * p.progress;

      const rot = rotate3D(x, y, z, angleX, angleY, angleZ);
      const perspective = fov / (fov + rot.z);
      const sx = centerX + rot.x * scale * perspective;
      const sy = centerY + rot.y * scale * perspective;

      ctx.beginPath();
      ctx.arc(sx, sy, p.size * perspective, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function spawnParticlesPeriodically() {
  if (Math.random() < 0.16 && neuralConnections.length) {
    const conn = neuralConnections[Math.floor(Math.random() * neuralConnections.length)];
    particles.push({
      source: conn.source,
      target: conn.target,
      progress: 0,
      speed: 0.008 + Math.random() * 0.012,
      color: Math.random() < 0.5 ? "#000000" : "#3c3c3c",
      size: Math.random() * 1.5 + 1.2,
    });
  }

  if (Math.random() < 0.006) {
    epochCounter += 1;
    globalLoss = Math.max(0.0005, Math.min(0.0085, globalLoss + (Math.random() * 0.0002 - 0.0001)));
    globalAccuracy = Math.max(99.2, Math.min(99.98, globalAccuracy + (Math.random() * 0.03 - 0.015)));
  }
}

function drawHUDReadout(ctx, rect) {
  const isMobile = rect.width < 768;
  if (isMobile) return;

  const hudX = rect.width - 224;
  const hudY = 24;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(22, 106, 79, 0.95)";
  ctx.fillText("● COGNITIVE NEURAL ENGINE v5.0", hudX + 10, hudY + 16);
  
  ctx.fillStyle = "rgba(21, 21, 21, 0.72)";
  ctx.fillText(`SYSTEM STATUS: ACTIVE`, hudX + 10, hudY + 34);
  ctx.fillText(`SYNAPSE COUNT: ${neuralNodes.length} NODES`, hudX + 10, hudY + 48);
  ctx.fillText(`CONNECTIONS: ${neuralConnections.length} TRACES`, hudX + 10, hudY + 62);
  ctx.fillText(`SIGNAL COHERENCE: 99.87%`, hudX + 10, hudY + 76);
  ctx.fillText(`BANDWIDTH: 4.8 GB/s`, hudX + 10, hudY + 90);
}

function drawHoverTooltip(ctx, rect) {
  if (!hoveredNode) return;

  // Reset text alignment — the floating-labels loop may have left it as "right",
  // which would draw the tooltip text shifted to the left of the box.
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const boxWidth = 180;
  const boxHeight = 96;
  let tx = hoveredNode.screenX + 15;
  let ty = hoveredNode.screenY - 45;
  
  if (tx + boxWidth > rect.width) tx = hoveredNode.screenX - boxWidth - 15;
  if (ty + boxHeight > rect.height) ty = rect.height - boxHeight - 10;
  if (ty < 10) ty = 10;

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeStyle = hoveredNode.colorType.saturated;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(tx, ty, boxWidth, boxHeight, 6);
  } else {
    ctx.rect(tx, ty, boxWidth, boxHeight);
  }
  ctx.fill();
  ctx.stroke();
  
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#151515";
  ctx.fillText(`[SYNAPSE PROBE]`, tx + 12, ty + 20);
  
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "rgba(21, 21, 21, 0.75)";
  ctx.fillText(`NODE ID: B-N${hoveredNode.id}`, tx + 12, ty + 38);
  ctx.fillText(`REGION: ${hoveredNode.region.replace("_LH", " (LH)").replace("_RH", " (RH)")}`, tx + 12, ty + 54);
  ctx.fillText(`POTENTIAL: ${(Math.abs(hoveredNode.baseSize * 1.5)).toFixed(2)} mV`, tx + 12, ty + 70);
  
  ctx.fillStyle = hoveredNode.colorType.saturated;
  ctx.fillText(`ACTIVITY RATE: ${(90 + hoveredNode.baseSize * 0.8).toFixed(1)}%`, tx + 12, ty + 86);
}

function drawSystem(now = 0) {
  if (now - lastFrameTime < 1000 / 60) {
    requestAnimationFrame(drawSystem);
    return;
  }
  lastFrameTime = now;

  const rect = canvas.getBoundingClientRect();
  const time = now * 0.00022;

  // Clear background for transparent overlay on light page theme
  ctx.clearRect(0, 0, rect.width, rect.height);

  const isMobile = rect.width < 768;
  const centerX = isMobile ? rect.width * 0.5 : rect.width * 0.42;
  const centerY = isMobile ? rect.height * 0.35 : rect.height * 0.5;

  const sizeRef = Math.min(rect.width, rect.height);
  const scale = isMobile ? sizeRef * 0.48 : sizeRef * 0.58;

  // Soft glowing radial background centered on the brain (light theme friendly)
  const radialGlow = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, scale * 2.2
  );
  radialGlow.addColorStop(0, "rgba(22, 106, 79, 0.1)");
  radialGlow.addColorStop(0.5, "rgba(22, 106, 79, 0.03)");
  radialGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = radialGlow;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Apply rotation speed and momentum decay
  if (isDragging) {
    // Slowly decay velocity when holding pointer still
    velocityX *= 0.85;
    velocityY *= 0.85;
  } else {
    // Damped return to default states: vertical speed decays to 0,
    // horizontal speed returns to default auto speed (0.0016)
    velocityX *= 0.95;
    velocityY = velocityY * 0.95 + 0.0016 * 0.05;

    baseRotationX += velocityX;
    baseRotationY += velocityY;
  }

  // Smoothly interpolate rotations to target base rotation
  rotationX += (baseRotationX - rotationX) * 0.08;
  rotationY += (baseRotationY - rotationY) * 0.08;
  rotationZ = Math.cos(time * 0.9) * 0.04;

  // Add the gentle bobbing motion on top of the base rotation
  const bobbingX = Math.sin(time * 1.36) * 0.08;
  
  const angleX = rotationX + bobbingX;
  const angleY = rotationY;
  const angleZ = rotationZ;

  // Project nodes and calculate screen coordinates
  neuralNodes.forEach(node => {
    const rot = rotate3D(node.x, node.y, node.z, angleX, angleY, angleZ);
    node.xRot = rot.x;
    node.yRot = rot.y;
    node.zRot = rot.z;

    const perspective = fov / (fov + rot.z);
    node.screenX = centerX + rot.x * scale * perspective;
    node.screenY = centerY + rot.y * scale * perspective;
    node.projectedRadius = node.baseSize * perspective;

    // Post-projection mouse pull effect
    const dx = pointer.x - node.screenX;
    const dy = pointer.y - node.screenY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < 120) {
      const pull = (120 - dist) / 120 * 12;
      node.screenX += (dx / dist) * pull;
      node.screenY += (dy / dist) * pull;
      node.hoverEffect = Math.min(1.0, node.hoverEffect + 0.15);
      if (Math.random() < 0.05) {
        node.pulseProgress = 1.0;
      }
    } else {
      node.hoverEffect = Math.max(0.0, node.hoverEffect - 0.1);
    }

    if (node.pulseProgress > 0) {
      node.pulseProgress -= 0.04;
    } else {
      node.pulseProgress = 0;
    }
  });

  // Hover detection
  let closestNode = null;
  let minDistance = Infinity;
  neuralNodes.forEach(node => {
    const dist = Math.sqrt((node.screenX - pointer.x) ** 2 + (node.screenY - pointer.y) ** 2);
    if (dist < minDistance) {
      minDistance = dist;
      closestNode = node;
    }
  });
  hoveredNode = minDistance < 28 ? closestNode : null;

  updateAndDrawBackground(ctx, rect);

  // Depth-sort connections & draw them
  neuralConnections.forEach(c => {
    c.zDepth = (c.source.zRot + c.target.zRot) / 2;
  });
  neuralConnections.sort((a, b) => a.zDepth - b.zDepth);

  neuralConnections.forEach(c => {
    const source = c.source;
    const target = c.target;

    const depthFade = (c.zDepth + 0.8) / 1.6;
    let opacity = 0.07 + depthFade * 0.16;
    if (c.isAccent) opacity += 0.05;

    const highlight = Math.max(source.pulseProgress, target.pulseProgress);
    const hoverVal = Math.max(source.hoverEffect, target.hoverEffect);
    opacity += highlight * 0.22 + hoverVal * 0.18;

    ctx.beginPath();
    ctx.moveTo(source.screenX, source.screenY);
    ctx.lineTo(target.screenX, target.screenY);

    let strokeStyle = "";
    if (source.colorType.base.includes("0, 0, 0")) {
      strokeStyle = `rgba(0, 0, 0, ${opacity})`;
    } else if (source.colorType.base.includes("40, 44, 52")) {
      strokeStyle = `rgba(40, 44, 52, ${opacity})`;
    } else if (source.colorType.base.includes("60, 60, 60")) {
      strokeStyle = `rgba(60, 60, 60, ${opacity})`;
    } else {
      strokeStyle = `rgba(21, 21, 21, ${opacity})`;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = c.isAccent ? 1.05 : 0.65;
    ctx.stroke();
  });

  // Project & Draw Floating Labels
  floatingLabels.forEach(lbl => {
    const rotLabel = rotate3D(lbl.cx, lbl.cy, lbl.cz, angleX, angleY, angleZ);
    const perspective = fov / (fov + rotLabel.z);
    const lx = centerX + rotLabel.x * scale * perspective;
    const ly = centerY + rotLabel.y * scale * perspective;

    const targetNode = neuralNodes.find(n => n.region === lbl.targetRegion);
    if (targetNode) {
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(targetNode.screenX, targetNode.screenY);
      ctx.strokeStyle = "rgba(21, 21, 21, 0.15)";
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.font = "8px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(21, 21, 21, 0.65)";
    ctx.textAlign = lbl.cx > 0 ? "left" : "right";
    ctx.fillText(lbl.text, lx + (lbl.cx > 0 ? 5 : -5), ly + 3);
  });

  // Depth-sort nodes & draw them
  const sortedNodes = [...neuralNodes].sort((a, b) => a.zRot - b.zRot);

  sortedNodes.forEach(node => {
    const radius = node.projectedRadius * 1.06 * (1.0 + node.hoverEffect * 0.25);

    // 1. Radial glow behind node
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radius * 2.2, 0, Math.PI * 2);
    const glowGrad = ctx.createRadialGradient(
      node.screenX, node.screenY, radius * 0.3,
      node.screenX, node.screenY, radius * 2.2
    );
    glowGrad.addColorStop(0, node.colorType.glowStart);
    glowGrad.addColorStop(0.5, node.colorType.glowStart.replace("0.25", "0.08").replace("0.2", "0.06").replace("0.15", "0.04"));
    glowGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glowGrad;
    ctx.fill();

    // 2. Translucent glass body with radial highlight
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
    const nodeGrad = ctx.createRadialGradient(
      node.screenX - radius * 0.3, node.screenY - radius * 0.3, radius * 0.05,
      node.screenX, node.screenY, radius
    );
    nodeGrad.addColorStop(0, node.colorType.highlight);
    nodeGrad.addColorStop(0.2, node.colorType.base);
    nodeGrad.addColorStop(1, node.colorType.gradientEnd);
    ctx.fillStyle = nodeGrad;
    ctx.fill();

    // 3. Bright Fresnel border
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = node.colorType.stroke;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 4. Crescent specular reflection
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radius * 0.88, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  updateAndDrawParticles(ctx, angleX, angleY, angleZ, centerX, centerY, scale);
  spawnParticlesPeriodically();
  drawHUDReadout(ctx, rect);
  drawHoverTooltip(ctx, rect);

  requestAnimationFrame(drawSystem);
}

window.addEventListener("pointerdown", (event) => {
  // Ignore clicks on interactive components
  if (event.target.closest("a, button, input, select, textarea")) {
    return;
  }

  const rect = canvas.getBoundingClientRect();
  const isMobile = rect.width < 768;

  isDragging = true;
  document.body.style.cursor = "grabbing";
  document.body.style.userSelect = "none";
  document.body.style.webkitUserSelect = "none";
  
  if (!isMobile) {
    event.preventDefault();
  }
  
  lastPointerPos.x = event.clientX;
  lastPointerPos.y = event.clientY;
  velocityX = 0;
  velocityY = 0;
});

// Prevent native browser dragging (like image dragging) from interrupting
window.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

window.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;

  if (isDragging) {
    const dx = event.clientX - lastPointerPos.x;
    const dy = event.clientY - lastPointerPos.y;
    
    const sensitivity = 0.005;
    
    // Horizontal mouse movement (dx) rotates around Y-axis
    // Vertical mouse movement (dy) rotates around X-axis
    baseRotationY += dx * sensitivity;
    baseRotationX += dy * sensitivity;
    
    // Prevent brain from flipping upside down
    baseRotationX = Math.max(-1.2, Math.min(1.2, baseRotationX));
    
    // Capture drag velocity for momentum
    velocityY = dx * sensitivity;
    velocityX = dy * sensitivity;
    
    lastPointerPos.x = event.clientX;
    lastPointerPos.y = event.clientY;
  }
});

const stopDragging = () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.body.style.webkitUserSelect = "";
  }
};

window.addEventListener("pointerup", stopDragging);
window.addEventListener("pointercancel", stopDragging);

window.addEventListener("selectstart", (event) => {
  if (isDragging) {
    event.preventDefault();
  }
});

window.addEventListener("resize", syncCanvasSize);
syncCanvasSize();

if (video) {
  video.style.display = "none";
}
canvas.style.display = "block";
canvas.style.opacity = "1";

drawSystem();

// Scroll-driven Timeline & Connector Animation
function initScrollTimeline() {
  const timeline = document.querySelector(".vertical-timeline");
  const progressLine = document.querySelector(".timeline-line-progress");
  const nodes = document.querySelectorAll(".timeline-node");
  const connector = document.querySelector(".connector-line");
  const profileSection = document.querySelector(".profile-section");

  if (!timeline || !progressLine) return;

  function updateTimeline() {
    const windowHeight = window.innerHeight;

    // 0. Visiting card strike-through and vengeance reveal based on scroll
    const visitingCard = document.querySelector(".visiting-card");
    const strikeLine = document.querySelector(".strike-line");
    const textVengeance = document.querySelector(".text-vengeance");

    if (visitingCard) {
      const cardRect = visitingCard.getBoundingClientRect();
      // Progress starts when card top crosses 92% window height, completes when card top crosses 22% window height
      const triggerStart = windowHeight * 0.92;
      const triggerEnd = windowHeight * 0.22;
      const scrollDistance = triggerStart - cardRect.top;
      const totalDistance = triggerStart - triggerEnd;
      const progress = Math.min(1, Math.max(0, scrollDistance / totalDistance));

      // Strike line draws from 0 to 100% (over the first 45% of card scroll progress)
      const strikeProgress = Math.min(1, Math.max(0, progress / 0.45));
      if (strikeLine) {
        strikeLine.style.width = `${strikeProgress * 100}%`;
      }

      // Vengeance text fade-in and card background color shift (over the remaining 55% of card scroll progress)
      const revealProgress = progress > 0.45 ? Math.min(1, Math.max(0, (progress - 0.45) / 0.55)) : 0;
      
      if (textVengeance) {
        textVengeance.style.opacity = revealProgress;
        textVengeance.style.transform = `translateY(${12 - (revealProgress * 12)}px)`;
      }
      
      // Set the custom CSS variable to smoothly interpolate background, borders, and text to blood red / white
      visitingCard.style.setProperty('--v-progress', revealProgress);
    }

    // 0b. Card Stacking 3D Depth Animation
    const overviewCard = document.querySelector(".overview-card");
    if (visitingCard && overviewCard && window.innerWidth > 860) {
      const visitingRect = visitingCard.getBoundingClientRect();
      const overviewRect = overviewCard.getBoundingClientRect();
      
      // Overlap begins when overview card top touches visiting card bottom
      const overlapStart = visitingRect.bottom;
      // Overlap completes when overview card top aligns with visiting card top (both at sticky 120px)
      const overlapEnd = visitingRect.top;
      
      const totalOverlapDistance = overlapStart - overlapEnd;
      const currentOverlap = overlapStart - overviewRect.top;
      
      // Calculate overlap progress (0 to 1)
      const overlapProgress = Math.min(1, Math.max(0, currentOverlap / totalOverlapDistance));
      
      // Apply 3D depth transform (scale down to 0.94, translate up by 25px, fade to 0.15)
      const scale = 1 - (overlapProgress * 0.06);
      const translateY = -overlapProgress * 25;
      const opacity = 1 - (overlapProgress * 0.85);
      
      visitingCard.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      visitingCard.style.opacity = opacity;
    } else if (visitingCard) {
      // Reset if not in desktop mode
      visitingCard.style.transform = "";
      visitingCard.style.opacity = "";
    }

    // 1. Profile connector scale calculation based on scroll
    if (profileSection && connector) {
      const profileBox = profileSection.querySelector(".profile-box");
      if (profileBox) {
        const boxRect = profileBox.getBoundingClientRect();
        // The line starts drawing as the bottom of the profile box enters the viewport
        const triggerStart = windowHeight * 0.95;
        const triggerEnd = windowHeight * 0.45;
        const scrollDistance = triggerStart - boxRect.bottom;
        const totalDistance = triggerStart - triggerEnd;
        const progress = Math.min(1, Math.max(0, scrollDistance / totalDistance));
        connector.style.transform = `scaleY(${progress})`;
      }
    }

    // 2. Timeline vertical line progress calculation based on scroll
    const timelineRect = timeline.getBoundingClientRect();
    
    // Line draws from the top of the timeline (crossing 75% of viewport) to the bottom node
    const startTrigger = windowHeight * 0.75;
    const scrollOffset = startTrigger - timelineRect.top;
    const timelineHeight = timelineRect.height;
    
    // Limit progress mapping to the active timeline height
    const progress = Math.min(1, Math.max(0, scrollOffset / (timelineHeight - 80)));
    progressLine.style.height = `${progress * 100}%`;

    // 3. Toggle node active classes as they pass viewport trigger line
    nodes.forEach((node) => {
      const nodeRect = node.getBoundingClientRect();
      if (nodeRect.top < windowHeight * 0.65) {
        node.classList.add("node-active");
      } else {
        node.classList.remove("node-active");
      }
    });
  }

  window.addEventListener("scroll", () => {
    requestAnimationFrame(updateTimeline);
  }, { passive: true });

  // Run initial state calculation
  updateTimeline();
  window.addEventListener("resize", updateTimeline);
}

initScrollTimeline();
