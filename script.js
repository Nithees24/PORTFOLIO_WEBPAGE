const root = document.documentElement;
const toggle = document.querySelector(".theme-toggle");
const glow = document.querySelector(".cursor-glow");
const revealItems = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll(".filter-button");
const stackItems = document.querySelectorAll(".stack-item");
const tiltCards = document.querySelectorAll("[data-tilt]");

toggle.addEventListener("click", () => {
  root.classList.toggle("dark");
});

window.addEventListener("pointermove", (event) => {
  glow.style.transform = `translate(${event.clientX - 160}px, ${event.clientY - 160}px)`;
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
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

const canvas = document.querySelector("#systemCanvas");
const ctx = canvas.getContext("2d");
const pointer = { x: canvas.width / 2, y: canvas.height / 2 };
const nodes = Array.from({ length: 34 }, (_, index) => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  vx: (Math.random() - 0.5) * 0.45,
  vy: (Math.random() - 0.5) * 0.45,
  r: index % 7 === 0 ? 5 : 3,
}));

function syncCanvasSize() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = rect.width * ratio;
  canvas.height = rect.height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawSystem() {
  const rect = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  nodes.forEach((node) => {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < 20 || node.x > rect.width - 20) node.vx *= -1;
    if (node.y < 20 || node.y > rect.height - 20) node.vy *= -1;

    const dx = pointer.x - node.x;
    const dy = pointer.y - node.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 120) {
      node.x -= dx * 0.002;
      node.y -= dy * 0.002;
    }
  });

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < 150) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(22, 106, 79, ${1 - distance / 150})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  nodes.forEach((node, index) => {
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
    ctx.fillStyle = index % 5 === 0 ? "#d45732" : index % 3 === 0 ? "#f1b84b" : "#166a4f";
    ctx.fill();
  });

  requestAnimationFrame(drawSystem);
}

canvas.addEventListener("pointermove", (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = event.clientX - rect.left;
  pointer.y = event.clientY - rect.top;
});

window.addEventListener("resize", syncCanvasSize);
syncCanvasSize();
drawSystem();
