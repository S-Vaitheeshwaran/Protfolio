/* =========================================================
   Vaitheeshwaran S — Portfolio interactions
   ========================================================= */
(() => {
  'use strict';

  // ---- Config -------------------------------------------------
  // Add your EmailJS values from https://dashboard.emailjs.com/.
  // Leave them empty to fall back to the visitor's email app (mailto).
  const EMAILJS_PUBLIC_KEY = 'irGf4e_uC-d0FobGp';
  const EMAILJS_SERVICE_ID = 'service_xww9vn6';
  const EMAILJS_NOTIFICATION_TEMPLATE_ID = 'template_vht5ms3';
  const EMAILJS_AUTOREPLY_TEMPLATE_ID = 'template_0o8id6g';
  const CONTACT_EMAIL = 'vaitheeshwaran375@gmail.com';

  const emailJsConfigured = EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_NOTIFICATION_TEMPLATE_ID;
  if (emailJsConfigured && window.emailjs) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }

  document.documentElement.classList.add('js');
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // ---- Footer year -------------------------------------------
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // ---- Mobile navigation -------------------------------------
  const toggle = $('#nav-toggle');
  const nav = $('#main-nav');
  const closeNav = () => {
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('.nav-link', nav).forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });

  // ---- Active nav link on scroll -----------------------------
  const links = $$('.nav-link');
  const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);

  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    // ---- Scroll reveal ---------------------------------------
    const reveal = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 80}ms`;
      reveal.observe(el);
    });

    // ---- Animated counters (hero metrics) --------------------
    const counter = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        animateCount(entry.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(el => counter.observe(el));
  } else {
    $$('.reveal').forEach(el => el.classList.add('visible'));
  }

  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const duration = 1100;
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ---- Project "Details" toggles -----------------------------
  $$('.project').forEach(card => {
    const btn = $('.link-btn', card);
    const more = $('.project-more', card);
    if (!btn || !more) return;
    btn.addEventListener('click', () => {
      const open = more.hidden;
      more.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      btn.firstChild.textContent = open ? 'Less ' : 'Details ';
    });
  });

  // ---- Contact form ------------------------------------------
  const form = $('#contact-form');
  const toast = $('#toast');
  const submitBtn = $('#submit-btn');
  let toastTimer;

  function showFeedback(text, type) {
    showToast(text, type);
  }

  function showToast(text, type) {
    if (!toast) return;
    clearTimeout(toastTimer);
    toast.textContent = text;
    toast.className = `toast ${type} visible`;
    toast.hidden = false;
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => (toast.hidden = true), 200);
    }, 5000);
  }

  function setLoading(on) {
    submitBtn.disabled = on;
    $('.btn-label', submitBtn).textContent = on ? 'SENDING...' : 'SEND MESSAGE';
    const svg = $('svg', submitBtn);
    if (svg) svg.style.display = on ? 'none' : '';
    const existing = $('.spinner', submitBtn);
    if (on && !existing) {
      const s = document.createElement('span');
      s.className = 'spinner';
      submitBtn.prepend(s);
    } else if (!on && existing) existing.remove();
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const name = data.name.trim(), email = data.email.trim(), message = data.message.trim();

    $$('.field', form).forEach(f => f.classList.remove('invalid'));
    const mark = id => $(`#${id}`).closest('.field').classList.add('invalid');

    if (!name || !email || !message) {
      if (!name) mark('name');
      if (!email) mark('email');
      if (!message) mark('message');
      showFeedback('Please fill out all required fields marked with an asterisk (*).', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      mark('email');
      showFeedback('Please enter a valid email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (emailJsConfigured) {
        if (!window.emailjs) throw new Error('EmailJS failed to load');
        const templateData = {
          name,
          email,
          from_name: name,
          from_email: email,
          subject: data.subject.trim() || `Portfolio enquiry from ${name}`,
          message,
          to_email: CONTACT_EMAIL,
          reply_to: email
        };
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_NOTIFICATION_TEMPLATE_ID, templateData);
        if (EMAILJS_AUTOREPLY_TEMPLATE_ID) {
          try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_AUTOREPLY_TEMPLATE_ID, {
              ...templateData,
              to_email: email
            });
          } catch (autoReplyError) {
            console.error('EmailJS auto-reply failed:', autoReplyError);
            showFeedback('✓ Your message was sent. The confirmation email could not be delivered.', 'success');
            form.reset();
            return;
          }
        }
        showFeedback('✓ Thank you! Your message has been sent. I will get back to as soon as possible .', 'success');
      } else {
        const subject = encodeURIComponent(data.subject.trim() || `Portfolio enquiry from ${name}`);
        const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        showFeedback('✓ Opening your email app with the message ready to send.', 'success');
      }
      form.reset();
    } catch (err) {
      showFeedback('Something went wrong. Please email me directly at ' + CONTACT_EMAIL + '.', 'error');
    } finally {
      setLoading(false);
    }
  });

  // clear invalid state as the user types
  form?.addEventListener('input', e => e.target.closest('.field')?.classList.remove('invalid'));
})();
