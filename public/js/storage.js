// E-GYM Multi-Device State Management
// Assigns each device/user an isolated Member UUID with Cloudflare Edge D1 Sync + LocalStorage

const STORAGE_KEY = "EGYM_MEMBER_STATE_V3";
const MEMBER_ID_KEY = "EGYM_MEMBER_UUID";
const SESSION_KEY = "EGYM_AUTH_SESSION";
const SESSION_TOKEN_KEY = "EGYM_SESSION_TOKEN";

class StorageManager {
  static isLoggedIn() {
    return !!localStorage.getItem(SESSION_KEY);
  }

  static getSessionToken() {
    return localStorage.getItem(SESSION_TOKEN_KEY) || "";
  }

  static getSession() {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static isAdmin() {
    const session = this.getSession();
    return !!(session && (session.isAdmin || session.is_admin === 1));
  }

  static async login(identifier, password) {
    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.token) {
          localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        }
        if (data.member) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.member));
          localStorage.setItem(MEMBER_ID_KEY, data.member.id);
          const state = this.getState();
          state.profile.name = data.member.name;
          state.profile.handle = data.member.handle;
          state.profile.tier = data.member.tier;
          state.currentRankId = data.member.currentRankId || "recruit";
          this.saveLocalState(state);
          await this.initCloudSync();
          return { success: true, member: data.member };
        }
      } else {
        const err = await resp.json();
        return { success: false, error: err.error || "Login failed" };
      }
    } catch (e) {
      console.warn("Edge login fallback:", e);
    }

    // Local fallback
    const state = this.getState();
    const cleanId = identifier.trim();
    const handle = cleanId.startsWith("@") ? cleanId : "@" + cleanId.split("@")[0];
    state.profile.handle = handle;
    const session = {
      id: this.getMemberId(),
      name: state.profile.name || cleanId,
      handle,
      isAdmin: handle.toLowerCase() === "@admin" || handle.toLowerCase() === "@founder",
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.saveState(state);
    return { success: true, member: session };
  }

  static async register(name, handle, email, password, focus) {
    try {
      const resp = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handle, email, password, focus })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.token) localStorage.setItem(SESSION_TOKEN_KEY, data.token);
        if (data.member) {
          localStorage.setItem(SESSION_KEY, JSON.stringify(data.member));
          localStorage.setItem(MEMBER_ID_KEY, data.member.id);
        }
        const cleanState = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
        cleanState.profile.name = name.trim();
        cleanState.profile.handle = handle.startsWith("@") ? handle.trim() : "@" + handle.trim();
        cleanState.profile.bio = `Committed to developing every dimension. Focused on ${focus || 'deliberate execution'}.`;
        this.saveState(cleanState);
        return { success: true, member: data.member || cleanState.profile };
      } else {
        const err = await resp.json();
        return { success: false, error: err.error || "Registration failed" };
      }
    } catch (e) {
      console.warn("Edge register fallback:", e);
    }

    // Offline fallback
    const cleanState = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
    cleanState.profile.name = name.trim();
    cleanState.profile.handle = handle.startsWith("@") ? handle.trim() : "@" + handle.trim();
    const session = {
      id: this.getMemberId(),
      name: cleanState.profile.name,
      handle: cleanState.profile.handle,
      isAdmin: cleanState.profile.handle.toLowerCase() === "@admin" || cleanState.profile.handle.toLowerCase() === "@founder",
      loggedInAt: new Date().toISOString()
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.saveState(cleanState);
    return { success: true, member: session };
  }

  static async logout() {
    const token = this.getSessionToken();
    if (token) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "x-session-token": token }
        });
      } catch (e) {}
    }
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
  }

  static getMemberId() {
    const session = this.getSession();
    if (session && session.id) return session.id;
    let id = localStorage.getItem(MEMBER_ID_KEY);
    if (!id) {
      const randPart = typeof crypto.randomUUID === "function" 
        ? crypto.randomUUID() 
        : Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      id = "mem_" + randPart;
      localStorage.setItem(MEMBER_ID_KEY, id);
    }
    return id;
  }

  static async initCloudSync() {
    const memberId = this.getMemberId();
    try {
      const resp = await fetch("/api/state", {
        headers: { "x-member-id": memberId }
      });

      if (resp.ok) {
        const cloudData = await resp.json();
        if (cloudData && cloudData.profile) {
          console.log("[E-GYM Edge] Loaded member state from Cloudflare D1.");
          this.saveLocalState(cloudData);
          return cloudData;
        }
      } else if (resp.status === 404) {
        // Brand new member on this device: initialize clean state and sync
        console.log("[E-GYM Edge] New member detected. Initializing fresh edge record.");
        const cleanState = this.getState();
        await this.syncToCloud(cleanState);
        return cleanState;
      }
    } catch (e) {
      console.log("[E-GYM Local] Running local-first mode on device.");
    }
    return this.getState();
  }

  static getState() {
    let state = null;
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        state = JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
    }
    if (!state) {
      state = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
      this.saveLocalState(state);
    }
    // Ensure rank and progression state structures exist
    if (!state.currentRankId) state.currentRankId = "recruit";
    if (!Array.isArray(state.rankHistory)) {
      state.rankHistory = [
        { rankId: "recruit", promotedAt: new Date().toISOString(), triggerReason: "Candidate Enrollment" }
      ];
    }
    if (!Array.isArray(state.xpLedger)) {
      state.xpLedger = [];
    }
    if (!Array.isArray(state.communityPosts)) {
      state.communityPosts = [];
    }
    if (!Array.isArray(state.accountabilityPartners)) {
      state.accountabilityPartners = [];
    }
    if (typeof state.assessmentCompleted !== "boolean") {
      state.assessmentCompleted = false;
    }
    if (!Array.isArray(state.eveningReflections)) {
      state.eveningReflections = [];
    }
    return state;
  }

  static saveLocalState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }

  static async syncToCloud(state) {
    this.saveLocalState(state);
    const memberId = this.getMemberId();
    const token = this.getSessionToken();
    try {
      await fetch("/api/state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-member-id": memberId,
          "x-session-token": token,
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(state)
      });
    } catch (e) {}
  }

  static saveState(state) {
    this.syncToCloud(state);
  }

  static updateProfile(name, handle, bio) {
    const state = this.getState();
    if (name) state.profile.name = name.trim();
    if (handle) state.profile.handle = handle.startsWith("@") ? handle.trim() : "@" + handle.trim();
    if (bio) state.profile.bio = bio.trim();
    this.saveState(state);
    return state;
  }

  static updateTodayObjective(objectiveId, completed) {
    const state = this.getState();
    const obj = state.todayObjectives.find(o => o.id === objectiveId);
    let promoResult = null;
    if (obj) {
      obj.completed = completed;
      const todayStr = new Date().toISOString().split("T")[0];
      const priorityXP = { critical: 30, high: 20, medium: 15, low: 10 };
      const xpAmt = priorityXP[obj.priority] || 15;

      if (completed) {
        state.stats.totalObjectivesDone += 1;
        if (typeof ProgressionEngine !== "undefined") {
          const res = ProgressionEngine.awardXP(state, xpAmt, "objective", `${obj.id}_${todayStr}`, `[${(obj.priority || 'standard').toUpperCase()}] Objective: ${obj.title}`);
          if (res.promotionOccurred) promoResult = res.newRank;
        } else {
          state.stats.unrealPoints += xpAmt;
        }
        if (obj.dimension && state.dimensionsRadar[obj.dimension] !== undefined) {
          state.dimensionsRadar[obj.dimension] = Math.min(100, (state.dimensionsRadar[obj.dimension] || 50) + 2);
        }
      } else {
        state.stats.totalObjectivesDone = Math.max(0, state.stats.totalObjectivesDone - 1);
        state.stats.unrealPoints = Math.max(0, state.stats.unrealPoints - xpAmt);
      }
      this.saveState(state);
    }
    return { state, promoResult };
  }

  static addTodayObjective(title, dimension = "execution", priority = "medium", dueTime = "Today", timeEst = "15m") {
    const state = this.getState();
    const newObj = {
      id: "obj-" + Date.now(),
      title: title.trim(),
      dimension: dimension || "execution",
      priority: priority || "medium",
      dueTime: dueTime || "Today",
      timeEst: timeEst || "15m",
      postponedCount: 0,
      completed: false,
      date: new Date().toISOString().split("T")[0],
      isCustom: true
    };
    state.todayObjectives.push(newObj);
    this.saveState(state);
    return state;
  }

  static postponeObjective(objectiveId) {
    const state = this.getState();
    const obj = state.todayObjectives.find(o => o.id === objectiveId);
    if (obj) {
      obj.postponedCount = (obj.postponedCount || 0) + 1;
      obj.dueTime = "Tomorrow";
      this.saveState(state);
    }
    return state;
  }

  static deleteTodayObjective(objectiveId) {
    const state = this.getState();
    state.todayObjectives = state.todayObjectives.filter(o => o.id !== objectiveId);
    this.saveState(state);
    return state;
  }

  static saveAssessment(answers, baselineRadar, priorityDimensions) {
    const state = this.getState();
    state.assessmentCompleted = true;
    state.assessment = {
      answers,
      baselineRadar,
      priorityDimensions,
      completedAt: new Date().toISOString()
    };
    // Update radar values
    Object.keys(baselineRadar).forEach(dim => {
      if (state.dimensionsRadar[dim] !== undefined) {
        state.dimensionsRadar[dim] = baselineRadar[dim];
      }
    });

    // Award +50 XP for completing intake calibration
    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const res = ProgressionEngine.awardXP(state, 50, "assessment", `asmt_${this.getMemberId()}`, "8-Dimension Intake Calibration Standard");
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 50;
    }

    this.saveState(state);
    return { state, promoResult };
  }

  static saveEveningReflection(winSummary, frictionSummary, tomorrowTarget) {
    const state = this.getState();
    const todayStr = new Date().toISOString().split("T")[0];
    if (!Array.isArray(state.eveningReflections)) {
      state.eveningReflections = [];
    }

    const ref = {
      id: "ref-" + Date.now(),
      reflectionDate: todayStr,
      winSummary: winSummary.trim(),
      frictionSummary: frictionSummary.trim(),
      tomorrowTarget: tomorrowTarget.trim(),
      xpAwarded: 25,
      createdAt: new Date().toISOString()
    };

    // Replace if already logged today or push
    const existingIdx = state.eveningReflections.findIndex(r => r.reflectionDate === todayStr);
    if (existingIdx >= 0) {
      state.eveningReflections[existingIdx] = ref;
    } else {
      state.eveningReflections.unshift(ref);
    }

    // Award +25 XP
    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const res = ProgressionEngine.awardXP(state, 25, "reflection", `refl_${this.getMemberId()}_${todayStr}`, "Daily Evening Discipline Reflection");
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 25;
    }

    this.saveState(state);
    return { state, promoResult };
  }

  static enrollChallenge(challengeId) {
    const state = this.getState();
    const existing = state.enrolledChallenges.find(c => c.challengeId === challengeId);
    if (existing) {
      return { success: false, message: "Already enrolled in this protocol." };
    }
    const challenge = EGYM_DATA.challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return { success: false, message: "Challenge not found." };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newEnrollment = {
      challengeId,
      currentDay: 1,
      startedAt: todayStr,
      status: "active",
      checkIns: {}
    };
    state.enrolledChallenges.push(newEnrollment);

    if (challenge.dailyObjectives && challenge.dailyObjectives.length > 0) {
      challenge.dailyObjectives.forEach(dObj => {
        state.todayObjectives.push({
          id: `today-${challengeId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          title: dObj.text,
          dimension: dObj.dimension || "execution",
          challengeId,
          completed: false,
          timeEst: "30m"
        });
      });
    }

    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const res = ProgressionEngine.awardXP(state, 50, "challenge_enroll", challengeId, `Enrolled in protocol: ${challenge.title}`);
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 50;
    }

    this.saveState(state);
    return { success: true, state, promoResult };
  }

  static logChallengeCheckIn(challengeId, note, reflection) {
    const state = this.getState();
    const enrollment = state.enrolledChallenges.find(c => c.challengeId === challengeId);
    if (!enrollment) return { success: false };

    const todayStr = new Date().toISOString().split("T")[0];
    enrollment.checkIns[todayStr] = {
      completed: true,
      note: note || "Daily standard completed.",
      reflection: reflection || "Committed to the process.",
      loggedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    enrollment.currentDay = Math.min(enrollment.currentDay + 1, 100);
    state.stats.currentStreak += 1;
    if (state.stats.currentStreak > state.stats.longestStreak) {
      state.stats.longestStreak = state.stats.currentStreak;
    }

    const challenge = EGYM_DATA.challenges.find(c => c.id === challengeId);
    let certificateIssued = false;
    if (challenge && enrollment.currentDay >= challenge.durationDays && enrollment.status !== "completed") {
      enrollment.status = "completed";
      certificateIssued = true;
      if (!Array.isArray(state.achievements)) state.achievements = [];
      const achId = "ach-cert-" + challengeId;
      if (!state.achievements.some(a => a.id === achId)) {
        state.achievements.push({
          id: achId,
          title: `${challenge.title} Graduate`,
          desc: `Completed all ${challenge.durationDays} days of ${challenge.title}.`,
          unlockedAt: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          icon: "award"
        });
      }
    }

    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const xpAmt = certificateIssued ? 500 : 75;
      const res = ProgressionEngine.awardXP(state, xpAmt, "challenge_checkin", `${challengeId}_${todayStr}`, `Protocol check-in: Day ${enrollment.currentDay}`);
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += certificateIssued ? 500 : 75;
    }

    this.saveState(state);
    return { success: true, state, promoResult, certificateIssued };
  }

  static addReadingLog(entry) {
    const state = this.getState();
    const logItem = {
      id: "rl-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      ...entry
    };
    state.readingLog.unshift(logItem);

    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const res = ProgressionEngine.awardXP(state, 30, "reading_log", logItem.id, `Reading session: ${entry.bookTitle || 'Reading log'}`);
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 30;
    }
    state.dimensionsRadar.intellectual = Math.min(100, state.dimensionsRadar.intellectual + 3);
    this.saveState(state);
    return { state, promoResult };
  }

  static addWorkoutLog(entry) {
    const state = this.getState();
    const workoutItem = {
      id: "wl-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      ...entry
    };
    state.workoutLog.unshift(workoutItem);

    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const res = ProgressionEngine.awardXP(state, 40, "workout_log", workoutItem.id, `Movement session: ${entry.title || 'Workout'}`);
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 40;
    }
    state.dimensionsRadar.physical = Math.min(100, state.dimensionsRadar.physical + 4);
    this.saveState(state);
    return { state, promoResult };
  }

  static saveWritingDraft(title, content) {
    const state = this.getState();
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const existing = state.writingDrafts.find(d => d.title === title);
    const todayStr = new Date().toISOString().split("T")[0];

    if (existing) {
      existing.content = content;
      existing.wordCount = wordCount;
      existing.updatedAt = todayStr;
    } else {
      state.writingDrafts.unshift({
        id: "wd-" + Date.now(),
        title: title || "Untitled Synthesis",
        content,
        wordCount,
        updatedAt: todayStr
      });
    }

    let promoResult = null;
    if (typeof ProgressionEngine !== "undefined") {
      const cleanTitle = (title || "untitled").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
      const res = ProgressionEngine.awardXP(state, 20, "writing_draft", `${cleanTitle}_${todayStr}`, `Synthesis draft: ${title || 'Untitled'}`);
      if (res.promotionOccurred) promoResult = res.newRank;
    } else {
      state.stats.unrealPoints += 20;
    }
    state.dimensionsRadar.creative = Math.min(100, state.dimensionsRadar.creative + 3);
    this.saveState(state);
    return { state, promoResult };
  }

  static setTier(tierName) {
    const state = this.getState();
    state.profile.tier = tierName;
    this.saveState(state);
    return state;
  }

  static async resetToDefault() {
    const defaultState = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
    this.saveLocalState(defaultState);
    const memberId = this.getMemberId();
    try {
      await fetch("/api/reset", {
        method: "POST",
        headers: { "x-member-id": memberId }
      });
    } catch (e) {}
    return defaultState;
  }

  static exportBackup() {
    const state = this.getState();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `egym-backup-${new Date().toISOString().split("T")[0]}.json`);
    dlAnchorElem.click();
  }

  static importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.profile && parsed.dimensionsRadar) {
        this.saveState(parsed);
        return { success: true };
      }
      return { success: false, message: "Invalid backup format." };
    } catch (e) {
      return { success: false, message: "JSON parsing error: " + e.message };
    }
  }

  static async fetchAdminAudit(adminKey = "") {
    const token = this.getSessionToken();
    const headers = {};
    if (token) {
      headers["x-session-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (adminKey) {
      headers["x-admin-key"] = adminKey;
    }
    try {
      const resp = await fetch("/api/ranks/audit", { headers });
      if (resp.ok) return await resp.json();
    } catch (e) {
      console.warn("Audit fetch failed:", e);
    }
    return null;
  }

  static async saveAdminRankConfig(rankObj, adminKey = "") {
    const token = this.getSessionToken();
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["x-session-token"] = token;
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (adminKey) {
      headers["x-admin-key"] = adminKey;
    }
    try {
      const resp = await fetch("/api/ranks", {
        method: "POST",
        headers,
        body: JSON.stringify(rankObj)
      });
      return await resp.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
