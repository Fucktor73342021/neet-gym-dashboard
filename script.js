/* ═══════════════════════════════════════════════════════════════════════════
   NEXUS WARRIOR DASHBOARD — app.js
   Vanilla JS · localStorage · Date-based tracking · Modular architecture
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────────────
   § 1 · CONSTANTS & CONFIGURATION
   ───────────────────────────────────────────────────────────────────────── */

const CONFIG = {
  // Change this to the actual NEET exam date (YYYY-MM-DD)
  NEET_EXAM_DATE: '2026-05-03',

  // Step goal
  STEP_TARGET: 2000,

  // NEET daily targets
  NEET_QUESTIONS_TARGET: 200,
  NEET_PAGES_TARGET: 50,

  // Diet targets for completion calculation
  DIET_CALORIES_TARGET: 1800,
  DIET_WATER_TARGET: 2.5,

  // Subject max chapters (used for progress bar scaling)
  PHY_TOTAL_CHAPTERS: 30,
  CHEM_TOTAL_CHAPTERS: 30,
  BIO_TOTAL_CHAPTERS: 38,
};

// Exercise IDs grouped by day-tab
const EXERCISES = {
  push: ['push-01', 'push-02', 'push-03', 'push-04', 'push-05',
         'push-06', 'push-07', 'push-08', 'push-09'],
  pull: ['pull-01', 'pull-02', 'pull-03', 'pull-04', 'pull-05',
         'pull-06', 'pull-07', 'pull-08'],
  legs: ['leg-01', 'leg-02', 'leg-03', 'leg-04', 'leg-05'],
};

// All exercises flat
const ALL_EXERCISES = [...EXERCISES.push, ...EXERCISES.pull, ...EXERCISES.legs];

// Day-of-week → which tab is "today's workout"
const DAY_WORKOUT_MAP = {
  1: 'push', // Monday
  3: 'pull', // Wednesday
  5: 'legs', // Friday
};

const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN',
                     'JUL','AUG','SEP','OCT','NOV','DEC'];

const MOTIVATIONAL_QUOTES = [
  { text: "The pain you feel today will be the strength you feel tomorrow. Push through — the government seat is waiting.", author: "— NEXUS WARRIOR PROTOCOL" },
  { text: "Discipline is doing what needs to be done, even when you don't want to do it. That's what separates the elite from the ordinary.", author: "— WARRIOR CREED" },
  { text: "Every question you solve is a vote for the future version of yourself who made it. Vote wisely.", author: "— NEXUS DIRECTIVE" },
  { text: "You've already survived every hard day so far. Today is just another one to conquer.", author: "— PROTOCOL v2.0" },
  { text: "The body achieves what the mind believes. Train both with equal ferocity.", author: "— WARRIOR DOCTRINE" },
  { text: "Stop waiting for motivation. Build discipline instead — it shows up even when motivation doesn't.", author: "— NEXUS PROTOCOL" },
  { text: "Your competition is sleeping. Your previous self is watching. Neither can afford for you to stop now.", author: "— WARRIOR CREED" },
  { text: "Biology, Chemistry, Physics — three keys to one door. Sharpen all three every single day.", author: "— NEET DOCTRINE" },
  { text: "One more question. One more page. One more rep. That's how legends are built — in the margins.", author: "— NEXUS WARRIOR" },
  { text: "The rank you want requires becoming the person who deserves it. Become that person today.", author: "— PROTOCOL v2.0" },
  { text: "Rest if you must, but never quit. The exam date doesn't move. You must.", author: "— WARRIOR DIRECTIVE" },
  { text: "Compound effort: small consistent actions create results that shock even you.", author: "— NEXUS SYSTEM" },
  { text: "Your streak isn't a number. It's proof that you chose growth over comfort, again and again.", author: "— WARRIOR CREED" },
  { text: "The scoreboard you fear is just a test of how well you prepared. Prepare obsessively.", author: "— NEET PROTOCOL" },
  { text: "Slow days still count. Imperfect sessions still build. Showing up is always the win.", author: "— NEXUS v2.0" },
];

/* ─────────────────────────────────────────────────────────────────────────
   § 2 · DATE UTILITIES
   ───────────────────────────────────────────────────────────────────────── */

/** Returns today's date as "YYYY-MM-DD" string (local time) */
function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns yesterday's date key */
function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Format a Date for the topbar display */
function formatTopbarDate(date) {
  const dayName = DAY_NAMES[date.getDay()];
  const dayNum  = String(date.getDate()).padStart(2, '0');
  const month   = MONTH_NAMES[date.getMonth()];
  const year    = date.getFullYear();
  return `${dayName} · ${dayNum} ${month} ${year}`;
}

/** Returns day-of-week index (0=Sun) */
function getTodayDOW() {
  return new Date().getDay();
}

/** Which tab is today's workout day */
function getTodayWorkoutTab() {
  return DAY_WORKOUT_MAP[getTodayDOW()] || null;
}

/** Days left until NEET exam */
function getDaysToNEET() {
  const exam  = new Date(CONFIG.NEET_EXAM_DATE);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

/** Returns greeting string based on hour */
function getGreetingByTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

/* ─────────────────────────────────────────────────────────────────────────
   § 3 · LOCAL STORAGE HELPERS
   ───────────────────────────────────────────────────────────────────────── */

const LS_KEYS = {
  gymDay:   (dateKey) => `nexus_gym_${dateKey}`,
  diet:     (dateKey) => `nexus_diet_${dateKey}`,
  neet:     (dateKey) => `nexus_neet_${dateKey}`,
  streak:   'nexus_streak',
  lastDate: 'nexus_last_date',
  quote:    'nexus_quote',
};

function lsGet(key) {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch { /* noop */ }
}

/* ─────────────────────────────────────────────────────────────────────────
   § 4 · NAVIGATION
   ───────────────────────────────────────────────────────────────────────── */

function initNavigation() {
  const navLinks = document.querySelectorAll('.nav__link[data-section]');
  const sections = document.querySelectorAll('.section');
  const breadcrumb = document.getElementById('topbar-section-label');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      switchSection(target, navLinks, sections, breadcrumb);
    });
  });
}

function switchSection(target, navLinks, sections, breadcrumb) {
  // Hide all sections
  sections.forEach(sec => {
    sec.classList.remove('is-active');
  });

  // Deactivate all nav links
  navLinks.forEach(link => {
    link.classList.remove('is-active');
    link.removeAttribute('aria-current');
  });

  // Activate target section
  const targetSection = document.getElementById(`section-${target}`);
  if (targetSection) {
    targetSection.classList.add('is-active');
  }

  // Activate matching nav link
  const activeLink = document.querySelector(`.nav__link[data-section="${target}"]`);
  if (activeLink) {
    activeLink.classList.add('is-active');
    activeLink.setAttribute('aria-current', 'page');
  }

  // Update breadcrumb
  if (breadcrumb) {
    const labelMap = {
      dashboard: 'DASHBOARD',
      gym:       'GYM TRACKER',
      diet:      'DIET TRACKER',
      neet:      'NEET TRACKER',
    };
    breadcrumb.textContent = labelMap[target] || target.toUpperCase();
  }

  // Scroll content area to top
  const contentArea = document.getElementById('content-area');
  if (contentArea) contentArea.scrollTop = 0;
}

/* ─────────────────────────────────────────────────────────────────────────
   § 5 · TABS (GYM SECTION)
   ───────────────────────────────────────────────────────────────────────── */

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      switchTab(tabId, tabBtns);
    });
  });
}

function switchTab(tabId, tabBtns) {
  // Deactivate all tab buttons
  if (!tabBtns) tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
  tabBtns.forEach(b => {
    b.classList.remove('is-active');
    b.setAttribute('aria-selected', 'false');
  });

  // Hide all tab content
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(tc => tc.classList.remove('is-active'));

  // Activate chosen
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (activeBtn) {
    activeBtn.classList.add('is-active');
    activeBtn.setAttribute('aria-selected', 'true');
  }

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (activeContent) activeContent.classList.add('is-active');
}

/** Auto-open today's workout tab and highlight it */
function openTodaysWorkoutTab() {
  const todayTab = getTodayWorkoutTab();
  if (todayTab) {
    switchTab(todayTab);
  } else {
    // Non-workout day — default to push tab
    switchTab('push');
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   § 6 · TOPBAR — date, day tag
   ───────────────────────────────────────────────────────────────────────── */

function initTopbar() {
  const now = new Date();
  const dateEl  = document.getElementById('topbar-date');
  const dayTag  = document.getElementById('topbar-day-tag');

  if (dateEl) dateEl.textContent = formatTopbarDate(now);

  if (dayTag) {
    const dow      = now.getDay();
    const todayTab = getTodayWorkoutTab();
    const dayLabel = DAY_NAMES[dow];

    const workoutLabels = { push: 'PUSH DAY', pull: 'PULL DAY', legs: 'LEG DAY' };
    dayTag.textContent = todayTab
      ? `${dayLabel} · ${workoutLabels[todayTab]}`
      : `${dayLabel} · REST DAY`;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   § 7 · GREETING (DASHBOARD)
   ───────────────────────────────────────────────────────────────────────── */

function updateGreeting() {
  const greetingText = document.querySelector('.greeting__text');
  const greetingTag  = document.querySelector('.greeting__time-tag');

  if (greetingText) {
    const greeting = getGreetingByTime();
    greetingText.innerHTML = `${greeting}, <em>Warrior</em>`;
  }

  if (greetingTag) {
    const now = new Date();
    const dow  = DAY_NAMES[now.getDay()];
    const todayTab = getTodayWorkoutTab();
    const workoutLabels = { push: 'PUSH DAY', pull: 'PULL DAY', legs: 'LEG DAY' };
    const workoutStr = todayTab ? workoutLabels[todayTab] : 'REST DAY';
    greetingTag.textContent = `// ${dow} · ${workoutStr}`;
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   § 8 · MOTIVATIONAL QUOTE (daily, seeded by date)
   ───────────────────────────────────────────────────────────────────────── */

function updateDailyQuote() {
  const card = document.getElementById('dash-quote');
  if (!card) return;

  // Use today's date as seed so quote changes daily but stays same all day
  const today = getTodayKey();
  const cached = lsGet(LS_KEYS.quote);

  let quote;
  if (cached && cached.date === today) {
    quote = cached.quote;
  } else {
    // Pick quote based on day-of-year for determinism
    const doy   = getDayOfYear(new Date());
    const index = doy % MOTIVATIONAL_QUOTES.length;
    quote = MOTIVATIONAL_QUOTES[index];
    lsSet(LS_KEYS.quote, { date: today, quote });
  }

  const textEl   = card.querySelector('.quote-card__text');
  const authorEl = card.querySelector('.quote-card__author');
  if (textEl)   textEl.textContent   = quote.text;
  if (authorEl) authorEl.textContent = quote.author;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff  = date - start;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/* ─────────────────────────────────────────────────────────────────────────
   § 9 · COUNTDOWN — Days to NEET
   ───────────────────────────────────────────────────────────────────────── */

function updateCountdown() {
  const el = document.getElementById('dash-days-left');
  if (!el) return;
  const days = getDaysToNEET();
  el.textContent = days > 0 ? days : 'EXAM DAY!';
}

/* ─────────────────────────────────────────────────────────────────────────
   § 10 · GYM TRACKER — data layer
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Returns the gym data object for a given date.
 * Shape: { exercises: { "push-01": { checked, weight, sets }, ... }, steps, stepsGoal }
 */
function getGymData(dateKey) {
  return lsGet(LS_KEYS.gymDay(dateKey)) || { exercises: {}, steps: '', stepsGoal: false };
}

function saveGymData(dateKey, data) {
  lsSet(LS_KEYS.gymDay(dateKey), data);
}

/** Read a single exercise row's current DOM values */
function readExerciseFromDOM(exId) {
  const checkbox = document.getElementById(exId);
  if (!checkbox) return null;
  const row = checkbox.closest('.exercise-row');
  if (!row) return null;
  const inputs = row.querySelectorAll('.exercise-row__input');
  return {
    checked: checkbox.checked,
    weight:  inputs[0] ? inputs[0].value : '',
    sets:    inputs[1] ? inputs[1].value : '',
  };
}

/** Write saved exercise data back to DOM */
function populateExerciseToDOM(exId, data) {
  if (!data) return;
  const checkbox = document.getElementById(exId);
  if (!checkbox) return;
  const row = checkbox.closest('.exercise-row');
  if (!row) return;
  const inputs = row.querySelectorAll('.exercise-row__input');

  checkbox.checked = !!data.checked;
  if (inputs[0]) inputs[0].value = data.weight || '';
  if (inputs[1]) inputs[1].value = data.sets   || '';

  // Apply or remove .is-done
  row.classList.toggle('is-done', !!data.checked);
}

/** Save one exercise to localStorage */
function saveExercise(exId, dateKey) {
  const data    = getGymData(dateKey);
  const exData  = readExerciseFromDOM(exId);
  if (exData) {
    data.exercises[exId] = exData;
    saveGymData(dateKey, data);
  }
}

/** Load all exercises from localStorage into DOM */
function loadGymData(dateKey) {
  const data = getGymData(dateKey);

  ALL_EXERCISES.forEach(exId => {
    const exData = data.exercises[exId];
    populateExerciseToDOM(exId, exData);
  });

  // Steps
  const stepInput    = document.getElementById('step-input');
  const stepComplete = document.getElementById('step-complete');
  if (stepInput)    stepInput.value     = data.steps    || '';
  if (stepComplete) stepComplete.checked = !!data.stepsGoal;
}

/** Attach auto-save listeners to all exercise inputs */
function initGymListeners(dateKey) {
  ALL_EXERCISES.forEach(exId => {
    const checkbox = document.getElementById(exId);
    if (!checkbox) return;
    const row = checkbox.closest('.exercise-row');
    const inputs = row ? row.querySelectorAll('.exercise-row__input') : [];

    // Checkbox
    checkbox.addEventListener('change', () => {
      if (row) row.classList.toggle('is-done', checkbox.checked);
      saveExercise(exId, dateKey);
      updateGymProgress(dateKey);
      updateDashboard(dateKey);
    });

    // Weight + Sets inputs
    inputs.forEach(inp => {
      inp.addEventListener('input', () => {
        saveExercise(exId, dateKey);
        updateGymProgress(dateKey);
        updateDashboard(dateKey);
      });
    });
  });

  // Steps input
  const stepInput = document.getElementById('step-input');
  const stepComplete = document.getElementById('step-complete');

  if (stepInput) {
    stepInput.addEventListener('input', () => {
      const data = getGymData(dateKey);
      data.steps = stepInput.value;
      // Auto-check goal if >= target
      if (parseInt(stepInput.value, 10) >= CONFIG.STEP_TARGET) {
        data.stepsGoal = true;
        if (stepComplete) stepComplete.checked = true;
      }
      saveGymData(dateKey, data);
      updateGymProgress(dateKey);
      updateDashboard(dateKey);
    });
  }

  if (stepComplete) {
    stepComplete.addEventListener('change', () => {
      const data = getGymData(dateKey);
      data.stepsGoal = stepComplete.checked;
      saveGymData(dateKey, data);
      updateGymProgress(dateKey);
      updateDashboard(dateKey);
    });
  }
}

/**
 * Gym completion % — uses today's workout tab exercises only
 * (so on a non-workout day it still checks the assigned day)
 */
function calcGymCompletion(dateKey) {
  const data    = getGymData(dateKey);
  const todayTab = getTodayWorkoutTab();
  const exIds   = todayTab ? EXERCISES[todayTab] : ALL_EXERCISES;
  if (!exIds.length) return 0;

  let done = 0;
  exIds.forEach(id => {
    if (data.exercises[id] && data.exercises[id].checked) done++;
  });

  // Steps add a small bonus
  const stepsOk = data.stepsGoal ? 1 : 0;
  const total   = exIds.length + 1; // +1 for steps
  return Math.round(((done + stepsOk) / total) * 100);
}

/** Update gym progress display inside Gym Tracker section (future use) */
function updateGymProgress(dateKey) {
  // No dedicated bar inside gym section — update flows through dashboard
  updateDashboard(dateKey);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 11 · DIET TRACKER — data layer
   ───────────────────────────────────────────────────────────────────────── */

function getDietData(dateKey) {
  return lsGet(LS_KEYS.diet(dateKey)) || { weight: '', calories: '', water: '' };
}

function saveDietData(dateKey, data) {
  lsSet(LS_KEYS.diet(dateKey), data);
}

function loadDietData(dateKey) {
  const data = getDietData(dateKey);
  const weightEl   = document.getElementById('diet-weight');
  const calEl      = document.getElementById('diet-calories');
  const waterEl    = document.getElementById('diet-water');

  if (weightEl) weightEl.value = data.weight   || '';
  if (calEl)    calEl.value    = data.calories  || '';
  if (waterEl)  waterEl.value  = data.water     || '';

  updateDietDisplayCards(data);
}

function updateDietDisplayCards(data) {
  const weightDisp = document.getElementById('diet-weight-display');
  const calDisp    = document.getElementById('diet-cal-display');
  const waterDisp  = document.getElementById('diet-water-display');

  if (weightDisp) weightDisp.textContent = data.weight   ? `${parseFloat(data.weight).toFixed(1)}` : '—';
  if (calDisp)    calDisp.textContent    = data.calories  ? `${parseInt(data.calories, 10)}`        : '—';
  if (waterDisp)  waterDisp.textContent  = data.water     ? `${parseFloat(data.water).toFixed(1)}`  : '—';
}

function initDietListeners(dateKey) {
  const fields = [
    { id: 'diet-weight',   key: 'weight'   },
    { id: 'diet-calories', key: 'calories' },
    { id: 'diet-water',    key: 'water'    },
  ];

  fields.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const data = getDietData(dateKey);
      data[key]  = el.value;
      saveDietData(dateKey, data);
      updateDietDisplayCards(data);
      updateDashboard(dateKey);
    });
  });
}

/** Diet completion % — each field contributes 1/3 */
function calcDietCompletion(dateKey) {
  const data = getDietData(dateKey);
  let score  = 0;
  if (parseFloat(data.weight)   > 0) score++;
  if (parseInt(data.calories, 10) >= CONFIG.DIET_CALORIES_TARGET) score++;
  if (parseFloat(data.water)    >= CONFIG.DIET_WATER_TARGET)      score++;
  return Math.round((score / 3) * 100);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 12 · NEET TRACKER — data layer
   ───────────────────────────────────────────────────────────────────────── */

function getNEETData(dateKey) {
  return lsGet(LS_KEYS.neet(dateKey)) || {
    questions: '', pages: '',
    physics:   { chapters: '', questions: '', accuracy: '' },
    chemistry: { chapters: '', questions: '', accuracy: '' },
    biology:   { chapters: '', questions: '', accuracy: '' },
  };
}

function saveNEETData(dateKey, data) {
  lsSet(LS_KEYS.neet(dateKey), data);
}

function loadNEETData(dateKey) {
  const data = getNEETData(dateKey);

  setVal('neet-questions', data.questions);
  setVal('neet-pages',     data.pages);

  // Subjects
  const subjects = ['phy', 'chem', 'bio'];
  const subjectKeys = { phy: 'physics', chem: 'chemistry', bio: 'biology' };

  subjects.forEach(prefix => {
    const key = subjectKeys[prefix];
    const sub = data[key] || {};
    setVal(`${prefix}-chapters`, sub.chapters);
    setVal(`${prefix}-questions`, sub.questions);
    setVal(`${prefix}-accuracy`,  sub.accuracy);
    updateSubjectDisplays(prefix, sub);
    updateSubjectProgressBar(prefix, sub);
  });
}

function initNEETListeners(dateKey) {
  // Top-level targets
  const topFields = [
    { id: 'neet-questions', key: 'questions' },
    { id: 'neet-pages',     key: 'pages'     },
  ];

  topFields.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      const data = getNEETData(dateKey);
      data[key]  = el.value;
      saveNEETData(dateKey, data);
      updateDashboard(dateKey);
    });
  });

  // Subject fields
  const subjects   = ['phy', 'chem', 'bio'];
  const subjectKeys = { phy: 'physics', chem: 'chemistry', bio: 'biology' };

  subjects.forEach(prefix => {
    const key   = subjectKeys[prefix];
    const fields = ['chapters', 'questions', 'accuracy'];

    fields.forEach(field => {
      const el = document.getElementById(`${prefix}-${field}`);
      if (!el) return;
      el.addEventListener('input', () => {
        const data      = getNEETData(dateKey);
        data[key]       = data[key] || {};
        data[key][field] = el.value;
        saveNEETData(dateKey, data);
        updateSubjectDisplays(prefix, data[key]);
        updateSubjectProgressBar(prefix, data[key]);
        updateDashboard(dateKey);
      });
    });
  });
}

function updateSubjectDisplays(prefix, sub) {
  const displays = {
    chapters: `${prefix}-chapters-display`,
    questions:`${prefix}-questions-display`,
    accuracy: `${prefix}-accuracy-display`,
  };

  const chapEl = document.getElementById(displays.chapters);
  const qEl    = document.getElementById(displays.questions);
  const accEl  = document.getElementById(displays.accuracy);

  if (chapEl) chapEl.textContent = sub.chapters  ? sub.chapters  : '—';
  if (qEl)    qEl.textContent    = sub.questions  ? sub.questions  : '—';
  if (accEl)  accEl.textContent  = sub.accuracy   ? `${sub.accuracy}%` : '—';
}

function updateSubjectProgressBar(prefix, sub) {
  const barId   = `${prefix}-progress-bar`;
  const bar     = document.getElementById(barId);
  if (!bar) return;

  // Progress based on accuracy (most reliable single metric)
  const accuracy = parseInt(sub.accuracy, 10) || 0;
  const pct      = Math.min(accuracy, 100);
  bar.style.width = `${pct}%`;
  bar.setAttribute('aria-valuenow', pct);
}

/** NEET completion % — questions and pages, 50/50 */
function calcNEETCompletion(dateKey) {
  const data = getNEETData(dateKey);
  const qPct = Math.min(
    parseInt(data.questions, 10) / CONFIG.NEET_QUESTIONS_TARGET * 100,
    100
  ) || 0;
  const pPct = Math.min(
    parseInt(data.pages, 10) / CONFIG.NEET_PAGES_TARGET * 100,
    100
  ) || 0;
  return Math.round((qPct + pPct) / 2);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 13 · DASHBOARD — progress bars & stats
   ───────────────────────────────────────────────────────────────────────── */

function updateDashboard(dateKey) {
  const gymPct  = calcGymCompletion(dateKey);
  const dietPct = calcDietCompletion(dateKey);
  const neetPct = calcNEETCompletion(dateKey);
  const overall = Math.round((gymPct + dietPct + neetPct) / 3);

  // Overall completion card
  setDashValue('dash-overall-pct', `${overall}%`);

  // Progress bars
  setProgressBar('dash-gym-bar',  'dash-gym-pct',  gymPct);
  setProgressBar('dash-diet-bar', 'dash-diet-pct', dietPct);
  setProgressBar('dash-neet-bar', 'dash-neet-pct', neetPct);

  // Check streak
  updateStreak(dateKey, gymPct, dietPct, neetPct);
}

function setProgressBar(barId, pctId, value) {
  const bar = document.getElementById(barId);
  const pct = document.getElementById(pctId);
  const clamped = Math.max(0, Math.min(100, value));

  if (bar) {
    bar.style.width = `${clamped}%`;
    // Update aria
    const wrapper = bar.closest('[role="progressbar"]');
    if (wrapper) wrapper.setAttribute('aria-valuenow', clamped);
  }
  if (pct) pct.textContent = `${clamped}%`;
}

function setDashValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ─────────────────────────────────────────────────────────────────────────
   § 14 · STREAK SYSTEM
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Streak data shape:
 * { count: Number, lastCompletedDate: "YYYY-MM-DD", history: ["YYYY-MM-DD",...] }
 */
function getStreakData() {
  return lsGet(LS_KEYS.streak) || { count: 0, lastCompletedDate: null, history: [] };
}

function saveStreakData(data) {
  lsSet(LS_KEYS.streak, data);
}

/**
 * Streak logic:
 * - A day is "completed" if all three trackers are >= 80%
 * - If today is completed and yesterday was last completed → extend streak
 * - If today is completed and last was >1 day ago → reset to 1
 * - If today not completed → streak stays (might still complete today)
 */
function updateStreak(dateKey, gymPct, dietPct, neetPct) {
  const streak    = getStreakData();
  const today     = dateKey;
  const yesterday = getYesterdayKey();
  const threshold = 80;

  const allDone = gymPct >= threshold && dietPct >= threshold && neetPct >= threshold;

  if (allDone && streak.lastCompletedDate !== today) {
    if (streak.lastCompletedDate === yesterday) {
      streak.count++;
    } else {
      streak.count = 1;
    }
    streak.lastCompletedDate = today;
    if (!streak.history.includes(today)) {
      streak.history.push(today);
      // Cap history to last 30 days
      if (streak.history.length > 30) streak.history = streak.history.slice(-30);
    }
    saveStreakData(streak);
  }

  renderStreakUI(streak, today);
}

function renderStreakUI(streak, today) {
  // Update streak count card
  const countEl = document.getElementById('dash-streak');
  if (countEl) countEl.textContent = streak.count || 0;

  // Update streak pips (shows last 7 days)
  const pips = document.querySelectorAll('.streak-pip');
  if (!pips.length) return;

  const lastSevenDates = getLastNDates(7);

  pips.forEach((pip, i) => {
    const dateForPip = lastSevenDates[i];
    pip.classList.remove('is-filled', 'is-today');

    if (dateForPip === today) {
      // Today pip
      const streak = getStreakData();
      if (streak.history.includes(today)) {
        pip.classList.add('is-filled');
      } else {
        pip.classList.add('is-today');
      }
    } else if (streak.history.includes(dateForPip)) {
      pip.classList.add('is-filled');
    }

    pip.title = dateForPip;
  });
}

/** Returns array of last N date keys including today (oldest first) */
function getLastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

function loadStreak() {
  const streak = getStreakData();
  const today  = getTodayKey();
  renderStreakUI(streak, today);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 15 · RESET FUNCTIONALITY
   ───────────────────────────────────────────────────────────────────────── */

function initResetButtons(dateKey) {
  // Inject reset buttons into each tracker section
  injectResetButton('section-gym',  'GYM',  () => resetGym(dateKey));
  injectResetButton('section-diet', 'DIET', () => resetDiet(dateKey));
  injectResetButton('section-neet', 'NEET', () => resetNEET(dateKey));
}

function injectResetButton(sectionId, label, handler) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  // Only inject once
  if (section.querySelector('.reset-btn-wrapper')) return;

  const header = section.querySelector('.section-header');

  const wrapper = document.createElement('div');
  wrapper.className = 'reset-btn-wrapper';
  wrapper.style.cssText = `
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  `;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--ghost reset-btn';
  btn.setAttribute('aria-label', `Reset ${label} Tracker for today`);
  btn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0" aria-hidden="true">
      <path d="M13.5 2.5A7 7 0 1 1 8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      <polyline points="8,1 11,1 11,4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    RESET ${label}
  `;
  btn.style.cssText = `
    font-size: 0.7rem;
    padding: 7px 14px;
    gap: 6px;
    color: var(--text-muted);
    border-color: var(--border);
  `;

  btn.addEventListener('click', () => {
    const confirmed = confirm(`Reset today's ${label} data? This cannot be undone.`);
    if (confirmed) {
      handler();
      // Brief visual feedback
      btn.textContent = `✓ CLEARED`;
      btn.style.color = 'var(--neon-green)';
      setTimeout(() => {
        btn.innerHTML = `
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style="flex-shrink:0" aria-hidden="true">
            <path d="M13.5 2.5A7 7 0 1 1 8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <polyline points="8,1 11,1 11,4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          RESET ${label}
        `;
        btn.style.color = '';
      }, 2000);
    }
  });

  wrapper.appendChild(btn);

  if (header) {
    header.insertAdjacentElement('afterend', wrapper);
  } else {
    section.insertAdjacentElement('afterbegin', wrapper);
  }
}

function resetGym(dateKey) {
  lsRemove(LS_KEYS.gymDay(dateKey));

  // Clear all exercise DOM
  ALL_EXERCISES.forEach(exId => {
    const checkbox = document.getElementById(exId);
    if (!checkbox) return;
    checkbox.checked = false;
    const row = checkbox.closest('.exercise-row');
    if (row) {
      row.classList.remove('is-done');
      row.querySelectorAll('.exercise-row__input').forEach(inp => inp.value = '');
    }
  });

  // Clear steps
  const stepInput    = document.getElementById('step-input');
  const stepComplete = document.getElementById('step-complete');
  if (stepInput)    stepInput.value     = '';
  if (stepComplete) stepComplete.checked = false;

  updateDashboard(dateKey);
}

function resetDiet(dateKey) {
  lsRemove(LS_KEYS.diet(dateKey));

  setVal('diet-weight',   '', true);
  setVal('diet-calories', '', true);
  setVal('diet-water',    '', true);

  updateDietDisplayCards({ weight: '', calories: '', water: '' });
  updateDashboard(dateKey);
}

function resetNEET(dateKey) {
  lsRemove(LS_KEYS.neet(dateKey));

  setVal('neet-questions', '', true);
  setVal('neet-pages',     '', true);

  const subjects   = ['phy', 'chem', 'bio'];
  const subjectKeys = { phy: 'physics', chem: 'chemistry', bio: 'biology' };
  const fields      = ['chapters', 'questions', 'accuracy'];

  subjects.forEach(prefix => {
    fields.forEach(field => setVal(`${prefix}-${field}`, '', true));
    updateSubjectDisplays(prefix, {});
    updateSubjectProgressBar(prefix, {});
  });

  updateDashboard(dateKey);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 16 · DOM HELPERS
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Set the value of an input element.
 * @param {string} id      - element ID
 * @param {*}      value   - value to set
 * @param {boolean} asInput - if true, set .value (input); else .textContent
 */
function setVal(id, value, asInput = false) {
  const el = document.getElementById(id);
  if (!el) return;
  if (asInput || el.tagName === 'INPUT') {
    el.value = value != null ? value : '';
  } else {
    el.textContent = value != null ? value : '—';
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   § 17 · WEEKLY CHART — inline SVG spark chart (no Chart.js needed)
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Build a simple inline SVG line chart from last 7 days of completion data.
 * Draws three lines: Gym (green), Diet (amber), NEET (purple).
 */
function renderWeeklyChart() {
  const container = document.getElementById('chart-weekly');
  if (!container) return;

  const dates   = getLastNDates(7);
  const gymPcts  = dates.map(d => calcGymCompletion(d));
  const dietPcts = dates.map(d => calcDietCompletion(d));
  const neetPcts = dates.map(d => calcNEETCompletion(d));

  const W = 600, H = 180, PAD = { top: 16, right: 20, bottom: 30, left: 32 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top  - PAD.bottom;
  const n = dates.length;

  /** Map value 0–100 → svg y coordinate */
  const yScale = (val) => PAD.top + innerH - (val / 100) * innerH;

  /** Map index → svg x coordinate */
  const xScale = (i)   => PAD.left + (i / (n - 1)) * innerW;

  /** Build polyline points string */
  function makePoints(pcts) {
    return pcts.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
  }

  /** Build gradient fill area path */
  function makeFillPath(pcts, color) {
    const pts = pcts.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' L');
    const lastX = xScale(n - 1).toFixed(1);
    const firstX = xScale(0).toFixed(1);
    const baseY  = (PAD.top + innerH).toFixed(1);
    return `M ${firstX},${baseY} L ${pts} L ${lastX},${baseY} Z`;
  }

  // Y-axis grid lines at 0, 25, 50, 75, 100
  const gridLines = [0, 25, 50, 75, 100].map(v => {
    const y = yScale(v).toFixed(1);
    return `
      <line x1="${PAD.left}" y1="${y}" x2="${W - PAD.right}" y2="${y}"
            stroke="rgba(0,245,255,0.06)" stroke-width="1"/>
      <text x="${PAD.left - 6}" y="${y}" fill="rgba(100,140,180,0.6)"
            font-size="8" font-family="Share Tech Mono, monospace"
            text-anchor="end" dominant-baseline="middle">${v}%</text>
    `;
  }).join('');

  // X-axis labels
  const xLabels = dates.map((d, i) => {
    const parts = d.split('-');
    const dt    = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const label = `${DAY_NAMES[dt.getDay()]} ${parts[2]}`;
    return `
      <text x="${xScale(i).toFixed(1)}" y="${H - 6}"
            fill="rgba(100,140,180,0.55)"
            font-size="8" font-family="Share Tech Mono, monospace"
            text-anchor="middle">${label}</text>
    `;
  }).join('');

  // Dots
  function makeDots(pcts, color, glow) {
    return pcts.map((v, i) => `
      <circle cx="${xScale(i).toFixed(1)}" cy="${yScale(v).toFixed(1)}" r="3"
              fill="${color}"
              style="filter: drop-shadow(0 0 4px ${color})"/>
    `).join('');
  }

  const svg = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;height:100%;display:block;">
      <defs>
        <linearGradient id="fillGym"  x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#39ff14" stop-opacity="0.18"/><stop offset="100%" stop-color="#39ff14" stop-opacity="0"/></linearGradient>
        <linearGradient id="fillDiet" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffb800" stop-opacity="0.14"/><stop offset="100%" stop-color="#ffb800" stop-opacity="0"/></linearGradient>
        <linearGradient id="fillNEET" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a855f7" stop-opacity="0.14"/><stop offset="100%" stop-color="#a855f7" stop-opacity="0"/></linearGradient>
      </defs>

      <!-- Grid -->
      ${gridLines}
      ${xLabels}

      <!-- Fill areas -->
      <path d="${makeFillPath(gymPcts)}"  fill="url(#fillGym)"  />
      <path d="${makeFillPath(dietPcts)}" fill="url(#fillDiet)" />
      <path d="${makeFillPath(neetPcts)}" fill="url(#fillNEET)" />

      <!-- Lines -->
      <polyline points="${makePoints(gymPcts)}"  fill="none" stroke="#39ff14" stroke-width="1.8"
                stroke-linejoin="round" stroke-linecap="round"
                style="filter:drop-shadow(0 0 4px #39ff14)"/>
      <polyline points="${makePoints(dietPcts)}" fill="none" stroke="#ffb800" stroke-width="1.8"
                stroke-linejoin="round" stroke-linecap="round"
                style="filter:drop-shadow(0 0 4px #ffb800)"/>
      <polyline points="${makePoints(neetPcts)}" fill="none" stroke="#a855f7" stroke-width="1.8"
                stroke-linejoin="round" stroke-linecap="round"
                style="filter:drop-shadow(0 0 4px #a855f7)"/>

      <!-- Dots -->
      ${makeDots(gymPcts,  '#39ff14')}
      ${makeDots(dietPcts, '#ffb800')}
      ${makeDots(neetPcts, '#a855f7')}

      <!-- Legend -->
      <circle cx="${PAD.left}"      cy="${PAD.top - 6}" r="3" fill="#39ff14"/>
      <text    x="${PAD.left + 8}"  y="${PAD.top - 3}"  fill="#39ff14" font-size="9" font-family="Share Tech Mono, monospace">GYM</text>
      <circle cx="${PAD.left + 48}" cy="${PAD.top - 6}" r="3" fill="#ffb800"/>
      <text    x="${PAD.left + 56}" y="${PAD.top - 3}"  fill="#ffb800" font-size="9" font-family="Share Tech Mono, monospace">DIET</text>
      <circle cx="${PAD.left + 104}" cy="${PAD.top - 6}" r="3" fill="#a855f7"/>
      <text    x="${PAD.left + 112}" y="${PAD.top - 3}" fill="#a855f7" font-size="9" font-family="Share Tech Mono, monospace">NEET</text>
    </svg>
  `;

  container.innerHTML = svg;
}

/* ─────────────────────────────────────────────────────────────────────────
   § 18 · NEW DAY DETECTION — clear today's data if it's a new day
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Checks if the app last ran on a different day.
 * If so, the date-keyed data naturally doesn't exist yet — inputs will be
 * blank. We just update the "last date" key.
 */
function handleNewDay() {
  const today    = getTodayKey();
  const lastDate = lsGet(LS_KEYS.lastDate);

  if (lastDate && lastDate !== today) {
    // New day — check if yesterday's streak should be maintained or broken
    const streakData = getStreakData();
    const yesterday  = getYesterdayKey();

    if (streakData.lastCompletedDate &&
        streakData.lastCompletedDate !== yesterday &&
        streakData.lastCompletedDate !== today) {
      // Streak was missed — reset
      streakData.count = 0;
      saveStreakData(streakData);
    }
  }

  lsSet(LS_KEYS.lastDate, today);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 19 · KEYBOARD SHORTCUTS
   ───────────────────────────────────────────────────────────────────────── */

function initKeyboardShortcuts() {
  const sectionMap = {
    '1': 'dashboard',
    '2': 'gym',
    '3': 'diet',
    '4': 'neet',
  };

  document.addEventListener('keydown', (e) => {
    // Only trigger if not inside an input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    const target = sectionMap[e.key];
    if (target) {
      const navLinks = document.querySelectorAll('.nav__link[data-section]');
      const sections = document.querySelectorAll('.section');
      const breadcrumb = document.getElementById('topbar-section-label');
      switchSection(target, navLinks, sections, breadcrumb);
    }
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   § 20 · LIVE CLOCK — update topbar date string every minute
   ───────────────────────────────────────────────────────────────────────── */

function startLiveClock() {
  // Update immediately, then every minute
  initTopbar();

  const msToNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(() => {
    initTopbar();
    setInterval(initTopbar, 60000);
  }, msToNextMinute);
}

/* ─────────────────────────────────────────────────────────────────────────
   § 21 · EXERCISE ROW VISUAL SYNC on page load
   ───────────────────────────────────────────────────────────────────────── */

/** Re-apply .is-done class based on current checkbox state */
function syncExerciseRowStyles() {
  ALL_EXERCISES.forEach(exId => {
    const checkbox = document.getElementById(exId);
    if (!checkbox) return;
    const row = checkbox.closest('.exercise-row');
    if (row) row.classList.toggle('is-done', checkbox.checked);
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   § 22 · INITIAL DATA LOAD
   ───────────────────────────────────────────────────────────────────────── */

function loadAllData(dateKey) {
  loadGymData(dateKey);
  loadDietData(dateKey);
  loadNEETData(dateKey);
  syncExerciseRowStyles();
}

/* ─────────────────────────────────────────────────────────────────────────
   § 23 · FULL DASHBOARD REFRESH
   ───────────────────────────────────────────────────────────────────────── */

function fullRefresh(dateKey) {
  updateGreeting();
  updateDailyQuote();
  updateCountdown();
  loadStreak();
  updateDashboard(dateKey);
  renderWeeklyChart();
}

/* ─────────────────────────────────────────────────────────────────────────
   § 24 · BOOT — main entry point
   ───────────────────────────────────────────────────────────────────────── */

function boot() {
  const dateKey = getTodayKey();

  // 1. Handle new day detection (updates streak if missed)
  handleNewDay();

  // 2. Navigation
  initNavigation();

  // 3. Tabs — open today's workout automatically
  initTabs();
  openTodaysWorkoutTab();

  // 4. Load all saved data into DOM
  loadAllData(dateKey);

  // 5. Attach auto-save listeners
  initGymListeners(dateKey);
  initDietListeners(dateKey);
  initNEETListeners(dateKey);

  // 6. Inject reset buttons
  initResetButtons(dateKey);

  // 7. Dashboard visual updates
  fullRefresh(dateKey);

  // 8. Topbar live clock
  startLiveClock();

  // 9. Keyboard shortcuts
  initKeyboardShortcuts();

  // 10. Periodic dashboard refresh every 5 minutes (keeps chart & streak up to date)
  setInterval(() => {
    updateDashboard(dateKey);
    renderWeeklyChart();
  }, 5 * 60 * 1000);

  // 11. Console welcome message
  console.log(
    '%c NEXUS WARRIOR DASHBOARD %c v2.0 booted successfully ',
    'background:#00f5ff;color:#04060f;font-weight:900;padding:4px 8px;font-family:monospace;',
    'background:#080e1e;color:#00f5ff;padding:4px 8px;font-family:monospace;border:1px solid #00f5ff22;'
  );
  console.log('%c Today: ' + dateKey + ' · Days to NEET: ' + getDaysToNEET(),
    'color:#6a8aac;font-family:monospace;font-size:11px;');
}

// ── Run on DOM ready ─────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
