// Motion is skipped for visitors who prefer reduced motion; content stays visible without JS.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Open / closed badge and today's hours, computed in Edmonton time
  (function () {
    var hours = { 0: null, 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [8, 17] };
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Edmonton', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var day = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
      var now = (parseInt(get('hour'), 10) % 24) + parseInt(get('minute'), 10) / 60;
      var h = hours[day], open = h && now >= h[0] && now < h[1];
      var dot = document.getElementById('dot'), txt = document.getElementById('open-text');
      if (dot && txt) {
        dot.className = 'dot ' + (open ? 'open' : 'closed');
        txt.textContent = open ? 'Open now · walk-ins welcome' : 'Closed right now · book ahead';
      }
      document.querySelectorAll('.hours div').forEach(function (row) {
        if (row.dataset.days.split(',').indexOf(String(day)) > -1) row.classList.add('today');
      });
    } catch (e) { /* leave the default text */ }
  })();

  // Scroll progress bar + sticky Book button (hidden once the form is on screen)
  var bar = document.querySelector('.progress');
  var sticky = document.querySelector('.sticky-call');
  if (sticky && !reduce) root.classList.add('js-sticky');
  function onScroll() {
    var max = root.scrollHeight - window.innerHeight;
    if (bar && max > 0) bar.style.transform = 'scaleX(' + Math.min(window.scrollY / max, 1) + ')';
    if (sticky) {
      var b = document.getElementById('book'), atForm = false;
      if (b) atForm = b.getBoundingClientRect().top < window.innerHeight * 0.7;
      sticky.classList.toggle('show', window.scrollY > 380 && !atForm);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Inquiry forms: send through FormSubmit without leaving the page. The visitor only
  // sees "thanks" if the service accepts the message; otherwise they get a direct email link.
  document.querySelectorAll('form[data-inquiry]').forEach(function (form) {
    var to = form.getAttribute('action').split('formsubmit.co/')[1];
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';
      var old = form.querySelector('.form-error'); if (old) old.remove();
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch('https://formsubmit.co/ajax/' + to, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.success === false || j.success === 'false') throw new Error(j.message || 'not accepted');
          var ok = document.createElement('div');
          ok.className = 'thanks'; ok.setAttribute('role', 'status');
          ok.innerHTML = '<strong>Thanks! Got it.</strong><p>' + (form.getAttribute('data-thanks') || "We'll be in touch soon.") + '</p>';
          form.replaceWith(ok);
        });
      }).catch(function () {
        btn.disabled = false; btn.textContent = label;
        var err = document.createElement('p');
        err.className = 'form-error'; err.setAttribute('role', 'alert');
        err.innerHTML = 'Sorry, that did not send. Please email <a href="mailto:' + to + '">' + to + '</a> instead.';
        form.appendChild(err);
      });
    });
  });

  if (reduce) return;

  // Rotating hero phrase
  var rot = document.getElementById('rot');
  if (rot) {
    var words = ['Feel sharper.', 'Walk out new.', 'Fresh every time.', 'Book your chair.'];
    var i = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () { i = (i + 1) % words.length; rot.textContent = words[i]; rot.classList.remove('out'); }, 300);
    }, 2600);
  }

  // Scroll reveal, with a failsafe for preview windows where the observer never fires
  if ('IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el, n) {
      el.style.transitionDelay = (n % 3) * 80 + 'ms';
      io.observe(el);
    });
    var sweep = function () {
      var vh = window.innerHeight || 800;
      document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (vh < 100 || (r.top < vh && r.bottom > 0)) el.classList.add('in');
      });
    };
    window.addEventListener('scroll', sweep, { passive: true });
    window.addEventListener('resize', sweep);
    setInterval(sweep, 700);
  }

  // Click ripple on buttons
  document.querySelectorAll('.btn, .pill, .sticky-call').forEach(function (b) {
    b.addEventListener('pointerdown', function (ev) {
      var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
      var rip = document.createElement('span');
      rip.className = 'ripple';
      rip.style.width = rip.style.height = d + 'px';
      rip.style.left = ev.clientX - r.left - d / 2 + 'px';
      rip.style.top = ev.clientY - r.top - d / 2 + 'px';
      b.appendChild(rip);
      setTimeout(function () { rip.remove(); }, 600);
    });
  });

  // Menu item tilt on mouse hover (desktop only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.menu li').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(700px) rotateX(' + (-y * 4) + 'deg) rotateY(' + (x * 4) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }
})();
