const PARTIAL_CACHE_PREFIX = 'partial:';

function getPartialFromCache(key){
  try{
    return sessionStorage.getItem(PARTIAL_CACHE_PREFIX + key) || '';
  }catch(err){
    return '';
  }
}

function setPartialCache(key, value){
  try{
    sessionStorage.setItem(PARTIAL_CACHE_PREFIX + key, value);
  }catch(err){
    // storage may be full or unavailable; ignore
  }
}

function injectPartial(el, html){
  if (!el || !html) return;
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  el.innerHTML = '';
  el.appendChild(tpl.content.cloneNode(true));
  el.removeAttribute('data-loading');
  el.setAttribute('data-cache-applied', 'true');
}

// Lightweight HTML partial includes for header/footer, with caching + shimmer placeholders
async function includePartials(){
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  if (!nodes.length) return;

  await Promise.all(nodes.map(async el => {
    const url = el.getAttribute('data-include');
    if (!url) return;

    el.setAttribute('data-loading', 'true');

    const cached = getPartialFromCache(url);
    if (cached && !el.children.length){
      injectPartial(el, cached);
      el.setAttribute('data-render-source', 'cache');
    }

    try {
      const res = await fetch(url, {cache:'no-cache'});
      if (!res.ok) throw new Error('Failed to load ' + url + ' (' + res.status + ')');
      const html = await res.text();
      setPartialCache(url, html);
      injectPartial(el, html);
      el.setAttribute('data-render-source', 'network');
    } catch(err){
      if (!el.children.length && cached){
        injectPartial(el, cached);
        el.setAttribute('data-render-source', 'cache');
      } else {
        el.removeAttribute('data-loading');
        el.setAttribute('data-load-error', 'true');
      }
      console.warn(err);
    }
  }));
}

function initNav(){
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('navList');
  if (toggle && nav && !toggle.hasListener){
    toggle.addEventListener('click', () => {
      const shown = nav.classList.toggle('show');
      toggle.setAttribute('aria-expanded', shown ? 'true' : 'false');
      document.body.classList.toggle('nav-open', shown);
    });
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 960px)').matches){
          nav.classList.remove('show');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('nav-open');
        }
      });
    });
    // mark to avoid duplicate bindings in case of re-init
    toggle.hasListener = true;
  }
}

function markActiveNav(){
  const links = document.querySelectorAll('header .nav-list a');
  if (!links.length) return;
  const norm = (s) => {
    try{
      const u = new URL(s, location.origin);
      let p = (u.pathname || '/').toLowerCase();
      p = p.replace(/index\.html$/, '').replace(/home\.html$/, '').replace(/\.html$/, '');
      if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
      if (!p) p = '/';
      return p;
    }catch{
      let p = (s || '/').toLowerCase();
      p = p.replace(/index\.html$/, '').replace(/home\.html$/, '').replace(/\.html$/, '');
      if (p !== '/' && p.endsWith('/')) p = p.slice(0, -1);
      if (!p.startsWith('/')) p = '/' + p;
      return p || '/';
    }
  };
  const page = norm(location.pathname || '/');
  links.forEach(a => {
    const href = norm(a.getAttribute('href'));
    if (href === page) a.classList.add('active');
  });
}

function setYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

// bootstrap includes then init header/footer helpers
(async () => {
  await includePartials();
  initNav();
  markActiveNav();
  setYear();
  initReveal();
  initHeaderShadow();
  lazyImages();
  initImageLightbox();
  enhanceSmoothAnchors();
  initTilt();
  initPressFeedback();
  initResponsiveFbEmbeds();
})();

// Toast helper: show a short confirmation when mailto CTA is clicked
function showToast(message = 'Sent'){
  const id = 'site-toast';
  let t = document.getElementById(id);
  if (!t){
    t = document.createElement('div');
    t.id = id;
    t.style.position = 'fixed';
    t.style.right = '1rem';
    t.style.bottom = '1rem';
    t.style.background = 'rgba(15,23,42,.95)';
    t.style.color = '#fff';
    t.style.padding = '.6rem .9rem';
    t.style.borderRadius = '.6rem';
    t.style.boxShadow = '0 8px 30px rgba(2,6,23,.3)';
    t.style.zIndex = 9999;
    t.style.fontSize = '.95rem';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.style.opacity = '1';
  setTimeout(() => { t.style.transition = 'opacity .5s'; t.style.opacity = '0'; }, 2200);
}

// Attach to mailto CTAs (Book / Email)
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
  if (!a) return;
  // allow default mailto behavior, but also show a toast
  showToast('Opening mail client...');
});

// Optional: lightbox hint (open FB in new tab already)

/* Booking modal: open, close, and submit -> mailto */
const openBtn = document.getElementById('open-booking');
const openBtn2 = document.getElementById('open-booking-2');
const openBtn3 = document.getElementById('open-booking-3');

function createModal(){
  if (document.getElementById('booking-modal')) return;
  const bd = document.createElement('div'); bd.className = 'modal-backdrop'; bd.id = 'booking-modal';
  bd.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
      <div class="modal-header">
        <div class="modal-heading">
          <p class="modal-kicker">Strategic collaboration</p>
          <h3 id="booking-title">Book a Strategic Collaboration Call</h3>
          <p class="modal-subhead">
            Share a few details so we can prepare relevant resources and confirm a time that serves your goals.
          </p>
        </div>
        <button class="modal-close modal-close-icon" type="button" aria-label="Close dialog">✕</button>
      </div>
      <div class="modal-body">
        <form id="booking-form">
          <div class="form-grid">
            <div class="field">
              <label for="name">Your name</label>
              <input id="name" name="name" type="text" autocomplete="name" required />
            </div>
            <div class="field">
              <label for="org">Organization</label>
              <input id="org" name="org" type="text" autocomplete="organization" />
            </div>
            <div class="field full">
              <label for="email">Email address</label>
              <input id="email" name="email" type="email" autocomplete="email" required />
            </div>
            <div class="field full">
              <label for="role">Which audience best describes you?</label>
              <select id="role" name="role">
                <option value="Corporate / Sponsor">Corporate / Sponsor</option>
                <option value="Conference / Media">Conference / Media</option>
                <option value="Research / Policy">Research / Policy</option>
                <option value="Parent / Educator">Parent / Educator</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="field full">
              <label for="notes">Notes / objectives</label>
              <textarea id="notes" name="notes" placeholder="Briefly describe your focus, stakeholders, and desired outcomes"></textarea>
            </div>
          </div>
           
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost modal-close">Cancel</button>
            <button type="submit" class="btn btn-primary">Send request</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(bd);

  // attach handlers
  bd.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', closeModal));
  bd.addEventListener('click', (e)=>{ if (e.target === bd) closeModal(); });
  const form = document.getElementById('booking-form');
  form.addEventListener('submit', (ev)=>{
    ev.preventDefault();
    const data = new FormData(form);
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const org = data.get('org') || '';
    const role = data.get('role') || '';
    const notes = data.get('notes') || '';
    const subject = encodeURIComponent('Strategic Collaboration Call request');
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nOrganization: ${org}\nRole: ${role}\n\nNotes:\n${notes}`);
    const href = `mailto:info@drelaineloo.com?subject=${subject}&body=${body}`;
    // open mail client
    window.location.href = href;
    showToast('Opening mail client...');
    closeModal();
  });
}

function closeModal(){
  const m = document.getElementById('booking-modal'); if (m) m.remove();
}

if (openBtn) openBtn.addEventListener('click', ()=>{ createModal(); });
if (openBtn2) openBtn2.addEventListener('click', ()=>{ createModal(); });
if (openBtn3) openBtn3.addEventListener('click', ()=>{ createModal(); });

// Enquiry form handler: validate and open mailto with form values
const enq = document.getElementById('enquiry-form');
if (enq){
  enq.addEventListener('submit', async (ev)=>{
    ev.preventDefault();
    const f = ev.target;
    const name = f.querySelector('#enq-name').value.trim();
    const email = f.querySelector('#enq-email').value.trim();
    const org = f.querySelector('#enq-org').value.trim();
    const subject = f.querySelector('#enq-subject').value.trim();
    const message = f.querySelector('#enq-message').value.trim();

    if (!name || !email || !subject || !message){
      showToast('Please complete all required fields');
      return;
    }

    const submitBtn = f.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn){
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      const res = await fetch('/api/send-enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, org, subject, message })
      });

      if (!res.ok){
        throw new Error(`Request failed with status ${res.status}`);
      }

      showToast('Thanks! We’ll be in touch shortly.');
      f.reset();
    } catch (err){
      console.error(err);
      showToast('Something went wrong. Please try again.');
    } finally {
      if (submitBtn){
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

/* ------------
   Reveal on scroll
   ------------ */
function initReveal(){
  const sel = [
    // hero
    '.hero .hero-copy', '.hero .hero-figure', '.programs-hero-copy', '.programs-hero-figure',
    // speaking hero
    '.speaking-hero .hero-grid > div', '.speaking-hero .hero-figure',
    // programs sections
    '.program-section .section-head', '.program-layout article', '.program-layout figure', '.program-block', '.program-gallery .media-wide',
    // home intro split
    '.intro-figure', '.intro-copy',
    // about page sections
    '.academic-section .academic-stack > figure', '.academic-card', '.recognitions .section-head', '.recognition-card', '.recognition-figure', '.recognition-content',
    // research page sections
    '.endorsement-card', '.media-stack .media-wide', '.pub-card', '.book-card', '.video-embed',
    // media page sections
    '.embed-grid .fb-embed', '.talks-content .talk-card', '.talk-media', '.mention-card',
    // connect page sections
    '#connect-copy .aud-card', '.engage-header', '.engage-follow', '.quote blockquote',
    // generic cards and sections
    '.stats .stat', '.hl-card', '.topic-card', '.about-card', '.pub-card', '.book-card', '.rec-card',
    '.contact-card .card-inner', '.banner-overlay',
    '.gallery-grid .gcard', '.cta-banner .cta-inner > *', '.footer-grid > *'
  ];
  const nodes = sel.flatMap(s => Array.from(document.querySelectorAll(s)));
  if (!nodes.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach((e)=>{
      if (e.isIntersecting){
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold:.16, rootMargin:'0px 0px -8% 0px' });

  nodes.forEach((el, i)=>{
    if (!el.hasAttribute('data-reveal')){
      let dir = 'up';
      // hero directions
      if (el.matches('.hero .hero-figure, .programs-hero-figure, .gallery-grid .gcard:nth-child(2n)')) dir = 'right';
      if (el.matches('.hero .hero-copy, .programs-hero-copy, .gallery-grid .gcard:nth-child(2n+1)')) dir = 'left';
      // speaking hero
      if (el.matches('.speaking-hero .hero-figure')) dir = 'right';
      if (el.matches('.speaking-hero .hero-grid > div')) dir = 'left';
      // program layout: alternate by column; flip layout reverses
      if (el.matches('.program-layout article, .program-layout figure')){
        const flipped = !!el.closest('.program-layout--flip');
        const isFigure = el.matches('figure');
        dir = (!flipped && isFigure) || (flipped && !isFigure) ? 'right' : 'left';
      }
      // program blocks: gentle up
      if (el.matches('.program-block')) dir = 'up';
      // home intro split
      if (el.matches('.intro-figure')) dir = 'right';
      if (el.matches('.intro-copy')) dir = 'left';
      // about page specifics
      if (el.matches('.academic-section .academic-stack > figure')) dir = 'right';
      if (el.matches('.academic-card')) dir = 'up';
      if (el.matches('.recognition-figure')) dir = 'left';
      if (el.matches('.recognition-content')) dir = 'right';
      // research page specifics
      if (el.matches('.endorsement-card, .pub-card, .book-card')) dir = 'up';
      if (el.matches('.media-stack .media-wide')) dir = 'right';
      if (el.matches('.video-embed')) dir = 'zoom';
      // media page specifics
      if (el.matches('.embed-grid .fb-embed')) dir = 'zoom';
      if (el.matches('.talks-content .talk-card')) dir = 'up';
      if (el.matches('.talk-media')) dir = 'right';
      if (el.matches('.mention-card')) dir = 'up';
      // connect page specifics
      if (el.matches('.engage-header')) dir = 'left';
      if (el.matches('.engage-follow')) dir = 'right';
      // quotes
      if (el.matches('.quote blockquote')) dir = 'zoom';
      el.setAttribute('data-reveal', dir);
    }
    el.style.transitionDelay = `${Math.min(i * 0.04, 0.45)}s`;
    io.observe(el);
  });
}

/* ------------
   Sticky header shadow
   ------------ */
function initHeaderShadow(){
  const h = document.querySelector('.site-header');
  if (!h) return;
  const onScroll = ()=>{
    if (window.scrollY > 6) h.classList.add('is-scrolled');
    else h.classList.remove('is-scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
}

/* ------------
   Lazy images for performance
   ------------ */
function lazyImages(){
  document.querySelectorAll('img:not([loading])').forEach(img => {
    img.setAttribute('loading','lazy');
  });
}

/* ------------
   Smooth anchors for in-page links
   ------------ */
function enhanceSmoothAnchors(){
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return;
    const target = document.getElementById(href.slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', href);
  }, { passive: false });
}

/* ------------
   Interactive tilt for cards/buttons
   ------------ */
function initTilt(){
  const els = document.querySelectorAll('.hl-card, .topic-card, .about-card, .pub-card, .book-card, .rec-card, .gcard, .stat, .btn, .academic-card, .recognition-card, .talk-card, .mention-card, .aud-card');
  if (!els.length) return;
  els.forEach(el => {
    el.classList.add('tiltable');
    let frame;
    const maxTilt = 6; // degrees
    function onMove(ev){
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const x = (ev.clientX - cx) / (rect.width/2);
      const y = (ev.clientY - cy) / (rect.height/2);
      const ry = Math.max(Math.min(x * maxTilt, maxTilt), -maxTilt);
      const rx = Math.max(Math.min(-y * maxTilt, maxTilt), -maxTilt);
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(()=>{
        el.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        el.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      });
    }
    function reset(){
      if (frame) cancelAnimationFrame(frame);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    }
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', reset);
    el.addEventListener('blur', reset);
  });
}

/* ------------
   Press feedback for buttons (scale + active state)
   ------------ */
function initPressFeedback(){
  document.addEventListener('mousedown', (e)=>{
    const b = e.target.closest('.btn');
    if (!b) return;
    b.classList.add('is-pressed');
  });
  document.addEventListener('mouseup', (e)=>{
    const b = e.target.closest('.btn.is-pressed');
    if (b) b.classList.remove('is-pressed');
  });
  document.addEventListener('mouseleave', (e)=>{
    const b = document.querySelector('.btn.is-pressed');
    if (b) b.classList.remove('is-pressed');
  });
  document.addEventListener('keydown', (e)=>{
    if (e.key !== ' ' && e.key !== 'Enter') return;
    const b = e.target.closest && e.target.closest('.btn');
    if (!b) return;
    b.classList.add('is-pressed');
  });
  document.addEventListener('keyup', (e)=>{
    const b = e.target.closest && e.target.closest('.btn.is-pressed');
    if (b) b.classList.remove('is-pressed');
  });
}

/* ------------
   Image lightbox
   ------------ */
let lightboxEl;
let lightboxImg;
let lightboxCaption;
let lightboxPrev;
let lightboxNext;
let lastFocusedEl;
let lightboxItems = [];
let lightboxIndex = -1;

function initImageLightbox(){
  const selectors = [
    '.media-wide img',
    '.pub-figure img',
    '.book-figure img',
    '.endorsement-card img',
    '.intro-figure img',
    '.recognition-figure-link img',
    '.gallery-grid img'
  ];
  const images = document.querySelectorAll(selectors.join(', '));
  if (!images.length) return;

  images.forEach(img => {
    const link = img.closest('a');
    const isRecognitionLink = link && link.classList.contains('recognition-figure-link');
    const galleryTrigger = img.closest('.gallery-item');
    if (img.dataset.lightboxBound) return;
    if (link && !isRecognitionLink) return;
    img.dataset.lightboxBound = 'true';
    img.classList.add('is-lightbox-enabled');

    const handleOpen = (e) => {
      if (e) e.preventDefault();
      openImageLightbox(img);
    };

    if (isRecognitionLink){
      if (!img.dataset.full) img.dataset.full = link.getAttribute('href');
      link.setAttribute('aria-label', `Expand image${img.alt ? ': ' + img.alt : ''}`);
      link.addEventListener('click', handleOpen);
      link.addEventListener('keydown', (e) => {
        if (e.key === ' '){
          e.preventDefault();
          handleOpen();
        }
      });
      return;
    }

    if (galleryTrigger){
      if (!galleryTrigger.dataset.lightboxBound){
        galleryTrigger.dataset.lightboxBound = 'true';
        galleryTrigger.addEventListener('click', handleOpen);
        galleryTrigger.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' '){
            e.preventDefault();
            handleOpen();
          }
        });
      }
      return;
    }

    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'Expand image');
    img.addEventListener('click', handleOpen);
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        handleOpen();
      }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImageLightbox();
    if (!lightboxItems.length || !lightboxEl || !lightboxEl.classList.contains('is-visible')) return;
    if (e.key === 'ArrowRight'){
      e.preventDefault();
      shiftLightbox(1);
    } else if (e.key === 'ArrowLeft'){
      e.preventDefault();
      shiftLightbox(-1);
    }
  });
}

function ensureLightbox(){
  if (lightboxEl) return;
  lightboxEl = document.createElement('div');
  lightboxEl.id = 'img-lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-hidden', 'true');
  lightboxEl.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <figure class="lightbox-figure">
      <button class="lightbox-close" type="button" aria-label="Close image">✕</button>
      <div class="lightbox-media">
        <button class="lightbox-nav lightbox-prev" type="button" aria-label="Previous image">
          <span aria-hidden="true">‹</span>
        </button>
        <img src="" alt="" />
        <button class="lightbox-nav lightbox-next" type="button" aria-label="Next image">
          <span aria-hidden="true">›</span>
        </button>
      </div>
      <figcaption></figcaption>
    </figure>
  `;
  document.body.appendChild(lightboxEl);
  lightboxImg = lightboxEl.querySelector('img');
  lightboxCaption = lightboxEl.querySelector('figcaption');
  lightboxPrev = lightboxEl.querySelector('.lightbox-prev');
  lightboxNext = lightboxEl.querySelector('.lightbox-next');
  const closeBtn = lightboxEl.querySelector('.lightbox-close');
  closeBtn.addEventListener('click', closeImageLightbox);
  lightboxEl.querySelector('.lightbox-backdrop').addEventListener('click', closeImageLightbox);
  lightboxPrev.addEventListener('click', () => shiftLightbox(-1));
  lightboxNext.addEventListener('click', () => shiftLightbox(1));
}

function openImageLightbox(img){
  ensureLightbox();
  lastFocusedEl = document.activeElement;
  const group = img.dataset.lightboxGroup;
  if (group){
    lightboxItems = Array.from(document.querySelectorAll(`img[data-lightbox-group="${group}"]`));
  } else {
    lightboxItems = [img];
  }
  lightboxIndex = Math.max(0, lightboxItems.indexOf(img));
  setLightboxImage(lightboxItems[lightboxIndex]);
  toggleLightboxNav();
  lightboxEl.classList.add('is-visible');
  lightboxEl.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    lightboxEl.classList.add('is-active');
  });
  lightboxEl.querySelector('.lightbox-close').focus();
}

function closeImageLightbox(){
  if (!lightboxEl || !lightboxEl.classList.contains('is-visible')) return;
  lightboxEl.classList.remove('is-active');
  lightboxEl.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    if (lightboxEl) lightboxEl.classList.remove('is-visible');
  }, 200);
  lightboxItems = [];
  lightboxIndex = -1;
  if (lastFocusedEl && typeof lastFocusedEl.focus === 'function'){ lastFocusedEl.focus(); }
}

function setLightboxImage(img){
  if (!img) return;
  const src = img.dataset.full || img.currentSrc || img.src;
  lightboxImg.src = src;
  lightboxImg.alt = img.alt || '';
  const caption = img.dataset.caption || img.alt || '';
  lightboxCaption.textContent = caption;
}

function shiftLightbox(delta){
  if (!lightboxItems.length) return;
  lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
  setLightboxImage(lightboxItems[lightboxIndex]);
  toggleLightboxNav();
}

function toggleLightboxNav(){
  if (!lightboxPrev || !lightboxNext) return;
  const multiple = lightboxItems.length > 1;
  lightboxPrev.hidden = lightboxNext.hidden = !multiple;
}

/* ------------
   Responsive Facebook embeds
   ------------ */
function initResponsiveFbEmbeds(){
  const iframes = Array.from(document.querySelectorAll('iframe.fb-embed'));
  if (!iframes.length) return;

  const parseHref = (src) => {
    try{
      const u = new URL(src, location.origin);
      return u;
    }catch{
      return null;
    }
  };

  const update = () => {
    iframes.forEach((el) => {
      const parent = el.parentElement;
      if (!parent) return;
      const maxW = Math.max(280, Math.floor(parent.getBoundingClientRect().width));
      const isMobile = window.matchMedia('(max-width: 480px)').matches;
      const targetWidth = Math.min(500, maxW);
      const aspect = 500/711; // based on provided default size
      const targetHeight = Math.round(targetWidth / aspect);

      // set element width/height attributes for better FB sizing
      el.setAttribute('width', String(targetWidth));
      el.setAttribute('height', String(Math.max(360, targetHeight)));
      el.style.width = '100%';

      // also adjust width param inside the src URL to let FB render server-side appropriately
      const parsed = parseHref(el.getAttribute('src'));
      if (parsed){
        parsed.searchParams.set('width', String(targetWidth));
        // keep show_text as-is
        const newSrc = parsed.toString();
        if (el.src !== newSrc) el.src = newSrc;
      }

      // add a small fallback link below iframe on mobile if not present
      let fallback = el.nextElementSibling;
      const href = parsed && parsed.searchParams.get('href') ? decodeURIComponent(parsed.searchParams.get('href')) : null;
      if (isMobile && href){
        if (!fallback || !(fallback instanceof HTMLAnchorElement) || !fallback.classList.contains('fb-fallback')){
          const a = document.createElement('a');
          a.className = 'fb-fallback';
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = 'View on Facebook';
          a.style.display = 'inline-block';
          a.style.margin = '.35rem 0 .8rem';
          a.style.fontSize = '.9rem';
          a.style.color = getComputedStyle(document.documentElement).getPropertyValue('--brand') || '#336699';
          el.insertAdjacentElement('afterend', a);
        }
      } else if (fallback && fallback.classList && fallback.classList.contains('fb-fallback')){
        fallback.remove();
      }
    });
  };

  // initial and resize observers
  update();
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 120);
  }, { passive:true });
}
