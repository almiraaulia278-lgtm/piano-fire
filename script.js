// ===== Piano Fire - 5 file version =====
function getUsers() { return JSON.parse(localStorage.getItem("pf_users") || "{}"); }
function saveUsers(u) { localStorage.setItem("pf_users", JSON.stringify(u)); }
function getCurrent() { return localStorage.getItem("pf_current"); }
function setCurrent(u) { localStorage.setItem("pf_current", u); }
function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (ok ? "success" : "error");
}

// Pindah halaman - buat tombol data-go di index.html
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-go]");
  if (!btn) return;
  const go = btn.dataset.go;
  if (go === "home") location.href = "index.html";
  else location.href = go + ".html";
});

// Logo / brand balik ke home
document.addEventListener("click", (e) => {
  const b = e.target.closest(".brand, .logo");
  if (b) location.href = "index.html";
});

// ===== REGISTER =====
const btnReg = document.getElementById("btn-register");
if (btnReg) {
  btnReg.addEventListener("click", () => {
    const user = document.getElementById("reg-user").value.trim();
    const pass = document.getElementById("reg-pass").value;
    const conf = document.getElementById("reg-confirm").value;
    if (!user || !pass) return showMsg("reg-msg", "Username dan password wajib diisi!");
    if (pass !== conf) return showMsg("reg-msg", "Konfirmasi password tidak sama!");
    const users = getUsers();
    if (users[user]) return showMsg("reg-msg", "Username sudah dipakai!");
    users[user] = { password: pass, high: 0, total: 0, last: "-" };
    saveUsers(users);
    showMsg("reg-msg", "Berhasil daftar! Pindah ke login...", true);
    setTimeout(() => location.href = "login.html", 1000);
  });
}

// ===== LOGIN =====
const btnLogin = document.getElementById("btn-login");
if (btnLogin) {
  btnLogin.addEventListener("click", () => {
    const user = document.getElementById("login-user").value.trim();
    const pass = document.getElementById("login-pass").value;
    const users = getUsers();
    if (!users[user] || users[user].password !== pass) {
      return showMsg("login-msg", "Username / password salah!");
    }
    setCurrent(user);
    showMsg("login-msg", "Login berhasil! Masuk ke dashboard...", true);
    setTimeout(() => location.href = "dashboard.html", 800);
  });
}

// ===== LOGOUT - semua tombol logout =====
["btn-logout", "btn-logout-game", "logout-btn"].forEach((id) => {
  const b = document.getElementById(id);
  if (b) b.addEventListener("click", () => {
    localStorage.removeItem("pf_current");
    location.href = "index.html";
  });
});

// ===== HEADER USER =====
const cur = getCurrent();
const headerUser = document.getElementById("header-user") || document.getElementById("nav-user") || document.getElementById("nav-user-game");
if (headerUser && cur) headerUser.textContent = "Halo, " + cur + "!";
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn && cur) logoutBtn.classList.remove("hidden");

// ===== DASHBOARD =====
const dashHalo = document.getElementById("dash-halo");
if (dashHalo) {
  if (!cur) { location.href = "login.html"; }
  else {
    const users = getUsers();
    const me = users[cur] || { high: 0, total: 0, last: "-" };
    dashHalo.textContent = "Halo, " + cur + "! 👋";
    document.getElementById("stat-high").textContent = me.high;
    document.getElementById("stat-total").textContent = me.total;
    document.getElementById("stat-last").textContent = me.last;
  }
}

// ===== GAME =====
const board = document.getElementById("game-board");
if (board) {
  if (!cur) location.href = "login.html";
  let score = 0, lives = 3, playing = false, timer = null, spawnTimer = null;
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const overlay = document.getElementById("game-overlay");
  const resultBox = document.getElementById("game-result");
  const finalEl = document.getElementById("final-score");
  const keys = ["A", "S", "D", "F"];

  function updateHUD() {
    scoreEl.textContent = score;
    livesEl.textContent = "❤️".repeat(lives) + "🖤".repeat(3 - lives);
  }
  function endGame() {
    playing = false;
    clearInterval(spawnTimer); clearInterval(timer);
    board.querySelectorAll(".tile").forEach(t => t.remove());
    const users = getUsers();
    if (users[cur]) {
      users[cur].total = (users[cur].total || 0) + 1;
      if (score > (users[cur].high || 0)) users[cur].high = score;
      users[cur].last = new Date().toLocaleDateString("id-ID");
      saveUsers(users);
    }
    finalEl.textContent = score;
    resultBox.classList.remove("hidden");
    overlay.style.display = "none";
  }
  function spawnTile() {
    if (!playing) return;
    const col = Math.floor(Math.random() * 4);
    const key = keys[col];
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = key;
    tile.dataset.key = key;
    tile.style.left = (col * 25) + "%";
    tile.style.top = "-90px";
    tile.addEventListener("click", () => hitTile(tile));
    board.appendChild(tile);
    let top = -90;
    const fall = setInterval(() => {
      if (!playing) { clearInterval(fall); tile.remove(); return; }
      top += 3;
      tile.style.top = top + "px";
      if (top > 480) {
        clearInterval(fall); tile.remove();
        lives--; updateHUD();
        if (lives <= 0) endGame();
      }
    }, 20);
    tile._fall = fall;
  }
  function hitTile(tile) {
    if (!playing) return;
    clearInterval(tile._fall);
    tile.remove();
    score += 10; updateHUD();
  }
  function pressKey(k) {
    if (!playing) return;
    const tiles = [...board.querySelectorAll(".tile")];
    // cari ubin paling bawah untuk tombol itu
    const match = tiles.filter(t => t.dataset.key === k).sort((a,b) => parseInt(b.style.top) - parseInt(a.style.top))[0];
    if (match && parseInt(match.style.top) > 300) hitTile(match);
  }
  document.addEventListener("keydown", (e) => {
    const k = e.key.toUpperCase();
    if (keys.includes(k)) pressKey(k);
  });
  document.querySelectorAll(".keys button").forEach(b => {
    b.addEventListener("click", () => pressKey(b.dataset.key));
  });
  function startGame() {
    score = 0; lives = 3; playing = true; updateHUD();
    resultBox.classList.add("hidden");
    overlay.style.display = "none";
    board.querySelectorAll(".tile").forEach(t => t.remove());
    spawnTimer = setInterval(spawnTile, 900);
  }
  document.getElementById("start-game").addEventListener("click", startGame);
  document.getElementById("play-again").addEventListener("click", startGame);
  updateHUD();
}