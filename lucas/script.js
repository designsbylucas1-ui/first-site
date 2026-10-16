(function () {
  // Mobile menu
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  // Scroll progress bar
  var bar = document.querySelector('.progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Mock booking calendar (October 2026 starts on a Thursday)
  var cal = document.getElementById('cal');
  if (cal) {
    var html = 'MTWTFSS'.split('').map(function (d) { return '<span class="h">' + d + '</span>'; }).join('');
    for (var i = 0; i < 3; i++) html += '<span></span>';
    for (var d = 1; d <= 31; d++) html += '<span class="' + (d === 22 ? 'pick' : d >= 15 ? 'on' : '') + '">' + d + '</span>';
    cal.innerHTML = html;
  }

  // Reveal on scroll
  var items = document.querySelectorAll('.proj, .what li, .about > *, .cta > *');
  items.forEach(function (el) { el.classList.add('rv'); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  // Contact form via Web3Forms
  var form = document.querySelector('.form');
  var status = form.querySelector('.status');
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
        if (j.success) { form.reset(); status.textContent = 'Thanks! I\'ll get back to you soon.'; }
        else throw new Error(j.message);
      })
      .catch(function () { status.textContent = 'Something went wrong. Please email me directly.'; })
      .then(function () { btn.disabled = false; });
  });
})();
