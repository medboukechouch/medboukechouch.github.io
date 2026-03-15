const username = "medboukechouch";
const repoGrid = document.getElementById("repoGrid");
const repoCount = document.getElementById("repoCount");
const followersCount = document.getElementById("followersCount");
const starsCount = document.getElementById("starsCount");
const year = document.getElementById("year");
const refreshRepos = document.getElementById("refreshRepos");
const themeToggle = document.getElementById("themeToggle");

year.textContent = new Date().getFullYear();

function formatNumber(value) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

async function fetchGitHubData() {
  repoGrid.innerHTML = "<p class='muted'>Chargement des projets...</p>";

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`),
      fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      throw new Error("Erreur API GitHub");
    }

    const user = await userRes.json();
    const repos = await reposRes.json();

    repoCount.textContent = formatNumber(user.public_repos || 0);
    followersCount.textContent = formatNumber(user.followers || 0);

    const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
    starsCount.textContent = formatNumber(totalStars);

    if (!repos.length) {
      repoGrid.innerHTML = "<p class='muted'>Aucun repo public trouvé.</p>";
      return;
    }

    repoGrid.innerHTML = repos
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

    initTilt();
  } catch (error) {
    repoGrid.innerHTML =
      "<p class='muted'>Impossible de charger GitHub maintenant. Réessaie plus tard.</p>";
  }
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

refreshRepos.addEventListener("click", fetchGitHubData);

initReveal();
initCursorGlow();
initTheme();
fetchGitHubData();
