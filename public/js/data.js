// E-GYM Platform Seed Data & Specifications
// Based on EGYM Concept & Business Blueprint

const EGYM_DATA = {
  brand: {
    name: "E-GYM",
    tagline: "BECOME UNREAL.",
    philosophy: "TRAIN EVERY DIMENSION.",
    subtext: "A digital self-development club built on structured challenges, guided programs, and measurable progress.",
    quote: "Transform so much that people struggle to believe you are the same person."
  },

  dimensions: [
    { id: "physical", name: "Physical", icon: "zap", color: "#10B981", desc: "Strength, cardiovascular health, mobility, sleep & sustainable nutrition." },
    { id: "intellectual", name: "Intellectual", icon: "book-open", color: "#3B82F6", desc: "Knowledge, curiosity, reasoning, critical thinking & learning ability." },
    { id: "emotional", name: "Emotional", icon: "heart", color: "#EC4899", desc: "Self-awareness, emotional regulation, resilience & healthy expression." },
    { id: "psychological", name: "Psychological", icon: "shield", color: "#8B5CF6", desc: "Confidence, patience, discipline, adaptability & mental fortitude." },
    { id: "social", name: "Social", icon: "users", color: "#06B6D4", desc: "Communication, empathy, relationships, collaboration & belonging." },
    { id: "financial", name: "Financial", icon: "trending-up", color: "#F59E0B", desc: "Financial literacy, budgeting, saving, capital allocation & risk awareness." },
    { id: "professional", name: "Professional", icon: "briefcase", color: "#6366F1", desc: "High-leverage competence, career direction & entrepreneurial capability." },
    { id: "creative", name: "Creative", icon: "feather", color: "#F43F5E", desc: "Imagination, expression, craft, experimentation & making things." }
  ],

  challenges: [
    {
      id: "discipline-75",
      title: "75-Day Discipline Protocol",
      tagline: "The multi-domain benchmark for physical and mental transformation.",
      department: "EXECUTION",
      category: "Multi-Domain",
      durationDays: 75,
      difficulty: "Advanced",
      commitment: "90 mins / day",
      dimensionIds: ["physical", "intellectual", "psychological"],
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
      featured: true,
      badge: "The Unreal Standard",
      description: "A comprehensive multi-domain protocol combining structured physical training, daily intellectual intake, focused work, and evening reflection. Designed for sustainable adaptation rather than dangerous extremes.",
      rules: [
        "Complete 45 minutes of intentional physical movement or recovery every day.",
        "Read 20 minutes of non-fiction or educational material daily.",
        "Execute one critical priority objective before distractions take over.",
        "Log a 3-minute evening reflection in your Personal HQ.",
        "Drink at least 2.5L of water and maintain 7+ hours in bed."
      ],
      safetyNotes: "Take programmed recovery days (walking/mobility) when physical fatigue is high. Sleep and nutrition form the bedrock of this challenge.",
      syllabus: [
        { phase: "Phase 1 (Days 1-25)", focus: "Friction & Foundation", details: "Eliminating digital distractions, locking in sleep timing, and establishing baseline consistency." },
        { phase: "Phase 2 (Days 26-50)", focus: "Momentum & Deep Work", details: "Increasing cognitive load, progressive exercise overload, and zero zero-days." },
        { phase: "Phase 3 (Days 51-75)", focus: "Integration & Mastery", details: "Internalizing habits into identity. Final development audit and certification." }
      ],
      dailyObjectives: [
        { id: "d75-obj-1", text: "45-min structured physical session (workout or mobility)", dimension: "physical" },
        { id: "d75-obj-2", text: "20-min reading with 1 captured insight", dimension: "intellectual" },
        { id: "d75-obj-3", text: "Execute #1 priority work objective with zero interruptions", dimension: "professional" },
        { id: "d75-obj-4", text: "Evening reflection and digital boundary shutdown", dimension: "psychological" }
      ]
    },
    {
      id: "reading-21",
      title: "21-Day Reading Habit Mastery",
      tagline: "Move from 'I want to read' to consistent, retained knowledge.",
      department: "MIND",
      category: "Reading Academy",
      durationDays: 21,
      difficulty: "Beginner",
      commitment: "15-20 mins / day",
      dimensionIds: ["intellectual"],
      image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
      featured: true,
      badge: "Reading Initiate",
      description: "A guided 21-day ramp designed to establish an effortless reading routine. Focuses on consistency and reflection rather than page-speed vanity.",
      rules: [
        "Read at least 15 uninterrupted minutes daily in a dedicated environment.",
        "Record 1 surprising idea or actionable takeaway in your Reading Journal.",
        "Answer the weekly comprehension check-in prompt."
      ],
      safetyNotes: "Choose books you actually want to read, not books you think you should impress people with.",
      syllabus: [
        { phase: "Week 1", focus: "Environment & Habit Cue", details: "Finding your prime reading window (morning vs night) and friction-free setup." },
        { phase: "Week 2", focus: "Active Reading & Marginalia", details: "Marking key arguments, noting counter-points, and synthesizing chapters." },
        { phase: "Week 3", focus: "Application & Roadmap", details: "Creating your personalized next-quarter reading roadmap." }
      ],
      dailyObjectives: [
        { id: "r21-obj-1", text: "15 minutes of uninterrupted reading", dimension: "intellectual" },
        { id: "r21-obj-2", text: "Log 1 key insight in Reading Academy journal", dimension: "intellectual" }
      ]
    },
    {
      id: "strength-30",
      title: "30-Day Strength & Mobility Foundation",
      tagline: "Build a resilient, pain-free athletic base.",
      department: "BODY",
      category: "Fitness & Health",
      durationDays: 30,
      difficulty: "Intermediate",
      commitment: "35 mins / day",
      dimensionIds: ["physical"],
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
      featured: false,
      badge: "Iron Spine",
      description: "A comprehensive movement foundation targeting compound movement patterns, hip/thoracic mobility, and rotational core stability. Suitable for home or gym with scalable progressions.",
      rules: [
        "Follow the assigned daily track: Strength A, Strength B, or Active Mobility.",
        "Log completed sets, repetitions, and perceived exertion (RPE).",
        "Never sacrifice form for repetitions. Rest 90 seconds between compound sets."
      ],
      safetyNotes: "Warm up thoroughly with the dynamic mobility routine. Modify movements if joint discomfort occurs.",
      syllabus: [
        { phase: "Days 1-10", focus: "Movement Mechanics", details: "Mastering the hinge, squat, push, and row patterns." },
        { phase: "Days 11-20", focus: "Volume Accumulation", details: "Progressive density and core bracing under fatigue." },
        { phase: "Days 21-30", focus: "Work Capacity & Testing", details: "Endurance benchmarks and baseline re-assessment." }
      ],
      dailyObjectives: [
        { id: "s30-obj-1", text: "Daily Movement / Strength Session (35 min)", dimension: "physical" },
        { id: "s30-obj-2", text: "Post-session 5-minute hip and thoracic mobility flow", dimension: "physical" }
      ]
    },
    {
      id: "deepwork-14",
      title: "14-Day Deep Work & Focus Routine",
      tagline: "Reclaim your attention span and double cognitive output.",
      department: "EXECUTION",
      category: "Productivity & Discipline",
      durationDays: 14,
      difficulty: "Intermediate",
      commitment: "90 min block / day",
      dimensionIds: ["professional", "psychological"],
      image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
      featured: false,
      badge: "Deep Operator",
      description: "Cut dopamine fatigue and learn to enter flow states on demand. Eliminates shallow tab-switching and anchors your day with an uncompromising 90-minute morning deep work block.",
      rules: [
        "Plan your 90-minute block the night before with exactly 1 primary deliverable.",
        "Zero notifications, phone in another room or in airplane mode.",
        "Implement a strict digital shutdown 1 hour before sleep."
      ],
      safetyNotes: "If mental resistance flares up, commit to starting for just 5 minutes without opening new tabs.",
      syllabus: [
        { phase: "Days 1-7", focus: "Distraction Audit & Shielding", details: "Block social feeds, time-box communications, and run daily 90-min blocks." },
        { phase: "Days 8-14", focus: "Flow State Acceleration", details: "Optimizing work rituals, binaural audio, and cognitive stamina." }
      ],
      dailyObjectives: [
        { id: "dw14-obj-1", text: "Complete 90-minute Deep Work focus block", dimension: "professional" },
        { id: "dw14-obj-2", text: "Execute evening digital shutdown protocol (no screens 60m before bed)", dimension: "psychological" }
      ]
    },
    {
      id: "writer-30",
      title: "30-Day Creator Sprint: Daily Writing",
      tagline: "Turn vague thoughts into lucid, published prose.",
      department: "CREATION",
      category: "Writing & Creativity",
      durationDays: 30,
      difficulty: "Intermediate",
      commitment: "30 mins / day",
      dimensionIds: ["creative", "intellectual"],
      image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
      featured: false,
      badge: "Prolific Author",
      description: "Consistency creates clarity. Commit to producing 400 words of original writing every single day across essays, stories, break-downs, or journals.",
      rules: [
        "Write at least 400 words daily without editing in the first pass.",
        "Save drafts to your Writing Studio portfolio.",
        "Polish and publish 1 piece weekly for peer review."
      ],
      safetyNotes: "Do not judge early drafts. The goal is flow and volume first; precision comes during editing.",
      syllabus: [
        { phase: "Days 1-10", focus: "Overcoming the Blank Canvas", details: "Idea generation frameworks, prompt cascades, and daily word counts." },
        { phase: "Days 11-20", focus: "Structure & Story Architecture", details: "Hooking readers, tension arcs, and concise argumentation." },
        { phase: "Days 21-30", focus: "Editorial Rigor & Publishing", details: "Cutting fluff, punchy headlines, and assembling your showcase portfolio." }
      ],
      dailyObjectives: [
        { id: "w30-obj-1", text: "Draft 400 words in Writing Studio", dimension: "creative" },
        { id: "w30-obj-2", text: "Review 1 peer writing draft in Community", dimension: "social" }
      ]
    },
    {
      id: "startup-30",
      title: "30-Day Startup Validation Sprint",
      tagline: "Validate real customer demand before writing code.",
      department: "GROWTH",
      category: "Skills & Career",
      durationDays: 30,
      difficulty: "Advanced",
      commitment: "60 mins / day",
      dimensionIds: ["professional", "financial"],
      image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=800&q=80",
      featured: false,
      badge: "Venture Builder",
      description: "Test a business hypothesis in the real world. Avoid building products no one wants by talking to 15 real potential buyers, understanding their pain points, and getting early commitments.",
      rules: [
        "Formulate a falsifiable customer problem statement.",
        "Conduct 15 customer discovery conversations (no pitch, only listening).",
        "Build a single-page landing test or letter of intent to measure demand."
      ],
      safetyNotes: "Follow ethical customer interview standards. Respect participant time and data.",
      syllabus: [
        { phase: "Week 1", focus: "Hypothesis & Target Persona", details: "Narrowing the ICP (Ideal Customer Profile) and crafting interview questions." },
        { phase: "Week 2-3", focus: "Outreach & Cold Discovery", details: "Conducting 15 calls and recording objective problem frequencies." },
        { phase: "Week 4", focus: "Offer & Demand Signal", details: "Validating willingness to pay or pre-order." }
      ],
      dailyObjectives: [
        { id: "s30-v-1", text: "Reach out to 3 target customers or conduct 1 interview", dimension: "professional" },
        { id: "s30-v-2", text: "Document customer insights and problem score in Growth log", dimension: "financial" }
      ]
    }
  ],

  readingAcademy: {
    roadmaps: [
      {
        id: "rm-habits",
        title: "Habits, Focus & Human Output",
        desc: "Master deliberate practice, automaticity, and attention management.",
        books: [
          { title: "Atomic Habits", author: "James Clear", difficulty: "Beginner", time: "5 hrs", why: "The foundational framework on identity-based habits and friction reduction." },
          { title: "Deep Work", author: "Cal Newport", difficulty: "Intermediate", time: "6 hrs", why: "Essential rules for focused success in a distracted world." },
          { title: "Peak", author: "Anders Ericsson", difficulty: "Advanced", time: "7 hrs", why: "The science of deliberate practice and world-class expertise." }
        ]
      },
      {
        id: "rm-philosophy",
        title: "Stoicism, Meaning & Resilience",
        desc: "Construct an internal fortress capable of enduring chaos with poise.",
        books: [
          { title: "Meditations", author: "Marcus Aurelius", difficulty: "Beginner", time: "4 hrs", why: "Private journal of Rome's philosopher emperor on duty and perspective." },
          { title: "Man's Search for Meaning", author: "Viktor Frankl", difficulty: "Beginner", time: "3.5 hrs", why: "Psychological resilience through purpose in the face of suffering." },
          { title: "Letters from a Stoic", author: "Seneca", difficulty: "Intermediate", time: "6 hrs", why: "Pragmatic, cutting advice on time, wealth, anxiety, and death." }
        ]
      },
      {
        id: "rm-wealth",
        title: "Capital, Psychology & Value Creation",
        desc: "Understand money behavior, market leverage, and compounding.",
        books: [
          { title: "The Psychology of Money", author: "Morgan Housel", difficulty: "Beginner", time: "4 hrs", why: "Timeless lessons on wealth, greed, and human financial quirks." },
          { title: "The Lean Startup", author: "Eric Ries", difficulty: "Intermediate", time: "5.5 hrs", why: "Iterative testing, validated learning, and rapid feedback loops." },
          { title: "Zero to One", author: "Peter Thiel", difficulty: "Intermediate", time: "4.5 hrs", why: "Notes on startups and how to build a unique monopoly of value." }
        ]
      }
    ],
    reflectionPrompts: [
      "What surprised me the most in this reading session?",
      "What did the author say that I instinctively disagree with, and why?",
      "What is one concrete action I will test in my life tomorrow based on this idea?"
    ]
  },

  exerciseLibrary: [
    { id: "ex-1", name: "Push-ups (Standard / Diamond)", category: "Chest & Triceps", difficulty: "Beginner-Intermediate", cues: "Elbows at 45 degrees, full lockout at top, tight core.", defaultSets: 3, defaultReps: "12-15" },
    { id: "ex-2", name: "Pull-ups / Inverted Rows", category: "Back & Biceps", difficulty: "Intermediate", cues: "Engage lats first, drive elbows toward ribs, controlled negative.", defaultSets: 3, defaultReps: "6-10" },
    { id: "ex-3", name: "Bodyweight / Goblet Squats", category: "Quads & Glutes", difficulty: "Beginner", cues: "Crease of hip below knee, knees tracking toes, chest upright.", defaultSets: 4, defaultReps: "15-20" },
    { id: "ex-4", name: "Romanian Deadlift / Hinge", category: "Hamstrings & Lower Back", difficulty: "Intermediate", cues: "Push hips backward, flat spine, slight knee bend, feel hamstring stretch.", defaultSets: 3, defaultReps: "10-12" },
    { id: "ex-5", name: "Walking Lunges", category: "Legs & Stability", difficulty: "Intermediate", cues: "90-degree bend at both knees, torso upright, drive through front heel.", defaultSets: 3, defaultReps: "12 each side" },
    { id: "ex-6", name: "Forearm Plank & Hollow Hold", category: "Core & Pelvic Stability", difficulty: "Beginner", cues: "Posterior pelvic tilt, glutes clenched, push floor away through forearms.", defaultSets: 3, defaultReps: "45-60s hold" },
    { id: "ex-7", name: "Thoracic Windmill & Hip 90/90", category: "Mobility & Recovery", difficulty: "All Levels", cues: "Slow controlled breathing, synchronize movement with exhalation.", defaultSets: 2, defaultReps: "8 reps per side" }
  ],

  writingPrompts: [
    { id: "wp-1", title: "The Anti-Goal Blueprint", prompt: "Describe your absolute nightmare day 3 years from now in vivid detail. What habits, compromises, and distractions led to that state? What boundaries must you set now?" },
    { id: "wp-2", title: "First Principles Audit", prompt: "Pick one core belief you hold about your career or capabilities. Why do you believe it? Is it based on direct evidence or inherited dogma?" },
    { id: "wp-3", title: "Morning Mental Sweep", prompt: "Stream of consciousness writing for 10 minutes. What unresolved tasks, anxieties, or subconscious loops are draining your working RAM today?" },
    { id: "wp-4", title: "Letter from the Unreal Self", prompt: "Write a short letter from yourself 5 years in the future, looking back at the current inflection point. What advice would they give you right now?" }
  ],

  membershipTiers: [
    {
      id: "explorer",
      name: "Explorer",
      price: "₹0",
      cadence: "Free Forever",
      highlight: false,
      who: "Members exploring the E-GYM methodology.",
      features: [
        "Access to selected starter challenges",
        "Personal HQ daily planner & basic habit tracker",
        "Starter Reading Academy roadmap",
        "Basic movement library & workout logging",
        "Standard Achievement Profile"
      ],
      cta: "Current Tier"
    },
    {
      id: "member",
      name: "Member",
      price: "₹349",
      cadence: "per month",
      highlight: true,
      badge: "Most Popular",
      who: "Ambitious operators seeking a serious, structured daily discipline.",
      features: [
        "Full access to ALL flagship challenges (75-Day Protocol, 30-Day Sprints)",
        "Advanced Reading Academy with chapter checkpoints & reflection engine",
        "Writing Studio with unlimited draft saves & prompt archives",
        "Focus Deep Work Pomodoro Suite with soundscapes",
        "Verified Performance Record & Digital Completion Certificates",
        "Accountability partner matching & community cohorts"
      ],
      cta: "Upgrade to Member"
    },
    {
      id: "elite",
      name: "Elite",
      price: "₹899",
      cadence: "per month",
      highlight: false,
      badge: "Institutional Access",
      who: "Leaders, founders, and professionals seeking high-performance mentorship.",
      features: [
        "Everything in Member Tier",
        "Exclusive expert-led masterclasses & monthly guest salons",
        "Curated high-stakes project roadmaps (Venture, Public Speaking)",
        "Priority verification for refundable deposit challenges",
        "Private small-group accountability circle (max 6 members)",
        "Direct founder office hours & program beta access"
      ],
      cta: "Apply for Elite"
    }
  ]
};

// Clean Reset State - Zeroed baseline ready for real production usage
const INITIAL_MEMBER_STATE = {
  profile: {
    name: "New Member",
    handle: "@initiate",
    title: "Candidate",
    tier: "Explorer",
    memberSince: "Nov 2026",
    bio: "Ready to train every dimension. Setting initial benchmarks.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80"
  },
  stats: {
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
    totalObjectivesDone: 0,
    hoursInvested: 0,
    unrealPoints: 0
  },
  dimensionsRadar: {
    physical: 50,
    intellectual: 50,
    emotional: 50,
    psychological: 50,
    social: 50,
    financial: 50,
    professional: 50,
    creative: 50
  },
  enrolledChallenges: [],
  todayObjectives: [
    { id: "starter-1", title: "Enroll in your first flagship challenge in the Challenge Arena", dimension: "execution", completed: false, timeEst: "5m" },
    { id: "starter-2", title: "Explore the Reading Academy roadmaps in Departments", dimension: "intellectual", completed: false, timeEst: "10m" },
    { id: "starter-3", title: "Set today's primary deep work block", dimension: "professional", completed: false, timeEst: "25m" }
  ],
  readingLog: [],
  workoutLog: [],
  writingDrafts: [],
  achievements: [
    { id: "ach-1", title: "Genesis Candidate", desc: "Initiated your journey in the E-GYM institution.", unlockedAt: "Nov 2026", icon: "award" }
  ]
};
