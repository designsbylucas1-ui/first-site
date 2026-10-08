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
    if (sticky) {
      var c = document.getElementById('contact'), atForm = false;
      if (c) { var r = c.getBoundingClientRect(); atForm = r.top < window.innerHeight * 0.7; }
      sticky.classList.toggle('show', window.scrollY > 380 && !atForm);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Inquiry forms: send through Web3Forms without leaving the page. Problems are shown
  // on the page itself (some viewers hide the browser's own warnings), and a failed send
  // gives the visitor a direct email link instead of losing their message.
  document.querySelectorAll('form[data-inquiry]').forEach(function (form) {
    var to = form.getAttribute('data-email');
    function show(msg, html) {
      var old = form.querySelector('.form-error'); if (old) old.remove();
      var err = document.createElement('p');
      err.className = 'form-error'; err.setAttribute('role', 'alert');
      if (html) err.innerHTML = msg; else err.textContent = msg;
      form.appendChild(err);
      err.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var old = form.querySelector('.form-error'); if (old) old.remove();
      form.querySelectorAll('.invalid').forEach(function (f) { f.classList.remove('invalid'); });

      // Validate: a name, plus at least one way to reach them
      var val = function (n) { var f = form.querySelector('[name="' + n + '"]'); return f ? f.value.trim() : ''; };
      var contacts = (form.getAttribute('data-contact') || 'phone').split(',');
      var bad = [];
      if (!val('name')) bad.push('name');
      if (!contacts.some(function (c) { return val(c); })) contacts.forEach(function (c) { bad.push(c); });
      var email = form.querySelector('[name="email"]');
      if (email && email.value.trim() && !email.validity.valid) bad.push('email');
      if (bad.length) {
        bad.forEach(function (n) { var f = form.querySelector('[name="' + n + '"]'); if (f) f.classList.add('invalid'); });
        var first = form.querySelector('.invalid'); if (first) first.focus();
        var needName = !val('name');
        var needContact = !contacts.some(function (c) { return val(c); });
        var what = contacts.length > 1 ? 'a phone number or email' : 'a phone number';
        var msg = needName && needContact ? 'Please enter your name and ' + what + '.'
          : needName ? 'Please enter your name.'
          : needContact ? 'Please enter ' + what + '.'
          : 'That email address does not look right.';
        show(msg);
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Sending...';
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !(j.success === true || j.success === 'true')) throw new Error(j.message || 'not accepted');
          var ok = document.createElement('div');
          ok.className = 'thanks'; ok.setAttribute('role', 'status');
          ok.innerHTML = '<strong>Thanks! Got it.</strong><p>I\'ll get back to you soon about your free sample.</p>';
          form.replaceWith(ok);
          ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
      }).catch(function () {
        btn.disabled = false; btn.textContent = label;
        show('Sorry, that did not send. Please email <a href="mailto:' + to + '">' + to + '</a> instead.', true);
      });
    });
  });

  // Sample viewer: "View sample" opens the concept site in an on-page overlay.
  // Falls back to a normal link if scripts are blocked. window.__SAMPLES (base64)
  // lets a single-file preview supply the sample HTML directly.
  var viewer = document.getElementById('viewer');
  if (viewer) {
    var frame = document.getElementById('viewer-frame');
    var openLink = document.getElementById('viewer-open');
    var lastFocus = null;
    var closeViewer = function () {
      viewer.classList.remove('show');
      document.body.style.overflow = '';
      setTimeout(function () { viewer.hidden = true; frame.removeAttribute('srcdoc'); frame.removeAttribute('src'); }, 250);
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll('a[data-sample]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        lastFocus = a;
        var href = a.getAttribute('href');
        document.getElementById('viewer-title').textContent = a.getAttribute('data-sample');
        openLink.href = href;
        var b64 = window.__SAMPLES && window.__SAMPLES[href];
        if (b64) {
          frame.removeAttribute('src');
          frame.srcdoc = new TextDecoder().decode(Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); }));
          openLink.hidden = true;
        }
        else { frame.removeAttribute('srcdoc'); frame.src = href; openLink.hidden = false; }
        viewer.hidden = false;
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () { viewer.classList.add('show'); });
        document.getElementById('viewer-close').focus();
      });
    });
    document.getElementById('viewer-close').addEventListener('click', closeViewer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !viewer.hidden) closeViewer(); });
  }

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

    // Failsafe: some preview windows never fire the observer, which would leave
    // sections blank. This also reveals anything in view on scroll and on a timer.
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
