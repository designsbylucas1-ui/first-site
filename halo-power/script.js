const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => {
  if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
});

document.getElementById('yr').textContent = new Date().getFullYear();

const header = document.querySelector('.site-header');
addEventListener('scroll', () => header.classList.toggle('stuck', scrollY > 10), { passive: true });

// Fade sections in on scroll; content stays visible if observers are unavailable.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('js');
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

// Quote form: send via Web3Forms without leaving the page; show problems on the page.
const form = document.getElementById('quote-form');
if (form) {
  const show = msg => {
    form.querySelector('.form-error')?.remove();
    const p = document.createElement('p');
    p.className = 'form-error'; p.setAttribute('role', 'alert');
    p.textContent = msg;
    form.appendChild(p);
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    form.querySelector('.form-error')?.remove();
    form.querySelectorAll('.invalid').forEach(f => f.classList.remove('invalid'));
    const v = n => form.elements[n].value.trim();
    const bad = [];
    if (!v('name')) bad.push('name');
    if (!v('phone') && !v('email')) bad.push('phone', 'email');
    if (v('email') && !form.elements.email.validity.valid) bad.push('email');
    if (bad.length) {
      bad.forEach(n => form.elements[n].classList.add('invalid'));
      form.querySelector('.invalid').focus();
      show(!v('name') ? 'Please enter your name and a phone number or email.' : 'Please enter a phone number or a valid email.');
      return;
    }
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending...';
    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) !== 'true') throw new Error(j.message || 'not accepted');
      const ok = document.createElement('div');
      ok.className = 'thanks'; ok.setAttribute('role', 'status');
      ok.innerHTML = "<strong>Thanks, we got your request!</strong><p>We'll get back to you shortly.</p>";
      form.replaceWith(ok);
    } catch {
      btn.disabled = false; btn.textContent = label;
      show('Sorry, that did not send. Please call (780) 995-0359 instead.');
    }
  });
}
