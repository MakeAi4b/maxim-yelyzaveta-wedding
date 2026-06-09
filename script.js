/* ===========================================================
   Максим & Єлизавета · wedding landing logic
   =========================================================== */
'use strict';

/* ---- CONFIG: заповніть контакти, щоб працювали кнопки відправки ---- */
const CONFIG = {
  // Дата і час весілля (Київ, UTC+3 у вересні)
  weddingISO: '2026-09-06T10:30:00+03:00',
  // Кнопка "Прокласти маршрут" — пошук у Google Maps за назвою
  venueQuery: 'Губернія ресторан',
  // RSVP: куди надсилати відповідь (лишіть порожнім, якщо не треба)
  telegram: '',            // напр. 'maxim_y'  -> https://t.me/maxim_y
  email:    '',            // напр. 'para@example.com'
  // дані для календаря (UTC)
  cal: {
    title: 'Весілля Максима та Єлизавети',
    details: 'Будемо раді бачити вас! Ресторан «Губернія».',
    location: 'Ресторан «Губернія»',
    startUTC: '20260906T073000Z',
    endUTC:   '20260906T193000Z'
  }
};

const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// "?still=1" freezes ambient canvas animations (useful for screenshots / low-power)
const STILL = new URLSearchParams(location.search).has('still');
const noAnim = reduceMotion || STILL;

/* ============================ NAV ============================ */
const nav = $('#nav');
const burger = $('#burger');
const navLinks = $('.nav__links');

const onScroll = () => {
  const y = window.scrollY;
  nav.classList.toggle('is-stuck', y > window.innerHeight * 0.7);
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  $('#progress').style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
});
$$('.nav__links a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  burger.classList.remove('open');
}));

/* active section highlight */
const sections = ['story', 'location', 'program', 'dresscode', 'gallery', 'rsvp']
  .map(id => $('#' + id)).filter(Boolean);
const navMap = {};
$$('.nav__links a').forEach(a => { navMap[a.getAttribute('href').slice(1)] = a; });
const secObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      $$('.nav__links a').forEach(a => a.classList.remove('active'));
      navMap[e.target.id]?.classList.add('active');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => secObserver.observe(s));

/* ====================== REVEAL ON SCROLL ===================== */
const revObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
$$('.reveal').forEach((el, i) => {
  el.style.transitionDelay = Math.min(i % 4 * 0.08, 0.3) + 's';
  revObserver.observe(el);
});

/* ========================= COUNTDOWN ======================== */
const target = new Date(CONFIG.weddingISO).getTime();
const cdEls = {
  days: $('[data-cd="days"]'), hours: $('[data-cd="hours"]'),
  mins: $('[data-cd="mins"]'), secs: $('[data-cd="secs"]')
};
const footerCd = $('#footerCd');
const pad = n => String(n).padStart(2, '0');

function tick() {
  const diff = target - Date.now();
  if (diff <= 0) {
    Object.values(cdEls).forEach(e => e && (e.textContent = '00'));
    const cd = $('#countdown');
    if (cd) cd.innerHTML = '<div class="cd" style="min-width:auto"><b>Сьогодні наш день!</b></div>';
    if (footerCd) footerCd.innerHTML = 'Сьогодні наш день! ❤';
    clearInterval(timer);
    return;
  }
  const d = Math.floor(diff / 864e5);
  const h = Math.floor(diff % 864e5 / 36e5);
  const m = Math.floor(diff % 36e5 / 6e4);
  const s = Math.floor(diff % 6e4 / 1e3);
  cdEls.days  && (cdEls.days.textContent  = d);
  cdEls.hours && (cdEls.hours.textContent = pad(h));
  cdEls.mins  && (cdEls.mins.textContent  = pad(m));
  cdEls.secs  && (cdEls.secs.textContent  = pad(s));
  if (footerCd) footerCd.innerHTML = `До зустрічі залишилось <b>${d}</b> ${plural(d, ['день','дні','днів'])}`;
}
function plural(n, f) {
  const n10 = n % 10, n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return f[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
  return f[2];
}
tick();
const timer = setInterval(tick, 1000);

/* ================= PERSONALIZED GREETING ==================== */
(() => {
  const p = new URLSearchParams(location.search);
  const guest = (p.get('guest') || p.get('to') || '').trim();
  if (guest) {
    const safe = guest.replace(/[<>]/g, '').slice(0, 60);
    $('#greeting').textContent = `${safe}, раді запросити вас на наше весілля`;
    const nameInput = $('#name');
    if (nameInput) nameInput.value = safe;
  }
})();

/* ===================== MAP + CALENDAR ======================= */
$('#mapBtn').href =
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONFIG.venueQuery);

function icsHref() {
  const c = CONFIG.cal;
  const body = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MY-Wedding//UA',
    'BEGIN:VEVENT', 'UID:my-wedding-2026@guberniya',
    'DTSTAMP:' + c.startUTC, 'DTSTART:' + c.startUTC, 'DTEND:' + c.endUTC,
    'SUMMARY:' + c.title, 'DESCRIPTION:' + c.details, 'LOCATION:' + c.location,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
}
$('#calBtn').addEventListener('click', e => {
  e.preventDefault();
  const a = document.createElement('a');
  a.href = icsHref();
  a.download = 'wedding-maxim-yelyzaveta.ics';
  document.body.appendChild(a); a.click(); a.remove();
});

/* ==================== DRESS-CODE SWATCHES =================== */
$$('.sw').forEach(btn => {
  btn.addEventListener('click', async () => {
    const hex = btn.dataset.hex;
    try { await navigator.clipboard.writeText(hex); } catch (_) {}
    $$('.sw').forEach(b => b.classList.remove('copied'));
    btn.classList.add('copied');
    const hint = $('#swHint');
    hint.textContent = `Колір «${btn.dataset.name}» (${hex}) скопійовано ✓`;
    hint.style.color = btn.dataset.hex;
    clearTimeout(btn._t);
    btn._t = setTimeout(() => {
      hint.textContent = 'Натисніть на колір, щоб скопіювати його код';
      hint.style.color = '';
      btn.classList.remove('copied');
    }, 2600);
  });
});

/* ========================== GALLERY ======================== */
const galleryImgs = [
  ['assets/img/presidium.jpg',       'Президіум молодят'],
  ['assets/img/ceremony-arch.jpg',   'Арка для церемонії'],
  ['assets/img/moody-drape.jpg',     'Декор із бордовою драпіровкою'],
  ['assets/img/bouquet-white.jpg',   'Білий букет'],
  ['assets/img/candles-floor.jpg',   'Свічки та тканини'],
  ['assets/img/champagne-tower.jpg', 'Вежа з шампанського'],
  ['assets/img/altar-bride.jpg',     'Наречена біля вівтаря'],
  ['assets/img/welcome.jpg',         'Welcome-зона'],
  ['assets/img/bouquet-burgundy.jpg','Бордовий букет'],
  ['assets/img/ceremony-aisle.jpg',  'Доріжка з троянд'],
  ['assets/img/table-napkin.jpg',    'Сервірування столу'],
  ['assets/img/seating.jpg',         'Зона розсадки'],
  ['assets/img/dance-laser.jpg',     'Перший танець'],
  ['assets/img/venue-forest.jpg',    'Церемонія серед зелені'],
  ['assets/img/bouquet-orchid.jpg',  'Каскадний букет'],
  ['assets/img/dance-smoke.jpg',     'Танець у диму'],
  ['assets/img/detail-drip.jpg',     'Свічки-акценти'],
  ['assets/img/story-champagne.jpg', 'Святковий момент']
];
const masonry = $('#masonry');
galleryImgs.forEach(([src, alt]) => {
  const img = document.createElement('img');
  img.src = src; img.alt = alt; img.loading = 'lazy';
  masonry.appendChild(img);
});

/* ========================== RSVP =========================== */
const form = $('#rsvpForm');
form.addEventListener('submit', e => {
  e.preventDefault();
  const name = $('#name');
  const attend = form.querySelector('input[name="attend"]:checked');
  let ok = true;
  [name].forEach(f => {
    const bad = !f.value.trim();
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });
  if (!attend) { ok = false; $('#formHint').textContent = 'Будь ласка, оберіть варіант відповіді.'; }
  if (!ok) {
    if (name.value.trim() && attend) {} else if (!$('#formHint').textContent)
      $('#formHint').textContent = 'Заповніть, будь ласка, виділені поля.';
    return;
  }
  $('#formHint').textContent = '';

  const data = {
    name: name.value.trim(),
    attend: attend.value,
    guests: $('#guests').value,
    menu: $('#menu').value,
    song: $('#song').value.trim(),
    note: $('#note').value.trim(),
    at: new Date().toISOString()
  };
  // зберігаємо локально, щоб нічого не загубилось
  try {
    const all = JSON.parse(localStorage.getItem('rsvp') || '[]');
    all.push(data); localStorage.setItem('rsvp', JSON.stringify(all));
  } catch (_) {}

  showThanks(data);
  if (!reduceMotion) petalBurst();
});

function buildMessage(d) {
  return [
    'RSVP · Весілля Максима та Єлизавети',
    'Ім’я: ' + d.name,
    'Відповідь: ' + d.attend,
    'Гостей: ' + d.guests,
    'Меню: ' + d.menu,
    d.song ? 'Пісня: ' + d.song : '',
    d.note ? 'Побажання: ' + d.note : ''
  ].filter(Boolean).join('\n');
}

function showThanks(d) {
  form.hidden = true;
  const thanks = $('#thanks');
  thanks.hidden = false;
  $('#thxName').textContent = d.name.split(' ')[0] || 'друже';
  $('#thxMsg').textContent = d.attend === 'Буду'
    ? 'Вашу відповідь збережено. Ми вже не можемо дочекатися зустрічі з вами! 💛'
    : 'Дякуємо, що повідомили. Нам буде вас не вистачати — обіймаємо!';

  const msg = buildMessage(d);
  const actions = $('#thanksActions');
  actions.innerHTML = '';
  if (CONFIG.telegram) {
    const a = mkBtn('Надіслати у Telegram', 'btn--solid');
    a.href = 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(msg);
    a.target = '_blank'; a.rel = 'noopener'; actions.appendChild(a);
  }
  if (CONFIG.email) {
    const a = mkBtn('Надіслати на пошту', 'btn--outline');
    a.href = 'mailto:' + CONFIG.email +
      '?subject=' + encodeURIComponent('RSVP — ' + d.name) +
      '&body=' + encodeURIComponent(msg);
    actions.appendChild(a);
  }
  // завжди доступно: копіювати
  const copy = mkBtn('Скопіювати відповідь', CONFIG.telegram || CONFIG.email ? 'btn--outline' : 'btn--solid');
  copy.href = '#';
  copy.addEventListener('click', async ev => {
    ev.preventDefault();
    try { await navigator.clipboard.writeText(msg); copy.textContent = 'Скопійовано ✓'; }
    catch (_) { copy.textContent = 'Не вдалося :('; }
    setTimeout(() => copy.textContent = 'Скопіювати відповідь', 2000);
  });
  actions.appendChild(copy);
  thanks.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
}
function mkBtn(text, cls) {
  const a = document.createElement('a');
  a.className = 'btn ' + cls; a.textContent = text; return a;
}
$('#editRsvp').addEventListener('click', () => {
  $('#thanks').hidden = true; form.hidden = false;
});

/* =================== CANVAS: HERO EMBERS =================== */
if (!noAnim) {
  const c = $('#embers'), x = c.getContext('2d');
  const hero = $('#home');
  let W, H, parts = [], running = true;
  const resize = () => { W = c.width = hero.offsetWidth; H = c.height = hero.offsetHeight; };
  resize(); window.addEventListener('resize', resize);
  const spawn = () => ({
    x: Math.random() * W,
    y: H + 10,
    r: Math.random() * 1.8 + 0.6,
    vy: -(Math.random() * 0.7 + 0.25),
    vx: (Math.random() - 0.5) * 0.4,
    life: 0, max: Math.random() * 220 + 120,
    hue: 38 + Math.random() * 14
  });
  for (let i = 0; i < 70; i++) { const p = spawn(); p.y = Math.random() * H; parts.push(p); }
  const loop = () => {
    if (!running) return;
    x.clearRect(0, 0, W, H);
    parts.forEach(p => {
      p.life++; p.y += p.vy; p.x += p.vx; p.vx += (Math.random() - 0.5) * 0.03;
      const a = Math.sin((p.life / p.max) * Math.PI) * 0.9;
      x.beginPath();
      x.fillStyle = `hsla(${p.hue},90%,62%,${a})`;
      x.shadowBlur = 8; x.shadowColor = `hsla(${p.hue},90%,60%,${a})`;
      x.arc(p.x, p.y, p.r, 0, 7);
      x.fill();
      if (p.life > p.max || p.y < -10) Object.assign(p, spawn());
    });
    x.shadowBlur = 0;
    requestAnimationFrame(loop);
  };
  loop();
  // pause embers when hero off-screen
  new IntersectionObserver(es => {
    es.forEach(e => { running = e.isIntersecting; if (running) loop(); });
  }, { threshold: 0.05 }).observe(hero);
}

/* ================= CANVAS: AMBIENT PETALS ================= */
const petalToggle = $('#petalToggle');
let petalsOn = localStorage.getItem('petals') !== 'off' && !noAnim;
let petalRAF = null;

function initPetals() {
  const c = $('#petals'), x = c.getContext('2d');
  let W, H, list = [];
  const colors = ['#3F2021', '#5A2E2F', '#E9D4C3', '#EFE1CE', '#b08a52'];
  const resize = () => { W = c.width = innerWidth; H = c.height = innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const mk = () => ({
    x: Math.random() * W, y: -20 - Math.random() * H,
    s: Math.random() * 9 + 6, vy: Math.random() * 1 + 0.5,
    vx: (Math.random() - 0.5) * 0.6, rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.04, sway: Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    op: Math.random() * 0.4 + 0.35
  });
  for (let i = 0; i < 26; i++) list.push(mk());
  const draw = () => {
    x.clearRect(0, 0, W, H);
    list.forEach(p => {
      p.y += p.vy; p.x += p.vx + Math.sin((p.y + p.sway * 40) / 60) * 0.5; p.rot += p.vr;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = p.op;
      x.fillStyle = p.color;
      x.beginPath();
      x.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 7);
      x.fill(); x.restore();
      if (p.y > H + 20) Object.assign(p, mk(), { y: -20 });
    });
    petalRAF = requestAnimationFrame(draw);
  };
  draw();
}
function stopPetals() {
  cancelAnimationFrame(petalRAF); petalRAF = null;
  const c = $('#petals'); c.getContext('2d').clearRect(0, 0, c.width, c.height);
}
function applyPetals() {
  petalToggle.classList.toggle('off', !petalsOn);
  if (petalsOn) { if (!petalRAF) initPetals(); }
  else stopPetals();
}
petalToggle.addEventListener('click', () => {
  petalsOn = !petalsOn;
  localStorage.setItem('petals', petalsOn ? 'on' : 'off');
  applyPetals();
});
if (noAnim) petalToggle.style.display = 'none'; else applyPetals();

/* one-off celebratory petal burst (RSVP) */
function petalBurst() {
  const c = $('#petals'), x = c.getContext('2d');
  c.width = innerWidth; c.height = innerHeight;
  const colors = ['#3F2021', '#5A2E2F', '#E9D4C3', '#EFE1CE', '#b08a52'];
  const cx = innerWidth / 2, cy = innerHeight * 0.4;
  let burst = Array.from({ length: 80 }, () => ({
    x: cx, y: cy, s: Math.random() * 9 + 5,
    vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 3,
    rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)], op: 1, g: 0.32
  }));
  let frames = 0;
  const run = () => {
    frames++;
    if (!petalsOn) x.clearRect(0, 0, c.width, c.height);
    burst.forEach(p => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.op -= 0.012;
      x.save(); x.translate(p.x, p.y); x.rotate(p.rot); x.globalAlpha = Math.max(0, p.op);
      x.fillStyle = p.color; x.beginPath();
      x.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 7); x.fill(); x.restore();
    });
    if (frames < 120) requestAnimationFrame(run);
    else if (petalsOn && !petalRAF) initPetals();
  };
  if (petalRAF) { cancelAnimationFrame(petalRAF); petalRAF = null; }
  run();
}
