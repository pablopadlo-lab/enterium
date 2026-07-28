/* ============================================================
   Enterium — shared JS
   - mobile nav toggle
   - scroll reveals (IntersectionObserver)
   - snapshot form handling (idle -> loading -> success/error)
   - GA4 init stub (consent mode default-denied, placeholder ID)
   ============================================================ */
(function () {
  'use strict';

  /* JS is available — gate the reveal initial state on this class (see canon.css). */
  document.documentElement.classList.add('js');

  /* ---------- GA4 (placeholder — see README) ----------
     To enable analytics:
       1. Replace G-XXXXXXXXXX below and in the commented snippet in each
          page's <head> with your real GA4 measurement ID.
       2. Uncomment the gtag loader snippet in <head>.
       3. Keep consent mode default 'denied' — analytics must fire only
          after the visitor consents (call gtag('consent','update',...)).
  ----------------------------------------------------- */
  var GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // PLACEHOLDER — do not ship with a real loader until replaced

  function initAnalytics(consentGranted) {
    if (GA4_MEASUREMENT_ID.indexOf('G-XXX') === 0) return; // placeholder: never load
    if (!consentGranted) return; // analytics fires only after consent
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_MEASUREMENT_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA4_MEASUREMENT_ID);
  }
  // Consent-mode default (denied) is declared inline in each page's <head>.
  // We deliberately do NOT call initAnalytics(true) anywhere by default.
  window.ENTERIUM_ANALYTICS = { init: initAnalytics };

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.navtoggle');
  var menu = document.getElementById('mobilemenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  /* ---------- scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- snapshot form ---------- */
  var form = document.querySelector('form[data-snapshot-form]');
  if (form) initSnapshotForm(form);

  function initSnapshotForm(form) {
    var successBox = document.getElementById('form-success');
    var errorBox = document.getElementById('form-error');
    var retryBtn = document.getElementById('form-retry');
    var submitBtn = form.querySelector('button[type="submit"]');
    var btnLabel = submitBtn ? submitBtn.textContent : '';

    function setInvalid(input, on) {
      var field = input.closest('.field');
      if (field) field.classList.toggle('invalid', on);
      input.setAttribute('aria-invalid', on ? 'true' : 'false');
    }

    function validate() {
      var ok = true;
      var firstBad = null;
      form.querySelectorAll('[required]').forEach(function (input) {
        var val = input.value.trim();
        var bad = !val;
        if (!bad && input.type === 'email') {
          bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
        }
        if (!bad && input.type === 'url') {
          bad = !/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/.*)?$/i.test(val.replace(/^https?:\/\//, ''));
        }
        setInvalid(input, bad);
        if (bad) { ok = false; if (!firstBad) firstBad = input; }
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    // clear error state as the user types
    form.addEventListener('input', function (e) {
      var input = e.target.closest('input,textarea');
      if (input) setInvalid(input, false);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.classList.contains('is-loading')) return;
      if (!validate()) return;

      var payload = {
        website: form.elements.website.value.trim(),
        category: form.elements.category.value.trim(),
        competitors: form.elements.competitors.value.trim(),
        email: form.elements.email.value.trim(),
        buyer_question: form.elements.question.value.trim() || null
      };

      form.classList.add('is-loading');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'TRANSMITTING\u2026';
        submitBtn.classList.add('mono');
      }
      if (errorBox) errorBox.classList.remove('show');

      var endpoint = (form.getAttribute('data-endpoint') || '').trim();

      var done = function () {
        form.classList.remove('is-loading');
        form.style.display = 'none';
        if (successBox) {
          successBox.classList.add('show');
          successBox.setAttribute('tabindex', '-1');
          successBox.focus();
        }
      };
      var fail = function () {
        form.classList.remove('is-loading');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = btnLabel; }
        if (errorBox) {
          errorBox.classList.add('show');
          errorBox.setAttribute('tabindex', '-1');
          errorBox.focus();
        }
      };

      if (!endpoint) {
        // Demo mode: no endpoint configured — simulate success and log the payload.
        // The success copy promises a 48h human run; in demo mode that's not true,
        // so say so honestly and offer the manual path.
        setTimeout(function () {
          console.log('[Enterium snapshot form — demo mode] payload:', payload);
          done();
          if (successBox && !successBox.querySelector('.demo-note')) {
            var note = document.createElement('p');
            note.className = 'demo-note';
            note.innerHTML = 'DEMO BUILD &mdash; submissions are not wired yet. Email <a href="mailto:hello@enterium.ai">hello@enterium.ai</a> and we\'ll run your snapshot manually.';
            successBox.appendChild(note);
          }
        }, 900);
        return;
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (res.ok) done(); else fail();
      }).catch(fail);
    });

    if (retryBtn) {
      retryBtn.addEventListener('click', function () {
        if (errorBox) errorBox.classList.remove('show');
        if (submitBtn) submitBtn.focus();
      });
    }
  }
})();
