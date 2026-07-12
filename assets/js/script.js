const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");

// While the theme wave (view transition) plays, page-level animation work is
// frozen so the browser can cache the old/new snapshots instead of
// re-rasterizing the whole viewport on every frame.
let themeWaveActive = false;
const glow = document.querySelector(".cursor-glow");
const revealItems = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll(".filter-button");
const stackItems = document.querySelectorAll(".stack-item");
const tiltCards = document.querySelectorAll("[data-tilt]");

if (toggle) {
  const syncThemeToggle = () => {
    const isDark = root.classList.contains("dark");
    toggle.setAttribute("aria-pressed", String(isDark));
    toggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  };

  syncThemeToggle(); // reflect the theme applied by the inline head script

  const applyTheme = () => {
    const isDark = root.classList.toggle("dark");
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch (e) {}
    syncThemeToggle();
  };

  toggle.addEventListener("click", () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // No View Transitions support (or reduced motion) -> just switch instantly.
    if (!document.startViewTransition || reduceMotion) {
      applyTheme();
      return;
    }

    // Wave originates from the centre of the toggle button and expands to the
    // farthest corner, so the new theme washes across the whole page.
    const rect = toggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Freeze the canvas loop and CSS transitions/animations for the duration
    // of the wave; otherwise every frame they produce invalidates the live
    // view-transition snapshot and forces a full-viewport repaint.
    themeWaveActive = true;
    root.classList.add("theme-wave");

    const transition = document.startViewTransition(applyTheme);
    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
    transition.finished.finally(() => {
      themeWaveActive = false;
      root.classList.remove("theme-wave");
    });
  });
}

window.addEventListener("pointermove", (event) => {
  glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px) translate(-50%, -50%)`;
});

function startHeroTypewriter() {
  const title = document.querySelector(".hero-title");
  if (!title) return;

  // Grab the two direct child spans (not nested accent spans, which a
  // `span:last-child` selector could match and later leave detached).
  const lines = title.querySelectorAll(":scope > span");
  const line1 = lines[0];
  const line2 = lines[1];
  if (!line1 || !line2) return;

  // Cycled hero phrases: the greeting plus a few ML / AI-agent one-liners.
  // `aAccent` / `bAccent` list character index ranges [start, end) to paint in
  // the accent green (e.g. "print" in phrase 1, "()" in vector.search()).
  const phrases = [
    { a: 'print("Hello', aAccent: [[0, 5]], b: 'World")', bAccent: [] },
    { a: "model", aAccent: [], b: ".fit()", bAccent: [[4, 6]] },
    { a: "agent", aAccent: [], b: ".run()", bAccent: [[4, 6]] },
    { a: "vector", aAccent: [], b: ".search()", bAccent: [[7, 9]] },
  ];

  const typeSpeed = () => 55 + Math.random() * 25;
  const eraseSpeed = 28;
  const holdTime = 1800;
  const betweenTime = 320;

  const cursor = document.createElement("span");
  cursor.className = "typewriter-cursor";

  // Render `text` into `host`, painting characters whose index falls inside an
  // accent range green, then optionally park the cursor at the end.
  function draw(host, text, ranges, withCursor) {
    host.textContent = "";
    for (let idx = 0; idx < text.length; idx++) {
      const ch = text[idx];
      const accented = ranges.some(([s, e]) => idx >= s && idx < e);
      if (accented) {
        const span = document.createElement("span");
        span.className = "accent-char";
        span.textContent = ch;
        host.appendChild(span);
      } else {
        host.appendChild(document.createTextNode(ch));
      }
    }
    if (withCursor) {
      host.appendChild(cursor);
    }
  }

  let p = 0;
  function runPhrase() {
    const { a, aAccent, b, bAccent } = phrases[p];
    line1.textContent = "";
    line2.textContent = "";
    let i = 0;
    let j = 0;

    function typeA() {
      draw(line1, a.slice(0, i), aAccent, true);
      if (i < a.length) {
        i++;
        setTimeout(typeA, typeSpeed());
      } else {
        draw(line1, a, aAccent, false); // keep the colour, drop the cursor
        setTimeout(typeB, 120);
      }
    }

    function typeB() {
      draw(line2, b.slice(0, j), bAccent, true);
      if (j < b.length) {
        j++;
        setTimeout(typeB, typeSpeed());
      } else {
        setTimeout(eraseB, holdTime);
      }
    }

    function eraseB() {
      if (j > 0) {
        j--;
        draw(line2, b.slice(0, j), bAccent, true);
        setTimeout(eraseB, eraseSpeed);
      } else {
        line2.textContent = "";
        setTimeout(eraseA, 40);
      }
    }

    function eraseA() {
      if (i > 0) {
        i--;
        draw(line1, a.slice(0, i), aAccent, true);
        setTimeout(eraseA, eraseSpeed);
      } else {
        line1.textContent = "";
        p = (p + 1) % phrases.length;
        setTimeout(runPhrase, betweenTime);
      }
    }

    setTimeout(typeA, 150);
  }

  runPhrase();
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

// --- Technology Map Interactive Details & Filtering ---
const detailsPanel = document.getElementById("stack-details-panel");
const detailsPlaceholder = detailsPanel ? detailsPanel.querySelector(".stack-details-placeholder") : null;
const detailsInner = detailsPanel ? detailsPanel.querySelector(".stack-details-inner") : null;

// --- Segmented filter control: sliding indicator ---
const stackControls = document.querySelector(".stack-controls");
const filterIndicator = stackControls
  ? stackControls.querySelector(".filter-indicator")
  : null;

const moveFilterIndicator = (button, instant = false) => {
  if (!filterIndicator || !stackControls || !button) return;

  // For instant placement, suppress the slide synchronously (no rAF, which
  // gets paused when the tab is backgrounded) then restore the transition.
  if (instant) filterIndicator.style.transition = "none";

  const rect = button.getBoundingClientRect();
  const parentRect = stackControls.getBoundingClientRect();
  filterIndicator.style.width = `${rect.width}px`;
  filterIndicator.style.transform = `translateX(${rect.left - parentRect.left - 5}px)`;
  filterIndicator.style.opacity = "1";

  if (instant) {
    void filterIndicator.offsetWidth; // commit the jump without animating
    filterIndicator.style.transition = ""; // fall back to the stylesheet transition
  }
};

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    moveFilterIndicator(button);

    // Clear active item and close details panel when switching filters
    stackItems.forEach((item) => {
      item.classList.remove("is-active");
      const isVisible = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-muted", !isVisible);
    });

    if (detailsPanel) {
      detailsPanel.classList.remove("is-open");
      setTimeout(() => {
        if (detailsInner) {
          detailsInner.style.display = "none";
          detailsInner.innerHTML = "";
        }
        if (detailsPlaceholder) {
          detailsPlaceholder.style.display = "flex";
        }
      }, 360);
    }
  });
});

// Place the filter indicator under the active button (instant, no fly-in)
const initFilterIndicator = () => {
  const active = stackControls
    ? stackControls.querySelector(".filter-button.active")
    : null;
  if (active) moveFilterIndicator(active, true);
};
initFilterIndicator();
window.addEventListener("load", initFilterIndicator);
window.addEventListener("resize", initFilterIndicator);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(initFilterIndicator);
}

stackItems.forEach((item) => {
  item.addEventListener("click", () => {
    // If the clicked item is already active, close the details panel
    if (item.classList.contains("is-active")) {
      item.classList.remove("is-active");
      if (detailsPanel) {
        detailsPanel.classList.remove("is-open");
        setTimeout(() => {
          if (detailsInner) {
            detailsInner.style.display = "none";
            detailsInner.innerHTML = "";
          }
          if (detailsPlaceholder) {
            detailsPlaceholder.style.display = "flex";
          }
        }, 360);
      }
      return;
    }

    // Set active item class
    stackItems.forEach((entry) => entry.classList.remove("is-active"));
    item.classList.add("is-active");

    // Load template details
    const template = item.querySelector("template");
    if (template && detailsPanel && detailsInner && detailsPlaceholder) {
      detailsPlaceholder.style.display = "none";
      detailsInner.innerHTML = template.innerHTML;
      detailsInner.style.display = "block";
      detailsPanel.classList.add("is-open");
      
      // Scroll slightly to details panel if it's not fully visible in window
      const rect = detailsPanel.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) {
        detailsPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  });
});

// --- How I Work Timeline Interactivity & Connecting Line Fill ---
const timeline = document.querySelector(".timeline");
const timelineTrackFill = document.querySelector(".timeline-track-fill");
const timelineSteps = document.querySelectorAll(".timeline-step");

if (timeline && timelineTrackFill) {
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          timelineTrackFill.style.width = "100%";
          timelineObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25 }
  );
  timelineObserver.observe(timeline);
}

timelineSteps.forEach((step) => {
  step.addEventListener("click", () => {
    const isExpanded = step.classList.contains("is-expanded");
    
    // Close other steps to function like a clean accordion
    timelineSteps.forEach((s) => s.classList.remove("is-expanded"));
    
    // Open clicked step if not already open
    if (!isExpanded) {
      step.classList.add("is-expanded");
    }
  });
  
  // Support trigger via Enter key for accessibility
  step.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      step.click();
    }
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

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const AUTO_SPIN = prefersReducedMotion ? 0 : 0.0016;
let heroInView = true;

// Interactive 3D drag-to-rotate state (momentum-based)
let baseRotationX = 0.24;
let baseRotationY = 0.0;
let rotationX = 0.24;
let rotationY = 0.0;
let rotationZ = 0.0;
let velocityX = 0.0;
let velocityY = AUTO_SPIN; // default auto-rotation speed
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

// Adjacency map so a firing node can relay signals to its neighbours
const nodeNeighbors = new Map();
neuralConnections.forEach(c => {
  if (!nodeNeighbors.has(c.source.id)) nodeNeighbors.set(c.source.id, []);
  if (!nodeNeighbors.has(c.target.id)) nodeNeighbors.set(c.target.id, []);
  nodeNeighbors.get(c.source.id).push({ conn: c, next: c.target });
  nodeNeighbors.get(c.target.id).push({ conn: c, next: c.source });
});
const hubNodes = neuralNodes.filter(n => n.baseSize >= 7);

let pulseRings = [];
const PARTICLE_CAP = 70;

function fireNode(node, energy) {
  node.pulseProgress = 1.0;
  pulseRings.push({ node, progress: 0 });
  if (energy <= 0 || particles.length >= PARTICLE_CAP) return;

  const neighbors = nodeNeighbors.get(node.id);
  if (!neighbors || !neighbors.length) return;

  const branches = Math.min(neighbors.length, 1 + Math.floor(Math.random() * 2));
  const shuffled = [...neighbors].sort(() => Math.random() - 0.5);
  for (let i = 0; i < branches; i++) {
    const { conn, next } = shuffled[i];
    particles.push({
      source: node,
      target: next,
      conn,
      progress: 0,
      speed: 0.012 + Math.random() * 0.014,
      rgb: Math.random() < 0.4 ? "22, 106, 79" : (Math.random() < 0.5 ? "40, 44, 52" : "0, 0, 0"),
      size: Math.random() * 1.5 + 1.2,
      energy: energy - 1
    });
  }
}

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
  const project = (p, t) => {
    const x = p.source.x + (p.target.x - p.source.x) * t;
    const y = p.source.y + (p.target.y - p.source.y) * t;
    const z = p.source.z + (p.target.z - p.source.z) * t;
    const rot = rotate3D(x, y, z, angleX, angleY, angleZ);
    const perspective = fov / (fov + rot.z);
    return {
      x: centerX + rot.x * scale * perspective,
      y: centerY + rot.y * scale * perspective,
      perspective
    };
  };

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.progress += p.speed;
    p.conn.flowGlow = 1.0; // keep the synapse lit while a signal travels along it

    if (p.progress >= 1) {
      particles.splice(i, 1);
      fireNode(p.target, p.energy); // relay the signal onward (cascade)
      continue;
    }

    const head = project(p, p.progress);
    const tail = project(p, Math.max(0, p.progress - 0.22));

    // Comet trail fading toward the tail
    const trailGrad = ctx.createLinearGradient(tail.x, tail.y, head.x, head.y);
    trailGrad.addColorStop(0, `rgba(${p.rgb}, 0)`);
    trailGrad.addColorStop(1, `rgba(${p.rgb}, 0.5)`);
    ctx.beginPath();
    ctx.moveTo(tail.x, tail.y);
    ctx.lineTo(head.x, head.y);
    ctx.strokeStyle = trailGrad;
    ctx.lineWidth = 1.4 * head.perspective;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(head.x, head.y, p.size * head.perspective, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${p.rgb}, 0.9)`;
    ctx.shadowBlur = 6;
    ctx.shadowColor = `rgba(${p.rgb}, 0.9)`;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawPulseRings(ctx) {
  for (let i = pulseRings.length - 1; i >= 0; i--) {
    const ring = pulseRings[i];
    ring.progress += 0.04;
    if (ring.progress >= 1) {
      pulseRings.splice(i, 1);
      continue;
    }
    const node = ring.node;
    const radius = node.projectedRadius * (1.5 + ring.progress * 3.4);
    const alpha = (1 - ring.progress) * 0.32;
    ctx.beginPath();
    ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(22, 106, 79, ${alpha})`;
    ctx.lineWidth = 0.4 + (1 - ring.progress) * 1.1;
    ctx.stroke();
  }
}

function spawnParticlesPeriodically() {
  if (!prefersReducedMotion) {
    // Ambient single-hop firings anywhere in the brain
    if (Math.random() < 0.05 && particles.length < PARTICLE_CAP) {
      fireNode(neuralNodes[Math.floor(Math.random() * neuralNodes.length)], 1);
    }

    // Occasional deeper "thought burst" cascading out from a hub node
    if (Math.random() < 0.01 && particles.length < PARTICLE_CAP * 0.6) {
      const pool = hubNodes.length ? hubNodes : neuralNodes;
      fireNode(pool[Math.floor(Math.random() * pool.length)], 3);
    }
  }

  if (Math.random() < 0.025) {
    epochCounter += 1;
    globalLoss = Math.max(0.0005, Math.min(0.0085, globalLoss + (Math.random() * 0.0002 - 0.00011)));
    globalAccuracy = Math.max(99.2, Math.min(99.98, globalAccuracy + (Math.random() * 0.03 - 0.014)));
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
  ctx.fillText(`EPOCH: ${epochCounter}  LOSS: ${globalLoss.toFixed(4)}`, hudX + 10, hudY + 48);
  ctx.fillText(`ACCURACY: ${globalAccuracy.toFixed(2)}%`, hudX + 10, hudY + 62);
  ctx.fillText(`SYNAPSES: ${neuralNodes.length} NODES / ${neuralConnections.length} TRACES`, hudX + 10, hudY + 76);
  ctx.fillText(`ACTIVE SIGNALS: ${String(particles.length).padStart(2, "0")}`, hudX + 10, hudY + 90);
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
  if (!heroInView) return; // paused off-screen; the IntersectionObserver restarts the loop
  if (themeWaveActive) {
    // Hold the last frame during the theme wave; a repainting canvas would
    // invalidate the view-transition snapshot every frame
    requestAnimationFrame(drawSystem);
    return;
  }
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

  // On mobile the hero text sits directly over the brain, so dim the whole
  // rendering there to keep the headline readable
  ctx.globalAlpha = isMobile ? 0.4 : 1;
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
    velocityY = velocityY * 0.95 + AUTO_SPIN * 0.05;

    baseRotationX += velocityX;
    baseRotationY += velocityY;
  }

  // Smoothly interpolate rotations to target base rotation
  rotationX += (baseRotationX - rotationX) * 0.08;
  rotationY += (baseRotationY - rotationY) * 0.08;
  rotationZ = prefersReducedMotion ? 0 : Math.cos(time * 0.9) * 0.04;

  // Add the gentle bobbing motion on top of the base rotation
  const bobbingX = prefersReducedMotion ? 0 : Math.sin(time * 1.36) * 0.08;
  
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
    if (c.flowGlow) c.flowGlow *= 0.92; // fade the traveling-signal glow
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
    opacity += highlight * 0.22 + hoverVal * 0.18 + (c.flowGlow || 0) * 0.2;

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

  drawPulseRings(ctx);
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

// Pause the render loop while the hero is scrolled out of view to save CPU/battery
if ("IntersectionObserver" in window) {
  new IntersectionObserver((entries) => {
    const visible = entries[0].isIntersecting;
    if (visible && !heroInView) {
      heroInView = true;
      lastFrameTime = 0;
      requestAnimationFrame(drawSystem);
    } else {
      heroInView = visible;
    }
  }, { threshold: 0.02 }).observe(canvas);
}

if (video) {
  video.style.display = "none";
}
canvas.style.display = "block";
canvas.style.opacity = "1";

drawSystem();

// Scroll-driven Timeline & Connector Animation
// Scroll-driven Timeline & Connector Animation
function initScrollTimeline() {
  const journey = document.querySelector(".journey-flow");
  const svg = document.querySelector(".journey-svg");
  const bgPath = document.querySelector(".journey-svg-bg");
  const progressPath = document.querySelector(".journey-svg-progress");
  const nodes = document.querySelectorAll(".journey-node");
  const detailText = document.querySelector(".journey-detail-text");
  const connector = document.querySelector(".connector-line");
  const profileSection = document.querySelector(".profile-section");

  if (!journey || !svg || !bgPath || !progressPath) return;

  let nodeFractions = [];
  let lastActiveIndex = -1;
  let hoverLock = false;

  function setDetail(node) {
    if (!detailText || !node) return;
    const desc = node.querySelector(".journey-desc");
    detailText.textContent = desc ? desc.textContent.trim() : "";
    detailText.classList.add("is-visible");
  }

  function clearDetail() {
    if (detailText) detailText.classList.remove("is-visible");
  }

  // Hovering a node previews its description in the shared caption
  nodes.forEach((node) => {
    node.addEventListener("pointerenter", () => {
      hoverLock = true;
      setDetail(node);
    });
    node.addEventListener("pointerleave", () => {
      hoverLock = false;
      if (lastActiveIndex >= 0) setDetail(nodes[lastActiveIndex]);
      else clearDetail();
    });
  });

  function drawTimelinePath() {
    const flowRect = journey.getBoundingClientRect();
    // Use the un-rotated layout box: getBoundingClientRect returns the tilted
    // bounding box, which would stretch the path away from the CSS-placed markers.
    svg.setAttribute("width", journey.offsetWidth);
    svg.setAttribute("height", journey.offsetHeight);

    const points = [];

    nodes.forEach((node) => {
      const marker = node.querySelector(".journey-marker");
      const markerRect = marker.getBoundingClientRect();
      points.push({
        x: markerRect.left - flowRect.left + markerRect.width / 2,
        y: markerRect.top - flowRect.top + markerRect.height / 2,
      });
    });

    if (!points.length) return;

    const isMobileLayout = window.innerWidth <= 860;
    const cubics = [];
    let startPt = points[0];

    if (isMobileLayout) {
      // Vertical zig-zag: stops alternate left/right and the route snakes
      // down between them like a subway map — straight rails past each
      // card, rounded corners, and side crossings only in the clear band
      // between cards, never through text
      const W = journey.offsetWidth;
      const xInset = 0.08 * W;

      // Alternate sides first: label wrap (and so card height) depends on x
      nodes.forEach((node, i) => {
        node.style.setProperty("--x", `${i % 2 === 0 ? xInset : W - xInset}px`);
      });

      const cardHeights = Array.from(nodes).map(
        (node) => node.querySelector(".journey-content").getBoundingClientRect().height
      );

      // Stack cards with a fixed clear band; markers sit at card centres.
      // The flow container is sized to fit whatever the labels measure.
      const pad = 24;
      const band = 56;
      const ys = [];
      let yCursor = pad + cardHeights[0] / 2;
      cardHeights.forEach((h, i) => {
        if (i > 0) yCursor += cardHeights[i - 1] / 2 + band + h / 2;
        ys.push(yCursor);
      });
      const H = yCursor + cardHeights[cardHeights.length - 1] / 2 + pad;
      journey.style.height = `${H}px`;
      svg.setAttribute("height", H);

      const nodeCoords = Array.from(nodes).map((_, i) => ({
        x: i % 2 === 0 ? xInset : W - xInset,
        y: ys[i],
      }));

      nodes.forEach((node, i) => {
        node.style.setProperty("--y", `${nodeCoords[i].y}px`);
      });

      startPt = nodeCoords[0];

      const k = 0.5523; // circular-arc bezier constant
      for (let i = 1; i < nodeCoords.length; i++) {
        const p1 = nodeCoords[i - 1];
        const p2 = nodeCoords[i];
        const yc = p1.y + cardHeights[i - 1] / 2 + band / 2; // centre of the clear band
        const r = Math.min(26, band / 2 - 2);
        const dir = p2.x > p1.x ? 1 : -1;
        cubics.push({
          c:
            `L ${p1.x} ${yc - r} ` +
            `C ${p1.x} ${yc - r + k * r}, ${p1.x + dir * (1 - k) * r} ${yc}, ${p1.x + dir * r} ${yc} ` +
            `L ${p2.x - dir * r} ${yc} ` +
            `C ${p2.x - dir * (1 - k) * r} ${yc}, ${p2.x} ${yc + r - k * r}, ${p2.x} ${yc + r}`,
          endsNode: false,
        });
        cubics.push({ c: `L ${p2.x} ${p2.y}`, endsNode: true });
      }
    } else {
      // Straight, non-drifting serpentine: 3 horizontal rows connected by
      // U-turns on the sides. Starts top-left (Node 1), loops right (Node 2),
      // loops left (Node 3), and ends bottom-right (Node 4).
      journey.style.height = ""; // drop the mobile-computed height
      const W = journey.offsetWidth;
      const H = journey.offsetHeight;
      const k = 0.55; // bezier handle ratio

      // 3 row heights
      const yA = 0.14 * H;
      const yB = 0.50 * H;
      const yC = 0.86 * H;

      // 2 straight vertical rails (no drift) - positioned at 15% and 85%
      const L = 0.15 * W;
      const R = 0.85 * W;

      // Bulge is exactly the vertical radius of the U-turn to ensure perfectly circular curves
      const bulge = (yB - yA) / 2;

      const apex1 = { x: R + bulge, y: (yA + yB) / 2 }; // Node 2
      const apex2 = { x: L - bulge, y: (yB + yC) / 2 }; // Node 3

      startPt = { x: L - bulge, y: yA }; // Node 1

      // Set node style properties dynamically so that markers align perfectly with curves on all screen widths
      const nodeCoords = [
        { x: L - bulge, y: yA },
        { x: apex1.x, y: apex1.y },
        { x: apex2.x, y: apex2.y },
        { x: R + bulge, y: yC }
      ];

      nodes.forEach((node, idx) => {
        if (nodeCoords[idx]) {
          node.style.setProperty("--x", `${(nodeCoords[idx].x / W) * 100}%`);
          node.style.setProperty("--y", `${(nodeCoords[idx].y / H) * 100}%`);
        }
      });

      // A rounded U-turn through an apex: enters at (ax,ay) travelling level,
      // is vertical at the apex, and exits level toward (bx,by).
      const addTurn = (ax, ay, apex, bx, by) => {
        cubics.push({
          c: `C ${ax + (apex.x - ax) * k} ${ay}, ${apex.x} ${apex.y - (apex.y - ay) * k}, ${apex.x} ${apex.y}`,
          endsNode: true,
        });
        cubics.push({
          c: `C ${apex.x} ${apex.y + (by - apex.y) * k}, ${bx + (apex.x - bx) * k} ${by}, ${bx} ${by}`,
          endsNode: false,
        });
      };

      cubics.push({ c: `L ${R} ${yA}`, endsNode: false }); // row 1 flat (L → R)
      addTurn(R, yA, apex1, R, yB); // U-turn 1 to Row 2 (apex = Node 2)
      cubics.push({ c: `L ${L} ${yB}`, endsNode: false }); // row 2 flat (R → L)
      addTurn(L, yB, apex2, L, yC); // U-turn 2 to Row 3 (apex = Node 3)
      cubics.push({ c: `L ${R + bulge} ${yC}`, endsNode: true }); // row 3 flat (L → R, ends at Node 4)
    }

    let pathD = `M ${startPt.x} ${startPt.y}`;
    const prefixPaths = [];
    cubics.forEach((seg) => {
      pathD += " " + seg.c;
      prefixPaths.push({ d: pathD, endsNode: seg.endsNode });
    });

    bgPath.setAttribute("d", pathD);

    // Exact arc length up to each stop, so activation matches the
    // moment the line actually reaches it (turns add length)
    const lengths = [0];
    prefixPaths.forEach((prefix) => {
      if (!prefix.endsNode) return;
      progressPath.setAttribute("d", prefix.d);
      lengths.push(progressPath.getTotalLength());
    });
    progressPath.setAttribute("d", pathD);

    const pathLength = progressPath.getTotalLength();
    progressPath.style.strokeDasharray = pathLength;
    progressPath.style.strokeDashoffset = pathLength;
    progressPath.dataset.length = pathLength;

    const totalDist = lengths[lengths.length - 1] || 1;
    nodeFractions = lengths.map((d) => d / totalDist);
  }

  // Draw the path initially
  drawTimelinePath();

  // 0. Visiting card sequential scroll animations.
  // Wheel scrolling arrives in coarse steps (one notch can cover ~15% of the
  // sticky range), so phase values are eased toward the scroll-derived target
  // each frame instead of applied raw — otherwise the red takeover jumps
  // most of its range in a single tick and reads as a flash.
  const visitingCardSpacer = document.querySelector(".visiting-card-spacer");
  const visitingCard = document.querySelector(".visiting-card");
  const strikeLine = document.querySelector(".strike-line");
  const textVengeance = document.querySelector(".text-vengeance");
  const visitingTitle = document.querySelector(".visiting-title");
  const textOriginalWrapper = document.querySelector(".text-original-wrapper");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let visitingTarget = 0;
  let visitingCurrent = -1; // sentinel: first update paints without tweening
  let visitingRaf = null;

  // Map overall progress to a localized segment
  const getActiveProgress = (p, start, end) => {
    if (p < start) return 0;
    if (p > end) return 1;
    return (p - start) / (end - start);
  };

  function applyVisitingPhases(progress) {
    // Contiguous phase windows — no dead zones between beats, and the red
    // takeover gets the widest window so it blends rather than snaps.
    const nameProgress = getActiveProgress(progress, 0.0, 0.12);
    const textOriginalProgress = getActiveProgress(progress, 0.14, 0.28);
    const strikeProgress = getActiveProgress(progress, 0.3, 0.44);
    const redProgress = getActiveProgress(progress, 0.46, 0.72);
    const batProgress = getActiveProgress(progress, 0.74, 0.92);

    // Phase 1: Name fades in
    if (visitingTitle) {
      visitingTitle.style.opacity = nameProgress;
    }

    // Phase 2: Next text fades in
    if (textOriginalWrapper) {
      textOriginalWrapper.style.opacity = textOriginalProgress;
    }

    // Phase 3: Next text gets cancelled
    if (strikeLine) {
      strikeLine.style.width = `${strikeProgress * 100}%`;
    }

    // Phase 4: Red color transition and vengeance text reveal
    visitingCard.style.setProperty("--v-progress", redProgress);
    if (textVengeance) {
      textVengeance.style.opacity = redProgress;
      textVengeance.style.transform = `translateY(${12 - redProgress * 12}px)`;
    }

    // Phase 5: Bat symbol appears
    visitingCard.style.setProperty("--bat-progress", batProgress);
  }

  function smoothVisitingStep() {
    const diff = visitingTarget - visitingCurrent;
    if (Math.abs(diff) < 0.0015) {
      visitingCurrent = visitingTarget;
      applyVisitingPhases(visitingCurrent);
      visitingRaf = null;
      return;
    }
    visitingCurrent += diff * 0.16;
    applyVisitingPhases(visitingCurrent);
    visitingRaf = requestAnimationFrame(smoothVisitingStep);
  }

  function updateTimeline() {
    const windowHeight = window.innerHeight;

    if (visitingCard) {
      let progress = 0;
      if (window.innerWidth > 860 && visitingCardSpacer) {
        const spacerRect = visitingCardSpacer.getBoundingClientRect();
        const cardRect = visitingCard.getBoundingClientRect();
        const stickyOffset = 120; // top offset in CSS
        const startScroll = stickyOffset + cardRect.height;
        const totalScroll = spacerRect.height;
        if (totalScroll > 0) {
          const scrolled = startScroll - spacerRect.top;
          progress = Math.min(1, Math.max(0, scrolled / totalScroll));
        } else {
          progress = 0;
        }
      } else {
        // Mobile fallback: viewport-based progress calculation
        const cardRect = visitingCard.getBoundingClientRect();
        const triggerStart = windowHeight * 0.92;
        const triggerEnd = windowHeight * 0.22;
        const scrollDistance = triggerStart - cardRect.top;
        const totalDistance = triggerStart - triggerEnd;
        progress = Math.min(1, Math.max(0, scrollDistance / totalDistance));
      }

      visitingTarget = progress;
      if (visitingCurrent < 0 || reduceMotion.matches) {
        // First paint (or reduced motion): apply directly, no tween
        visitingCurrent = progress;
        applyVisitingPhases(progress);
      } else if (!visitingRaf) {
        visitingRaf = requestAnimationFrame(smoothVisitingStep);
      }
    }

    // 0b. Card Stacking 3D Depth Animation
    const overviewCard = document.querySelector(".overview-card");
    if (visitingCard && overviewCard && window.innerWidth > 860) {
      const visitingRect = visitingCard.getBoundingClientRect();
      const overviewRect = overviewCard.getBoundingClientRect();
      
      const overlapStart = visitingRect.bottom;
      const overlapEnd = visitingRect.top;
      
      const totalOverlapDistance = overlapStart - overlapEnd;
      const currentOverlap = overlapStart - overviewRect.top;
      
      const overlapProgress = Math.min(1, Math.max(0, currentOverlap / totalOverlapDistance));
      
      const scale = 1 - (overlapProgress * 0.06);
      const translateY = -overlapProgress * 25;
      const opacity = 1 - (overlapProgress * 0.85);
      
      visitingCard.style.transform = `scale(${scale}) translateY(${translateY}px)`;
      visitingCard.style.opacity = opacity;
    } else if (visitingCard) {
      visitingCard.style.transform = "";
      visitingCard.style.opacity = "";
    }

    // 1. Profile connector scale calculation based on scroll
    if (profileSection && connector) {
      const profileBox = profileSection.querySelector(".profile-box");
      if (profileBox) {
        const boxRect = profileBox.getBoundingClientRect();
        const triggerStart = windowHeight * 0.95;
        const triggerEnd = windowHeight * 0.45;
        const scrollDistance = triggerStart - boxRect.bottom;
        const totalDistance = triggerStart - triggerEnd;
        const progress = Math.min(1, Math.max(0, scrollDistance / totalDistance));
        connector.style.transform = `scaleY(${progress})`;
      }
    }

    // 2. Journey wave progress: fills as the flow travels up the viewport
    const flowRect = journey.getBoundingClientRect();
    const startTrigger = windowHeight * 0.85;
    const travel = Math.max(windowHeight * 0.5, flowRect.height * 0.9);
    const jProgress = Math.min(1, Math.max(0, (startTrigger - flowRect.top) / travel));

    if (progressPath.dataset.length) {
      const pathLength = parseFloat(progressPath.dataset.length);
      progressPath.style.strokeDashoffset = pathLength - jProgress * pathLength;
    }

    // 3. Activate nodes as the progress line reaches them
    let activeIndex = -1;
    nodes.forEach((node, i) => {
      if (jProgress > 0.02 && jProgress >= (nodeFractions[i] || 0) - 0.01) {
        node.classList.add("node-active");
        activeIndex = i;
      } else {
        node.classList.remove("node-active");
      }
    });

    if (activeIndex !== lastActiveIndex) {
      lastActiveIndex = activeIndex;
      if (!hoverLock) {
        if (activeIndex >= 0) setDetail(nodes[activeIndex]);
        else clearDetail();
      }
    }
  }

  window.addEventListener("scroll", () => {
    requestAnimationFrame(updateTimeline);
  }, { passive: true });

  window.addEventListener("resize", () => {
    drawTimelinePath();
    updateTimeline();
  });

  // Run initial state calculation
  drawTimelinePath();
  updateTimeline();

  // Re-measure once webfonts settle: label heights decide the crossing bands
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      drawTimelinePath();
      updateTimeline();
    });
  }
}

initScrollTimeline();

// --- Fun section: fade the whole page to black from here downward ---
// One-way threshold: black kicks in once the section top crosses the lower
// third of the viewport and STAYS black for everything below it (contact,
// footer). It only fades back to light when scrolling up past the section.
const funSection = document.querySelector(".fun-section");
if (funSection) {
  const updateFunMode = () => {
    const top = funSection.getBoundingClientRect().top;
    document.body.classList.toggle("fun-mode", top < window.innerHeight * 0.65);
  };
  window.addEventListener("scroll", () => requestAnimationFrame(updateFunMode), { passive: true });
  window.addEventListener("resize", updateFunMode);
  updateFunMode();
}

// --- Fun section tabs (Music / Movies / Games / Sports) ---
const funTabs = document.querySelectorAll(".fun-tab");
const funPanels = document.querySelectorAll(".fun-panel");
const funShell = document.querySelector(".fun-shell");

// Animate the shell's height around a content change so the container
// doesn't jump when panels of different sizes are switched in
const animateShellHeight = (mutate) => {
  if (!funShell) {
    mutate();
    return;
  }
  const startHeight = funShell.getBoundingClientRect().height;
  // Clear any in-flight animation so the new end height measures naturally
  funShell.style.transition = "";
  funShell.style.height = "";
  mutate();
  const endHeight = funShell.getBoundingClientRect().height;
  if (Math.round(startHeight) === Math.round(endHeight)) return;
  funShell.style.boxSizing = "border-box";
  funShell.style.overflow = "hidden";
  funShell.style.height = `${startHeight}px`;
  funShell.getBoundingClientRect(); // force reflow before transitioning
  funShell.style.transition = "height 380ms cubic-bezier(0.4, 0, 0.2, 1)";
  funShell.style.height = `${endHeight}px`;
  funShell.addEventListener("transitionend", function clear(e) {
    if (e.propertyName !== "height") return;
    funShell.style.height = "";
    funShell.style.transition = "";
    funShell.style.overflow = "";
    funShell.style.boxSizing = "";
    funShell.removeEventListener("transitionend", clear);
  });
};

// Helper to align tab indicator
const alignTabIndicator = (tabList, activeTab, indicatorClass) => {
  const indicator = tabList.querySelector(indicatorClass);
  if (!indicator || !activeTab) return;
  const rect = activeTab.getBoundingClientRect();
  const parentRect = tabList.getBoundingClientRect();
  indicator.style.width = `${rect.width}px`;
  indicator.style.left = `${rect.left - parentRect.left}px`;
};

// Initialize all main tabs and visible subtabs indicators
const initAllTabIndicators = () => {
  // Main tabs
  const mainTabList = document.querySelector(".fun-tabs");
  if (mainTabList) {
    const activeTab = mainTabList.querySelector(".fun-tab.active");
    alignTabIndicator(mainTabList, activeTab, ".fun-tab-indicator");
  }

  // Subtabs (only those in currently active panels)
  document.querySelectorAll(".fun-panel.is-active .fun-subtabs").forEach((subtabList) => {
    const activeSubtab = subtabList.querySelector(".fun-subtab.active");
    alignTabIndicator(subtabList, activeSubtab, ".fun-subtab-indicator");
  });
};

// Main tab click handler
funTabs.forEach((tab) => {
  const tabList = tab.closest(".fun-tabs");
  tab.addEventListener("click", () => {
    // Switch active class
    funTabs.forEach((t) => t.classList.toggle("active", t === tab));
    
    // Slide main tab indicator
    alignTabIndicator(tabList, tab, ".fun-tab-indicator");
    
    // Toggle panels, animating the shell height between the two sizes
    animateShellHeight(() => {
      funPanels.forEach((p) => {
        const isActive = p.dataset.panel === tab.dataset.tab;
        p.classList.toggle("is-active", isActive);

        if (isActive) {
          // Trigger subtab indicator calculation since this panel is now visible
          const subtabList = p.querySelector(".fun-subtabs");
          if (subtabList) {
            const activeSubtab = subtabList.querySelector(".fun-subtab.active");
            setTimeout(() => {
              alignTabIndicator(subtabList, activeSubtab, ".fun-subtab-indicator");
            }, 20);
          }
        }
      });
    });
  });
});

// Sub-toggles inside a panel (Directors/Actors, Cricket/Football/F1)
document.querySelectorAll(".fun-subtabs").forEach((group) => {
  const subtabs = group.querySelectorAll(".fun-subtab");
  const panel = group.closest(".fun-panel");
  const subpanels = panel ? panel.querySelectorAll(".fun-subpanel") : [];

  subtabs.forEach((subtab) => {
    subtab.addEventListener("click", () => {
      // Toggle button classes
      subtabs.forEach((t) => t.classList.toggle("active", t === subtab));
      
      // Slide subtab indicator
      alignTabIndicator(group, subtab, ".fun-subtab-indicator");
      
      // Toggle subpanels, animating the shell height between the two sizes
      animateShellHeight(() => {
        subpanels.forEach((sp) => sp.classList.toggle("is-active", sp.dataset.subpanel === subtab.dataset.subtab));
      });
    });
  });
});

// Align indicators on load and resize
window.addEventListener("load", initAllTabIndicators);
window.addEventListener("resize", initAllTabIndicators);
// Fallback triggers to ensure initial positions are calculated correctly
setTimeout(initAllTabIndicators, 100);
setTimeout(initAllTabIndicators, 500);

// --- Fun section Billboard Carousels ---
document.querySelectorAll(".fun-billboard").forEach((billboard) => {
  const slides = billboard.querySelectorAll(".fun-billboard-slide");
  let currentIndex = 0;
  let autoSlideTimer = null;
  const slideInterval = 5000; // slide every 5s

  // Dynamically inject minimalist left/right chevron arrow overlays
  const prevBtn = document.createElement("button");
  prevBtn.className = "fun-billboard-arrow prev";
  prevBtn.setAttribute("aria-label", "Previous slide");
  prevBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  `;

  const nextBtn = document.createElement("button");
  nextBtn.className = "fun-billboard-arrow next";
  nextBtn.setAttribute("aria-label", "Next slide");
  nextBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  `;

  billboard.appendChild(prevBtn);
  billboard.appendChild(nextBtn);

  const showSlide = (index) => {
    currentIndex = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle("active", i === index);
    });
  };

  const nextSlide = () => {
    let nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  };

  const prevSlide = () => {
    let prevIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(prevIndex);
  };

  const startAutoSlide = () => {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(nextSlide, slideInterval);
  };

  const stopAutoSlide = () => {
    if (autoSlideTimer) clearInterval(autoSlideTimer);
  };

  // Arrow button click handlers
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent advancing slide from track click
    prevSlide();
    startAutoSlide();
  });

  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent advancing slide from track click
    nextSlide();
    startAutoSlide();
  });

  // Click anywhere on the image/track to advance slide (minimalist click-to-next)
  const track = billboard.querySelector(".fun-billboard-track");
  if (track) {
    track.style.cursor = "pointer";
    track.addEventListener("click", () => {
      nextSlide();
      startAutoSlide();
    });
  }

  // Pause on hover
  billboard.addEventListener("mouseenter", stopAutoSlide);
  billboard.addEventListener("mouseleave", startAutoSlide);

  // Mobile Touch Swipe Gesture Support
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  billboard.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchMoved = false;
  }, { passive: true });

  billboard.addEventListener("touchmove", (e) => {
    const diffX = Math.abs(e.changedTouches[0].screenX - touchStartX);
    const diffY = Math.abs(e.changedTouches[0].screenY - touchStartY);
    // If movement is mostly horizontal, mark as a swipe gesture
    if (diffX > 10 && diffX > diffY) {
      touchMoved = true;
    }
  }, { passive: true });

  billboard.addEventListener("touchend", (e) => {
    if (!touchMoved) return;
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchEndX - touchStartX;
    const swipeThreshold = 40; // minimum pixels to register swipe
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        prevSlide(); // Swipe Right -> Show Previous
      } else {
        nextSlide(); // Swipe Left -> Show Next
      }
      startAutoSlide();
    }
  }, { passive: true });

  // Initial auto slide start
  startAutoSlide();
});

// --- Project Lovelace showcase video: autoplay only while visible ---
const showcaseVideo = document.querySelector(".showcase-video");
if (showcaseVideo) {
  const videoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          showcaseVideo.play().catch(() => {});
        } else {
          showcaseVideo.pause();
        }
      });
    },
    { threshold: 0.35 }
  );
  videoObserver.observe(showcaseVideo);
}

// --- Technology Swapping Logo Logic ---
const techPool = [
  {
    name: "Python",
    icon: `<svg version="1.1" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://web.resource.org/cc/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="-2 -2 114 114" enable-background="new 0.21 -0.077 110 110" xml:space="preserve"><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="63.8159" y1="56.6829" x2="118.4934" y2="1.8225" gradientTransform="matrix(1 0 0 -1 -53.2974 66.4321)"> <stop offset="0" style="stop-color:#387EB8"/> <stop offset="1" style="stop-color:#366994"/></linearGradient><path fill="url(#SVGID_1_)" d="M55.023-0.077c-25.971,0-26.25,10.081-26.25,12.156c0,3.148,0,12.594,0,12.594h26.75v3.781 c0,0-27.852,0-37.375,0c-7.949,0-17.938,4.833-17.938,26.25c0,19.673,7.792,27.281,15.656,27.281c2.335,0,9.344,0,9.344,0 s0-9.765,0-13.125c0-5.491,2.721-15.656,15.406-15.656c15.91,0,19.971,0,26.531,0c3.902,0,14.906-1.696,14.906-14.406 c0-13.452,0-17.89,0-24.219C82.054,11.426,81.515-0.077,55.023-0.077z M40.273,8.392c2.662,0,4.813,2.15,4.813,4.813 c0,2.661-2.151,4.813-4.813,4.813s-4.813-2.151-4.813-4.813C35.46,10.542,37.611,8.392,40.273,8.392z"/><linearGradient id="SVGID_2_" gradientUnits="userSpaceOnUse" x1="97.0444" y1="21.6321" x2="155.6665" y2="-34.5308" gradientTransform="matrix(1 0 0 -1 -53.2974 66.4321)"> <stop offset="0" style="stop-color:#FFE052"/> <stop offset="1" style="stop-color:#FFC331"/></linearGradient><path fill="url(#SVGID_2_)" d="M55.397,109.923c25.959,0,26.282-10.271,26.282-12.156c0-3.148,0-12.594,0-12.594H54.897v-3.781 c0,0,28.032,0,37.375,0c8.009,0,17.938-4.954,17.938-26.25c0-23.322-10.538-27.281-15.656-27.281c-2.336,0-9.344,0-9.344,0 s0,10.216,0,13.125c0,5.491-2.631,15.656-15.406,15.656c-15.91,0-19.476,0-26.532,0c-3.892,0-14.906,1.896-14.906,14.406 c0,14.475,0,18.265,0,24.219C28.366,100.497,31.562,109.923,55.397,109.923z M70.148,101.454c-2.662,0-4.813-2.151-4.813-4.813 s2.15-4.813,4.813-4.813c2.661,0,4.813,2.151,4.813,4.813S72.809,101.454,70.148,101.454z"/></svg>`
  },
  {
    name: "LangChain",
    icon: `<svg fill="#00A67E" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>LangChain</title><path d="M13.796 0a6.93 6.93 0 0 0-4.91 2.019L5.451 5.455l3.273 3.27 3.432-3.432a2.284 2.284 0 0 1 3.277 0 2.28 2.28 0 0 1 0 3.275L12 12.001l3.273 3.273 3.433-3.435c2.692-2.692 2.692-7.127 0-9.82A6.92 6.92 0 0 0 13.796 0m-5.07 8.728-3.433 3.434c-2.692 2.693-2.692 7.126 0 9.819A6.92 6.92 0 0 0 10.203 24a6.93 6.93 0 0 0 4.911-2.02l3.432-3.432-3.271-3.272-3.433 3.433a2.284 2.284 0 0 1-3.277 0 2.28 2.28 0 0 1 0-3.276L12 12z"/></svg>`
  },
  {
    name: "Ollama",
    icon: `<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Ollama</title><path d="M16.361 10.26a.894.894 0 0 0-.558.47l-.072.148.001.207c0 .193.004.217.059.353.076.193.152.312.291.448.24.238.51.3.872.205a.86.86 0 0 0 .517-.436.752.752 0 0 0 .08-.498c-.064-.453-.33-.782-.724-.897a1.06 1.06 0 0 0-.466 0zm-9.203.005c-.305.096-.533.32-.65.639a1.187 1.187 0 0 0-.06.52c.057.309.31.59.598.667.362.095.632.033.872-.205.14-.136.215-.255.291-.448.055-.136.059-.16.059-.353l.001-.207-.072-.148a.894.894 0 0 0-.565-.472 1.02 1.02 0 0 0-.474.007Zm4.184 2c-.131.071-.223.25-.195.383.031.143.157.288.353.407.105.063.112.072.117.136.004.038-.01.146-.029.243-.02.094-.036.194-.036.222.002.074.07.195.143.253.064.052.076.054.255.059.164.005.198.001.264-.03.169-.082.212-.234.15-.525-.052-.243-.042-.28.087-.355.137-.08.281-.219.324-.314a.365.365 0 0 0-.175-.48.394.394 0 0 0-.181-.033c-.126 0-.207.03-.355.124l-.085.053-.053-.032c-.219-.13-.259-.145-.391-.143a.396.396 0 0 0-.193.032zm.39-2.195c-.373.036-.475.05-.654.086-.291.06-.68.195-.951.328-.94.46-1.589 1.226-1.787 2.114-.04.176-.045.234-.045.53 0 .294.005.357.043.524.264 1.16 1.332 2.017 2.714 2.173.3.033 1.596.033 1.896 0 1.11-.125 2.064-.727 2.493-1.571.114-.226.169-.372.22-.602.039-.167.044-.23.044-.523 0-.297-.005-.355-.045-.531-.288-1.29-1.539-2.304-3.072-2.497a6.873 6.873 0 0 0-.855-.031zm.645.937a3.283 3.283 0 0 1 1.44.514c.223.148.537.458.671.662.166.251.26.508.303.82.02.143.01.251-.043.482-.08.345-.332.705-.672.957a3.115 3.115 0 0 1-.689.348c-.382.122-.632.144-1.525.138-.582-.006-.686-.01-.853-.042-.57-.107-1.022-.334-1.35-.68-.264-.28-.385-.535-.45-.946-.03-.192.025-.509.137-.776.136-.326.488-.73.836-.963.403-.269.934-.46 1.422-.512.187-.02.586-.02.773-.002zm-5.503-11a1.653 1.653 0 0 0-.683.298C5.617.74 5.173 1.666 4.985 2.819c-.07.436-.119 1.04-.119 1.503 0 .544.064 1.24.155 1.721.02.107.031.202.023.208a8.12 8.12 0 0 1-.187.152 5.324 5.324 0 0 0-.949 1.02 5.49 5.49 0 0 0-.94 2.339 6.625 6.625 0 0 0-.023 1.357c.091.78.325 1.438.727 2.04l.13.195-.037.064c-.269.452-.498 1.105-.605 1.732-.084.496-.095.629-.095 1.294 0 .67.009.803.088 1.266.095.555.288 1.143.503 1.534.071.128.243.393.264.407.007.003-.014.067-.046.141a7.405 7.405 0 0 0-.548 1.873c-.062.417-.071.552-.071.991 0 .56.031.832.148 1.279L3.42 24h1.478l-.05-.091c-.297-.552-.325-1.575-.068-2.597.117-.472.25-.819.498-1.296l.148-.29v-.177c0-.165-.003-.184-.057-.293a.915.915 0 0 0-.194-.25 1.74 1.74 0 0 1-.385-.543c-.424-.92-.506-2.286-.208-3.451.124-.486.329-.918.544-1.154a.787.787 0 0 0 .223-.531c0-.195-.07-.355-.224-.522a3.136 3.136 0 0 1-.817-1.729c-.14-.96.114-2.005.69-2.834.563-.814 1.353-1.336 2.237-1.475.199-.033.57-.028.776.01.226.04.367.028.512-.041.179-.085.268-.19.374-.431.093-.215.165-.333.36-.576.234-.29.46-.489.822-.729.413-.27.884-.467 1.352-.561.17-.035.25-.04.569-.04.319 0 .398.005.569.04a4.07 4.07 0 0 1 1.914.997c.117.109.398.457.488.602.034.057.095.177.132.267.105.241.195.346.374.43.14.068.286.082.503.045.343-.058.607-.053.943.016 1.144.23 2.14 1.173 2.581 2.437.385 1.108.276 2.267-.296 3.153-.097.15-.193.27-.333.419-.301.322-.301.722-.001 1.053.493.539.801 1.866.708 3.036-.062.772-.26 1.463-.533 1.854a2.096 2.096 0 0 1-.224.258.916.916 0 0 0-.194.25c-.054.109-.057.128-.057.293v.178l.148.29c.248.476.38.823.498 1.295.253 1.008.231 2.01-.059 2.581a.845.845 0 0 0-.044.098c0 .006.329.009.732.009h.73l.02-.074.036-.134c.019-.076.057-.3.088-.516.029-.217.029-1.016 0-1.258-.11-.875-.295-1.57-.597-2.226-.032-.074-.053-.138-.046-.141.008-.005.057-.074.108-.152.376-.569.607-1.284.724-2.228.031-.26.031-1.378 0-1.628-.083-.645-.182-1.082-.348-1.525a6.083 6.083 0 0 0-.329-.7l-.038-.064.131-.194c.402-.604.636-1.262.727-2.04a6.625 6.625 0 0 0-.024-1.358 5.512 5.512 0 0 0-.939-2.339 5.325 5.325 0 0 0-.95-1.02 8.097 8.097 0 0 1-.186-.152.692.692 0 0 1 .023-.208c.208-1.087.201-2.443-.017-3.503-.19-.924-.535-1.658-.98-2.082-.354-.338-.716-.482-1.15-.455-.996.059-1.8 1.205-2.116 3.01a6.805 6.805 0 0 0-.097.726c0 .036-.007.066-.015.066a.96.96 0 0 1-.149-.078A4.857 4.857 0 0 0 12 3.03c-.832 0-1.687.243-2.456.698a.958.958 0 0 1-.148.078c-.008 0-.015-.03-.015-.066a6.71 6.71 0 0 0-.097-.725C8.997 1.392 8.337.319 7.46.048a2.096 2.096 0 0 0-.585-.041Zm.293 1.402c.248.197.523.759.682 1.388.03.113.06.244.069.292.007.047.026.152.041.233.067.365.098.76.102 1.24l.002.475-.12.175-.118.178h-.278c-.324 0-.646.041-.954.124l-.238.06c-.033.007-.038-.003-.057-.144a8.438 8.438 0 0 1 .016-2.323c.124-.788.413-1.501.696-1.711.067-.05.079-.049.157.013zm9.825-.012c.17.126.358.46.498.888.28.854.36 2.028.212 3.145-.019.14-.024.151-.057.144l-.238-.06a3.693 3.693 0 0 0-.954-.124h-.278l-.119-.178-.119-.175.002-.474c.004-.669.066-1.19.214-1.772.157-.623.434-1.185.68-1.382.078-.062.09-.063.159-.012z"/></svg>`
  },
  {
    name: "vLLM",
    icon: `<svg fill="#FD5E53" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>vLLM</title><path d="m23.6 0-8.721 4.59L9.829 24h7.41zM9.83 24V5.142H.4Z"/></svg>`
  },
  {
    name: "OpenRouter",
    icon: `<svg fill="currentColor" role="img" viewBox="-1 -1 26 26" xmlns="http://www.w3.org/2000/svg"><title>OpenRouter</title><path d="M16.778 1.844v1.919q-.569-.026-1.138-.032-.708-.008-1.415.037c-1.93.126-4.023.728-6.149 2.237-2.911 2.066-2.731 1.95-4.14 2.75-.396.223-1.342.574-2.185.798-.841.225-1.753.333-1.751.333v4.229s.768.108 1.61.333c.842.224 1.789.575 2.185.799 1.41.798 1.228.683 4.14 2.75 2.126 1.509 4.22 2.11 6.148 2.236.88.058 1.716.041 2.555.005v1.918l7.222-4.168-7.222-4.17v2.176c-.86.038-1.611.065-2.278.021-1.364-.09-2.417-.357-3.979-1.465-2.244-1.593-2.866-2.027-3.68-2.508.889-.518 1.449-.906 3.822-2.59 1.56-1.109 2.614-1.377 3.978-1.466.667-.044 1.418-.017 2.278.02v2.176L24 6.014Z"/></svg>`
  },
  {
    name: "Google Cloud",
    icon: `<svg viewBox="0 0 36 28" xmlns="http://www.w3.org/2000/svg"><path fill="#ea4335" d="M21.85,7.41l1,0,2.85-2.85.14-1.21A12.81,12.81,0,0,0,5,9.6a1.55,1.55,0,0,1,1-.06l5.7-.94s.29-.48.44-.45a7.11,7.11,0,0,1,9.73-.74Z"/><path fill="#4285f4" d="M29.76,9.6a12.84,12.84,0,0,0-3.87-6.24l-4,4A7.11,7.11,0,0,1,24.5,13v.71a3.56,3.56,0,1,1,0,7.12H17.38l-.71.72v4.27l.71.71H24.5A9.26,9.26,0,0,0,29.76,9.6Z"/><path fill="#34a853" d="M10.25,26.49h7.12v-5.7H10.25a3.54,3.54,0,0,1-1.47-.32l-1,.31L4.91,23.63l-.25,1A9.21,9.21,0,0,0,10.25,26.49Z"/><path fill="#fbbc05" d="M10.25,8A9.26,9.26,0,0,0,4.66,24.6l4.13-4.13a3.56,3.56,0,1,1,4.71-4.71l4.13-4.13A9.25,9.25,0,0,0,10.25,8Z"/></svg>`
  },
  {
    name: "ChatGPT",
    icon: `<svg fill="#10A37F" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.949 6.547a3.94 3.94 0 0 0-.348-3.273 4.11 4.11 0 0 0-4.4-1.934A4.1 4.1 0 0 0 8.423.2 4.15 4.15 0 0 0 6.305.086a4.1 4.1 0 0 0-1.891.948 4.04 4.04 0 0 0-1.158 1.753 4.1 4.1 0 0 0-1.563.679A4 4 0 0 0 .554 4.72a3.99 3.99 0 0 0 .502 4.731 3.94 3.94 0 0 0 .346 3.274 4.11 4.11 0 0 0 4.402 1.933c.382.425.852.764 1.377.995.526.231 1.095.35 1.67.346 1.78.002 3.358-1.132 3.901-2.804a4.1 4.1 0 0 0 1.563-.68 4 4 0 0 0 1.14-1.253 3.99 3.99 0 0 0-.506-4.716m-6.097 8.406a3.05 3.05 0 0 1-1.945-.694l.096-.054 3.23-1.838a.53.53 0 0 0 .265-.455v-4.49l1.366.778q.02.011.025.035v3.722c-.003 1.653-1.361 2.992-3.037 2.996m-6.53-2.75a2.95 2.95 0 0 1-.36-2.01l.095.057L5.29 12.09a.53.53 0 0 0 .527 0l3.949-2.246v1.555a.05.05 0 0 1-.022.041L6.473 13.3c-1.454.826-3.311.335-4.15-1.098m-.85-6.94A3.02 3.02 0 0 1 3.07 3.949v3.785a.51.51 0 0 0 .262.451l3.93 2.237-1.366.779a.05.05 0 0 1-.048 0L2.585 9.342a2.98 2.98 0 0 1-1.113-4.094zm11.216 2.571L8.747 5.576l1.362-.776a.05.05 0 0 1 .048 0l3.265 1.86a3 3 0 0 1 1.173 1.207 2.96 2.96 0 0 1-.27 3.2 3.05 3.05 0 0 1-1.36.997V8.279a.52.52 0 0 0-.276-.445m1.36-2.015-.097-.057-3.226-1.855a.53.53 0 0 0-.53 0L6.249 6.153V4.598a.04.04 0 0 1 .019-.04L9.533 2.7a3.07 3.07 0 0 1 3.257.139c.474.325.843.778 1.066 1.303.223.526.289 1.103.191 1.664zM5.503 8.575 4.139 7.8a.05.05 0 0 1-.026-.037V4.049c0-.57.166-1.127.476-1.607s.752-.864 1.275-1.105a3.08 3.08 0 0 1 .139-.239z"/></svg>`
  },
  {
    name: "Gemini",
    icon: `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 69 69"><mask id="maskme" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" ><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="#000"/><path d="M32.447 0c.68 0 1.273.465 1.439 1.125a38.904 38.904 0 001.999 5.905c2.152 5 5.105 9.376 8.854 13.125 3.751 3.75 8.126 6.703 13.125 8.855a38.98 38.98 0 005.906 1.999c.66.166 1.124.758 1.124 1.438 0 .68-.464 1.273-1.125 1.439a38.902 38.902 0 00-5.905 1.999c-5 2.152-9.375 5.105-13.125 8.854-3.749 3.751-6.702 8.126-8.854 13.125a38.973 38.973 0 00-2 5.906 1.485 1.485 0 01-1.438 1.124c-.68 0-1.272-.464-1.438-1.125a38.913 38.913 0 00-2-5.905c-2.151-5-5.103-9.375-8.854-13.125-3.75-3.749-8.125-6.702-13.125-8.854a38.973 38.973 0 00-5.905-2A1.485 1.485 0 010 32.448c0-.68.465-1.272 1.125-1.438a38.903 38.903 0 005.905-2c5-2.151 9.376-5.104 13.125-8.854 3.75-3.749 6.703-8.125 8.855-13.125a38.972 38.972 0 001.999-5.905A1.485 1.485 0 0132.447 0z" fill="url(#prefix__paint0_linear_2001_67)"/></mask><g mask="url(#maskme)"><g filter="url(#prefix__filter0_f_2001_67)"><path d="M-5.859 50.734c7.498 2.663 16.116-2.33 19.249-11.152 3.133-8.821-.406-18.131-7.904-20.794-7.498-2.663-16.116 2.33-19.25 11.151-3.132 8.822.407 18.132 7.905 20.795z" fill="#FFE432"/></g><g filter="url(#prefix__filter1_f_2001_67)"><path d="M27.433 21.649c10.3 0 18.651-8.535 18.651-19.062 0-10.528-8.35-19.062-18.651-19.062S8.78-7.94 8.78 2.587c0 10.527 8.35 19.062 18.652 19.062z" fill="#FC413D"/></g><g filter="url(#prefix__filter2_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#prefix__filter3_f_2001_67)"><path d="M20.184 82.608c10.753-.525 18.918-12.244 18.237-26.174-.68-13.93-9.95-24.797-20.703-24.271C6.965 32.689-1.2 44.407-.519 58.337c.681 13.93 9.95 24.797 20.703 24.271z" fill="#00B95C"/></g><g filter="url(#prefix__filter4_f_2001_67)"><path d="M30.954 74.181c9.014-5.485 11.427-17.976 5.389-27.9-6.038-9.925-18.241-13.524-27.256-8.04-9.015 5.486-11.428 17.977-5.39 27.902 6.04 9.924 18.242 13.523 27.257 8.038z" fill="#00B95C"/></g><g filter="url(#prefix__filter5_f_2001_67)"><path d="M67.391 42.993c10.132 0 18.346-7.91 18.346-17.666 0-9.757-8.214-17.667-18.346-17.667s-18.346 7.91-18.346 17.667c0 9.757 8.214 17.666 18.346 17.666z" fill="#3186FF"/></g><g filter="url(#prefix__filter6_f_2001_67)"><path d="M-13.065 40.944c9.33 7.094 22.959 4.869 30.442-4.972 7.483-9.84 5.987-23.569-3.343-30.663C4.704-1.786-8.924.439-16.408 10.28c-7.483 9.84-5.986 23.57 3.343 30.664z" fill="#FBBC04"/></g><g filter="url(#prefix__filter7_f_2001_67)"><path d="M34.74 51.43c11.135 7.656 25.896 5.524 32.968-4.764 7.073-10.287 3.779-24.832-7.357-32.488C49.215 6.52 34.455 8.654 27.382 18.94c-7.072 10.288-3.779 24.833 7.357 32.49z" fill="#3186FF"/></g><g filter="url(#prefix__filter8_f_2001_67)"><path d="M54.984-2.336c2.833 3.852-.808 11.34-8.131 16.727-7.324 5.387-15.557 6.631-18.39 2.78-2.833-3.853.807-11.342 8.13-16.728 7.324-5.387 15.558-6.631 18.39-2.78z" fill="#749BFF"/></g><g filter="url(#prefix__filter9_f_2001_67)"><path d="M31.727 16.104C43.053 5.598 46.94-8.626 40.41-15.666c-6.53-7.04-21.006-4.232-32.332 6.274s-15.214 24.73-8.683 31.77c6.53 7.04 21.006 4.232 32.332-6.274z" fill="#FC413D"/></g><g filter="url(#prefix__filter10_f_2001_67)"><path d="M8.51 53.838c6.732 4.818 14.46 5.55 17.262 1.636 2.802-3.915-.384-10.994-7.116-15.812-6.731-4.818-14.46-5.55-17.261-1.636-2.802 3.915.383 10.994 7.115 15.812z" fill="#FFEE48"/></g></g><defs><filter id="prefix__filter0_f_2001_67" x="-19.824" y="13.152" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="2.46" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter1_f_2001_67" x="-15.001" y="-40.257" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="11.891" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter2_f_2001_67" x="-20.776" y="11.927" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter3_f_2001_67" x="-20.776" y="11.927" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter4_f_2001_67" x="-19.845" y="15.459" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="10.109" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter5_f_2001_67" x="29.832" y="-11.552" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="9.606" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter6_f_2001_67" x="-38.583" y="-16.253" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="8.706" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter7_f_2001_67" x="8.107" y="-5.966" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.775" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter8_f_2001_67" x="13.587" y="-18.488" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="6.957" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter9_f_2001_67" x="-15.526" y="-31.297" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="5.876" result="effect1_foregroundBlur_2001_67"/></filter><filter id="prefix__filter10_f_2001_67" x="-14.168" y="20.964" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feGaussianBlur stdDeviation="7.273" result="effect1_foregroundBlur_2001_67"/></filter><linearGradient id="prefix__paint0_linear_2001_67" x1="18.447" y1="43.42" x2="52.153" y2="15.004" gradientUnits="userSpaceOnUse"><stop stop-color="#4893FC"/><stop offset=".27" stop-color="#4893FC"/><stop offset=".777" stop-color="#969DFF"/><stop offset="1" stop-color="#BD99FE"/></linearGradient></defs></svg>`
  },
  {
    name: "Claude Code",
    icon: `<svg fill="#CC5A37" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Claude</title><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>`
  },
  {
    name: "Mistral",
    icon: `<svg fill="#FD5E53" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Mistral AI</title><path d="M17.143 3.429v3.428h-3.429v3.429h-3.428V6.857H6.857V3.43H3.43v13.714H0v3.428h10.286v-3.428H6.857v-3.429h3.429v3.429h3.429v-3.429h3.428v3.429h-3.428v3.428H24v-3.428h-3.43V3.429z"/></svg>`
  },
  {
    name: "Qwen",
    icon: `<svg fill="#2563EB" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>QWen</title><path d="M23.919 14.545 20.817 9.17l1.47-2.544a.56.56 0 0 0 0-.566l-1.633-2.83a.57.57 0 0 0-.49-.283h-6.207L12.487.402a.57.57 0 0 0-.49-.284H8.732a.56.56 0 0 0-.49.284L5.139 5.775h-2.94a.56.56 0 0 0-.49.284L.077 8.887a.56.56 0 0 0 0 .567L3.18 14.83l-1.47 2.545a.56.56 0 0 0 0 .566l1.634 2.83a.57.57 0 0 0 .49.283h6.205l1.47 2.545a.57.57 0 0 0 .49.284h3.266a.57.57 0 0 0 .49-.284l3.104-5.375h2.94a.57.57 0 0 0 .49-.283l1.634-2.828a.55.55 0 0 0-.004-.568M8.733.686l1.634 2.828-1.634 2.828H21.8L20.164 9.17H7.425L5.63 6.06Zm1.306 19.801-6.205-.002 1.634-2.83h3.265L2.201 6.344h3.267q3.182 5.517 6.367 11.032zm10.124-5.66L18.53 12l-6.532 11.315-1.634-2.83c2.129-3.673 4.25-7.351 6.373-11.028h3.592l3.102 5.374z"/></svg>`
  },
  {
    name: "DeepSeek",
    icon: `<svg fill="#0052D9" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>DeepSeek</title><path d="M23.748 4.651c-.254-.124-.364.113-.512.233-.051.04-.094.09-.137.137-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.155-.708-.311-.955-.65-.172-.24-.219-.509-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.094.172.187.129.323-.082.28-.18.553-.266.833-.055.179-.137.218-.328.14a5.5 5.5 0 0 1-1.737-1.179c-.857-.828-1.631-1.743-2.597-2.46a12 12 0 0 0-.689-.47c-.985-.957.13-1.743.387-1.836.27-.098.094-.433-.778-.428-.872.003-1.67.295-2.687.685a3 3 0 0 1-.465.136 9.6 9.6 0 0 0-2.883-.101c-1.885.21-3.39 1.1-4.497 2.622C.082 8.776-.231 10.854.152 13.02c.403 2.284 1.568 4.175 3.36 5.653 1.857 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.132-.284 4.994-1.86.47.234.962.328 1.78.398.629.058 1.235-.031 1.705-.129.735-.155.684-.836.418-.961-2.155-1.004-1.682-.595-2.112-.926 1.095-1.295 2.768-3.598 3.284-6.733.05-.346.115-.834.108-1.114-.004-.171.035-.238.23-.257a4.2 4.2 0 0 0 1.545-.475c1.397-.763 1.96-2.016 2.093-3.517.02-.23-.004-.467-.247-.588M11.58 18.168c-2.088-1.642-3.101-2.183-3.52-2.16-.39.024-.32.472-.234.763.09.288.207.487.371.74.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.168-1.361-.801-2.5-1.86-3.301-3.306-.775-1.393-1.225-2.888-1.299-4.482-.02-.385.094-.522.477-.592a4.7 4.7 0 0 1 1.53-.038c2.131.311 3.946 1.264 5.467 2.774.868.86 1.525 1.887 2.202 2.89.72 1.066 1.494 2.082 2.48 2.915.348.291.626.513.892.677-.802.09-2.14.109-3.055-.615zm1.001-6.44a.306.306 0 0 1 .415-.287.3.3 0 0 1 .113.074.3.3 0 0 1 .086.214c0 .17-.136.307-.308.307a.303.303 0 0 1-.306-.307m3.11 1.596c-.2.081-.4.151-.591.16a1.25 1.25 0 0 1-.798-.254c-.274-.23-.47-.358-.551-.758a1.7 1.7 0 0 1 .015-.588c.07-.327-.007-.537-.238-.727-.188-.156-.426-.199-.689-.199a.6.6 0 0 1-.254-.078.253.253 0 0 1-.114-.358 1 1 0 0 1 .192-.21c.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.392.451.462.576.685.915.176.264.336.536.446.848.066.194-.02.353-.25.45"/></svg>`
  },
  {
    name: "Percy",
    icon: `<svg fill="#9333EA" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Percy</title><path d="M13.235 2.4s.569 1.169.616 1.547c0 0-1.856-.646-4.458-.891 0 0 1.25.872 1.734 1.538 0 0-1.84-.093-4.586 0 0 0 1.561.634 2.252 1.215 0 0-3.26.331-5.103.862 0 0 2.076.73 2.652 1.276 0 0-2.648.754-5.316 2.294 0 0 1.482.26 2.642.766 0 0-1.478 1.033-3.668 3.852 0 0 1.62-.309 2.73-.222 0 0-1.407 1.644-2.141 4.158 0 0 .813-.518 1.602-.706 0 0 .084 2.998 1.724 3.478v-.002a.774.774 0 0 0 .225.034c.08 0 .163-.012.248-.036.52-.15.915-.663 1.37-1.256.15-.195.303-.395.466-.59.2-.284.438-.54.706-.762.58-.478 1.38-.84 2.358-.695 1.1.093 1.78 1.189 2.327 2.07.283.458.659 1.27 1.289 1.27.696 0 .94-.834 1.25-1.862.292-.97.726-1.891 1.29-2.732 1.085-1.617 2.474-2.495 4.14-3.36 1.595-.83 3.102-1.614 3.858-2.803.379-.594.567-1.325.558-2.169a6.966 6.966 0 0 0-.31-1.909c-.139-.455-.505-.902-.939-.72a3.417 3.417 0 0 1-1.151.256c-.858-.805-3.379-2.4-5.038-3.303 0 0 .202.592.482 1.699 0 0-1.787-1.396-3.81-2.296zm0 2.7 3.81.945-1.233.255zM9.957 6.67l4.571.354-1.388.46Zm6.955 1.082-.678.514-2.383.134zm-5.784.514-1.088.73-3.018-.287Zm4.505 1.206-1.105.617-3.002-.176zm-8.282.77-.679 1.312-2.982 1.313zm4.135.533-.77 1.265-3.853.942zm-5.845 2.354-.118 1.313L3.6 16.2zm11.31 3.151c-1.093 1.127-2.002 2.806-2.232 4.121.39.58.746.867 1.08.873h.012c.346 0 .575-.233.68-.693.077-.343.094-.813.114-1.36.029-.844.067-1.894.346-2.94zm-7.904 2.512c-1.018.011-2.008.83-2.506 1.532v.001c.283.64.587.953.925.953a.53.53 0 0 0 .082-.007c.46-.072.886-.963 1.242-1.825a19.8 19.8 0 0 0 .257-.654z"/></svg>`
  },
  {
    name: "Cypress",
    icon: `<svg fill="#04C38E" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Cypress</title><path d="M11.998.0195c-.8642 0-1.6816.1101-2.1445.1934v.002C4.1731 1.2283 0 6.1368 0 12.0018c0 1.1265.1573 2.2328.4648 3.3028.0387.1453.0915.2993.1368.4473 1.607 4.865 6.2245 8.226 11.3925 8.2285.0651 0 .2518-.0003.502-.0118.8564-.0353 1.6228-.5734 1.9512-1.369l.4736-1.1544L20.4258 8.043H18.621l-2.3164 5.871-2.334-5.871h-1.9082l3.2734 8.0117c-.8115 1.9702-1.6252 3.9395-2.4355 5.9101-.0808.1945-.2655.3284-.4727.336-.144.005-.285.0098-.4316.0098-4.5848 0-8.6672-3.0695-9.9277-7.4649a10.3058 10.3058 0 0 1-.3985-2.8437c0-5.0887 3.6521-9.3404 8.6035-10.164.2214-.037.8885-.1446 1.7246-.1446 4.4166 0 8.269 2.732 9.7305 6.8476.0558.144.0977.293.1465.4395.299.9746.4531 1.9887.4531 3.0215 0 4.5696-2.9413 8.5326-7.3164 9.8613l.4863 1.5996c5.085-1.546 8.4995-6.1518 8.502-11.459 0-1.5491-.2983-2.8706-.6504-3.8926-.0432-.1212-.0873-.2422-.1309-.3633h-.002C21.4577 3.0954 17.0444.0195 11.998.0195ZM8.4336 7.8906c-1.1999 0-2.1747.3852-2.9805 1.1758-.8007.7856-1.205 1.7736-1.205 2.9356 0 1.1544.4068 2.1368 1.205 2.9199.8058.7906 1.7806 1.1738 2.9805 1.1738 1.705 0 3.1556-.955 3.7871-2.4883l.0332-.082-1.6289-.5547c-.168.4563-.7552 1.4883-2.1914 1.4883-.6745 0-1.2437-.2344-1.6934-.6992-.4572-.4699-.6875-1.0632-.6875-1.7578 0-.6998.2253-1.2809.6875-1.7735.4522-.4648 1.019-.7012 1.6934-.7012 1.438 0 2.0238 1.0815 2.1934 1.4883l1.627-.5527-.0333-.084c-.629-1.5358-2.082-2.4883-3.7871-2.4883Z"/></svg>`
  },
  {
    name: "PyTorch",
    icon: `<svg fill="#EE4C2C" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>PyTorch</title><path d="M12.005 0L4.952 7.053a9.865 9.865 0 000 14.022 9.866 9.866 0 0014.022 0c3.984-3.9 3.986-10.205.085-14.023l-1.744 1.743c2.904 2.905 2.904 7.634 0 10.538s-7.634 2.904-10.538 0-2.904-7.634 0-10.538l4.647-4.646.582-.665zm3.568 3.899a1.327 1.327 0 00-1.327 1.327 1.327 1.327 0 001.327 1.328A1.327 1.327 0 0016.9 5.226 1.327 1.327 0 0015.573 3.9z"/></svg>`
  },
  {
    name: "FastAPI",
    icon: `<svg fill="#009688" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>FastAPI</title><path d="M12 .0387C5.3729.0384.0003 5.3931 0 11.9988c-.001 6.6066 5.372 11.9628 12 11.9625 6.628.0003 12.001-5.3559 12-11.9625-.0003-6.6057-5.3729-11.9604-12-11.96m-.829 5.4153h7.55l-7.5805 5.3284h5.1828L5.279 18.5436q2.9466-6.5444 5.892-13.0896"/></svg>`
  },
  {
    name: "Hugging Face",
    icon: `<svg fill="#FFD21E" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Hugging Face</title><path d="M12.025 1.13c-5.77 0-10.449 4.647-10.449 10.378 0 1.112.178 2.181.503 3.185.064-.222.203-.444.416-.577a.96.96 0 0 1 .524-.15c.293 0 .584.124.84.284.278.173.48.408.71.694.226.282.458.611.684.951v-.014c.017-.324.106-.622.264-.874s.403-.487.762-.543c.3-.047.596.06.787.203s.31.313.4.467c.15.257.212.468.233.542.01.026.653 1.552 1.657 2.54.616.605 1.01 1.223 1.082 1.912.055.537-.096 1.059-.38 1.572.637.121 1.294.187 1.967.187.657 0 1.298-.063 1.921-.178-.287-.517-.44-1.041-.384-1.581.07-.69.465-1.307 1.081-1.913 1.004-.987 1.647-2.513 1.657-2.539.021-.074.083-.285.233-.542.09-.154.208-.323.4-.467a1.08 1.08 0 0 1 .787-.203c.359.056.604.29.762.543s.247.55.265.874v.015c.225-.34.457-.67.683-.952.23-.286.432-.52.71-.694.257-.16.547-.284.84-.285a.97.97 0 0 1 .524.151c.228.143.373.388.43.625l.006.04a10.3 10.3 0 0 0 .534-3.273c0-5.731-4.678-10.378-10.449-10.378M8.327 6.583a1.5 1.5 0 0 1 .713.174 1.487 1.487 0 0 1 .617 2.013c-.183.343-.762-.214-1.102-.094-.38.134-.532.914-.917.71a1.487 1.487 0 0 1 .69-2.803m7.486 0a1.487 1.487 0 0 1 .689 2.803c-.385.204-.536-.576-.916-.71-.34-.12-.92.437-1.103.094a1.487 1.487 0 0 1 .617-2.013 1.5 1.5 0 0 1 .713-.174m-10.68 1.55a.96.96 0 1 1 0 1.921.96.96 0 0 1 0-1.92m13.838 0a.96.96 0 1 1 0 1.92.96.96 0 0 1 0-1.92M8.489 11.458c.588.01 1.965 1.157 3.572 1.164 1.607-.007 2.984-1.155 3.572-1.164.196-.003.305.12.305.454 0 .886-.424 2.328-1.563 3.202-.22-.756-1.396-1.366-1.63-1.32q-.011.001-.02.006l-.044.026-.01.008-.03.024q-.018.017-.035.036l-.032.04a1 1 0 0 0-.058.09l-.014.025q-.049.088-.11.19a1 1 0 0 1-.083.116 1.2 1.2 0 0 1-.173.18q-.035.029-.075.058a1.3 1.3 0 0 1-.251-.243 1 1 0 0 1-.076-.107c-.124-.193-.177-.363-.337-.444-.034-.016-.104-.008-.2.022q-.094.03-.216.087-.06.028-.125.063l-.13.074q-.067.04-.136.086a3 3 0 0 0-.135.096 3 3 0 0 0-.26.219 2 2 0 0 0-.12.121 2 2 0 0 0-.106.128l-.002.002a2 2 0 0 0-.09.132l-.001.001a1.2 1.2 0 0 0-.105.212q-.013.036-.024.073c-1.139-.875-1.563-2.317-1.563-3.203 0-.334.109-.457.305-.454m.836 10.354c.824-1.19.766-2.082-.365-3.194-1.13-1.112-1.789-2.738-1.789-2.738s-.246-.945-.806-.858-.97 1.499.202 2.362c1.173.864-.233 1.45-.685.64-.45-.812-1.683-2.896-2.322-3.295s-1.089-.175-.938.647 2.822 2.813 2.562 3.244-1.176-.506-1.176-.506-2.866-2.567-3.49-1.898.473 1.23 2.037 2.16c1.564.932 1.686 1.178 1.464 1.53s-3.675-2.511-4-1.297c-.323 1.214 3.524 1.567 3.287 2.405-.238.839-2.71-1.587-3.216-.642-.506.946 3.49 2.056 3.522 2.064 1.29.33 4.568 1.028 5.713-.624m5.349 0c-.824-1.19-.766-2.082.365-3.194 1.13-1.112 1.789-2.738 1.789-2.738s.246-.945.806-.858.97 1.499-.202 2.362c-1.173.864.233 1.45.685.64.451-.812 1.683-2.896 2.322-3.295s1.089-.175.938.647-2.822 2.813-2.562 3.244 1.176-.506 1.176-.506 2.866-2.567 3.49-1.898-.473 1.23-2.037 2.16c-1.564.932-1.686 1.178-1.464 1.53s3.675-2.511 4-1.297c.323 1.214-3.524 1.567-3.287 2.405.238.839 2.71-1.587 3.216-.642.506.946-3.49 2.056-3.522 2.064-1.29.33-4.568 1.028-5.713-.624"/></svg>`
  },
  {
    name: "Docker",
    icon: `<svg fill="#2496ED" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Docker</title><path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"/></svg>`
  },
  {
    name: "MLflow",
    icon: `<svg fill="#007D9C" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>MLflow</title><path d="M11.883.002a12.044 12.044 0 0 0-9.326 19.463l3.668-2.694A7.573 7.573 0 0 1 12.043 4.45v2.867l6.908-5.14A12.012 12.012 0 0 0 11.883.002zm9.562 4.533L17.777 7.23a7.573 7.573 0 0 1-5.818 12.322v-2.867l-6.908 5.14a12.046 12.046 0 0 0 16.394-17.29z"/></svg>`
  },
  {
    name: "LangGraph",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#00A67E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="2.5" fill="#00A67E"/><circle cx="5" cy="18" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M12 7.5L5.5 15.5"/><path d="M12 7.5l6.5 8"/><path d="M7.5 18h9"/></svg>`
  },
  {
    name: "Pinecone",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L3 9h18L12 2z"/><path d="M12 7l-7 6h14l-7-6z"/><path d="M12 12l-7 6h14l-7-6z"/><path d="M12 18v4"/></svg>`
  },
  {
    name: "Qdrant",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#FD5E53" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7" fill="#FD5E53"/></svg>`
  },
  {
    name: "n8n",
    icon: `<svg fill="#FF6C37" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>n8n</title><path d="M21.4737 5.6842c-1.1772 0-2.1663.8051-2.4468 1.8947h-2.8955c-1.235 0-2.289.893-2.492 2.111l-.1038.623a1.263 1.263 0 0 1-1.246 1.0555H11.289c-.2805-1.0896-1.2696-1.8947-2.4468-1.8947s-2.1663.8051-2.4467 1.8947H4.973c-.2805-1.0896-1.2696-1.8947-2.4468-1.8947C1.1311 9.4737 0 10.6047 0 12s1.131 2.5263 2.5263 2.5263c1.1772 0 2.1663-.8051 2.4468-1.8947h1.4223c.2804 1.0896 1.2696 1.8947 2.4467 1.8947 1.1772 0 2.1663-.8051 2.4468-1.8947h1.0008a1.263 1.263 0 0 1 1.2459 1.0555l.1038.623c.203 1.218 1.257 2.111 2.492 2.111h.3692c.2804 1.0895 1.2696 1.8947 2.4468 1.8947 1.3952 0 2.5263-1.131 2.5263-2.5263s-1.131-2.5263-2.5263-2.5263c-1.1772 0-2.1664.805-2.4468 1.8947h-.3692a1.263 1.263 0 0 1-1.246-1.0555l-.1037-.623A2.52 2.52 0 0 0 13.9607 12a2.52 2.52 0 0 0 .821-1.4794l.1038-.623a1.263 1.263 0 0 1 1.2459-1.0555h2.8955c.2805 1.0896 1.2696 1.8947 2.4468 1.8947 1.3952 0 2.5263-1.131 2.5263-2.5263s-1.131-2.5263-2.5263-2.5263m0 1.2632a1.263 1.263 0 0 1 1.2631 1.2631 1.263 1.263 0 0 1-1.2631 1.2632 1.263 1.263 0 0 1-1.2632-1.2632 1.263 1.263 0 0 1 1.2632-1.2631M2.5263 10.7368A1.263 1.263 0 0 1 3.7895 12a1.263 1.263 0 0 1-1.2632 1.2632A1.263 1.263 0 0 1 1.2632 12a1.263 1.263 0 0 1 1.2631-1.2632m6.3158 0A1.263 1.263 0 0 1 10.1053 12a1.263 1.263 0 0 1-1.2632 1.2632A1.263 1.263 0 0 1 7.579 12a1.263 1.263 0 0 1 1.2632-1.2632m10.1053 3.7895a1.263 1.263 0 0 1 1.2631 1.2632 1.263 1.263 0 0 1-1.2631 1.2631 1.263 1.263 0 0 1-1.2632-1.2631 1.263 1.263 0 0 1 1.2632-1.2632"/></svg>`
  },
  {
    name: "GitHub",
    icon: `<svg fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>GitHub</title><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`
  },
  {
    name: "TensorFlow",
    icon: `<svg fill="#FF6F00" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>TensorFlow</title><path d="M19.6 12l.1 4.7-3.1-1.8v6.7L12.5 24V0l10.2 5.9v5.3l-6.1-3.6v2.7zM1.3 5.9L11.5 0v24l-4.1-2.4v-14l-6.1 3.6z"/></svg>`
  },
];

let visibleIndices = [0, 1, 2, 3, 4, 5];
let unusedPool = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];

let svgIdCounter = 0;
function getTechHTML(tech, slotIndex) {
  let svg = tech.icon;
  svgIdCounter++;
  const uniq = `${slotIndex}_${svgIdCounter}`;
  if (tech.name === "Gemini") {
    svg = svg.replace(/maskme/g, `mask_${uniq}`)
             .replace(/prefix__/g, `pref_${uniq}_`);
  } else if (tech.name === "Python") {
    svg = svg.replace(/SVGID_1_/g, `SVGID_1_${uniq}`)
             .replace(/SVGID_2_/g, `SVGID_2_${uniq}`);
  }
  return `<div class="tech-icon">${svg}</div><div class="tech-label">${tech.name}</div>`;
}

function swapSingleTech() {
  const slotIndex = Math.floor(Math.random() * 6);
  const card = document.querySelector(`#tech-slot-${slotIndex} .tech-card`);
  if (!card) return;

  const poolIndex = Math.floor(Math.random() * unusedPool.length);
  const newTechIndex = unusedPool[poolIndex];
  const oldTechIndex = visibleIndices[slotIndex];

  // Update indices
  visibleIndices[slotIndex] = newTechIndex;
  unusedPool[poolIndex] = oldTechIndex;

  const newTech = techPool[newTechIndex];
  const isFlipped = card.classList.contains("flipped");

  if (!isFlipped) {
    const back = card.querySelector(".tech-card-back");
    back.innerHTML = getTechHTML(newTech, slotIndex);
    card.classList.add("flipped");
  } else {
    const front = card.querySelector(".tech-card-front");
    front.innerHTML = getTechHTML(newTech, slotIndex);
    card.classList.remove("flipped");
  }
}

function initTechSwap() {
  const slots = [0, 1, 2, 3, 4, 5];
  slots.forEach((i) => {
    const slot = document.getElementById(`tech-slot-${i}`);
    if (!slot) return;
    const front = slot.querySelector(".tech-card-front");
    const tech = techPool[i];
    front.innerHTML = getTechHTML(tech, i);
  });

  // Start the 2s loop (only swapping one logo at a time)
  setInterval(swapSingleTech, 2000);
}

// Initialize the technology swap widget
initTechSwap();

// Mobile navigation toggle
const siteNav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");

if (siteNav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the menu after choosing a destination
  siteNav.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Close when clicking anywhere outside the menu
  document.addEventListener("click", (event) => {
    if (siteNav.classList.contains("open") && !siteNav.contains(event.target)) {
      siteNav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

// --- Main Navbar Sliding Indicator & Scroll Spy ---
const initNavbarIndicator = () => {
  const navLinksList = document.querySelector(".nav-links");
  if (!navLinksList) return;

  const indicator = navLinksList.querySelector(".nav-indicator");
  const links = navLinksList.querySelectorAll("a");
  const sections = Array.from(links).map((link) => {
    const href = link.getAttribute("href");
    return href.startsWith("#") ? document.querySelector(href) : null;
  });

  let activeLink = null;

  const alignIndicator = (targetLink, instant = false) => {
    if (!indicator) return;
    if (instant) indicator.classList.add("nav-indicator--instant");

    if (!targetLink) {
      indicator.style.width = "0px";
      indicator.style.opacity = "0";
    } else {
      const rect = targetLink.getBoundingClientRect();
      const parentRect = navLinksList.getBoundingClientRect();

      // Slide via GPU-accelerated transform, relative to the 6px base offset.
      indicator.style.width = `${rect.width}px`;
      indicator.style.transform = `translateX(${rect.left - parentRect.left - 6}px)`;
      indicator.style.opacity = "1";
    }

    if (instant) {
      // Commit styles without a transition, then re-enable animation.
      void indicator.offsetWidth;
      requestAnimationFrame(() => {
        indicator.classList.remove("nav-indicator--instant");
      });
    }
  };

  // Hover animations
  links.forEach((link) => {
    link.addEventListener("mouseenter", () => {
      alignIndicator(link);
    });
    
    link.addEventListener("mouseleave", () => {
      // Return to active link
      alignIndicator(activeLink);
    });
  });

  // Scroll spy to track active section
  const updateActiveSection = (instant = false) => {
    let currentActive = null;
    const scrollPosition = window.scrollY + window.innerHeight * 0.35; // trigger line at 35% height
    
    sections.forEach((sec, idx) => {
      if (!sec) return;
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentActive = links[idx];
      }
    });

    // Fallback to top section if scrolled past top
    if (!currentActive && window.scrollY < 200 && links.length > 0) {
      currentActive = links[0];
    }

    if (currentActive !== activeLink) {
      activeLink = currentActive;
      links.forEach((link) => link.classList.toggle("active", link === activeLink));
      alignIndicator(activeLink, instant);
    }
  };

  // Align initially and listen to scroll/resize
  window.addEventListener("scroll", () => updateActiveSection(false), { passive: true });
  window.addEventListener("resize", () => {
    // Reposition without sliding — layout width may have changed.
    alignIndicator(activeLink, true);
  });

  // Initial run — place the pill instantly so it doesn't fly in on load.
  updateActiveSection(true);
  // Re-measure instantly once fonts/layout settle (widths may shift).
  const resettle = () => {
    updateActiveSection(true);
    if (activeLink) alignIndicator(activeLink, true);
  };
  setTimeout(resettle, 100);
  setTimeout(resettle, 500);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(resettle);
  }
};

// Start the navbar indicator
initNavbarIndicator();

// --- Premium eased scrolling for in-page anchor links ---
// Replaces the browser's fixed-speed smooth scroll with a distance-aware
// glide: immediate response, long soft settle (ease-out-expo).
const initPremiumAnchorScroll = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let rafId = null;

  const cancelGlide = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
    ["wheel", "touchstart", "keydown"].forEach((type) =>
      window.removeEventListener(type, cancelGlide)
    );
  };

  const glideTo = (targetY) => {
    cancelGlide();
    const startY = window.scrollY;
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    const endY = Math.max(0, Math.min(targetY, maxY));
    const distance = endY - startY;
    if (Math.abs(distance) < 1) return;

    // Short hops stay quick; long jumps get room to breathe
    const duration = Math.min(1400, 700 + Math.abs(distance) * 0.12);
    const startTime = performance.now();
    const ease = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

    // Hand control back the moment the user scrolls
    ["wheel", "touchstart", "keydown"].forEach((type) =>
      window.addEventListener(type, cancelGlide, { passive: true })
    );

    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      window.scrollTo({ top: startY + distance * ease(progress), behavior: "instant" });
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        cancelGlide();
      }
    };
    rafId = requestAnimationFrame(step);
  };

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");
    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (hash.length > 1 && !target) return; // unknown target: let the browser decide

    event.preventDefault();
    let targetY = target ? target.getBoundingClientRect().top + window.scrollY : 0;

    // Custom scroll target for About (#profile) link to align directly to the red active/vengeance card state
    if (hash === "#profile") {
      const visitingCard = document.querySelector(".visiting-card");
      const visitingCardSpacer = document.querySelector(".visiting-card-spacer");
      if (visitingCard) {
        if (window.innerWidth > 860 && visitingCardSpacer) {
          const stickyOffset = 120;
          const cardHeight = visitingCard.offsetHeight;
          const spacerHeight = visitingCardSpacer.offsetHeight;
          const spacerTopPage = visitingCardSpacer.getBoundingClientRect().top + window.scrollY;
          
          // targetProgress = 0.72 matches when the card becomes fully red (vengeance state)
          const targetProgress = 0.72;
          const targetScrolled = targetProgress * spacerHeight;
          targetY = targetScrolled + spacerTopPage - (stickyOffset + cardHeight);
        } else {
          // Mobile fallback scroll target
          const cardOffsetTop = visitingCard.getBoundingClientRect().top + window.scrollY;
          const triggerStart = window.innerHeight * 0.92;
          const triggerEnd = window.innerHeight * 0.22;
          const totalDistance = triggerStart - triggerEnd;
          const targetProgress = 0.72;
          targetY = (targetProgress * totalDistance) - triggerStart + cardOffsetTop;
        }
      }
    }

    if (hash.length > 1) history.pushState(null, "", hash);

    if (reduceMotion.matches) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return;
    }
    glideTo(targetY);
  });
};

initPremiumAnchorScroll();
