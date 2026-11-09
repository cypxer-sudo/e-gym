// E-GYM Institutional Rank & Progression Engine
// Comprehensive 9-tier hierarchy, criteria evaluation, vector emblems & anti-tamper XP ledger

const DEFAULT_RANKS = [
  {
    id: "recruit",
    level: 1,
    title: "Recruit",
    tagline: "Starting rank for every new member",
    min_xp: 0,
    min_streak: 0,
    min_challenges: 0,
    min_objectives: 0,
    min_dimensions_count: 0,
    min_dimension_score: 0,
    color_primary: "#94A3B8",
    color_secondary: "#475569",
    perks: ["Access to Personal HQ", "Standard Challenge Arena Enrollment", "Basic Habit Tracking"]
  },
  {
    id: "initiate",
    level: 2,
    title: "Initiate",
    tagline: "Demonstrates initial commitment and consistency",
    min_xp: 150,
    min_streak: 3,
    min_challenges: 1,
    min_objectives: 5,
    min_dimensions_count: 1,
    min_dimension_score: 55,
    color_primary: "#38BDF8",
    color_secondary: "#0284C7",
    perks: ["Custom daily objectives creation", "Access to Mind & Body department logs", "Basic institutional dossier"]
  },
  {
    id: "aspirant",
    level: 3,
    title: "Aspirant",
    tagline: "Establishes regular development habits",
    min_xp: 450,
    min_streak: 7,
    min_challenges: 1,
    min_objectives: 15,
    min_dimensions_count: 2,
    min_dimension_score: 60,
    color_primary: "#34D399",
    color_secondary: "#059669",
    perks: ["Full Reading Academy syllabus access", "Writing Studio drafts save", "Personal progress export"]
  },
  {
    id: "disciple",
    level: 4,
    title: "Disciple",
    tagline: "Shows sustained effort across multiple dimensions",
    min_xp: 1000,
    min_streak: 14,
    min_challenges: 1,
    min_objectives: 30,
    min_dimensions_count: 4,
    min_dimension_score: 60,
    color_primary: "#A78BFA",
    color_secondary: "#7C3AED",
    perks: ["Concurrent challenge enrollment (up to 3)", "Deep focus acoustic presets", "Priority challenge check-ins"]
  },
  {
    id: "adept",
    level: 5,
    title: "Adept",
    tagline: "Demonstrates measurable progress and discipline",
    min_xp: 2200,
    min_streak: 21,
    min_challenges: 1,
    min_objectives: 60,
    min_dimensions_count: 5,
    min_dimension_score: 65,
    color_primary: "#FBBF24",
    color_secondary: "#D97706",
    perks: ["Official printable protocol credentials", "Advanced 8-dimension audit breakdown", "Institutional Adept badge"]
  },
  {
    id: "elite",
    level: 6,
    title: "Elite",
    tagline: "Maintains high performance across development areas",
    min_xp: 4000,
    min_streak: 30,
    min_challenges: 2,
    min_objectives: 100,
    min_dimensions_count: 6,
    min_dimension_score: 70,
    color_primary: "#F43F5E",
    color_secondary: "#E11D48",
    perks: ["Curated high-stakes project roadmaps", "Private small-group accountability circles", "Elite member lounge access"]
  },
  {
    id: "master",
    level: 7,
    title: "Master",
    tagline: "Demonstrates advanced consistency and achievement",
    min_xp: 7500,
    min_streak: 60,
    min_challenges: 3,
    min_objectives: 175,
    min_dimensions_count: 7,
    min_dimension_score: 75,
    color_primary: "#D4AF37",
    color_secondary: "#996515",
    perks: ["Institutional Master seal", "Direct founder office hours", "Program beta testing eligibility"]
  },
  {
    id: "grandmaster",
    level: 8,
    title: "Grandmaster",
    tagline: "Exceptional long-term development across all dimensions",
    min_xp: 12500,
    min_streak: 90,
    min_challenges: 4,
    min_objectives: 250,
    min_dimensions_count: 8,
    min_dimension_score: 80,
    color_primary: "#E0E7FF",
    color_secondary: "#6366F1",
    perks: ["Sovereign Grandmaster aura & insignia", "Full platform historical telemetry", "Permanent institutional hall of fame entry"]
  },
  {
    id: "legend",
    level: 9,
    title: "Legend",
    tagline: "Extremely difficult rank reserved for outstanding members",
    min_xp: 20000,
    min_streak: 120,
    min_challenges: 5,
    min_objectives: 400,
    min_dimensions_count: 8,
    min_dimension_score: 85,
    color_primary: "#FFD700",
    color_secondary: "#FFA500",
    perks: ["The Apex Unreal standard credential", "Institutional advisory council seat", "Lifetime honorary status"]
  }
];

// Vector SVG Emblems (Geometric, Obsidian & Metallic Gold Institutional Heraldry)
const RANK_EMBLEMS = {
  recruit: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-recruit">
      <defs>
        <linearGradient id="grad_rec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#94A3B8" />
          <stop offset="100%" stop-color="#475569" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" stroke="#334155" stroke-width="2.5" stroke-dasharray="4 3" />
      <circle cx="50" cy="50" r="34" stroke="url(#grad_rec)" stroke-width="2" />
      <path d="M50 24 L50 36 M50 64 L50 76 M24 50 L36 50 M64 50 L76 50" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"/>
      <polygon points="50,38 59,58 50,53 41,58" fill="url(#grad_rec)" stroke="#CBD5E1" stroke-width="1.5"/>
    </svg>
  `,

  initiate: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-initiate">
      <defs>
        <linearGradient id="grad_ini" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>
        <radialGradient id="glow_ini" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="42" fill="url(#glow_ini)"/>
      <polygon points="50,14 84,76 16,76" stroke="#0369A1" stroke-width="2" fill="#0C1929"/>
      <polygon points="50,26 74,70 26,70" stroke="url(#grad_ini)" stroke-width="2.5" fill="none"/>
      <circle cx="50" cy="52" r="7" fill="url(#grad_ini)"/>
      <line x1="50" y1="26" x2="50" y2="45" stroke="#BAE6FD" stroke-width="2"/>
    </svg>
  `,

  aspirant: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-aspirant">
      <defs>
        <linearGradient id="grad_asp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34D399" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
      </defs>
      <rect x="20" y="20" width="60" height="60" rx="8" transform="rotate(45 50 50)" stroke="#065F46" stroke-width="2" fill="#061A14"/>
      <rect x="26" y="26" width="48" height="48" rx="4" transform="rotate(45 50 50)" stroke="url(#grad_asp)" stroke-width="2.5"/>
      <path d="M50 28 L62 48 L50 44 L38 48 Z" fill="url(#grad_asp)"/>
      <path d="M50 48 L62 68 L50 64 L38 68 Z" fill="url(#grad_asp)"/>
    </svg>
  `,

  disciple: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-disciple">
      <defs>
        <linearGradient id="grad_dis" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#C084FC" />
          <stop offset="100%" stop-color="#7E22CE" />
        </linearGradient>
      </defs>
      <!-- Outer Hexagon -->
      <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" stroke="#581C87" stroke-width="2" fill="#140924"/>
      <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" stroke="url(#grad_dis)" stroke-width="2.5" fill="none"/>
      <!-- Four dimension axes meeting at core -->
      <line x1="28" y1="28" x2="72" y2="72" stroke="url(#grad_dis)" stroke-width="1.5" stroke-dasharray="3 2"/>
      <line x1="28" y1="72" x2="72" y2="28" stroke="url(#grad_dis)" stroke-width="1.5" stroke-dasharray="3 2"/>
      <polygon points="50,32 62,50 50,68 38,50" fill="url(#grad_dis)" stroke="#E9D5FF" stroke-width="1.5"/>
    </svg>
  `,

  adept: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-adept">
      <defs>
        <linearGradient id="grad_adp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FCD34D" />
          <stop offset="50%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#B45309" />
        </linearGradient>
      </defs>
      <!-- Shield Base -->
      <path d="M50 10 L82 22 V52 C82 72 50 88 50 88 C50 88 18 72 18 52 V22 Z" stroke="#78350F" stroke-width="2" fill="#1E1303"/>
      <path d="M50 18 L74 27 V50 C74 66 50 79 50 79 C50 79 26 66 26 50 V27 Z" stroke="url(#grad_adp)" stroke-width="2.5" fill="none"/>
      <!-- Inner Radiant Star -->
      <polygon points="50,28 55,42 70,42 58,51 62,65 50,56 38,65 42,51 30,42 45,42" fill="url(#grad_adp)" stroke="#FEF3C7" stroke-width="1"/>
    </svg>
  `,

  elite: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-elite">
      <defs>
        <linearGradient id="grad_elt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FB7185" />
          <stop offset="100%" stop-color="#BE123C" />
        </linearGradient>
      </defs>
      <!-- Wings Frame -->
      <circle cx="50" cy="50" r="42" stroke="#881337" stroke-width="2" fill="#20070F"/>
      <path d="M12 40 Q28 26 44 42 Q30 52 20 62 Z" fill="url(#grad_elt)" opacity="0.85"/>
      <path d="M88 40 Q72 26 56 42 Q70 52 80 62 Z" fill="url(#grad_elt)" opacity="0.85"/>
      <!-- Central Pillar & Diamond -->
      <polygon points="50,20 64,50 50,80 36,50" stroke="#FFE4E6" stroke-width="2" fill="url(#grad_elt)"/>
      <circle cx="50" cy="50" r="5" fill="#FFFFFF"/>
      <polygon points="50,12 55,22 45,22" fill="#FB7185"/>
    </svg>
  `,

  master: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-master">
      <defs>
        <linearGradient id="grad_mst" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FDE047" />
          <stop offset="40%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#854D0E" />
        </linearGradient>
        <radialGradient id="glow_mst" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#glow_mst)"/>
      <!-- Octagonal Sovereignty -->
      <polygon points="50,8 79,21 92,50 79,79 50,92 21,79 8,50 21,21" stroke="#A16207" stroke-width="2" fill="#1C1504"/>
      <polygon points="50,16 74,26 84,50 74,74 50,84 26,74 16,50 26,26" stroke="url(#grad_mst)" stroke-width="2.5" fill="none"/>
      <!-- Master Cross/Crest -->
      <polygon points="50,22 58,42 78,50 58,58 50,78 42,58 22,50 42,42" fill="url(#grad_mst)" stroke="#FEF9C3" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="6" fill="#1C1504" stroke="#FDE047" stroke-width="2"/>
    </svg>
  `,

  grandmaster: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-grandmaster">
      <defs>
        <linearGradient id="grad_gm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="30%" stop-color="#C7D2FE" />
          <stop offset="70%" stop-color="#818CF8" />
          <stop offset="100%" stop-color="#4338CA" />
        </linearGradient>
      </defs>
      <!-- Dual Intersecting Square Stars (16-point aura) -->
      <rect x="20" y="20" width="60" height="60" rx="4" stroke="url(#grad_gm)" stroke-width="2" fill="#0C0E24" transform="rotate(0 50 50)"/>
      <rect x="20" y="20" width="60" height="60" rx="4" stroke="url(#grad_gm)" stroke-width="2" fill="#0C0E24" transform="rotate(45 50 50)"/>
      <!-- Concentric Halo -->
      <circle cx="50" cy="50" r="28" stroke="#A5B4FC" stroke-width="1.5" stroke-dasharray="3 2" fill="none"/>
      <!-- Inner Diamond Core -->
      <polygon points="50,20 62,38 80,50 62,62 50,80 38,62 20,50 38,38" fill="url(#grad_gm)" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="8" fill="#FFFFFF"/>
    </svg>
  `,

  legend: (size = 64) => `
    <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="rank-emblem rank-emblem-legend">
      <defs>
        <linearGradient id="grad_leg_gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFBEB" />
          <stop offset="35%" stop-color="#FCD34D" />
          <stop offset="70%" stop-color="#D4AF37" />
          <stop offset="100%" stop-color="#78350F" />
        </linearGradient>
        <radialGradient id="halo_leg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.5"/>
          <stop offset="70%" stop-color="#D4AF37" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#halo_leg)"/>
      <!-- Laurel / Sunburst Apex Ring -->
      <circle cx="50" cy="50" r="44" stroke="url(#grad_leg_gold)" stroke-width="2.5" stroke-dasharray="6 3"/>
      <!-- Triple Crown Peaks -->
      <path d="M22 68 L28 36 L40 50 L50 22 L60 50 L72 36 L78 68 Z" fill="url(#grad_leg_gold)" stroke="#FFFBEB" stroke-width="2"/>
      <!-- Crown Base Jewels -->
      <rect x="22" y="68" width="56" height="8" rx="2" fill="#78350F" stroke="#FCD34D" stroke-width="1.5"/>
      <circle cx="34" cy="72" r="2.5" fill="#FFFFFF"/>
      <circle cx="50" cy="72" r="2.5" fill="#FFFFFF"/>
      <circle cx="66" cy="72" r="2.5" fill="#FFFFFF"/>
      <!-- Apex Star above center peak -->
      <polygon points="50,10 53,17 60,17 55,22 57,29 50,25 43,29 45,22 40,17 47,17" fill="#FFFFFF"/>
    </svg>
  `
};

class ProgressionEngine {
  static cachedRanks = null;

  static async fetchRanks() {
    try {
      const resp = await fetch("/api/ranks");
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedRanks = data;
          return data;
        }
      }
    } catch (e) {
      console.warn("[E-GYM Progression] Local fallback ranks utilized.");
    }
    this.cachedRanks = DEFAULT_RANKS;
    return DEFAULT_RANKS;
  }

  static getRanks() {
    return this.cachedRanks || DEFAULT_RANKS;
  }

  static getRankById(rankId) {
    const ranks = this.getRanks();
    return ranks.find(r => r.id === rankId) || ranks[0];
  }

  static getEmblemSVG(rankId, size = 64) {
    const fn = RANK_EMBLEMS[rankId] || RANK_EMBLEMS.recruit;
    return fn(size);
  }

  /**
   * Evaluates a member's progress against all ranks.
   * Returns currentRank, nextRank, progressPct, criteriaList, and qualifiesForNext.
   */
  static evaluate(state, customRanks = null) {
    const ranks = customRanks || this.getRanks();
    const stats = state.stats || { unrealPoints: 0, currentStreak: 0, longestStreak: 0, totalObjectivesDone: 0 };
    const radar = state.dimensionsRadar || {};
    const enrolled = state.enrolledChallenges || [];

    // Metric summaries
    const xp = Number(stats.unrealPoints || 0);
    const streak = Math.max(Number(stats.currentStreak || 0), Number(stats.longestStreak || 0));
    const objectives = Number(stats.totalObjectivesDone || 0);
    
    // Count completed or high-progress challenges
    const completedChallengesCount = enrolled.filter(c => c.status === "completed" || c.currentDay >= 21).length;
    const enrolledCount = enrolled.length;

    // Helper: evaluate single rank criteria
    const checkRankCriteria = (rank) => {
      // 1. XP
      const xpMet = xp >= (rank.min_xp || 0);

      // 2. Streak
      const streakMet = streak >= (rank.min_streak || 0);

      // 3. Objectives
      const objMet = objectives >= (rank.min_objectives || 0);

      // 4. Challenges (higher ranks require completed challenges; lower ranks accept enrolled)
      let chalMet = false;
      const minChal = rank.min_challenges || 0;
      if (minChal === 0) {
        chalMet = true;
      } else if (rank.level <= 3) {
        chalMet = enrolledCount >= minChal;
      } else {
        chalMet = completedChallengesCount >= minChal;
      }

      // 5. Multi-dimensional Radar: at least N dimensions with score >= min_score
      let radarMet = false;
      const reqCount = rank.min_dimensions_count || 0;
      const minScore = rank.min_dimension_score || 0;
      if (reqCount === 0 || minScore === 0) {
        radarMet = true;
      } else {
        const qualifyingDims = Object.values(radar).filter(val => Number(val) >= minScore).length;
        radarMet = qualifyingDims >= reqCount;
      }

      return xpMet && streakMet && objMet && chalMet && radarMet;
    };

    // Determine current rank: highest rank where all criteria are satisfied
    let currentRankIndex = 0;
    for (let i = 0; i < ranks.length; i++) {
      if (checkRankCriteria(ranks[i])) {
        currentRankIndex = i;
      } else {
        break; // Stop at first unsatisfied rank
      }
    }

    const currentRank = ranks[currentRankIndex];
    const nextRank = currentRankIndex + 1 < ranks.length ? ranks[currentRankIndex + 1] : null;

    // Build criteria list for next rank
    let criteriaList = [];
    let progressPct = 100;

    if (nextRank) {
      // 1. XP criterion
      const xpNeeded = nextRank.min_xp || 0;
      const xpPct = xpNeeded > 0 ? Math.min(100, Math.round((xp / xpNeeded) * 100)) : 100;
      criteriaList.push({
        id: "xp",
        label: "Institutional Unreal XP",
        current: xp,
        target: xpNeeded,
        unit: "XP",
        met: xp >= xpNeeded,
        pct: xpPct
      });

      // 2. Streak criterion
      const streakNeeded = nextRank.min_streak || 0;
      if (streakNeeded > 0) {
        const streakPct = Math.min(100, Math.round((streak / streakNeeded) * 100));
        criteriaList.push({
          id: "streak",
          label: "Consecutive Days Consistency",
          current: streak,
          target: streakNeeded,
          unit: "Days",
          met: streak >= streakNeeded,
          pct: streakPct
        });
      }

      // 3. Objectives completed
      const objNeeded = nextRank.min_objectives || 0;
      if (objNeeded > 0) {
        const objPct = Math.min(100, Math.round((objectives / objNeeded) * 100));
        criteriaList.push({
          id: "objectives",
          label: "Lifetime Objectives Executed",
          current: objectives,
          target: objNeeded,
          unit: "Tasks",
          met: objectives >= objNeeded,
          pct: objPct
        });
      }

      // 4. Challenges criterion
      const chalNeeded = nextRank.min_challenges || 0;
      if (chalNeeded > 0) {
        const currentChal = nextRank.level <= 3 ? enrolledCount : completedChallengesCount;
        const chalLabel = nextRank.level <= 3 ? "Active Flagship Protocols" : "Completed Protocols (21+ Days)";
        const chalPct = Math.min(100, Math.round((currentChal / chalNeeded) * 100));
        criteriaList.push({
          id: "challenges",
          label: chalLabel,
          current: currentChal,
          target: chalNeeded,
          unit: "Protocols",
          met: currentChal >= chalNeeded,
          pct: chalPct
        });
      }

      // 5. Multi-dimension radar criterion
      const reqDims = nextRank.min_dimensions_count || 0;
      const minScore = nextRank.min_dimension_score || 0;
      if (reqDims > 0 && minScore > 0) {
        const currentQualifying = Object.values(radar).filter(val => Number(val) >= minScore).length;
        const radarPct = Math.min(100, Math.round((currentQualifying / reqDims) * 100));
        criteriaList.push({
          id: "radar",
          label: `Dimensions Developing at ${minScore}%+`,
          current: currentQualifying,
          target: reqDims,
          unit: "Domains",
          met: currentQualifying >= reqDims,
          pct: radarPct
        });
      }

      // Compute total aggregate progression percentage towards next rank
      const totalPcts = criteriaList.reduce((acc, c) => acc + c.pct, 0);
      progressPct = criteriaList.length > 0 ? Math.round(totalPcts / criteriaList.length) : 100;
    }

    return {
      currentRank,
      nextRank,
      progressPct,
      criteriaList,
      isMaxRank: !nextRank,
      qualifiesForNext: nextRank ? criteriaList.every(c => c.met) : false
    };
  }

  /**
   * Anti-tamper XP award ledger manager.
   * Prevents duplicate XP awards using unique sourceId/sourceType transaction keys.
   */
  static awardXP(state, amount, sourceType, sourceId, desc, verified = true) {
    if (!state.xpLedger) {
      state.xpLedger = [];
    }

    // Generate deterministic transaction key if sourceId is provided
    const txId = sourceId ? `tx_${sourceType}_${sourceId}` : `tx_${sourceType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Check for duplicate transaction
    const existing = state.xpLedger.find(entry => entry.txId === txId);
    if (existing) {
      return {
        awarded: false,
        reason: "Transaction already processed",
        txId,
        currentXP: state.stats.unrealPoints
      };
    }

    const numericAmount = Math.max(0, Number(amount) || 0);

    // Record ledger entry
    const entry = {
      txId,
      amount: numericAmount,
      sourceType,
      sourceId: sourceId || null,
      desc: desc || `${sourceType} reward`,
      verified: !!verified,
      timestamp: new Date().toISOString()
    };
    state.xpLedger.unshift(entry);

    // Increment points
    state.stats.unrealPoints = (Number(state.stats.unrealPoints) || 0) + numericAmount;

    // Check if this newly awarded XP promotes the member to a higher rank
    const evaluation = this.evaluate(state);
    let promotionOccurred = false;
    let oldRankId = state.currentRankId || "recruit";

    if (evaluation.currentRank.id !== oldRankId) {
      const oldRank = this.getRankById(oldRankId);
      if (evaluation.currentRank.level > oldRank.level) {
        promotionOccurred = true;
        state.currentRankId = evaluation.currentRank.id;

        if (!state.rankHistory) {
          state.rankHistory = [];
        }

        state.rankHistory.unshift({
          rankId: evaluation.currentRank.id,
          promotedAt: new Date().toISOString(),
          triggerReason: `Reached ${evaluation.currentRank.title} requirements (+${numericAmount} XP from ${sourceType})`
        });
      }
    }

    return {
      awarded: true,
      amount: numericAmount,
      txId,
      newTotal: state.stats.unrealPoints,
      promotionOccurred,
      newRank: evaluation.currentRank
    };
  }

  /**
   * Verifies and checks if member should be promoted based on current state.
   */
  static checkAndApplyPromotion(state) {
    const evaluation = this.evaluate(state);
    const oldRankId = state.currentRankId || "recruit";
    const oldRank = this.getRankById(oldRankId);

    if (evaluation.currentRank.level > oldRank.level) {
      state.currentRankId = evaluation.currentRank.id;
      if (!state.rankHistory) state.rankHistory = [];

      state.rankHistory.unshift({
        rankId: evaluation.currentRank.id,
        promotedAt: new Date().toISOString(),
        triggerReason: `Satisfied all criteria for ${evaluation.currentRank.title}`
      });

      return {
        promoted: true,
        oldRank,
        newRank: evaluation.currentRank
      };
    }

    return { promoted: false, currentRank: evaluation.currentRank };
  }
}

// Export for browser and node testing environments
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ProgressionEngine, DEFAULT_RANKS, RANK_EMBLEMS };
}
