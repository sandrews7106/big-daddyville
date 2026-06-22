// js/map.js — XpressoMedic Scenarios
// Handles level detection, pin interactions, popup, and scenario reveal

(() => {
'use strict';


// ── LEVEL DETECTION ────────────────────────────────────────
const params = new URLSearchParams(window.location.search);
const level  = params.get('level') || 'emtb';

const SCENARIO_MAP = {
  emtb:  typeof SCENARIOS      !== 'undefined' ? SCENARIOS      : {},
  aemt:  typeof SCENARIOS_AEMT !== 'undefined' ? SCENARIOS_AEMT : {},
  medic: typeof SCENARIOS_MEDIC!== 'undefined' ? SCENARIOS_MEDIC: {},
};

const SCENARIOS_ACTIVE = SCENARIO_MAP[level] || SCENARIO_MAP.emtb;

// Update badge
const badge = document.getElementById('levelBadge');
if (badge) {
  const labels = { emtb:'EMT', aemt:'AEMT', medic:'Paramedic' };
  badge.textContent = labels[level] || 'EMT';
  badge.className   = 'header-badge ' + level;
}

// ── LOCATION DATA ───────────────────────────────────────────
const locations = [
  { id:'bd_burger',   name:"Big Daddy's Burgers",         addr:"101 Big Daddy Blvd", cat:'food',   icon:'🍔', tagline:"Grease, Glory & Gut Calls" },
  { id:'bd_bbq',      name:"Big Daddy's BBQ Pit",          addr:"340 Big Daddy Blvd", cat:'food',   icon:'🍖', tagline:"Low & Slow Since '99" },
  { id:'bd_chinese',  name:"Big Daddy Dragon Palace",      addr:"510 Big Daddy Blvd", cat:'food',   icon:'🥡', tagline:"All You Can Eat, All Day" },
  { id:'bd_pizza',    name:"Big Daddy's Pizza Palace",     addr:"22 Papa Drive",       cat:'food',   icon:'🍕', tagline:"Hot Slices, Hot Calls" },
  { id:'bd_taco',     name:"Big Daddy's Tacos",            addr:"600 Papa Drive",      cat:'food',   icon:'🌮', tagline:"Open Late. Way Too Late." },
  { id:'bd_diner',    name:"Big Daddy's All-Night Diner",  addr:"820 Papa Drive",      cat:'food',   icon:'🥞', tagline:"Coffee That Could Strip Paint" },
  { id:'bd_coffee',   name:"Big Daddy Brews",              addr:"250 Throne Ave",      cat:'coffee', icon:'☕', tagline:"Artisan Roasts, Zero Chill" },
  { id:'bd_nursing',  name:"Grand-daddy's Nursing & Rehab", addr:"750 Crown St",          cat:'health', icon:'🏥', tagline:"Round-the-Clock Care"  },
  { id:'bd_grocery',  name:"Big Daddy's Food King",        addr:"180 Big Daddy Blvd", cat:'retail', icon:'🛒', tagline:"Everything You Need & Then Some" },
  { id:'bd_mhp',     name:"Big Daddy's Mobile Home Park",  addr:"200 Papa Drive",       cat:'school', icon:'🏠', tagline:"Home Is Where The Call Is"  },
  { id:'bd_hospital', name:"Big Daddy Memorial Hospital",   addr:"900 Crown St",        cat:'health', icon:'🏨', tagline:"Where Every Call Could Be Your Last" },
  { id:'bd_pharmacy', name:"Big Daddy's Rx Pharmacy",      addr:"240 Crown St N",      cat:'health', icon:'💊', tagline:"Pills, Patience & Wisdom" },
  { id:'bd_cbd',      name:"Big Daddy's CBD & Wellness",   addr:"310 Throne Ave",      cat:'health', icon:'🌿', tagline:"Relax. Legally." },
  { id:'bd_smoke',    name:"Big Daddy's Smoke Shack",      addr:"330 Throne Ave",      cat:'health', icon:'💨', tagline:"Vapes, Tobacco & Bad Decisions" },
  { id:'bd_carwash',  name:"Big Daddy's Car Wash",         addr:"760 Big Daddy Blvd", cat:'auto',   icon:'🚗', tagline:"Cleaner Car, Messier Calls" },
  { id:'bd_gasgo',   name:"Big Daddy's Gas and Go",        addr:"160 Papa Drive",       cat:'auto',   icon:'⛽', tagline:"Full Tank, Empty Waiting Room"  },
  { id:'bd_auto',     name:"Big Daddy's Auto Repair",      addr:"820 Big Daddy Blvd", cat:'auto',   icon:'🔧', tagline:"We Fix It. Eventually." },
  { id:'bd_club',     name:"Big Daddy's Gentleman's Club", addr:"730 Crown St",        cat:'adult',  icon:'🎭', tagline:"Discretion Is Our Middle Name" },
  { id:'bd_bar',      name:"Big Daddy's Tap Room",         addr:"370 Big Daddy Blvd", cat:'adult',  icon:'🍺', tagline:"Cold Beer, Warm Arguments" },
  { id:'bd_estates',  name:"Big Daddy Estates",            addr:"4100 Crowne Court",   cat:'hotel',  icon:'🏘️', tagline:"Where the Money Lives" },
  { id:'bd_motel',    name:"Big Daddy's Motor Inn",        addr:"99 Papa Drive",       cat:'hotel',  icon:'🏨', tagline:"Hourly & Weekly Rates Available" },
  { id:'bd_suites',   name:"Big Daddy Suites",             addr:"840 Crown St",        cat:'hotel',  icon:'🏩', tagline:"Extended Stay. Extended Problems." },
  { id:'bd_fire',     name:"Big Daddy Fire Station 1",     addr:"500 Throne Ave",      cat:'fire',   icon:'🚒', tagline:"Home Base" },
  { id:'bd_police',   name:"Big Daddy PD",                 addr:"420 Big Daddy Blvd", cat:'police', icon:'🚔', tagline:"To Protect & Serve Big Daddyville" },
  { id:'bd_school',   name:"Big Daddy High School",        addr:"60 Papa Drive",       cat:'school', icon:'🏫', tagline:"Go Big Daddy Bulldogs!" },
  { id:'bd_church',   name:"Big Daddy's House of Grace",   addr:"600 Throne Ave",      cat:'school', icon:'⛪', tagline:"All Are Welcome Here" },
  { id:'bd_park',     name:"Deron's Dreamland Park",       addr:"Center of Big Daddyville", cat:'park', icon:'🌳', tagline:"Where Every Call Is a Learning Moment" },
];

const catColor = {
  food:'#e67e22', coffee:'#a0522d', retail:'#27ae60', health:'#2980b9',
  auto:'#7f8c8d', adult:'#e94560',  hotel:'#8e44ad',  fire:'#c0392b',
  police:'#1a5276', school:'#d35400', park:'#2ea043'
};
const catLabel = {
  food:'Food & Dining', coffee:'Coffee Shop', retail:'Retail',
  health:'Health / CBD', auto:'Auto & Laundry', adult:'Adult & Nightlife',
  hotel:'Hotel / Motel', fire:'Fire Station', police:'Police Dept',
  school:'School / Church', park:'Park / Outdoor'
};

// Scenario index tracker
const scenarioIndex = {};
locations.forEach(l => { scenarioIndex[l.id] = 0; });

// ── BIND PIN EVENTS ─────────────────────────────────────────
locations.forEach(loc => {
  const g = document.getElementById('pin-' + loc.id);
  if (!g) return;
  g.addEventListener('mouseenter',  e  => showPopup(loc, e));
  g.addEventListener('mouseleave',  ()  => hidePopup());
  g.addEventListener('mousemove',   e  => movePopup(e));
  g.addEventListener('click',       ()  => loadScenario(loc, false));
  g.addEventListener('touchstart',  e  => { e.preventDefault(); showPopup(loc, e.touches[0]); }, { passive:false });
  g.addEventListener('touchend',    e  => { e.preventDefault(); hidePopup(); loadScenario(loc, false); }, { passive:false });
});

// ── HOVER POPUP ─────────────────────────────────────────────
const popup   = document.getElementById('hover-popup');
const caretUp = document.getElementById('popupCaretUp');
const caretDn = document.getElementById('popupCaretDown');
const mapWrap = document.getElementById('mapWrap');

function showPopup(loc, e) {
  document.getElementById('popupLogoMain').textContent = loc.icon;
  document.getElementById('popupLogoBg').textContent   = loc.icon;
  document.getElementById('popupLogoArea').style.background =
    `linear-gradient(135deg,${catColor[loc.cat]}33,${catColor[loc.cat]}11)`;
  document.getElementById('popupSign').textContent     = loc.tagline || '';
  document.getElementById('popupName').textContent     = loc.name;
  document.getElementById('popupAddr').textContent     = '📍 ' + loc.addr;
  document.getElementById('popupCatDot').style.background  = catColor[loc.cat];
  document.getElementById('popupCatLabel').textContent = catLabel[loc.cat] || loc.cat;
  popup.classList.add('visible');
  movePopup(e);
}

function movePopup(e) {
  if (!mapWrap || !popup) return;
  const rect = mapWrap.getBoundingClientRect();
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches ? e.touches[0].clientX : rect.left + rect.width / 2);
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches ? e.touches[0].clientY : rect.top + 100);
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  popup.style.visibility = 'hidden';
  popup.style.display    = 'flex';
  const pw = popup.offsetWidth;
  const ph = popup.offsetHeight;
  popup.style.visibility = '';
  if (!popup.classList.contains('visible')) { popup.style.display = ''; return; }

  const M    = 8;
  const left = Math.max(M, Math.min(x - pw / 2, rect.width - pw - M));
  const flip = (y - ph - 22) < M;

  caretUp.style.display = flip ? 'none'  : 'block';
  caretDn.style.display = flip ? 'block' : 'none';
  popup.style.left      = left + 'px';
  popup.style.top       = (flip ? y + 22 : y - ph - 18) + 'px';
  popup.style.transform = 'none';
}

function hidePopup() {
  popup.classList.remove('visible');
}

// ── SCENARIO DISPLAY ────────────────────────────────────────
const wrap    = document.getElementById('scenarioWrap');
let activeLoc = null;
const reveals = ['scene', 'primary', 'patient', 'vitals', 'teaching'];

function loadScenario(loc, next) {
  activeLoc = loc;
  hidePopup();

  // Highlight active pin
  document.querySelectorAll('.pin-group').forEach(g => g.classList.remove('active'));
  const pin = document.getElementById('pin-' + loc.id);
  if (pin) pin.classList.add('active');

  const pool = SCENARIOS_ACTIVE[loc.id];
  if (!pool || !pool.length) {
    wrap.innerHTML = `<div class="idle-state"><div class="icon">⚠️</div><h3>No Scenarios</h3><p>No ${badge ? badge.textContent : 'scenarios'} scenarios for this location yet.</p></div>`;
    return;
  }

  if (next) {
    scenarioIndex[loc.id] = (scenarioIndex[loc.id] + 1) % pool.length;
  } else {
    scenarioIndex[loc.id] = Math.floor(Math.random() * pool.length);
  }

  const s     = pool[scenarioIndex[loc.id]];
  const idx   = scenarioIndex[loc.id];
  const total = pool.length;

  // Parse teaching points
  const tpRaw   = s.teaching_points || '';
  const tpParts = tpRaw.split(/\d+\.\s+/).filter(t => t.trim().length > 0);

  // Priority is now a question for the student — no badge, show prompt
  const psRaw = s.primarySurvey || '';
  const priorityPrompt = '<span class="priority-badge priority-question">❓ High or Low Priority?</span>';

  // Parse primary survey into labeled rows
  function parsePrimarySurvey(text) {
    const fields = [
      { key: 'General Impression', icon: '👁' },
      { key: 'AVPU',               icon: '🧠' },
      { key: 'Airway',             icon: '💨' },
      { key: 'Breathing',          icon: '🫁' },
      { key: 'Circulation',        icon: '❤️' },
      { key: 'Patient priority',   icon: '🚨' },
    ];
    const rows = [];
    fields.forEach((f, i) => {
      const nextKey = i + 1 < fields.length ? fields[i + 1].key : null;
      const re = new RegExp(f.key + '[:\s]+(.+?)' + (nextKey ? '(?=' + nextKey + ')' : '$'), 'is');
      const m = text.match(re);
      if (m) rows.push({ label: f.key, icon: f.icon, value: m[1].replace(/\s+/g, ' ').trim() });
    });
    // fallback — if parsing fails, show raw text
    return rows.length >= 3 ? rows : null;
  }

  const psRows = parsePrimarySurvey(psRaw);
  const psHTML = psRows
    ? psRows.map(r => {
        if (r.label === 'Patient Priority') return '';
        return '<div class="ps-row"><span class="ps-icon">' + r.icon + '</span><div class="ps-content"><span class="ps-label">' + r.label + '</span><span class="ps-value">' + r.value + '</span></div></div>';
      }).join('')
    : '<div class="content-text">' + psRaw + '</div>';

  wrap.innerHTML = `
    <div class="loc-header">
      <div class="loc-icon">${loc.icon}</div>
      <div>
        <div class="loc-name">${loc.name}</div>
        <div class="loc-addr">📍 ${loc.addr}</div>
        <span class="loc-cat">
          <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${catColor[loc.cat]};margin-right:4px;vertical-align:middle"></span>
          ${catLabel[loc.cat] || loc.cat}
        </span>
        <div class="scenario-tag">Scenario ${idx + 1} of ${total}</div>
      </div>
    </div>

    <div class="dispatch-block">
      <div class="dispatch-label">📻 Dispatch</div>
      <div class="dispatch-text">${s.dispatch_line}</div>
    </div>

    <button class="reveal-all-btn" onclick="revealAll()">👁 Reveal All Sections</button>

    <div class="reveal-section" id="sec-scene">
      <button class="reveal-btn" onclick="toggleReveal('scene')" id="btn-scene">
        <div class="reveal-btn-left">
          <span class="reveal-btn-icon">🚨</span>
          <div><div class="reveal-btn-label">Scene Size-Up</div><div class="reveal-btn-sub">Safety · MOI/NOI · First look</div></div>
        </div>
        <span class="reveal-chevron">▶</span>
      </button>
      <div class="reveal-content" id="con-scene">
        <div class="content-label">Chief Complaint</div>
        <div class="content-value" style="margin-bottom:10px">"${s.chief_complaint}"</div>
        <div class="content-label">Scene Size-Up</div>
        <div class="content-text">${s.sceneSizeUp || ''}</div>
      </div>
    </div>

    <div class="reveal-section" id="sec-primary">
      <button class="reveal-btn" onclick="toggleReveal('primary')" id="btn-primary">
        <div class="reveal-btn-left">
          <span class="reveal-btn-icon">🫀</span>
          <div><div class="reveal-btn-label">Primary Survey</div><div class="reveal-btn-sub">AVPU · XABCs · Skin · Priority</div></div>
        </div>
        <span class="reveal-chevron">▶</span>
      </button>
      <div class="reveal-content" id="con-primary">
        <div class="ps-grid">${psHTML}</div>
        <div style="margin-top:12px">${priorityPrompt}</div>
      </div>
    </div>

    <div class="reveal-section" id="sec-patient">
      <button class="reveal-btn" onclick="toggleReveal('patient')" id="btn-patient">
        <div class="reveal-btn-left">
          <span class="reveal-btn-icon">📋</span>
          <div><div class="reveal-btn-label">History &amp; Secondary</div><div class="reveal-btn-sub">OPQRST · SAMPLE · Exam findings</div></div>
        </div>
        <span class="reveal-chevron">▶</span>
      </button>
      <div class="reveal-content" id="con-patient">
        <div class="content-text">${s.historySecondary || s.patient_info || ''}</div>
      </div>
    </div>

    <div class="reveal-section" id="sec-vitals">
      <button class="reveal-btn" onclick="toggleReveal('vitals')" id="btn-vitals">
        <div class="reveal-btn-left">
          <span class="reveal-btn-icon">📊</span>
          <div><div class="reveal-btn-label">Vital Signs</div><div class="reveal-btn-sub">BP · HR · RR · SpO₂ · GCS · Temp</div></div>
        </div>
        <span class="reveal-chevron">▶</span>
      </button>
      <div class="reveal-content" id="con-vitals">
        <div class="vitals-grid">
          <div class="vital"><div class="val">${s.vitals.bp}</div><div class="lbl">BP</div></div>
          <div class="vital"><div class="val">${s.vitals.hr}</div><div class="lbl">HR</div></div>
          <div class="vital"><div class="val">${s.vitals.rr}</div><div class="lbl">RR</div></div>
          <div class="vital"><div class="val">${s.vitals.spo2}</div><div class="lbl">SpO₂</div></div>
          <div class="vital"><div class="val">${s.vitals.gcs}</div><div class="lbl">GCS</div></div>
          <div class="vital"><div class="val">${s.vitals.temp}</div><div class="lbl">Temp</div></div>
        </div>
      </div>
    </div>

    <div class="reveal-section" id="sec-teaching">
      <button class="reveal-btn" onclick="toggleReveal('teaching')" id="btn-teaching">
        <div class="reveal-btn-left">
          <span class="reveal-btn-icon">🎓</span>
          <div><div class="reveal-btn-label">Teaching Points</div><div class="reveal-btn-sub">Debrief after student answers</div></div>
        </div>
        <span class="reveal-chevron">▶</span>
      </button>
      <div class="reveal-content" id="con-teaching">
        <div class="teaching-block">
          ${tpParts.map((tp, i) => `
            <div class="tp-item">
              <div class="tp-num">${i + 1}</div>
              <div class="tp-text">${tp.trim()}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn btn-next"   onclick="loadScenario(activeLoc, true)">➡ Next</button>
      <button class="btn btn-random" onclick="loadScenario(activeLoc, false)">🎲 Random</button>
      <button class="btn btn-reset"  onclick="resetReveals()">↺ Reset</button>
    </div>
  `;
}

function toggleReveal(key) {
  const btn = document.getElementById('btn-' + key);
  const con = document.getElementById('con-' + key);
  if (!btn || !con) return;
  const open = con.classList.contains('open');
  con.classList.toggle('open', !open);
  btn.classList.toggle('revealed', !open);
}

function revealAll() {
  reveals.forEach(k => {
    const btn = document.getElementById('btn-' + k);
    const con = document.getElementById('con-' + k);
    if (con && !con.classList.contains('open')) {
      con.classList.add('open');
      if (btn) btn.classList.add('revealed');
    }
  });
}

function resetReveals() {
  reveals.forEach(k => {
    const btn = document.getElementById('btn-' + k);
    const con = document.getElementById('con-' + k);
    if (con) con.classList.remove('open');
    if (btn) btn.classList.remove('revealed');
  });
  wrap.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose to inline onclick handlers
window.loadScenario  = loadScenario;
window.toggleReveal  = toggleReveal;
window.revealAll     = revealAll;
window.resetReveals  = resetReveals;
window.activeLoc     = activeLoc;

// Keep activeLoc in sync
const _origLoad = loadScenario;
window.loadScenario = function(loc, next) {
  _origLoad(loc, next);
  window.activeLoc = activeLoc;
};

})();