// E-GYM Web Application Main Controller
// Pair programming implementation following E-GYM Concept & Business Blueprint

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  state: null,
  activeView: "hq",
  activeDeptSub: "mind",
  selectedChallengeId: null,

  // Timer state
  timerInterval: null,
  timerSecondsLeft: 25 * 60,
  timerInitialSeconds: 25 * 60,
  timerRunning: false,

  async init() {
    this.state = StorageManager.getState();
    this.setupNavigation();
    this.setupAudioToggle();
    this.setupFocusTimer();

    // Initialize Rank Progression Engine
    if (typeof ProgressionEngine !== "undefined") {
      try {
        await ProgressionEngine.fetchRanks();
        const promo = ProgressionEngine.checkAndApplyPromotion(this.state);
        if (promo.promoted) {
          StorageManager.saveState(this.state);
        }
      } catch (e) {
        console.warn("[E-GYM App] Progression engine initialized with local presets.");
      }
    }

    this.renderAll();
    this.bindGlobalEvents();

    // Check login state
    if (!StorageManager.isLoggedIn()) {
      this.switchView("login");
    } else {
      this.switchView("hq");
    }

    try {
      const cloudState = await StorageManager.initCloudSync();
      if (cloudState) {
        this.state = cloudState;
        this.renderAll();
      }
    } catch (e) {}
  },

  renderAll() {
    this.state = StorageManager.getState();
    this.renderTopBar();
    this.renderHQ();
    this.renderRankBanner();
    this.renderRanksView();
    this.renderChallengeArena();
    this.renderDepartments();
    this.renderProfile();
    this.renderMembership();
    this.renderRadarChart();
  },

  // -------------------------------------------------------------
  // Topbar & Header
  // -------------------------------------------------------------
  renderTopBar() {
    const isLoggedIn = StorageManager.isLoggedIn();
    const loggedInWrap = document.getElementById("auth-logged-in-wrap");
    const loggedOutWrap = document.getElementById("auth-logged-out-wrap");
    if (loggedInWrap && loggedOutWrap) {
      loggedInWrap.classList.toggle("hidden", !isLoggedIn);
      loggedOutWrap.classList.toggle("hidden", isLoggedIn);
    }

    // Header Rank Pill
    const rankBadge = document.getElementById("header-rank-badge");
    const rankText = document.getElementById("header-rank-text");
    if (rankText && typeof ProgressionEngine !== "undefined") {
      const curRank = ProgressionEngine.getRankById(this.state.currentRankId || "recruit");
      rankText.textContent = curRank.title;
    }

    const tierPill = document.getElementById("header-tier-pill");
    if (tierPill) {
      tierPill.textContent = this.state.profile.tier || "Genesis Member";
    }
    const audioBtn = document.getElementById("mute-toggle-btn");
    if (audioBtn) {
      audioBtn.innerHTML = SoundFX.isMuted 
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg> Audio: Off`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg> Audio: On`;
    }
  },

  setupAudioToggle() {
    const audioBtn = document.getElementById("mute-toggle-btn");
    if (audioBtn) {
      audioBtn.addEventListener("click", () => {
        SoundFX.toggleMute();
        this.renderTopBar();
      });
    }
  },

  // -------------------------------------------------------------
  // Authentication Controller
  // -------------------------------------------------------------
  switchAuthTab(tab) {
    const signinTab = document.getElementById("tab-btn-signin");
    const registerTab = document.getElementById("tab-btn-register");
    const signinForm = document.getElementById("auth-form-signin");
    const registerForm = document.getElementById("auth-form-register");

    if (tab === "signin") {
      if (signinTab) signinTab.classList.add("active");
      if (registerTab) registerTab.classList.remove("active");
      if (signinForm) signinForm.classList.remove("hidden");
      if (registerForm) registerForm.classList.add("hidden");
    } else {
      if (registerTab) registerTab.classList.add("active");
      if (signinTab) signinTab.classList.remove("active");
      if (registerForm) registerForm.classList.remove("hidden");
      if (signinForm) signinForm.classList.add("hidden");
    }
    SoundFX.playClick();
  },

  submitSignIn() {
    const idInput = document.getElementById("login-identifier");
    const val = idInput ? idInput.value.trim() : "";
    if (!val) {
      alert("Please enter your member handle or email.");
      return;
    }
    this.state = StorageManager.login(val);
    SoundFX.playSuccess();
    this.renderAll();
    this.switchView("hq");
  },

  submitRegister() {
    const name = document.getElementById("reg-name").value;
    const handle = document.getElementById("reg-handle").value;
    const email = document.getElementById("reg-email").value;
    const focus = document.getElementById("reg-focus").value;

    if (!name || !handle) {
      alert("Please provide your name and handle.");
      return;
    }

    this.state = StorageManager.register(name, handle, email, focus);
    SoundFX.playSuccess();
    this.renderAll();
    this.switchView("hq");
  },

  continueAsGuest() {
    this.state = StorageManager.login("Guest Candidate");
    SoundFX.playSuccess();
    this.renderAll();
    this.switchView("hq");
  },

  logout() {
    StorageManager.logout();
    SoundFX.playClick();
    this.renderTopBar();
    this.switchView("login");
  },

  // -------------------------------------------------------------
  // Navigation & Routing
  // -------------------------------------------------------------
  setupNavigation() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach(tab => {
      tab.addEventListener("click", (e) => {
        const viewTarget = tab.getAttribute("data-view");
        this.switchView(viewTarget);
      });
    });

    // Logo click goes home
    const logo = document.getElementById("app-logo");
    if (logo) {
      logo.addEventListener("click", () => this.switchView("hq"));
    }

    // Tier pill click goes to membership
    const tierPill = document.getElementById("header-tier-pill");
    if (tierPill) {
      tierPill.addEventListener("click", () => this.switchView("membership"));
    }

    // Profile click goes to profile
    const avatar = document.getElementById("header-avatar");
    if (avatar) {
      avatar.addEventListener("click", () => this.switchView("profile"));
    }

    // Department Sub-tabs
    const deptBtns = document.querySelectorAll(".dept-tab-btn");
    deptBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        deptBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const sub = btn.getAttribute("data-subview");
        this.switchDeptSub(sub);
      });
    });
  },

  switchView(viewName) {
    if (!StorageManager.isLoggedIn() && viewName !== "login") {
      viewName = "login";
    }
    this.activeView = viewName;
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("data-view") === viewName);
    });
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active-view");
    });
    const targetSec = document.getElementById(`view-${viewName}`);
    if (targetSec) {
      targetSec.classList.add("active-view");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    SoundFX.playClick();
  },

  switchDeptSub(subName) {
    this.activeDeptSub = subName;
    document.querySelectorAll(".dept-subview").forEach(sv => sv.classList.remove("active-subview"));
    const target = document.getElementById(`dept-sub-${subName}`);
    if (target) target.classList.add("active-subview");
    SoundFX.playClick();
  },

  // -------------------------------------------------------------
  // Personal HQ View
  // -------------------------------------------------------------
  renderHQ() {
    const { stats, profile, todayObjectives, enrolledChallenges } = this.state;

    // Stats bar
    const streakEl = document.getElementById("stat-streak");
    if (streakEl) streakEl.textContent = `${stats.currentStreak} Days`;

    const pointsEl = document.getElementById("stat-points");
    if (pointsEl) pointsEl.textContent = stats.unrealPoints.toLocaleString();

    const doneCount = todayObjectives.filter(o => o.completed).length;
    const totalCount = todayObjectives.length;
    const rate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    const rateEl = document.getElementById("stat-rate");
    if (rateEl) rateEl.textContent = `${rate}%`;

    const totalDoneEl = document.getElementById("stat-total-done");
    if (totalDoneEl) totalDoneEl.textContent = stats.totalObjectivesDone;

    // Objectives List
    const objListEl = document.getElementById("hq-objectives-list");
    const countBadge = document.getElementById("hq-obj-count-badge");
    if (countBadge) countBadge.textContent = `${doneCount}/${totalCount} Done`;

    if (objListEl) {
      if (todayObjectives.length === 0) {
        objListEl.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No objectives logged for today. Click "+ Add Objective" or enroll in a challenge!</div>`;
      } else {
        objListEl.innerHTML = todayObjectives.map(obj => {
          const dimClass = `dim-${obj.dimension || 'execution'}`;
          return `
            <div class="objective-item ${obj.completed ? 'completed' : ''}" data-obj-id="${obj.id}">
              <div class="objective-left">
                <div class="custom-checkbox" onclick="App.toggleObjective('${obj.id}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span class="objective-text">${this.escapeHTML(obj.title)}</span>
              </div>
              <div class="objective-meta">
                <span class="dimension-tag ${dimClass}">${obj.dimension || 'task'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted);">${obj.timeEst || '15m'}</span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // Active Challenges in HQ
    const activeCont = document.getElementById("hq-active-challenges-list");
    if (activeCont) {
      if (enrolledChallenges.length === 0) {
        activeCont.innerHTML = `
          <div style="background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-lg); padding: 2rem; text-align: center;">
            <p style="color: var(--text-secondary); margin-bottom: 1rem;">You are not currently enrolled in any flagship challenges.</p>
            <button class="btn btn-primary" onclick="App.switchView('challenges')">Explore Challenge Arena</button>
          </div>
        `;
      } else {
        activeCont.innerHTML = enrolledChallenges.map(enc => {
          const cDef = EGYM_DATA.challenges.find(c => c.id === enc.challengeId);
          if (!cDef) return "";
          const pct = Math.min(100, Math.round((enc.currentDay / cDef.durationDays) * 100));
          const todayStr = new Date().toISOString().split("T")[0];
          const hasCheckedInToday = enc.checkIns && enc.checkIns[todayStr] && enc.checkIns[todayStr].completed;

          return `
            <div class="active-challenge-card">
              <div class="ac-head">
                <div>
                  <div style="font-size:0.7rem; color:var(--text-gold); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.2rem;">${cDef.department}</div>
                  <h3 class="ac-title">${this.escapeHTML(cDef.title)}</h3>
                </div>
                <span class="ac-days">Day ${enc.currentDay} of ${cDef.durationDays}</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%;"></div>
              </div>
              <div class="ac-footer">
                <span>${pct}% Completed</span>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  ${hasCheckedInToday 
                    ? `<span style="color: var(--accent-emerald); font-weight:700; display:flex; align-items:center; gap:0.3rem;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg> Checked In</span>`
                    : `<button class="btn btn-primary" style="padding: 0.35rem 0.85rem; font-size: 0.75rem;" onclick="App.openCheckInModal('${cDef.id}')">Daily Check-In</button>`
                  }
                  <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="App.openChallengeModal('${cDef.id}')">View Details</button>
                </div>
              </div>
            </div>
          `;
        }).join("");
      }
    }
  },

  toggleObjective(id) {
    const obj = this.state.todayObjectives.find(o => o.id === id);
    if (!obj) return;
    const newStatus = !obj.completed;
    const res = StorageManager.updateTodayObjective(id, newStatus);
    this.state = res.state || res;

    if (newStatus) {
      SoundFX.playSuccess();
      if (res.promoResult) {
        this.showPromotionModal(res.promoResult);
      }
    } else {
      SoundFX.playClick();
    }
    this.renderHQ();
    this.renderRankBanner();
    this.renderRanksView();
    this.renderProfile();
    this.renderRadarChart();
  },

  // -------------------------------------------------------------
  // Rank Progression & Hierarchy Components
  // -------------------------------------------------------------
  renderRankBanner() {
    if (typeof ProgressionEngine === "undefined") return;
    const evaluation = ProgressionEngine.evaluate(this.state);
    const { currentRank, nextRank, progressPct, criteriaList } = evaluation;

    const emblemWrap = document.getElementById("hq-rank-emblem");
    if (emblemWrap) {
      emblemWrap.innerHTML = ProgressionEngine.getEmblemSVG(currentRank.id, 80);
    }

    const levelTag = document.getElementById("hq-rank-level");
    if (levelTag) levelTag.textContent = `LEVEL ${currentRank.level}`;

    const titleEl = document.getElementById("hq-rank-title");
    if (titleEl) titleEl.textContent = currentRank.title;

    const descEl = document.getElementById("hq-rank-desc");
    if (descEl) descEl.textContent = currentRank.tagline;

    const nextName = document.getElementById("hq-next-rank-name");
    if (nextName) nextName.textContent = nextRank ? nextRank.title.toUpperCase() : "MAX LEVEL";

    const pctEl = document.getElementById("hq-rank-progress-pct");
    if (pctEl) pctEl.textContent = nextRank ? `${progressPct}%` : "100%";

    const barEl = document.getElementById("hq-rank-progress-bar");
    if (barEl) barEl.style.width = nextRank ? `${progressPct}%` : "100%";

    const criteriaSummary = document.getElementById("hq-rank-criteria-list");
    if (criteriaSummary) {
      if (!nextRank) {
        criteriaSummary.innerHTML = `<span class="criteria-chip met">⚡ Sovereign Apex Rank Attained</span>`;
      } else {
        criteriaSummary.innerHTML = criteriaList.map(c => `
          <span class="criteria-chip ${c.met ? 'met' : 'unmet'}" title="${c.label}: ${c.current}/${c.target} ${c.unit}">
            ${c.met 
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` 
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
            }
            <strong>${c.label}:</strong> ${c.current}/${c.target} ${c.unit}
          </span>
        `).join("");
      }
    }
  },

  renderRanksView() {
    if (typeof ProgressionEngine === "undefined") return;
    const ranks = ProgressionEngine.getRanks();
    const evaluation = ProgressionEngine.evaluate(this.state);
    const { currentRank, nextRank, progressPct } = evaluation;

    // 1. Standing Overview Card
    const standingCont = document.getElementById("ranks-standing-overview");
    if (standingCont) {
      standingCont.innerHTML = `
        <div class="standing-overview-grid">
          <div class="standing-emblem-large">
            ${ProgressionEngine.getEmblemSVG(currentRank.id, 110)}
          </div>
          <div class="standing-info-col">
            <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-gold); letter-spacing: 0.1em; text-transform: uppercase;">
              MEMBER DOSSIER • LEVEL ${currentRank.level}
            </div>
            <h2>${this.escapeHTML(currentRank.title)}</h2>
            <p>${this.escapeHTML(currentRank.tagline)}</p>
            <div class="standing-metrics-pills">
              <div class="standing-metric-pill">
                <span class="lbl">Unreal XP</span>
                <span class="val">${(this.state.stats.unrealPoints || 0).toLocaleString()}</span>
              </div>
              <div class="standing-metric-pill">
                <span class="lbl">Streak</span>
                <span class="val">${this.state.stats.currentStreak || 0} Days</span>
              </div>
              <div class="standing-metric-pill">
                <span class="lbl">Tasks Done</span>
                <span class="val">${this.state.stats.totalObjectivesDone || 0}</span>
              </div>
              <div class="standing-metric-pill">
                <span class="lbl">Active Protocols</span>
                <span class="val">${(this.state.enrolledChallenges || []).length}</span>
              </div>
            </div>
          </div>
          <div class="standing-progress-box">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.75rem;">
              <span style="color:var(--text-muted); text-transform:uppercase;">Next: ${nextRank ? nextRank.title : 'Apex'}</span>
              <strong style="color:var(--text-gold); font-family:var(--font-mono);">${progressPct}%</strong>
            </div>
            <div class="rank-progress-track" style="margin-bottom:0.75rem;">
              <div class="rank-progress-fill" style="width: ${progressPct}%;"></div>
            </div>
            <div style="font-size:0.72rem; color:var(--text-secondary); line-height:1.4;">
              ${nextRank ? `Satisfy all mandatory criteria to unlock ${nextRank.title}.` : 'You stand at the absolute summit of E-GYM.'}
            </div>
          </div>
        </div>
      `;
    }

    // 2. Ladder Container
    const ladderCont = document.getElementById("rank-ladder-container");
    if (ladderCont) {
      ladderCont.innerHTML = ranks.map(rank => {
        const isCurrent = rank.id === currentRank.id;
        const isUnlocked = rank.level <= currentRank.level;
        const cardClass = isCurrent ? "active-rank" : (isUnlocked ? "unlocked-rank" : "locked-rank");

        // Format criteria display
        const xpReq = rank.min_xp ? `${rank.min_xp.toLocaleString()} XP` : "0 XP";
        const streakReq = rank.min_streak ? `${rank.min_streak} Days Streak` : "None";
        const chalReq = rank.min_challenges ? `${rank.min_challenges} Protocol(s)` : "None";
        const objReq = rank.min_objectives ? `${rank.min_objectives} Objectives` : "None";
        const dimReq = rank.min_dimensions_count ? `${rank.min_dimensions_count} dims @ ${rank.min_dimension_score}%+` : "None";

        // Criteria satisfaction status for current member
        const userXP = this.state.stats.unrealPoints || 0;
        const userStreak = Math.max(this.state.stats.currentStreak || 0, this.state.stats.longestStreak || 0);
        const userObj = this.state.stats.totalObjectivesDone || 0;
        const userChal = (this.state.enrolledChallenges || []).length;
        const userRadarMet = rank.min_dimensions_count 
          ? Object.values(this.state.dimensionsRadar || {}).filter(v => Number(v) >= (rank.min_dimension_score || 0)).length >= rank.min_dimensions_count
          : true;

        return `
          <div class="rank-tier-card ${cardClass}">
            <div class="rank-card-emblem">
              ${ProgressionEngine.getEmblemSVG(rank.id, 64)}
            </div>

            <div class="rank-card-identity">
              <span class="rank-card-level">LEVEL ${rank.level}</span>
              <h3 class="rank-card-name">${this.escapeHTML(rank.title)}</h3>
              <p class="rank-card-tagline">${this.escapeHTML(rank.tagline)}</p>
            </div>

            <div class="rank-card-criteria-box">
              <div style="font-size:0.68rem; color:var(--text-gold); font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.25rem;">
                Mandatory Thresholds
              </div>
              <div class="criteria-grid-mini">
                <div class="criteria-item-mini ${userXP >= (rank.min_xp || 0) ? 'satisfied' : 'pending'}">
                  <span>⚡</span> <span>${xpReq}</span>
                </div>
                <div class="criteria-item-mini ${userStreak >= (rank.min_streak || 0) ? 'satisfied' : 'pending'}">
                  <span>🔥</span> <span>${streakReq}</span>
                </div>
                <div class="criteria-item-mini ${userObj >= (rank.min_objectives || 0) ? 'satisfied' : 'pending'}">
                  <span>🎯</span> <span>${objReq}</span>
                </div>
                <div class="criteria-item-mini ${userChal >= (rank.min_challenges || 0) ? 'satisfied' : 'pending'}">
                  <span>🛡️</span> <span>${chalReq}</span>
                </div>
                ${rank.min_dimensions_count ? `
                  <div class="criteria-item-mini ${userRadarMet ? 'satisfied' : 'pending'}" style="grid-column: 1 / -1;">
                    <span>📊</span> <span>Multi-Domain: ${dimReq}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <div class="rank-card-perks">
              <strong>Institutional Perks</strong>
              <ul>
                ${(rank.perks || []).map(p => `<li>${this.escapeHTML(p)}</li>`).join("")}
              </ul>
            </div>
          </div>
        `;
      }).join("");
    }

    // 3. Promotion History
    const historyCont = document.getElementById("rank-history-timeline");
    const countBadge = document.getElementById("rank-history-count-badge");
    const historyList = this.state.rankHistory || [];
    if (countBadge) countBadge.textContent = `${historyList.length} Record${historyList.length === 1 ? '' : 's'}`;

    if (historyCont) {
      if (historyList.length === 0) {
        historyCont.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No historical promotion events recorded yet.</div>`;
      } else {
        historyCont.innerHTML = historyList.map(item => {
          const rObj = ProgressionEngine.getRankById(item.rankId);
          const dateStr = item.promotedAt ? new Date(item.promotedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Initial';
          return `
            <div class="timeline-entry">
              <div>
                <div class="timeline-entry-title">Conferred: ${rObj ? rObj.title : item.rankId}</div>
                <div class="timeline-entry-reason">${this.escapeHTML(item.triggerReason || 'Standard progression requirements fulfilled')}</div>
              </div>
              <div class="timeline-entry-date">${dateStr}</div>
            </div>
          `;
        }).join("");
      }
    }
  },

  // -------------------------------------------------------------
  // 8-Dimension Radar Chart (HTML5 Canvas or SVG)
  // -------------------------------------------------------------
  renderRadarChart() {
    const canvas = document.getElementById("dimensions-radar-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Retina display resolution
    const width = 280;
    const height = 280;
    canvas.width = width * 2;
    canvas.height = height * 2;
    ctx.scale(2, 2);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = 100;
    const dimensions = EGYM_DATA.dimensions;
    const totalSides = dimensions.length;
    const radarData = this.state.dimensionsRadar || {};

    ctx.clearRect(0, 0, width, height);

    // Draw concentric polygon rings (25%, 50%, 75%, 100%)
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(level => {
      ctx.beginPath();
      for (let i = 0; i < totalSides; i++) {
        const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (maxRadius * level);
        const y = centerY + Math.sin(angle) * (maxRadius * level);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw axis lines
    for (let i = 0; i < totalSides; i++) {
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * maxRadius;
      const y = centerY + Math.sin(angle) * maxRadius;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.stroke();
    }

    // Draw member dimension polygon
    ctx.beginPath();
    for (let i = 0; i < totalSides; i++) {
      const dim = dimensions[i];
      const val = radarData[dim.id] || 60;
      const r = (val / 100) * maxRadius;
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    // Fill with glowing gold gradient
    const fillGrad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, maxRadius);
    fillGrad.addColorStop(0, "rgba(212, 175, 55, 0.45)");
    fillGrad.addColorStop(1, "rgba(212, 175, 55, 0.15)");
    ctx.fillStyle = fillGrad;
    ctx.fill();

    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw vertices
    for (let i = 0; i < totalSides; i++) {
      const dim = dimensions[i];
      const val = radarData[dim.id] || 60;
      const r = (val / 100) * maxRadius;
      const angle = (Math.PI * 2 / totalSides) * i - Math.PI / 2;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render compact list below canvas
    const listCont = document.getElementById("dimensions-compact-list");
    if (listCont) {
      listCont.innerHTML = dimensions.map(d => {
        const score = radarData[d.id] || 60;
        return `
          <div class="dim-row">
            <span class="dim-name">${d.name}</span>
            <span class="dim-score">${score}%</span>
          </div>
        `;
      }).join("");
    }
  },

  // -------------------------------------------------------------
  // Challenge Arena
  // -------------------------------------------------------------
  renderChallengeArena(filterCategory = "all") {
    const cont = document.getElementById("arena-challenges-grid");
    if (!cont) return;

    let challenges = EGYM_DATA.challenges;
    if (filterCategory !== "all") {
      challenges = challenges.filter(c => c.department.toLowerCase() === filterCategory.toLowerCase() || c.category.toLowerCase().includes(filterCategory.toLowerCase()));
    }

    const enrolledIds = this.state.enrolledChallenges.map(c => c.challengeId);

    cont.innerHTML = challenges.map(c => {
      const isEnrolled = enrolledIds.includes(c.id);
      return `
        <div class="challenge-card">
          <div class="cc-media">
            <img src="${c.image}" alt="${c.title}" loading="lazy">
            <span class="cc-badge">${c.badge}</span>
            <span class="cc-department">${c.department}</span>
          </div>
          <div class="cc-content">
            <h3 class="cc-title">${this.escapeHTML(c.title)}</h3>
            <div class="cc-tagline">${this.escapeHTML(c.tagline)}</div>
            <p class="cc-desc">${this.escapeHTML(c.description)}</p>
            
            <div class="cc-meta-row">
              <span class="cc-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${c.durationDays} Days
              </span>
              <span class="cc-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                ${c.difficulty}
              </span>
              <span class="cc-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                ${c.commitment}
              </span>
            </div>

            <div class="cc-action">
              <button class="btn btn-secondary" style="flex:1;" onclick="App.openChallengeModal('${c.id}')">Inspect Protocol</button>
              ${isEnrolled 
                ? `<button class="btn btn-outline-gold" style="flex:1;" onclick="App.switchView('hq')">Active in HQ</button>`
                : `<button class="btn btn-primary" style="flex:1;" onclick="App.enrollInChallenge('${c.id}')">Enroll</button>`
              }
            </div>
          </div>
        </div>
      `;
    }).join("");
  },

  openChallengeModal(challengeId) {
    const c = EGYM_DATA.challenges.find(item => item.id === challengeId);
    if (!c) return;
    this.selectedChallengeId = challengeId;

    const modalTitle = document.getElementById("challenge-modal-title");
    const modalBody = document.getElementById("challenge-modal-content");
    const enrollBtn = document.getElementById("challenge-modal-enroll-btn");

    if (modalTitle) modalTitle.textContent = c.title;

    const isEnrolled = this.state.enrolledChallenges.some(item => item.challengeId === challengeId);

    if (enrollBtn) {
      if (isEnrolled) {
        enrollBtn.textContent = "Currently Active in Personal HQ";
        enrollBtn.className = "btn btn-outline-gold";
        enrollBtn.onclick = () => {
          this.closeModal("challenge-modal");
          this.switchView("hq");
        };
      } else {
        enrollBtn.textContent = "Commit & Enroll in Protocol";
        enrollBtn.className = "btn btn-primary";
        enrollBtn.onclick = () => {
          this.enrollInChallenge(challengeId);
          this.closeModal("challenge-modal");
        };
      }
    }

    if (modalBody) {
      modalBody.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <p style="color: var(--text-gold); font-weight:600; margin-bottom: 0.5rem;">${this.escapeHTML(c.tagline)}</p>
          <p style="color: var(--text-secondary); font-size: 0.95rem; line-height:1.6;">${this.escapeHTML(c.description)}</p>
        </div>

        <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-display); font-size: 0.9rem; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">Daily Standard & Rules</h4>
          <ul style="list-style-type: none; display: flex; flex-direction: column; gap: 0.5rem;">
            ${c.rules.map(r => `
              <li style="display:flex; align-items:flex-start; gap:0.6rem; font-size: 0.85rem; color: var(--text-primary);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2.5" style="margin-top:0.2rem; flex-shrink:0;"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${this.escapeHTML(r)}</span>
              </li>
            `).join("")}
          </ul>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-family: var(--font-display); font-size: 0.9rem; color: #FFFFFF; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">Curriculum & Phasing</h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            ${c.syllabus.map(s => `
              <div style="background: rgba(255,255,255,0.02); border-left: 2px solid var(--border-gold); padding: 0.75rem 1rem;">
                <div style="font-weight:700; font-size: 0.85rem; color: var(--text-gold);">${s.phase}: ${s.focus}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.2rem;">${s.details}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-md); padding: 1rem; font-size: 0.8rem; color: #F59E0B;">
          <strong>Safety & Sustainability Note:</strong> ${c.safetyNotes}
        </div>
      `;
    }

    this.openModal("challenge-modal");
  },

  enrollInChallenge(challengeId) {
    const res = StorageManager.enrollChallenge(challengeId);
    if (res.success) {
      SoundFX.playSuccess();
      this.state = res.state;
      this.renderHQ();
      this.renderRankBanner();
      this.renderRanksView();
      this.renderChallengeArena();
      this.switchView("hq");
      if (res.promoResult) {
        this.showPromotionModal(res.promoResult);
      } else {
        alert("Protocol Activated! Your daily objectives have been updated in your Personal HQ.");
      }
    } else {
      alert(res.message);
    }
  },

  // -------------------------------------------------------------
  // Daily Check-In Modal
  // -------------------------------------------------------------
  openCheckInModal(challengeId) {
    this.selectedChallengeId = challengeId;
    const c = EGYM_DATA.challenges.find(item => item.id === challengeId);
    const titleEl = document.getElementById("checkin-modal-title");
    if (titleEl && c) {
      titleEl.textContent = `Daily Check-In: ${c.title}`;
    }
    document.getElementById("checkin-notes-input").value = "";
    document.getElementById("checkin-reflection-input").value = "";
    this.openModal("checkin-modal");
  },

  submitCheckIn() {
    if (!this.selectedChallengeId) return;
    const notes = document.getElementById("checkin-notes-input").value;
    const reflection = document.getElementById("checkin-reflection-input").value;

    const res = StorageManager.logChallengeCheckIn(this.selectedChallengeId, notes, reflection);
    if (res.success) {
      SoundFX.playSuccess();
      this.state = res.state;
      this.closeModal("checkin-modal");
      this.renderHQ();
      this.renderRankBanner();
      this.renderRanksView();
      this.renderProfile();
      this.renderRadarChart();
      if (res.promoResult) {
        this.showPromotionModal(res.promoResult);
      } else {
        alert("Check-in logged successfully! +75 Unreal Points & streak updated.");
      }
    }
  },

  // -------------------------------------------------------------
  // Departments View
  // -------------------------------------------------------------
  renderDepartments() {
    this.renderReadingAcademy();
    this.renderFitnessDept();
    this.renderWritingStudio();
  },

  renderReadingAcademy() {
    const roadmapsCont = document.getElementById("reading-roadmaps-container");
    if (roadmapsCont) {
      roadmapsCont.innerHTML = EGYM_DATA.readingAcademy.roadmaps.map(rm => `
        <div class="roadmap-card">
          <div class="roadmap-head">
            <h4 class="roadmap-title">${this.escapeHTML(rm.title)}</h4>
            <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.25rem;">${this.escapeHTML(rm.desc)}</p>
          </div>
          <div class="roadmap-books">
            ${rm.books.map(b => `
              <div class="book-item">
                <div class="book-title-row">
                  <span class="book-title">${this.escapeHTML(b.title)}</span>
                  <span class="book-time">${b.time}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem;">by ${this.escapeHTML(b.author)} • <span style="color:var(--text-gold);">${b.difficulty}</span></div>
                <div class="book-why">${this.escapeHTML(b.why)}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }

    // Render Reading Log History
    const logCont = document.getElementById("reading-log-history");
    if (logCont) {
      if (this.state.readingLog.length === 0) {
        logCont.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No reading sessions logged yet.</p>`;
      } else {
        logCont.innerHTML = this.state.readingLog.map(rl => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
              <strong style="color:var(--text-gold); font-size:0.95rem;">${this.escapeHTML(rl.bookTitle)}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">${rl.date} • ${rl.pagesRead || '15'} pages</span>
            </div>
            <p style="font-size:0.85rem; color:var(--text-primary); margin-bottom:0.4rem; font-style:italic;">"${this.escapeHTML(rl.insight)}"</p>
            ${rl.actionItem ? `<div style="font-size:0.75rem; color:var(--accent-emerald);">Action item: ${this.escapeHTML(rl.actionItem)}</div>` : ''}
          </div>
        `).join("");
      }
    }
  },

  submitReadingEntry() {
    const bookTitle = document.getElementById("reader-book-input").value;
    const pages = document.getElementById("reader-pages-input").value;
    const insight = document.getElementById("reader-insight-input").value;
    const action = document.getElementById("reader-action-input").value;

    if (!bookTitle || !insight) {
      alert("Please enter the book title and your captured insight.");
      return;
    }

    const res = StorageManager.addReadingLog({
      bookTitle,
      author: "",
      pagesRead: parseInt(pages) || 15,
      insight,
      actionItem: action
    });

    this.state = res.state || res;
    SoundFX.playSuccess();
    document.getElementById("reader-book-input").value = "";
    document.getElementById("reader-pages-input").value = "";
    document.getElementById("reader-insight-input").value = "";
    document.getElementById("reader-action-input").value = "";
    this.renderReadingAcademy();
    this.renderHQ();
    this.renderRankBanner();
    this.renderRanksView();
    this.renderRadarChart();
    if (res.promoResult) this.showPromotionModal(res.promoResult);
  },

  renderFitnessDept() {
    const exList = document.getElementById("fitness-exercise-library");
    if (exList) {
      exList.innerHTML = EGYM_DATA.exerciseLibrary.map(ex => `
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
            <strong style="font-size:0.95rem; color:#FFFFFF;">${this.escapeHTML(ex.name)}</strong>
            <span style="font-size:0.75rem; color:var(--accent-emerald);">${ex.defaultSets} sets × ${ex.defaultReps}</span>
          </div>
          <div style="font-size:0.75rem; color:var(--text-gold); margin-bottom:0.35rem;">${ex.category} • ${ex.difficulty}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${this.escapeHTML(ex.cues)}</div>
        </div>
      `).join("");
    }

    // Workout history
    const historyCont = document.getElementById("fitness-workout-history");
    if (historyCont) {
      if (this.state.workoutLog.length === 0) {
        historyCont.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No workouts logged yet.</p>`;
      } else {
        historyCont.innerHTML = this.state.workoutLog.map(wl => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; margin-bottom:0.75rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
              <strong style="color:var(--text-gold); font-size:0.95rem;">${this.escapeHTML(wl.exerciseName)}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">${wl.date} • RPE: ${wl.rpe}/10</span>
            </div>
            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem;">
              ${wl.sets.map(s => `${s.reps}`).join(" | ")}
            </div>
            ${wl.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">Notes: ${this.escapeHTML(wl.notes)}</div>` : ''}
          </div>
        `).join("");
      }
    }
  },

  submitWorkoutEntry() {
    const exerciseName = document.getElementById("workout-name-input").value;
    const sets = document.getElementById("workout-sets-input").value;
    const notes = document.getElementById("workout-notes-input").value;

    if (!exerciseName) {
      alert("Please enter exercise name or session title.");
      return;
    }

    const res = StorageManager.addWorkoutLog({
      exerciseName,
      sets: [{ reps: sets || "3 sets complete", weight: "Standard" }],
      rpe: 8,
      notes
    });

    this.state = res.state || res;
    SoundFX.playSuccess();
    document.getElementById("workout-name-input").value = "";
    document.getElementById("workout-sets-input").value = "";
    document.getElementById("workout-notes-input").value = "";
    this.renderFitnessDept();
    this.renderHQ();
    this.renderRankBanner();
    this.renderRanksView();
    this.renderRadarChart();
    if (res.promoResult) this.showPromotionModal(res.promoResult);
  },

  renderWritingStudio() {
    const promptsCont = document.getElementById("writing-prompts-container");
    if (promptsCont) {
      promptsCont.innerHTML = EGYM_DATA.writingPrompts.map(p => `
        <div class="prompt-card" onclick="App.applyWritingPrompt('${p.id}')">
          <div class="prompt-card-title">${this.escapeHTML(p.title)}</div>
          <div class="prompt-card-body">${this.escapeHTML(p.prompt)}</div>
        </div>
      `).join("");
    }

    // Saved drafts
    const draftsCont = document.getElementById("writing-saved-drafts");
    if (draftsCont) {
      if (this.state.writingDrafts.length === 0) {
        draftsCont.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem;">No drafts saved yet.</p>`;
      } else {
        draftsCont.innerHTML = this.state.writingDrafts.map(d => `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:0.85rem; margin-bottom:0.5rem; cursor:pointer;" onclick="App.loadWritingDraft('${d.id}')">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
              <strong style="color:var(--text-gold); font-size:0.85rem;">${this.escapeHTML(d.title)}</strong>
              <span style="font-size:0.7rem; color:var(--text-muted);">${d.wordCount} words</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this.escapeHTML(d.content)}</div>
          </div>
        `).join("");
      }
    }
  },

  applyWritingPrompt(promptId) {
    const p = EGYM_DATA.writingPrompts.find(item => item.id === promptId);
    if (!p) return;
    const titleInput = document.getElementById("writing-editor-title");
    const textArea = document.getElementById("writing-editor-body");
    if (titleInput && textArea) {
      titleInput.value = p.title;
      textArea.value = `[Prompt: ${p.prompt}]\n\n`;
      this.updateWordCount();
      textArea.focus();
      SoundFX.playClick();
    }
  },

  loadWritingDraft(draftId) {
    const d = this.state.writingDrafts.find(item => item.id === draftId);
    if (!d) return;
    const titleInput = document.getElementById("writing-editor-title");
    const textArea = document.getElementById("writing-editor-body");
    if (titleInput && textArea) {
      titleInput.value = d.title;
      textArea.value = d.content;
      this.updateWordCount();
      SoundFX.playClick();
    }
  },

  saveCurrentDraft() {
    const title = document.getElementById("writing-editor-title").value || "Untitled Synthesis";
    const content = document.getElementById("writing-editor-body").value;
    if (!content.trim()) {
      alert("Draft is empty.");
      return;
    }
    const res = StorageManager.saveWritingDraft(title, content);
    this.state = res.state || res;
    SoundFX.playSuccess();
    this.renderWritingStudio();
    this.renderHQ();
    this.renderRankBanner();
    this.renderRanksView();
    this.renderRadarChart();
    if (res.promoResult) {
      this.showPromotionModal(res.promoResult);
    } else {
      alert("Draft saved to Writing Studio archive!");
    }
  },

  updateWordCount() {
    const textArea = document.getElementById("writing-editor-body");
    const wcEl = document.getElementById("writing-word-count");
    if (textArea && wcEl) {
      const words = textArea.value.trim() ? textArea.value.trim().split(/\s+/).length : 0;
      wcEl.textContent = `${words} words`;
    }
  },

  // -------------------------------------------------------------
  // Focus Pomodoro Timer (Execution Dept)
  // -------------------------------------------------------------
  setupFocusTimer() {
    const display = document.getElementById("timer-display");
    const toggleBtn = document.getElementById("timer-toggle-btn");
    const resetBtn = document.getElementById("timer-reset-btn");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleTimer());
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetTimer());
    }

    document.querySelectorAll(".timer-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".timer-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const minutes = parseInt(pill.getAttribute("data-minutes")) || 25;
        this.setTimerPreset(minutes);
      });
    });

    this.updateTimerDisplay();
  },

  setTimerPreset(minutes) {
    this.pauseTimer();
    this.timerInitialSeconds = minutes * 60;
    this.timerSecondsLeft = this.timerInitialSeconds;
    this.updateTimerDisplay();
    SoundFX.playClick();
  },

  toggleTimer() {
    if (this.timerRunning) {
      this.pauseTimer();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    this.timerRunning = true;
    SoundFX.playGong();
    const toggleBtn = document.getElementById("timer-toggle-btn");
    if (toggleBtn) toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Session`;

    this.timerInterval = setInterval(() => {
      this.timerSecondsLeft--;
      this.updateTimerDisplay();

      if (this.timerSecondsLeft <= 0) {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        SoundFX.playGong();
        alert("Deep Work Block Complete! Honor the boundary and take a break.");
        this.state.stats.unrealPoints += 50;
        StorageManager.saveState(this.state);
        this.renderHQ();
        this.resetTimer();
      }
    }, 1000);
  },

  pauseTimer() {
    this.timerRunning = false;
    clearInterval(this.timerInterval);
    const toggleBtn = document.getElementById("timer-toggle-btn");
    if (toggleBtn) toggleBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Start Focus Block`;
  },

  resetTimer() {
    this.pauseTimer();
    this.timerSecondsLeft = this.timerInitialSeconds;
    this.updateTimerDisplay();
  },

  updateTimerDisplay() {
    const display = document.getElementById("timer-display");
    if (!display) return;
    const mins = Math.floor(this.timerSecondsLeft / 60);
    const secs = this.timerSecondsLeft % 60;
    display.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  // -------------------------------------------------------------
  // Profile & Development Record
  // -------------------------------------------------------------
  renderProfile() {
    const { profile, stats, achievements, enrolledChallenges } = this.state;

    const nameEl = document.getElementById("profile-name");
    if (nameEl) nameEl.textContent = profile.name;

    const handleEl = document.getElementById("profile-handle");
    if (handleEl) handleEl.textContent = `${profile.handle} • Member since ${profile.memberSince}`;

    const tierEl = document.getElementById("profile-tier-badge");
    if (tierEl) tierEl.textContent = profile.tier;

    const bioEl = document.getElementById("profile-bio");
    if (bioEl) bioEl.textContent = profile.bio;

    // Badges / Achievements
    const achCont = document.getElementById("profile-achievements-grid");
    if (achCont) {
      achCont.innerHTML = achievements.map(a => `
        <div style="background:var(--bg-card); border:1px solid var(--border-gold); border-radius:var(--radius-lg); padding:1.25rem; display:flex; align-items:center; gap:1rem;">
          <div style="width:40px; height:40px; border-radius:50%; background:rgba(212,175,55,0.15); display:flex; align-items:center; justify-content:center; color:var(--text-gold); flex-shrink:0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
          </div>
          <div>
            <div style="font-weight:700; color:#FFFFFF; font-size:0.95rem;">${this.escapeHTML(a.title)}</div>
            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.15rem;">${this.escapeHTML(a.desc)}</div>
            <div style="font-size:0.65rem; color:var(--text-gold); margin-top:0.25rem; text-transform:uppercase; font-weight:600;">Unlocked ${a.unlockedAt}</div>
          </div>
        </div>
      `).join("");
    }

    // Protocol certificates
    const certCont = document.getElementById("profile-certificates-list");
    if (certCont) {
      certCont.innerHTML = enrolledChallenges.map(enc => {
        const cDef = EGYM_DATA.challenges.find(c => c.id === enc.challengeId);
        if (!cDef) return "";
        return `
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1rem; display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
            <div>
              <div style="font-weight:700; color:#FFFFFF;">${this.escapeHTML(cDef.title)}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Enrolled on ${enc.startedAt} • Current: Day ${enc.currentDay}/${cDef.durationDays}</div>
            </div>
            <button class="btn btn-outline-gold" style="font-size:0.75rem; padding:0.35rem 0.85rem;" onclick="App.openCertificateModal('${cDef.id}')">View Credential</button>
          </div>
        `;
      }).join("");
    }
  },

  openCertificateModal(challengeId) {
    const c = EGYM_DATA.challenges.find(item => item.id === challengeId);
    if (!c) return;

    const certTitle = document.getElementById("cert-challenge-title");
    const certRecipient = document.getElementById("cert-recipient-name");
    const certId = document.getElementById("cert-hash-id");
    const certDate = document.getElementById("cert-issue-date");

    if (certTitle) certTitle.textContent = c.title;
    if (certRecipient) certRecipient.textContent = this.state.profile.name;
    if (certId) certId.textContent = `UNREAL-ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    if (certDate) certDate.textContent = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    this.openModal("certificate-modal");
  },

  // -------------------------------------------------------------
  // Membership View
  // -------------------------------------------------------------
  renderMembership() {
    const grid = document.getElementById("membership-tiers-grid");
    if (!grid) return;

    const currentTier = this.state.profile.tier || "Member";

    grid.innerHTML = EGYM_DATA.membershipTiers.map(t => {
      const isCurrent = t.name.toLowerCase() === currentTier.toLowerCase();
      return `
        <div class="tier-card ${t.highlight ? 'featured' : ''}">
          ${t.badge ? `<div class="tier-badge">${t.badge}</div>` : ''}
          <div class="tier-name">${t.name}</div>
          <div class="tier-who">${t.who}</div>
          <div class="tier-price-wrap">
            <span class="tier-price">${t.price}</span>
            <span class="tier-cadence">${t.cadence}</span>
          </div>
          <ul class="tier-features">
            ${t.features.map(f => `
              <li class="tier-feature-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${this.escapeHTML(f)}</span>
              </li>
            `).join("")}
          </ul>
          <button class="btn ${isCurrent ? 'btn-secondary' : 'btn-primary'}" ${isCurrent ? 'disabled' : ''} onclick="App.selectTier('${t.name}')">
            ${isCurrent ? 'Current Active Tier' : `Select ${t.name}`}
          </button>
        </div>
      `;
    }).join("");
  },

  selectTier(tierName) {
    this.state = StorageManager.setTier(tierName);
    SoundFX.playSuccess();
    this.renderTopBar();
    this.renderMembership();
    this.renderProfile();
    alert(`Membership updated to ${tierName}! Welcome to your expanded institutional access.`);
  },

  // -------------------------------------------------------------
  // Modals & Forms
  // -------------------------------------------------------------
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("open");
      SoundFX.playClick();
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("open");
      SoundFX.playClick();
    }
  },

  openAddObjectiveModal() {
    document.getElementById("new-obj-title").value = "";
    this.openModal("add-objective-modal");
  },

  submitAddObjective() {
    const title = document.getElementById("new-obj-title").value.trim();
    const dimension = document.getElementById("new-obj-dimension").value;
    const timeEst = document.getElementById("new-obj-time").value.trim() || "15m";

    if (!title) {
      alert("Please enter objective description.");
      return;
    }

    this.state = StorageManager.addTodayObjective(title, dimension, timeEst);
    SoundFX.playSuccess();
    this.closeModal("add-objective-modal");
    this.renderHQ();
    this.renderRadarChart();
  },

  // -------------------------------------------------------------
  // Profile Customization
  // -------------------------------------------------------------
  openEditProfileModal() {
    document.getElementById("edit-profile-name").value = this.state.profile.name || "";
    document.getElementById("edit-profile-handle").value = this.state.profile.handle || "";
    document.getElementById("edit-profile-bio").value = this.state.profile.bio || "";
    this.openModal("edit-profile-modal");
  },

  submitEditProfile() {
    const name = document.getElementById("edit-profile-name").value;
    const handle = document.getElementById("edit-profile-handle").value;
    const bio = document.getElementById("edit-profile-bio").value;

    this.state = StorageManager.updateProfile(name, handle, bio);
    SoundFX.playSuccess();
    this.closeModal("edit-profile-modal");
    this.renderProfile();
    this.renderTopBar();
    alert("Dossier profile updated!");
  },

  // -------------------------------------------------------------
  // Data Backup & Reset
  // -------------------------------------------------------------
  openSettingsModal() {
    this.openModal("settings-modal");
  },

  exportBackup() {
    StorageManager.exportBackup();
    SoundFX.playSuccess();
  },

  importBackupFile(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const res = StorageManager.importBackup(e.target.result);
      if (res.success) {
        SoundFX.playSuccess();
        this.renderAll();
        this.closeModal("settings-modal");
        alert("State successfully restored from backup!");
      } else {
        alert("Import failed: " + res.message);
      }
    };
    reader.readAsText(file);
  },

  async resetAllData() {
    if (confirm("Are you sure you want to reset all progress to the default starting blueprint?")) {
      this.state = await StorageManager.resetToDefault();
      SoundFX.playClick();
      this.renderAll();
      this.closeModal("settings-modal");
      alert("Platform reset to clean baseline.");
    }
  },

  // Global bindings
  bindGlobalEvents() {
    // Arena Filter pills
    document.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const filter = btn.getAttribute("data-filter");
        this.renderChallengeArena(filter);
      });
    });

    // Editor textarea auto word count
    const editor = document.getElementById("writing-editor-body");
    if (editor) {
      editor.addEventListener("input", () => this.updateWordCount());
    }

    // Modal background click to close
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          overlay.classList.remove("open");
        }
      });
    });
  },

  // -------------------------------------------------------------
  // Promotion Ceremony Celebration Modal
  // -------------------------------------------------------------
  showPromotionModal(newRank) {
    if (!newRank) return;
    const emblemCont = document.getElementById("promo-modal-emblem");
    if (emblemCont) {
      emblemCont.innerHTML = ProgressionEngine.getEmblemSVG(newRank.id, 130);
    }

    const titleEl = document.getElementById("promo-modal-title");
    if (titleEl) titleEl.textContent = newRank.title;

    const taglineEl = document.getElementById("promo-modal-tagline");
    if (taglineEl) taglineEl.textContent = newRank.tagline;

    const proofCont = document.getElementById("promo-modal-proof-grid");
    if (proofCont) {
      proofCont.innerHTML = `
        <div class="promo-proof-item"><span>✓</span> <span>${(newRank.min_xp || 0).toLocaleString()} XP Verified</span></div>
        <div class="promo-proof-item"><span>✓</span> <span>${newRank.min_streak || 0} Days Streak Satisfied</span></div>
        <div class="promo-proof-item"><span>✓</span> <span>${newRank.min_objectives || 0} Objectives Executed</span></div>
        <div class="promo-proof-item"><span>✓</span> <span>${newRank.min_dimensions_count || 0} Domains Balanced</span></div>
      `;
    }

    const perksCont = document.getElementById("promo-modal-perks");
    if (perksCont && newRank.perks) {
      perksCont.innerHTML = newRank.perks.map(p => `<li>${this.escapeHTML(p)}</li>`).join("");
    }

    // Acoustic institutional celebration
    SoundFX.playSuccess();
    setTimeout(() => SoundFX.playGong(), 250);

    this.openModal("promotion-modal");
  },

  closePromotionModal() {
    this.closeModal("promotion-modal");
    SoundFX.playClick();
    this.renderAll();
  },

  // -------------------------------------------------------------
  // Admin Management Suite
  // -------------------------------------------------------------
  openAdminModal() {
    this.openModal("admin-modal");
    this.renderAdminRanks();
    this.renderAdminLedger();
    this.renderAdminSimulator();
  },

  switchAdminTab(tabName) {
    document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
    const btn = document.getElementById(`admin-tab-btn-${tabName}`);
    if (btn) btn.classList.add("active");

    document.querySelectorAll(".admin-tab-content").forEach(c => c.classList.add("hidden"));
    const content = document.getElementById(`admin-tab-${tabName}`);
    if (content) content.classList.remove("hidden");
    SoundFX.playClick();
  },

  async refreshAdminSuite() {
    const key = document.getElementById("admin-key-input")?.value || "egym_admin_2026";
    const auditData = await StorageManager.fetchAdminAudit(key);
    if (auditData) {
      if (auditData.ranks) {
        ProgressionEngine.cachedRanks = auditData.ranks;
      }
      alert(`Admin edge sync successful: ${auditData.members?.length || 0} members & ${auditData.recentLedger?.length || 0} ledger transactions loaded.`);
      this.renderAdminRanks();
      this.renderAdminLedger(auditData.recentLedger);
      this.renderAdminSimulator();
      this.renderAll();
    } else {
      alert("Failed to connect with Edge D1. Verify admin key or server state.");
    }
  },

  renderAdminRanks() {
    const cont = document.getElementById("admin-ranks-editor-list");
    if (!cont) return;
    const ranks = ProgressionEngine.getRanks();

    cont.innerHTML = ranks.map(r => `
      <div class="admin-rank-card" id="admin-card-${r.id}">
        <div class="admin-rank-header">
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div style="width:36px; height:36px;">${ProgressionEngine.getEmblemSVG(r.id, 36)}</div>
            <div>
              <strong style="color:#FFFFFF; font-size:0.95rem;">${this.escapeHTML(r.title)}</strong>
              <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); margin-left:0.5rem;">ID: ${r.id} (Level ${r.level})</span>
            </div>
          </div>
          <button class="btn btn-outline-gold" style="font-size:0.72rem; padding:0.3rem 0.75rem;" onclick="App.saveAdminRank('${r.id}')">Save Thresholds</button>
        </div>
        <div class="admin-rank-inputs-grid">
          <div class="admin-input-group">
            <label>Min Unreal XP</label>
            <input type="number" id="adm-${r.id}-xp" value="${r.min_xp}">
          </div>
          <div class="admin-input-group">
            <label>Min Streak (Days)</label>
            <input type="number" id="adm-${r.id}-streak" value="${r.min_streak}">
          </div>
          <div class="admin-input-group">
            <label>Min Protocols</label>
            <input type="number" id="adm-${r.id}-challenges" value="${r.min_challenges}">
          </div>
          <div class="admin-input-group">
            <label>Min Objectives Done</label>
            <input type="number" id="adm-${r.id}-obj" value="${r.min_objectives}">
          </div>
          <div class="admin-input-group">
            <label>Multi-Dims Count</label>
            <input type="number" id="adm-${r.id}-dim-count" value="${r.min_dimensions_count}">
          </div>
          <div class="admin-input-group">
            <label>Min Dim Score (%)</label>
            <input type="number" id="adm-${r.id}-dim-score" value="${r.min_dimension_score}">
          </div>
          <div class="admin-input-group" style="grid-column: span 2;">
            <label>Tagline</label>
            <input type="text" id="adm-${r.id}-tagline" value="${this.escapeHTML(r.tagline)}">
          </div>
        </div>
      </div>
    `).join("");
  },

  async saveAdminRank(rankId) {
    const r = ProgressionEngine.getRankById(rankId);
    if (!r) return;

    r.min_xp = parseInt(document.getElementById(`adm-${rankId}-xp`)?.value) || 0;
    r.min_streak = parseInt(document.getElementById(`adm-${rankId}-streak`)?.value) || 0;
    r.min_challenges = parseInt(document.getElementById(`adm-${rankId}-challenges`)?.value) || 0;
    r.min_objectives = parseInt(document.getElementById(`adm-${rankId}-obj`)?.value) || 0;
    r.min_dimensions_count = parseInt(document.getElementById(`adm-${rankId}-dim-count`)?.value) || 0;
    r.min_dimension_score = parseInt(document.getElementById(`adm-${rankId}-dim-score`)?.value) || 0;
    r.tagline = document.getElementById(`adm-${rankId}-tagline`)?.value || r.tagline;

    const key = document.getElementById("admin-key-input")?.value || "egym_admin_2026";
    const resp = await StorageManager.saveAdminRankConfig(r, key);
    if (resp && resp.success) {
      SoundFX.playSuccess();
      alert(`Rank '${r.title}' criteria updated and saved to Edge D1 successfully!`);
    } else {
      alert(`Rank '${r.title}' criteria saved in local memory.`);
    }
    this.renderAll();
  },

  renderAdminLedger(serverLedger = null) {
    const tbody = document.getElementById("admin-ledger-tbody");
    if (!tbody) return;
    const ledger = serverLedger || this.state.xpLedger || [];

    if (ledger.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No XP ledger transactions recorded yet. Complete an objective to generate verifiable transactions.</td></tr>`;
      return;
    }

    tbody.innerHTML = ledger.slice(0, 30).map(tx => `
      <tr>
        <td class="tx-id-mono">${this.escapeHTML(tx.txId || tx.id || 'tx_gen')}</td>
        <td><span class="dimension-tag dim-execution">${tx.sourceType || 'system'}</span></td>
        <td style="color:var(--text-gold); font-weight:700;">+${tx.amount} XP</td>
        <td>${this.escapeHTML(tx.desc || tx.description || 'Award')}</td>
        <td><span style="color:var(--accent-emerald); font-weight:600;">✓ Verified</span></td>
        <td style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted);">${tx.timestamp ? new Date(tx.timestamp).toLocaleTimeString() : 'Recent'}</td>
      </tr>
    `).join("");
  },

  renderAdminSimulator() {
    const cont = document.getElementById("admin-simulator-details");
    if (!cont) return;
    const evaluation = ProgressionEngine.evaluate(this.state);

    cont.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-card); padding:1rem; border-radius:var(--radius-md); border:1px solid var(--border-subtle);">
        <div>
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Evaluated Current Standing</div>
          <strong style="font-size:1.2rem; color:var(--text-gold);">${evaluation.currentRank.title} (Level ${evaluation.currentRank.level})</strong>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:0.2rem;">Next Target: ${evaluation.nextRank ? evaluation.nextRank.title : 'Apex Legend'} (${evaluation.progressPct}%)</div>
        </div>
        <button class="btn btn-primary" onclick="App.testSimulatePromotion('${evaluation.nextRank ? evaluation.nextRank.id : 'legend'}')">Test Promotion Ceremony</button>
      </div>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1rem;">
        <div style="background:var(--bg-card); padding:0.85rem; border-radius:var(--radius-md);">
          <div style="font-size:0.7rem; color:var(--text-muted);">SIMULATE XP INJECTION</div>
          <button class="btn btn-secondary" style="width:100%; margin-top:0.5rem; font-size:0.75rem;" onclick="App.simulateAddXP(500)">+500 Unreal XP</button>
        </div>
        <div style="background:var(--bg-card); padding:0.85rem; border-radius:var(--radius-md);">
          <div style="font-size:0.7rem; color:var(--text-muted);">SIMULATE STREAK INJECTION</div>
          <button class="btn btn-secondary" style="width:100%; margin-top:0.5rem; font-size:0.75rem;" onclick="App.simulateAddStreak(7)">+7 Days Streak</button>
        </div>
        <div style="background:var(--bg-card); padding:0.85rem; border-radius:var(--radius-md);">
          <div style="font-size:0.7rem; color:var(--text-muted);">SIMULATE RADAR BOOST</div>
          <button class="btn btn-secondary" style="width:100%; margin-top:0.5rem; font-size:0.75rem;" onclick="App.simulateBoostRadar(10)">+10% All Dimensions</button>
        </div>
      </div>
    `;
  },

  testSimulatePromotion(targetRankId) {
    const rank = ProgressionEngine.getRankById(targetRankId) || ProgressionEngine.getRanks()[1];
    this.closeModal("admin-modal");
    this.showPromotionModal(rank);
  },

  simulateAddXP(amt) {
    const res = ProgressionEngine.awardXP(this.state, amt, "admin_simulation", `sim_${Date.now()}`, `Admin simulated test injection`);
    StorageManager.saveState(this.state);
    SoundFX.playSuccess();
    if (res.promotionOccurred) {
      this.closeModal("admin-modal");
      this.showPromotionModal(res.newRank);
    } else {
      this.renderAdminSimulator();
      this.renderAdminLedger();
      this.renderAll();
    }
  },

  simulateAddStreak(days) {
    this.state.stats.currentStreak += days;
    if (this.state.stats.currentStreak > this.state.stats.longestStreak) {
      this.state.stats.longestStreak = this.state.stats.currentStreak;
    }
    const promo = ProgressionEngine.checkAndApplyPromotion(this.state);
    StorageManager.saveState(this.state);
    SoundFX.playSuccess();
    if (promo.promoted) {
      this.closeModal("admin-modal");
      this.showPromotionModal(promo.newRank);
    } else {
      this.renderAdminSimulator();
      this.renderAll();
    }
  },

  simulateBoostRadar(amt) {
    Object.keys(this.state.dimensionsRadar).forEach(dim => {
      this.state.dimensionsRadar[dim] = Math.min(100, (this.state.dimensionsRadar[dim] || 50) + amt);
    });
    const promo = ProgressionEngine.checkAndApplyPromotion(this.state);
    StorageManager.saveState(this.state);
    SoundFX.playSuccess();
    if (promo.promoted) {
      this.closeModal("admin-modal");
      this.showPromotionModal(promo.newRank);
    } else {
      this.renderAdminSimulator();
      this.renderAll();
    }
  },

  escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
};
