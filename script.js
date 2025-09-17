// Lightweight HTML partial includes for header/footer
async function includePartials(){
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  if (!nodes.length) return;
  await Promise.all(nodes.map(async el => {
    const url = el.getAttribute('data-include');
    try {
      const res = await fetch(url, {cache:'no-cache'});
      if (!res.ok) throw new Error('Failed to load ' + url);
      const html = await res.text();
      // Replace placeholder with fetched partial
      el.outerHTML = html;
    } catch(err){
      // fail silently in production
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
    });
    // mark to avoid duplicate bindings in case of re-init
    toggle.hasListener = true;
  }
}

function markActiveNav(){
  const links = document.querySelectorAll('header .nav-list a');
  if (!links.length) return;
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  links.forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href && page.endsWith(href)) a.classList.add('active');
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
      <button class="modal-close" aria-label="Close">✕</button>
      <h3 id="booking-title">Book a Strategic Collaboration Call</h3>
      <div class="modal-body">
        <form id="booking-form">
          <div class="form-row">
            <div>
              <label for="name">Your name</label>
              <input id="name" name="name" type="text" required />
            </div>
            <div>
              <label for="org">Organization</label>
              <input id="org" name="org" type="text" />
            </div>
            <div class="full">
              <label for="email">Email address</label>
              <input id="email" name="email" type="email" required />
            </div>
            <div class="full">
              <label for="role">Which audience best describes you?</label>
              <select id="role" name="role">
                <option>Corporate / Sponsor</option>
                <option>Conference / Media</option>
                <option>Research / Policy</option>
                <option>Parent / Educator</option>
                <option>Other</option>
              </select>
            </div>
            <div class="full">
              <label for="notes">Notes / objectives</label>
              <textarea id="notes" name="notes" placeholder="Briefly describe your goal or questions"></textarea>
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
  enq.addEventListener('submit', (ev)=>{
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

    const mailSub = encodeURIComponent(subject);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nOrganization: ${org}\n\n${message}`);
    window.location.href = `mailto:info@drelaineloo.com?subject=${mailSub}&body=${body}`;
    showToast('Opening mail client...');
    f.reset();
  });
}
