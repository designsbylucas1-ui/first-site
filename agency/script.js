// All motion is skipped for visitors who prefer reduced motion; content stays visible without JS.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  // Scroll progress bar + sticky CTA that slides in after the hero
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

  // Rotating hero phrase
  var rot = document.getElementById('rot');
  if (rot) {
    var words = ['phone ring', 'quotes roll in', 'customers call', 'business grow'];
    var i = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () {
        i = (i + 1) % words.length;
        rot.textContent = words[i];
        rot.classList.remove('out');
      }, 300);
    }, 2600);
  }

  // Floating glow orbs in the hero
  var hero = document.querySelector('.hero');
  if (hero) {
    var colors = ['#7c5cff', '#22d3ee', '#ff5c8a'];
    for (var o = 0; o < 3; o++) {
      var orb = document.createElement('span');
      orb.className = 'orb';
      orb.style.width = orb.style.height = 140 + o * 40 + 'px';
      orb.style.background = colors[o];
      orb.style.left = 10 + o * 35 + '%';
      orb.style.top = 20 + o * 20 + '%';
      orb.style.animationDelay = -o * 3 + 's';
      hero.appendChild(orb);
    }
  }

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
