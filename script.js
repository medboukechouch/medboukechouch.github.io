const username = "medboukechouch";
const repoGrid = document.getElementById("repoGrid");
const repoCount = document.getElementById("repoCount");
const followersCount = document.getElementById("followersCount");
const starsCount = document.getElementById("starsCount");
const year = document.getElementById("year");
const refreshRepos = document.getElementById("refreshRepos");
const toggleRepos = document.getElementById("toggleRepos");
const repoSummary = document.getElementById("repoSummary");
const themeToggle = document.getElementById("themeToggle");
const profileImage = document.getElementById("profileImage");
const uploadPhotoBtn = document.getElementById("uploadPhotoBtn");
const photoInput = document.getElementById("photoInput");

let allRepos = [];
let showAllRepos = false;

year.textContent = new Date().getFullYear();

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

async function fetchGitHubData() {
  repoGrid.innerHTML = "<p class='muted'>Chargement des projets...</p>";

  try {
    const userRes = await fetch(`https://api.github.com/users/${username}`);

    if (!userRes.ok) {
      throw new Error("Erreur API GitHub");
    }

    const user = await userRes.json();
    const repos = await fetchAllRepos();
    allRepos = repos
      .filter((repo) => !repo.fork)
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    repoCount.textContent = formatNumber(user.public_repos || 0);
    followersCount.textContent = formatNumber(user.followers || 0);
    if (user.avatar_url) {
      profileImage.src = user.avatar_url;
    }

    const totalStars = allRepos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    starsCount.textContent = formatNumber(totalStars);

    if (!allRepos.length) {
      repoGrid.innerHTML = "<p class='muted'>Aucun repo public trouvé.</p>";
      repoSummary.textContent = "Aucun dépôt public détecté pour le moment.";
      return;
    }

    renderRepos();
  } catch (error) {
    repoGrid.innerHTML =
      "<p class='muted'>Impossible de charger GitHub maintenant. Réessaie plus tard.</p>";
  }
}

async function fetchAllRepos() {
  const perPage = 100;
  let page = 1;
  const repos = [];

  while (true) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`
    );

    if (!response.ok) {
      throw new Error("Erreur API GitHub Repos");
    }

    const batch = await response.json();
    repos.push(...batch);

    if (batch.length < perPage) {
      break;
    }

    page += 1;
  }

  return repos;
}

function renderRepos() {
  const visibleRepos = showAllRepos ? allRepos : allRepos.slice(0, 12);

  repoGrid.innerHTML = visibleRepos
      .map(
        (repo) => `
        <article class="repo-card" data-tilt>
          <h3>${repo.name}</h3>
          <p>${repo.description || "Projet sans description pour le moment."}</p>
          <div class="repo-meta">
            <span>${repo.language || "N/A"}</span>
            <span>⭐ ${repo.stargazers_count || 0}</span>
          </div>
          <div class="hero-cta" style="margin-top:0.8rem">
            <a class="btn small" href="${repo.html_url}" target="_blank" rel="noreferrer">Voir repo</a>
          </div>
        </article>
      `
      )
      .join("");

  repoSummary.textContent = `${visibleRepos.length} sur ${allRepos.length} projets affichés (sans forks).`;
  toggleRepos.textContent = showAllRepos ? "Afficher moins" : "Afficher tout";

  initTilt();
}

function initReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
}

function initCursorGlow() {
  const glow = document.querySelector(".cursor-glow");
  window.addEventListener("pointermove", (event) => {
    glow.style.left = `${event.clientX}px`;
    glow.style.top = `${event.clientY}px`;
  });
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light");

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
  });
}

function initTilt() {
  const cards = document.querySelectorAll("[data-tilt]");

  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const rotateX = ((y - cy) / cy) * -6;
      const rotateY = ((x - cx) / cx) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
    });
  });
}

function initPhotoUpload() {
  const savedPhoto = localStorage.getItem("profilePhotoNoBg");
  if (savedPhoto) {
    profileImage.src = savedPhoto;
  }

  uploadPhotoBtn.addEventListener("click", () => {
    photoInput.click();
  });

  photoInput.addEventListener("change", async (event) => {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const processed = await removeBackgroundFromImage(file);
      profileImage.src = processed;
      localStorage.setItem("profilePhotoNoBg", processed);
    } catch (error) {
      profileImage.src = URL.createObjectURL(file);
    }
  });
}

function removeBackgroundFromImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (!ctx) {
          reject(new Error("Canvas indisponible"));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const bg = estimateBackgroundColor(data, canvas.width, canvas.height);
        const threshold = 38;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const distance = Math.sqrt(
            (r - bg.r) * (r - bg.r) + (g - bg.g) * (g - bg.g) + (b - bg.b) * (b - bg.b)
          );

          if (distance < threshold) {
            data[i + 3] = 0;
          }
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

function estimateBackgroundColor(data, width, height) {
  const points = [
    0,
    width - 1,
    width * (height - 1),
    width * height - 1,
    Math.floor(width / 2),
    width * Math.floor(height / 2),
  ];

  let r = 0;
  let g = 0;
  let b = 0;

  points.forEach((pixelIndex) => {
    const idx = pixelIndex * 4;
    r += data[idx];
    g += data[idx + 1];
    b += data[idx + 2];
  });

  const count = points.length;
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  };
}

refreshRepos.addEventListener("click", fetchGitHubData);
toggleRepos.addEventListener("click", () => {
  showAllRepos = !showAllRepos;
  renderRepos();
});

initReveal();
initCursorGlow();
initTheme();
initPhotoUpload();
fetchGitHubData();
