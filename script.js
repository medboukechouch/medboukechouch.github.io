/* ===========================
   PORTFOLIO SCRIPT
   Mohamed Boukechouch
=========================== */

const USERNAME = "medboukechouch";

// DOM refs
const repoGrid       = document.getElementById("repoGrid");
const repoCountEl    = document.getElementById("repoCount");
const followersEl    = document.getElementById("followersCount");
const starsEl        = document.getElementById("starsCount");
const yearEl         = document.getElementById("year");
const repoSummaryEl  = document.getElementById("repoSummary");
const refreshBtn     = document.getElementById("refreshRepos");
const toggleBtn      = document.getElementById("toggleRepos");
const themeToggleBtn = document.getElementById("themeToggle");
const profileImg     = document.getElementById("profileImage");
const uploadBtn      = document.getElementById("uploadPhotoBtn");
const photoInput     = document.getElementById("photoInput");

let allRepos     = [];
let showAll      = false;

// Year
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ===========================
   GITHUB DATA
=========================== */
async function fetchGitHubData() {
  if (repoGrid) repoGrid.innerHTML = "<p class='muted mono' style='font-size:12px;padding:20px 0'>Connexion à l'API GitHub…</p>";

  try {
    const [userRes, repos] = await Promise.all([
      fetch(`https://api.github.com/users/${USERNAME}`),
      fetchAllRepos()
    ]);

    if (!userRes.ok) throw new Error("API GitHub inaccessible");

    const user = await userRes.json();

    // Stats
    if (repoCountEl)  repoCountEl.textContent  = fmt(user.public_repos || 0);
    if (followersEl)  followersEl.textContent   = fmt(user.followers    || 0);
    if (user.avatar_url && profileImg) profileImg.src = user.avatar_url;

    // Repos — no forks, sorted by update
    allRepos = repos
      .filter(r => !r.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const totalStars = allRepos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    if (starsEl) starsEl.textContent = fmt(totalStars);

    if (!allRepos.length) {
      if (repoGrid)    repoGrid.innerHTML    = "<p class='muted mono' style='font-size:12px'>Aucun dépôt public trouvé.</p>";
      if (repoSummaryEl) repoSummaryEl.textContent = "Aucun dépôt détecté.";
      return;
    }

    renderRepos();

  } catch (err) {
    if (repoGrid) repoGrid.innerHTML =
      "<p class='muted mono' style='font-size:12px;padding:20px 0'>Impossible de charger GitHub en ce moment. Réessaie plus tard.</p>";
    if (repoSummaryEl) repoSummaryEl.textContent = "Erreur de connexion à l'API GitHub.";
  }
}

async function fetchAllRepos() {
  const PER_PAGE = 100;
  let page = 1, all = [];
  while (true) {
    const res = await fetch(
      `https://api.github.com/users/${USERNAME}/repos?sort=updated&per_page=${PER_PAGE}&page=${page}`
    );
    if (!res.ok) throw new Error("Erreur repos");
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
    page++;
  }
  return all;
}

function renderRepos() {
  if (!repoGrid) return;
  const visible = showAll ? allRepos : allRepos.slice(0, 9);

  repoGrid.innerHTML = visible.map(r => `
    <article class="repo-card" data-tilt>
      <h3>${escHtml(r.name)}</h3>
      <p>${escHtml(r.description || "Projet sans description.")}</p>
      <div class="repo-meta">
        <span class="lang">${escHtml(r.language || "—")}</span>
        <span>⭐ ${r.stargazers_count || 0}</span>
      </div>
      <a class="btn ghost small" href="${r.html_url}" target="_blank" rel="noreferrer">Voir le repo →</a>
    </article>
  `).join("");

  if (repoSummaryEl)
    repoSummaryEl.textContent = `${visible.length} / ${allRepos.length} projets affichés (forks exclus)`;

  if (toggleBtn)
    toggleBtn.textContent = showAll ? "Afficher moins" : "Afficher tout";

  initTilt();
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmt(n) {
  return new Intl.NumberFormat("fr-FR").format(n);
}

/* ===========================
   CUSTOM CURSOR
=========================== */
function initCursor() {
  const cur  = document.getElementById("cursor");
  const ring = document.getElementById("cursorRing");
  if (!cur || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    cur.style.left = mx + "px";
    cur.style.top  = my + "px";
  });

  (function tick() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    ring.style.left = rx + "px";
    ring.style.top  = ry + "px";
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll("a, button, .repo-card, .skill-card, .featured-card, .contact-link").forEach(el => {
    el.addEventListener("mouseenter", () => { cur.classList.add("big"); ring.classList.add("big"); });
    el.addEventListener("mouseleave", () => { cur.classList.remove("big"); ring.classList.remove("big"); });
  });
}

/* ===========================
   SCROLL REVEAL
=========================== */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("visible"), i * 60);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

/* ===========================
   ACTIVE NAV
=========================== */
function initActiveNav() {
  const sections = document.querySelectorAll("section[id]");
  const links    = document.querySelectorAll(".nav a");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 160) current = s.getAttribute("id");
    });
    links.forEach(a => {
      a.style.color = a.getAttribute("href") === `#${current}` ? "var(--accent)" : "";
    });
  }, { passive: true });
}

/* ===========================
   TILT EFFECT
=========================== */
function initTilt() {
  document.querySelectorAll("[data-tilt]").forEach(card => {
    card.addEventListener("mousemove", e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - 0.5) * -8;
      const ry = ((e.clientX - r.left) / r.width  - 0.5) *  8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });
}

/* ===========================
   THEME
=========================== */
function initTheme() {
  if (localStorage.getItem("theme") === "light") document.body.classList.add("light");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("light");
      localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    });
  }
}

/* ===========================
   PHOTO UPLOAD
=========================== */
function initPhotoUpload() {
  const saved = localStorage.getItem("profilePhoto");
  if (saved && profileImg) profileImg.src = saved;

  if (uploadBtn) uploadBtn.addEventListener("click", () => photoInput && photoInput.click());

  if (photoInput) {
    photoInput.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const processed = await removeBackground(file);
        if (profileImg) profileImg.src = processed;
        localStorage.setItem("profilePhoto", processed);
      } catch {
        const url = URL.createObjectURL(file);
        if (profileImg) profileImg.src = url;
      }
    });
  }
}

function removeBackground(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) { reject(new Error("Canvas unavailable")); return; }
        canvas.width  = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const bg = estimateBg(data, canvas.width, canvas.height);
        const threshold = 40;

        for (let i = 0; i < data.length; i += 4) {
          const dist = Math.sqrt(
            (data[i]   - bg.r) ** 2 +
            (data[i+1] - bg.g) ** 2 +
            (data[i+2] - bg.b) ** 2
          );
          if (dist < threshold) data[i+3] = 0;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function estimateBg(data, w, h) {
  const pts = [0, w-1, w*(h-1), w*h-1, Math.floor(w/2), w*Math.floor(h/2)];
  let r=0, g=0, b=0;
  pts.forEach(p => { r+=data[p*4]; g+=data[p*4+1]; b+=data[p*4+2]; });
  return { r: Math.round(r/pts.length), g: Math.round(g/pts.length), b: Math.round(b/pts.length) };
}

/* ===========================
   EVENTS
=========================== */
if (refreshBtn) refreshBtn.addEventListener("click", fetchGitHubData);
if (toggleBtn)  toggleBtn.addEventListener("click", () => { showAll = !showAll; renderRepos(); });

/* ===========================
   INIT
=========================== */
initTheme();
initCursor();
initReveal();
initActiveNav();
initPhotoUpload();
fetchGitHubData();