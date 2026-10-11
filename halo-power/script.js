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

// Photo picker: compress to ~1600px JPEG so uploads stay small on phone data.
const photoInput = document.getElementById('photo-input');
const thumbs = document.getElementById('thumbs');
const photos = [];
const MAX_PHOTOS = 3;
const shrink = file => new Promise((resolve, reject) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const s = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(b => { URL.revokeObjectURL(url); b ? resolve({ blob: b, url: URL.createObjectURL(b) }) : reject(); }, 'image/jpeg', 0.82);
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(); };
  img.src = url;
});
const drawThumbs = () => {
  thumbs.innerHTML = '';
  photos.forEach((p, i) => {
    const li = document.createElement('li');
    const im = document.createElement('img'); im.src = p.url; im.alt = 'Selected photo ' + (i + 1);
    const x = document.createElement('button'); x.type = 'button'; x.textContent = '×'; x.setAttribute('aria-label', 'Remove photo ' + (i + 1));
    x.onclick = () => { URL.revokeObjectURL(p.url); photos.splice(i, 1); drawThumbs(); };
    li.append(im, x); thumbs.appendChild(li);
  });
};
if (photoInput) {
  photoInput.addEventListener('change', async () => {
    const files = [...photoInput.files].filter(f => f.type.startsWith('image/'));
    photoInput.value = '';
    for (const f of files) {
      if (photos.length >= MAX_PHOTOS) break;
      try { photos.push(await shrink(f)); } catch {}
    }
    drawThumbs();
  });
  const drop = document.querySelector('.drop');
  ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, () => drop.classList.remove('over')));
  drop.addEventListener('drop', e => { e.preventDefault(); photoInput.files = e.dataTransfer.files; photoInput.dispatchEvent(new Event('change')); });
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
      const fd = new FormData(form);
      photos.forEach((p, i) => fd.append(i ? 'attachment' + (i + 1) : 'attachment', p.blob, 'photo-' + (i + 1) + '.jpg'));
      const r = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, body: fd });
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
