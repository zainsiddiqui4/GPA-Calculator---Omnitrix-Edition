/* ═══════════════════════════════════════════════════════════════
   FAST NUCES GPA CALCULATOR — Omnitrix Edition · script.js
   Modules:
     1. Grade map (single source of truth)
     2. Helpers (DOM, toast, ripple)
     3. Theme toggle
     4. Navigation (hamburger, scroll-spy, smooth scroll)
     5. Scroll reveal + hero counters
     6. Tabs (SGPA / CGPA)
     7. Dynamic rows
     8. Calculation engine + validation
     9. Result rendering (ring, metrics, table, summary, sorting)
    10. Download / Save-as-PDF
    11. Grading scale table
    12. Quotes API (free, with graceful fallback + cache)
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. GRADE MAP — official FAST NUCES criteria ─────────────── */
const GRADES = [
  { grade: 'A+', range: '90% – 100%', gp: 4.00, remarks: 'Exceptional'   },
  { grade: 'A',  range: '86% – 89%',  gp: 4.00, remarks: 'Excellent'     },
  { grade: 'A-', range: '82% – 85%',  gp: 3.67, remarks: 'Very Good'     },
  { grade: 'B+', range: '78% – 81%',  gp: 3.33, remarks: 'Good'          },
  { grade: 'B',  range: '74% – 77%',  gp: 3.00, remarks: 'Above Average' },
  { grade: 'B-', range: '70% – 73%',  gp: 2.67, remarks: 'Average'       },
  { grade: 'C+', range: '66% – 69%',  gp: 2.33, remarks: 'Satisfactory'  },
  { grade: 'C',  range: '62% – 65%',  gp: 2.00, remarks: 'Adequate'      },
  { grade: 'C-', range: '58% – 61%',  gp: 1.67, remarks: 'Pass'          },
  { grade: 'D+', range: '54% – 57%',  gp: 1.33, remarks: 'Marginal'      },
  { grade: 'D',  range: '50% – 53%',  gp: 1.00, remarks: 'Minimum Pass'  },
  { grade: 'F',  range: '0% – 49%',   gp: 0.00, remarks: 'Fail'          },
];
const GP_OF = Object.fromEntries(GRADES.map(g => [g.grade, g.gp]));

/* Approx. percentage midpoints per grade — used for the percentage metric */
const PCT_MID = {
  'A+': 95, 'A': 87.5, 'A-': 83.5, 'B+': 79.5, 'B': 75.5, 'B-': 71.5,
  'C+': 67.5, 'C': 63.5, 'C-': 59.5, 'D+': 55.5, 'D': 51.5, 'F': 40,
};

/* GPA → status label */
function gradeStatus(gpa) {
  if (gpa >= 3.67) return 'Outstanding — Dean\u2019s List territory';
  if (gpa >= 3.00) return 'Great standing';
  if (gpa >= 2.00) return 'Good standing';
  if (gpa >= 1.00) return 'Warning zone — needs improvement';
  return 'Critical — seek academic advising';
}

/* GPA → approximate percentage (linear interpolation over the FAST scale) */
function gpaToPercent(gpa) {
  // Build sorted (gp, pct) anchor points from the scale, then interpolate.
  const pts = [[0, 40], [1.0, 51.5], [1.33, 55.5], [1.67, 59.5], [2.0, 63.5],
               [2.33, 67.5], [2.67, 71.5], [3.0, 75.5], [3.33, 79.5],
               [3.67, 83.5], [4.0, 91]];
  if (gpa <= 0) return 40;
  if (gpa >= 4) return Math.min(100, 91 + (gpa - 4) * 10);
  for (let i = 1; i < pts.length; i++) {
    if (gpa <= pts[i][0]) {
      const [g0, p0] = pts[i - 1], [g1, p1] = pts[i];
      return p0 + ((gpa - g0) / (g1 - g0)) * (p1 - p0);
    }
  }
  return 91;
}

/* ── 2. HELPERS ──────────────────────────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* Toast notifications */
function toast(msg, type = 'ok', ms = 3200) {
  const wrap = $('#toastWrap');
  const el = document.createElement('div');
  el.className = `toast ${type === 'error' ? 'error' : ''}`;
  el.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, ms);
}

/* Button ripple micro-interaction */
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('.btn, .tab');
  if (!btn) return;
  const r = document.createElement('span');
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  r.className = 'ripple';
  r.style.width = r.style.height = `${size}px`;
  r.style.left = `${e.clientX - rect.left - size / 2}px`;
  r.style.top  = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove(), { once: true });
});

/* ── 3. THEME TOGGLE ─────────────────────────────────────────── */
const themeToggle = $('#themeToggle');
const savedTheme = localStorage.getItem('gpa-theme');
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('gpa-theme', next);
});

/* ── 4. NAVIGATION ───────────────────────────────────────────── */
const hamburger = $('#hamburger');
const navLinks  = $('#navLinks');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
});

/* Close drawer when a link is tapped */
$$('.nav-link').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}));

/* Header shadow on scroll */
const header = $('#siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

/* Scroll-spy: highlight active section link */
const sections = ['home', 'calculator', 'rules', 'grading', 'quotes']
  .map(id => document.getElementById(id));

const spy = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      $$('.nav-link').forEach(a =>
        a.classList.toggle('active', a.getAttribute('href') === `#${en.target.id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => s && spy.observe(s));

/* ── 5. SCROLL REVEAL + HERO COUNTERS ────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach(el => revealObs.observe(el));

/* Animated hero counters */
function animateCount(el, target, ms = 1400) {
  const isFloat = String(target).includes('.');
  const start = performance.now();
  function frame(now) {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = isFloat ? (target * eased).toFixed(2) : Math.round(target * eased);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      animateCount(en.target, parseFloat(en.target.dataset.count));
      counterObs.unobserve(en.target);
    }
  });
}, { threshold: 0.6 });
$$('.stat-num').forEach(el => counterObs.observe(el));

/* ── 6. TABS ─────────────────────────────────────────────────── */
const tabSgpa = $('#tabSgpa'), tabCgpa = $('#tabCgpa'), glider = $('#tabGlider');
const sgpaPanel = $('#sgpaPanel'), cgpaPanel = $('#cgpaPanel');
let mode = 'sgpa';

function positionGlider(tab) {
  glider.style.left  = `${tab.offsetLeft}px`;
  glider.style.width = `${tab.offsetWidth}px`;
}
function setMode(next) {
  mode = next;
  const active = next === 'sgpa' ? tabSgpa : tabCgpa;
  const idle   = next === 'sgpa' ? tabCgpa : tabSgpa;
  active.classList.add('active');   active.setAttribute('aria-selected', 'true');
  idle.classList.remove('active');  idle.setAttribute('aria-selected', 'false');
  sgpaPanel.classList.toggle('hidden', next !== 'sgpa');
  cgpaPanel.classList.toggle('hidden', next !== 'cgpa');
  positionGlider(active);
  hideResult();
}
tabSgpa.addEventListener('click', () => setMode('sgpa'));
tabCgpa.addEventListener('click', () => setMode('cgpa'));
window.addEventListener('resize', () => positionGlider(mode === 'sgpa' ? tabSgpa : tabCgpa));
window.addEventListener('load',  () => positionGlider(tabSgpa));

/* ── 7. DYNAMIC ROWS ─────────────────────────────────────────── */
const sgpaRows = $('#sgpaRows'), cgpaRows = $('#cgpaRows');
const CH_OPTIONS = [0, 1, 2, 3, 4, 5, 6];

function gradeOptionsHTML() {
  return `<option value="" disabled selected>Grade</option>` +
    GRADES.map(g => `<option value="${g.grade}">${g.grade} (${g.gp.toFixed(2)})</option>`).join('');
}
function chOptionsHTML() {
  return `<option value="" disabled selected>CH</option>` +
    CH_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('');
}

function makeSgpaRow(index) {
  const row = document.createElement('div');
  row.className = 'row sgpa-cols';
  row.innerHTML = `
    <input class="field f-name" type="text" placeholder="Course ${index} (optional)" aria-label="Course name" />
    <select class="field f-ch" aria-label="Credit hours">${chOptionsHTML()}</select>
    <select class="field f-grade" aria-label="Grade">${gradeOptionsHTML()}</select>
    <button class="row-del" aria-label="Remove course" title="Remove">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    </button>`;
  wireRow(row, sgpaRows, 'subject');
  return row;
}

function makeCgpaRow(index) {
  const row = document.createElement('div');
  row.className = 'row cgpa-cols';
  row.innerHTML = `
    <input class="field f-name" type="text" placeholder="Semester ${index} (optional)" aria-label="Semester name" />
    <input class="field f-gpa" type="number" min="0" max="4" step="0.01" placeholder="GPA (0–4)" aria-label="Semester GPA" />
    <input class="field f-ch-num" type="number" min="1" max="30" step="1" placeholder="Credit Hours" aria-label="Credit hours" />
    <button class="row-del" aria-label="Remove semester" title="Remove">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
    </button>`;
  wireRow(row, cgpaRows, 'semester');
  return row;
}

function wireRow(row, container, label) {
  row.querySelector('.row-del').addEventListener('click', () => {
    if (container.children.length <= 1) {
      toast(`At least one ${label} row is required.`, 'error');
      return;
    }
    row.classList.add('removing');
    row.addEventListener('animationend', () => row.remove(), { once: true });
  });
  /* Live validation: clear invalid state on input */
  $$('.field', row).forEach(f =>
    f.addEventListener('input', () => f.classList.remove('invalid')));
}

function addSgpaRow()  { sgpaRows.appendChild(makeSgpaRow(sgpaRows.children.length + 1)); }
function addCgpaRow()  { cgpaRows.appendChild(makeCgpaRow(cgpaRows.children.length + 1)); }

$('#addSubjectBtn').addEventListener('click', addSgpaRow);
$('#addSemesterBtn').addEventListener('click', addCgpaRow);

$('#resetSgpaBtn').addEventListener('click', () => {
  sgpaRows.innerHTML = '';
  for (let i = 0; i < 4; i++) addSgpaRow();
  hideResult();
  toast('SGPA calculator reset.');
});
$('#resetCgpaBtn').addEventListener('click', () => {
  cgpaRows.innerHTML = '';
  for (let i = 0; i < 2; i++) addCgpaRow();
  hideResult();
  toast('CGPA calculator reset.');
});

/* Seed initial rows */
for (let i = 0; i < 4; i++) addSgpaRow();
for (let i = 0; i < 2; i++) addCgpaRow();

/* ── 8. CALCULATION ENGINE + VALIDATION ──────────────────────── */
function markInvalid(field) { field.classList.add('invalid'); }

function collectSgpa() {
  const rows = $$('.row', sgpaRows);
  const items = [];
  let bad = false;

  rows.forEach((row, i) => {
    const name  = $('.f-name', row).value.trim() || `Course ${i + 1}`;
    const chSel = $('.f-ch', row);
    const grSel = $('.f-grade', row);
    const ch    = chSel.value === '' ? NaN : Number(chSel.value);
    const grade = grSel.value;

    if (Number.isNaN(ch)) { markInvalid(chSel); bad = true; }
    if (!grade)           { markInvalid(grSel); bad = true; }
    if (!Number.isNaN(ch) && grade) items.push({ name, ch, grade, gp: GP_OF[grade] });
  });

  if (bad) { toast('Please fill credit hours and grade for every course.', 'error'); return null; }
  if (!items.length) { toast('Add at least one course.', 'error'); return null; }

  const graded = items.filter(it => it.ch > 0); // 0-CH courses don't affect GPA
  const totalCH = graded.reduce((s, it) => s + it.ch, 0);
  if (totalCH === 0) { toast('Total credit hours cannot be zero — GPA is undefined.', 'error'); return null; }

  const totalQP = graded.reduce((s, it) => s + it.gp * it.ch, 0);
  return { items, totalCH, totalQP, gpa: totalQP / totalCH };
}

function collectCgpa() {
  const rows = $$('.row', cgpaRows);
  const items = [];
  let bad = false;

  rows.forEach((row, i) => {
    const name = $('.f-name', row).value.trim() || `Semester ${i + 1}`;
    const gpaF = $('.f-gpa', row);
    const chF  = $('.f-ch-num', row);
    const gpa  = parseFloat(gpaF.value);
    const ch   = parseFloat(chF.value);

    const gpaOk = !Number.isNaN(gpa) && gpa >= 0 && gpa <= 4;
    const chOk  = !Number.isNaN(ch) && ch > 0 && Number.isInteger(ch);
    if (!gpaOk) { markInvalid(gpaF); bad = true; }
    if (!chOk)  { markInvalid(chF);  bad = true; }
    if (gpaOk && chOk) items.push({ name, gpa, ch });
  });

  if (bad) { toast('Enter a valid GPA (0–4) and whole-number credit hours for every semester.', 'error'); return null; }
  if (!items.length) { toast('Add at least one semester.', 'error'); return null; }

  const totalCH = items.reduce((s, it) => s + it.ch, 0);
  const totalQP = items.reduce((s, it) => s + it.gpa * it.ch, 0);
  return { items, totalCH, totalQP, gpa: totalQP / totalCH };
}

$('#calcSgpaBtn').addEventListener('click', () => {
  const data = collectSgpa();
  if (data) { renderResult(data, 'SGPA'); toast('SGPA calculated — it\u2019s hero time! ⚡'); }
});
$('#calcCgpaBtn').addEventListener('click', () => {
  const data = collectCgpa();
  if (data) { renderResult(data, 'CGPA'); toast('CGPA calculated — it\u2019s hero time! ⚡'); }
});

/* ── 9. RESULT RENDERING ─────────────────────────────────────── */
const resultSection = $('#resultSection');
const RING_CIRC = 603.19; // 2π × 96
let lastResult = null;    // kept for sorting + download

function hideResult() { resultSection.classList.add('hidden'); }

function animateRing(gpa) {
  const fg = $('#ringFg');
  const value = $('#ringValue');
  const frac = Math.min(1, Math.max(0, gpa / 4));
  // reset then animate on next frame so the CSS transition fires
  fg.style.transition = 'none';
  fg.style.strokeDashoffset = RING_CIRC;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fg.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.22,1,0.36,1)';
    fg.style.strokeDashoffset = RING_CIRC * (1 - frac);
  }));
  animateCount(value, gpa, 1600);
}

function renderResult(data, label) {
  lastResult = { ...data, label };
  const gpa = data.gpa;
  const pct = label === 'SGPA'
    ? weightedPercent(data.items)             // course-grade-based estimate
    : gpaToPercent(gpa);                      // GPA-based estimate

  /* Ring + metrics */
  $('#ringLabel').textContent = label;
  animateRing(gpa);
  $('#metricGpaLabel').textContent = label;
  $('#metricGpa').textContent = gpa.toFixed(2);
  $('#metricPct').textContent = `${pct.toFixed(1)}%`;
  $('#metricCh').textContent  = data.totalCH;
  $('#metricCoursesLabel').textContent = label === 'SGPA' ? 'Courses' : 'Semesters';
  $('#metricCourses').textContent = data.items.length;

  /* Table */
  $('#tableTitle').textContent = label === 'SGPA' ? 'Course-wise Result' : 'Semester-wise Result';
  renderTable(label);

  /* Summary */
  const grid = $('#summaryGrid');
  grid.innerHTML = [
    ['Total Credit Hours', data.totalCH],
    ['Total Quality Points', data.totalQP.toFixed(2)],
    [`Final ${label}`, gpa.toFixed(2), true],
    ['Percentage (approx.)', `${pct.toFixed(1)}%`],
    ['Grade Status', gradeStatus(gpa)],
  ].map(([l, v, hl]) => `
    <div class="summary-item ${hl ? 'highlight' : ''}">
      <span class="s-label">${l}</span>
      <span class="s-value">${v}</span>
    </div>`).join('');

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* SGPA percentage: credit-weighted midpoint of the grade percentage bands */
function weightedPercent(items) {
  const graded = items.filter(it => it.ch > 0);
  const ch = graded.reduce((s, it) => s + it.ch, 0);
  if (!ch) return 0;
  return graded.reduce((s, it) => s + PCT_MID[it.grade] * it.ch, 0) / ch;
}

/* ── Sortable result table ── */
let sortState = { key: null, dir: 1 };

function renderTable(label) {
  const thead = $('#resultThead'), tbody = $('#resultTbody'), tfoot = $('#resultTfoot');
  const isS = label === 'SGPA';

  const cols = isS
    ? [['name','Course Name'], ['ch','Credit Hours'], ['grade','Grade'], ['gp','GP'], ['qp','QP']]
    : [['name','Semester'], ['gpa','GPA'], ['ch','Credit Hours'], ['qp','QP = GPA×CH']];

  thead.innerHTML = `<tr>${cols.map(([k, t]) =>
    `<th class="sortable" data-key="${k}">${t}<span class="sort-arrow">${sortState.key === k ? (sortState.dir === 1 ? '▲' : '▼') : '↕'}</span></th>`
  ).join('')}</tr>`;

  /* Build sortable data */
  let rows = lastResult.items.map(it => isS
    ? { name: it.name, ch: it.ch, grade: it.grade, gp: it.gp, qp: it.gp * it.ch }
    : { name: it.name, gpa: it.gpa, ch: it.ch, qp: it.gpa * it.ch });

  if (sortState.key) {
    const k = sortState.key;
    rows.sort((a, b) => {
      const av = a[k], bv = b[k];
      if (typeof av === 'string') return av.localeCompare(bv) * sortState.dir;
      return (av - bv) * sortState.dir;
    });
  }

  tbody.innerHTML = rows.map(r => isS
    ? `<tr><td>${escapeHTML(r.name)}</td><td>${r.ch}</td>
        <td><span class="grade-chip ${r.grade === 'F' ? 'fail' : ''}">${r.grade}</span></td>
        <td>${r.gp.toFixed(2)}</td><td>${r.qp.toFixed(2)}</td></tr>`
    : `<tr><td>${escapeHTML(r.name)}</td><td>${r.gpa.toFixed(2)}</td>
        <td>${r.ch}</td><td>${r.qp.toFixed(2)}</td></tr>`
  ).join('');

  tfoot.innerHTML = isS
    ? `<tr><td>Total Quality Points</td><td>${lastResult.totalCH}</td><td>—</td><td>—</td><td>${lastResult.totalQP.toFixed(2)}</td></tr>`
    : `<tr><td>Total</td><td>—</td><td>${lastResult.totalCH}</td><td>${lastResult.totalQP.toFixed(2)}</td></tr>`;

  /* Wire sorting */
  $$('th.sortable', thead).forEach(th => th.addEventListener('click', () => {
    const key = th.dataset.key;
    sortState = { key, dir: sortState.key === key ? -sortState.dir : 1 };
    renderTable(label);
  }));
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ── 10. DOWNLOAD / SAVE AS PDF ──────────────────────────────── */
/* Both use the browser's native print-to-PDF — dependency-free and reliable. */
function printResult() {
  if (!lastResult) { toast('Calculate a result first.', 'error'); return; }
  window.print();
}
$('#pdfBtn').addEventListener('click', printResult);

/* "Download Result" — generates a clean standalone HTML report and downloads it */
$('#downloadBtn').addEventListener('click', () => {
  if (!lastResult) { toast('Calculate a result first.', 'error'); return; }
  const { label, items, totalCH, totalQP, gpa } = lastResult;
  const isS = label === 'SGPA';
  const pct = isS ? weightedPercent(items) : gpaToPercent(gpa);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const rowsHTML = items.map(it => isS
    ? `<tr><td>${escapeHTML(it.name)}</td><td>${it.ch}</td><td>${it.grade}</td><td>${it.gp.toFixed(2)}</td><td>${(it.gp * it.ch).toFixed(2)}</td></tr>`
    : `<tr><td>${escapeHTML(it.name)}</td><td>${it.gpa.toFixed(2)}</td><td>${it.ch}</td><td>${(it.gpa * it.ch).toFixed(2)}</td></tr>`
  ).join('');

  const headHTML = isS
    ? '<th>Course</th><th>CH</th><th>Grade</th><th>GP</th><th>QP</th>'
    : '<th>Semester</th><th>GPA</th><th>CH</th><th>QP</th>';

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${label} Result — FAST NUCES</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;color:#14211a;max-width:720px;margin:2rem auto;padding:0 1rem}
  h1{color:#067a3d;font-size:1.5rem;border-bottom:3px solid #067a3d;padding-bottom:.5rem}
  .big{font-size:2.6rem;font-weight:800;color:#067a3d}
  table{width:100%;border-collapse:collapse;margin:1.2rem 0}
  th{background:#eafff2;color:#067a3d;text-align:left;padding:.55rem .7rem;border:1px solid #cde9d8}
  td{padding:.5rem .7rem;border:1px solid #e2efe8}
  tfoot td{font-weight:700;background:#f4faf6}
  .meta{color:#557} .grid{display:flex;gap:1rem;flex-wrap:wrap;margin:1rem 0}
  .cell{border:1px solid #cde9d8;border-radius:10px;padding:.7rem 1rem;min-width:140px}
  .cell b{display:block;color:#067a3d}
</style></head><body>
<h1>FAST NUCES — ${label} Result</h1>
<p class="meta">Generated on ${date} · FAST NUCES GPA Calculator (Omnitrix Edition)</p>
<p class="big">${label}: ${gpa.toFixed(2)}</p>
<div class="grid">
  <div class="cell"><b>${gpa.toFixed(2)}</b>Final ${label}</div>
  <div class="cell"><b>${pct.toFixed(1)}%</b>Percentage (approx.)</div>
  <div class="cell"><b>${totalCH}</b>Total Credit Hours</div>
  <div class="cell"><b>${totalQP.toFixed(2)}</b>Total Quality Points</div>
  <div class="cell"><b>${gradeStatus(gpa)}</b>Status</div>
</div>
<table><thead><tr>${headHTML}</tr></thead><tbody>${rowsHTML}</tbody>
<tfoot><tr><td>Total</td>${isS ? '<td>' + totalCH + '</td><td>—</td><td>—</td>' : '<td>—</td><td>' + totalCH + '</td>'}<td>${totalQP.toFixed(2)}</td></tr></tfoot></table>
<p class="meta">Formula: ${isS ? 'GPA = Σ(GP × CH) ÷ Σ(CH)' : 'CGPA = Σ(Semester GPA × CH) ÷ Σ(CH)'}</p>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `FAST-${label}-Result.html`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Result downloaded. Open it and press Ctrl+P to save as PDF too.');
});

/* ── 11. GRADING SCALE TABLE (built from the single grade map) ── */
$('#gradingTbody').innerHTML = GRADES.map(g => `
  <tr>
    <td><span class="grade-chip ${g.grade === 'F' ? 'fail' : ''}">${g.grade}</span></td>
    <td>${g.range}</td>
    <td>${g.gp.toFixed(2)}</td>
    <td>QP = ${g.gp.toFixed(2)} × Credit Hours</td>
    <td>${(g.gp * 3).toFixed(2)}</td>
    <td>${g.remarks}</td>
  </tr>`).join('');

/* ── 12. QUOTES API ──────────────────────────────────────────── */
/* Primary: dummyjson.com (free, no key, CORS-enabled).
   Fallback: local cache → curated offline quotes. Failures degrade gracefully. */
const OFFLINE_QUOTES = [
  { q: 'It\u2019s hero time — but first, it\u2019s study time.', a: 'Omnitrix Wisdom' },
  { q: 'Success is the sum of small efforts, repeated day in and day out.', a: 'Robert Collier' },
  { q: 'The expert in anything was once a beginner.', a: 'Helen Hayes' },
  { q: 'Don\u2019t watch the clock; do what it does. Keep going.', a: 'Sam Levenson' },
  { q: 'The future belongs to those who believe in the beauty of their dreams.', a: 'Eleanor Roosevelt' },
  { q: 'Education is the most powerful weapon which you can use to change the world.', a: 'Nelson Mandela' },
  { q: 'It always seems impossible until it\u2019s done.', a: 'Nelson Mandela' },
  { q: 'Strive for progress, not perfection.', a: 'Unknown' },
];

const quoteText = $('#quoteText');
const quoteAuthor = $('#quoteAuthor');
const quoteLoader = $('#quoteLoader');
const newQuoteBtn = $('#newQuoteBtn');
const QCACHE_KEY = 'gpa-quote-cache';

function showQuote(q, a) {
  /* retrigger entrance animations */
  quoteText.style.animation = 'none'; quoteAuthor.style.animation = 'none';
  void quoteText.offsetWidth;
  quoteText.style.animation = ''; quoteAuthor.style.animation = '';
  quoteText.textContent = q;
  quoteAuthor.textContent = a;
}

async function fetchQuote() {
  quoteLoader.classList.add('on');
  quoteText.textContent = ''; quoteAuthor.textContent = '';
  newQuoteBtn.disabled = true;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch('https://dummyjson.com/quotes/random', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    showQuote(data.quote, data.author || 'Unknown');

    /* cache last few good quotes for offline fallback */
    const cache = JSON.parse(localStorage.getItem(QCACHE_KEY) || '[]');
    cache.unshift({ q: data.quote, a: data.author || 'Unknown' });
    localStorage.setItem(QCACHE_KEY, JSON.stringify(cache.slice(0, 12)));
  } catch {
    /* Graceful degradation: cached quotes first, then curated offline set */
    const cache = JSON.parse(localStorage.getItem(QCACHE_KEY) || '[]');
    const pool = cache.length ? cache : OFFLINE_QUOTES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    showQuote(pick.q, pick.a);
    toast('Quotes API unreachable — showing a saved quote instead.', 'error');
  } finally {
    quoteLoader.classList.remove('on');
    newQuoteBtn.disabled = false;
  }
}

newQuoteBtn.addEventListener('click', fetchQuote);
fetchQuote(); // initial load
