// E-GYM LocalStorage State Management
// Handles persistence, state mutations, and backup export/import

const STORAGE_KEY = "EGYM_MEMBER_STATE_V1";

class StorageManager {
  static getState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Failed to read from localStorage:", e);
    }
    // Return deep copy of default state
    const defaultState = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
    this.saveState(defaultState);
    return defaultState;
  }

  static saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }

  static updateTodayObjective(objectiveId, completed) {
    const state = this.getState();
    const obj = state.todayObjectives.find(o => o.id === objectiveId);
    if (obj) {
      obj.completed = completed;
      if (completed) {
        state.stats.totalObjectivesDone += 1;
        state.stats.unrealPoints += 25;
        // bump radar dimension if matches
        if (obj.dimension && state.dimensionsRadar[obj.dimension]) {
          state.dimensionsRadar[obj.dimension] = Math.min(100, state.dimensionsRadar[obj.dimension] + 1);
        }
      } else {
        state.stats.totalObjectivesDone = Math.max(0, state.stats.totalObjectivesDone - 1);
        state.stats.unrealPoints = Math.max(0, state.stats.unrealPoints - 25);
      }
      this.saveState(state);
    }
    return state;
  }

  static addTodayObjective(title, dimension = "execution", timeEst = "15m") {
    const state = this.getState();
    const newObj = {
      id: "custom-" + Date.now(),
      title,
      dimension,
      completed: false,
      timeEst,
      isCustom: true
    };
    state.todayObjectives.push(newObj);
    this.saveState(state);
    return state;
  }

  static enrollChallenge(challengeId) {
    const state = this.getState();
    const existing = state.enrolledChallenges.find(c => c.challengeId === challengeId);
    if (existing) {
      return { success: false, message: "Already enrolled in this challenge." };
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

    // Add challenge's daily objectives to today's objectives
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

    state.stats.unrealPoints += 50;
    this.saveState(state);
    return { success: true, state };
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

    // Increment day if not checked in today previously
    enrollment.currentDay = Math.min(enrollment.currentDay + 1, 100);
    state.stats.currentStreak += 1;
    if (state.stats.currentStreak > state.stats.longestStreak) {
      state.stats.longestStreak = state.stats.currentStreak;
    }
    state.stats.unrealPoints += 75;

    this.saveState(state);
    return { success: true, state };
  }

  static addReadingLog(entry) {
    const state = this.getState();
    const logItem = {
      id: "rl-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      ...entry
    };
    state.readingLog.unshift(logItem);
    state.stats.unrealPoints += 30;
    state.dimensionsRadar.intellectual = Math.min(100, state.dimensionsRadar.intellectual + 2);
    this.saveState(state);
    return state;
  }

  static addWorkoutLog(entry) {
    const state = this.getState();
    const workoutItem = {
      id: "wl-" + Date.now(),
      date: new Date().toISOString().split("T")[0],
      ...entry
    };
    state.workoutLog.unshift(workoutItem);
    state.stats.unrealPoints += 40;
    state.dimensionsRadar.physical = Math.min(100, state.dimensionsRadar.physical + 3);
    this.saveState(state);
    return state;
  }

  static saveWritingDraft(title, content) {
    const state = this.getState();
    const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
    const existing = state.writingDrafts.find(d => d.title === title);

    if (existing) {
      existing.content = content;
      existing.wordCount = wordCount;
      existing.updatedAt = new Date().toISOString().split("T")[0];
    } else {
      state.writingDrafts.unshift({
        id: "wd-" + Date.now(),
        title: title || "Untitled Draft",
        content,
        wordCount,
        updatedAt: new Date().toISOString().split("T")[0]
      });
    }

    state.stats.unrealPoints += 20;
    state.dimensionsRadar.creative = Math.min(100, state.dimensionsRadar.creative + 2);
    this.saveState(state);
    return state;
  }

  static setTier(tierName) {
    const state = this.getState();
    state.profile.tier = tierName;
    this.saveState(state);
    return state;
  }

  static resetToDefault() {
    const defaultState = JSON.parse(JSON.stringify(INITIAL_MEMBER_STATE));
    this.saveState(defaultState);
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
      if (parsed.profile && parsed.enrolledChallenges) {
        this.saveState(parsed);
        return { success: true };
      }
      return { success: false, message: "Invalid backup format." };
    } catch (e) {
      return { success: false, message: "JSON parsing error: " + e.message };
    }
  }
}
