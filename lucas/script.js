(function () {
  var $ = function (id) { return document.getElementById(id); };

  // Mobile menu
  var burger = document.querySelector('.burger'), menu = $('menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  // Scroll progress
  var bar = document.querySelector('.progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- Interactive booking demo ----------
  var TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'];
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var minView = view.getTime();
  var maxView = new Date(today.getFullYear(), today.getMonth() + 3, 1).getTime();
  var sel = null, selTime = null;

  var cal = $('cal'), slots = $('slots'), confirmBtn = $('confirm'), steps = document.querySelectorAll('#flow li');
  var timers = [];

  function closed(d) { return d < today || d.getDay() === 0; }
  // A few slots are always taken, picked deterministically from the date
  function taken(d, t) { return ((d.getDate() * 7 + d.getMonth() * 3 + t * 5) % 4) === 0; }
  function nextOpen(from) {
    var d = new Date(from);
    for (var i = 0; i < 40; i++) { if (!closed(d)) return d; d.setDate(d.getDate() + 1); }
    return null;
  }
  function fmt(d) { return DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); }

  function renderCal() {
    $('month').textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
    $('prev').disabled = view.getTime() <= minView;
    $('next').disabled = view.getTime() >= maxView;
    var html = 'MTWTFSS'.split('').map(function (c) { return '<span class="dow">' + c + '</span>'; }).join('');
    var offset = (view.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) html += '<span class="empty"></span>';
    var n = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var d = 1; d <= n; d++) {
      var dt = new Date(view.getFullYear(), view.getMonth(), d);
      var cls = [];
      if (dt.getTime() === today.getTime()) cls.push('today');
      if (sel && dt.getTime() === sel.getTime()) cls.push('sel');
      html += '<button type="button" data-d="' + d + '" class="' + cls.join(' ') + '"' + (closed(dt) ? ' disabled' : '') +
        ' aria-pressed="' + (cls.indexOf('sel') > -1) + '" aria-label="' + fmt(dt) + '">' + d + '</button>';
    }
    cal.innerHTML = html;
  }

  function renderSlots() {
    if (!sel) { $('slotsLabel').textContent = ''; slots.innerHTML = ''; return; }
    $('slotsLabel').innerHTML = 'Times for <b>' + fmt(sel) + '</b>';
    slots.innerHTML = TIMES.map(function (t, i) {
      var off = taken(sel, i);
      return '<button type="button" data-t="' + t + '" class="' + (t === selTime ? 'sel' : '') + '"' + (off ? ' disabled' : '') +
        ' aria-pressed="' + (t === selTime) + '">' + t + '</button>';
    }).join('');
    confirmBtn.disabled = !selTime;
    confirmBtn.textContent = selTime ? 'Confirm ' + selTime : 'Pick a time';
  }

  function choose(d) { sel = d; selTime = null; renderCal(); renderSlots(); }

  cal.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-d]'); if (!b || b.disabled) return;
    choose(new Date(view.getFullYear(), view.getMonth(), +b.dataset.d));
  });
  slots.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-t]'); if (!b || b.disabled) return;
    selTime = b.dataset.t; renderSlots();
  });
  $('prev').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); });
  $('next').addEventListener('click', function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); });

  function clearFlow() { timers.forEach(clearTimeout); timers = []; steps.forEach(function (s) { s.classList.remove('on'); }); }
  confirmBtn.addEventListener('click', function () {
    if (!sel || !selTime) return;
    $('doneText').textContent = fmt(sel) + ' at ' + selTime + '. A confirmation email is on its way, with a reminder text the day before.';
    $('done').hidden = false;
    clearFlow();
    steps.forEach(function (s, i) { timers.push(setTimeout(function () { s.classList.add('on'); }, 250 + i * 700)); });
  });
  $('again').addEventListener('click', function () {
    $('done').hidden = true; clearFlow(); choose(nextOpen(today));
  });

  var first = nextOpen(today);
  if (first) { view = new Date(first.getFullYear(), first.getMonth(), 1); sel = first; }
  renderCal(); renderSlots();

  // ---------- Contact form via Web3Forms ----------
  var form = document.querySelector('.form'), status = form.querySelector('.status');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements;
    if (!f.name.value.trim() || !(f.email.value.trim() || f.phone.value.trim())) {
      status.textContent = 'Please add your name and an email or phone number.'; return;
    }
    var btn = form.querySelector('button'); btn.disabled = true; status.textContent = 'Sending…';
    fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.success) { form.reset(); status.textContent = "Thanks! I'll get back to you soon."; }
        else throw new Error(j.message);
      })
      .catch(function () { status.textContent = 'Something went wrong. Please email me directly.'; })
      .then(function () { btn.disabled = false; });
  });
})();
