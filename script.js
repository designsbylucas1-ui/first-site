// All motion is skipped for visitors who prefer reduced motion; content stays visible without JS.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Scroll progress bar + sticky call bar (slides in after the hero)
  var bar = document.querySelector('.progress');
  var sticky = document.querySelector('.sticky-call');
  if (sticky && !reduce) root.classList.add('js-sticky');
  function onScroll() {
    var max = root.scrollHeight - window.innerHeight;
    if (bar && max > 0) bar.style.transform = 'scaleX(' + Math.min(window.scrollY / max, 1) + ')';
    if (sticky) sticky.classList.toggle('show', window.scrollY > 380);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  // Rotating "We handle:" word
  var rot = document.getElementById('rot');
  if (rot) {
    var words = ['furnace repair', 'air conditioning', 'emergency breakdowns', 'new installs', 'seasonal tune-ups'];
    var i = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove('out');
      }, 300);
    }, 2400);
  }

  // Falling snow in the hero
  var hero = document.querySelector('.hero');
  if (hero) {
    for (var s = 0; s < 16; s++) {
      var f = document.createElement('span');
      f.className = 'flake';
      f.style.left = Math.random() * 100 + '%';
      f.style.animationDuration = 7 + Math.random() * 7 + 's';
      f.style.animationDelay = -Math.random() * 12 + 's';
      f.style.width = f.style.height = 3 + Math.random() * 4 + 'px';
      hero.appendChild(f);
    }
  }

  // Count-up numbers (final text is restored when done)
  function countUp(el) {
    var end = parseFloat(el.dataset.count), prefix = el.dataset.prefix || '';
    var final = el.textContent, t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1);
      el.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else el.textContent = final;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  setTimeout(function () { counters.forEach(countUp); }, 700);

  // Scroll reveal
  if ('IntersectionObserver' in window) {
    root.classList.add('js-reveal');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el, n) {
      el.style.transitionDelay = (n % 3) * 80 + 'ms';
      io.observe(el);
    });
  }

  // Card tilt on mouse hover (desktop only)
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.cards li').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'perspective(600px) rotateX(' + (-y * 6) + 'deg) rotateY(' + (x * 6) + 'deg) translateY(-3px)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }
})();
