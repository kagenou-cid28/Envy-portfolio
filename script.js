/* ===== MAIN SCRIPT ===== */
(function() {
  'use strict';

  // ===== LOADER =====
  (function loader() {
    const counterEl = document.getElementById('loader-counter');
    const loaderEl = document.getElementById('loader');
    if (!counterEl || !loaderEl) return;

    const duration = 2200;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const count = Math.round(eased * 100);
      counterEl.textContent = String(count).padStart(3, '0') + '%';

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(() => {
          loaderEl.classList.add('hidden');
          pageLoadSequence();
        }, 400);
      }
    }
    requestAnimationFrame(tick);
  })();

  // ===== PAGE LOAD SEQUENCE =====
  function pageLoadSequence() {
    setTimeout(() => {
      document.getElementById('navbar').classList.add('visible');
    }, 400);

    // Fade in hero title as a whole
    setTimeout(() => {
      const title = document.getElementById('hero-title');
      if (title) {
        title.style.opacity = '0';
        title.style.transform = 'translateY(30px)';
        title.style.transition = 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)';
        requestAnimationFrame(() => {
          title.style.opacity = '1';
          title.style.transform = 'translateY(0)';
        });
      }
    }, 600);

    setTimeout(() => {
      const firstSection = document.querySelector('.reveal');
      if (firstSection) firstSection.classList.add('visible');
    }, 1200);
  }

  // ===== LENIS SMOOTH SCROLL =====
  (function initLenis() {
    if (typeof Lenis === 'undefined') return;
    const lenis = new Lenis({
      lerp: 0.07,
      easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.6,
      smoothTouch: true,
      touchMultiplier: 1.2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Lenis global for Three.js sync
    window.__lenis = lenis;

    // Nav progress bar + scrolled state + ∞ rotation
    lenis.on('scroll', function(e) {
      if (window.__updateScrollProgress) window.__updateScrollProgress(e.progress);
      const pBar = document.getElementById('nav-progress');
      if (pBar) pBar.style.width = (e.progress * 100) + '%';
      const nav = document.getElementById('navbar');
      if (nav) nav.classList.toggle('scrolled', e.animatedScroll > 50);
      const glyph = document.querySelector('.footer-glyph');
      if (glyph) glyph.style.transform = 'rotate(' + (e.progress * 360) + 'deg)';
    });

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          lenis.scrollTo(target, { offset: -64, duration: 1.2 });
        }
      });
    });
  })();

  // ===== INTERSECTION OBSERVER FOR REVEALS =====
  (function observer() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (entry.target.id === 'capabilities') {
            initSkillBars();
          }
        }
      });
    }, { threshold: 0.15 });

    revealEls.forEach(el => obs.observe(el));
  })();

  // ===== BAR CHART =====
  function initSkillBars() {
    const container = document.getElementById('barchart');
    if (!container || container.hasChildNodes()) return;

    const skills = [
      { name: 'C', pct: 85, cat: 'language' },
      { name: 'C++', pct: 80, cat: 'language' },
      { name: 'Python', pct: 88, cat: 'language' },
      { name: 'AI Tools', pct: 82, cat: 'hardware' },
      { name: 'Embedded Systems', pct: 75, cat: 'hardware' },
      { name: 'Vibe Coding', pct: 92, cat: 'human' },
      { name: 'Communication', pct: 88, cat: 'human' },
      { name: 'Adaptability', pct: 95, cat: 'human' },
      { name: 'Problem Solving', pct: 90, cat: 'human' },
    ];

    const catColors = { language: '#ffffff', hardware: '#c084fc', human: '#9b5de5' };

    container.innerHTML = skills.map((s, i) =>
      '<div class="bar-row">' +
        '<span class="bar-name">' + s.name + '</span>' +
        '<div class="bar-track">' +
          '<div class="bar-fill" data-pct="' + s.pct + '" style="background:' + (catColors[s.cat] || '#9b5de5') + ';width:0%"></div>' +
        '</div>' +
        '<span class="bar-pct">' + s.pct + '%</span>' +
      '</div>'
    ).join('');

    // Animate bars
    const fills = container.querySelectorAll('.bar-fill');
    fills.forEach((fill, i) => {
      setTimeout(() => {
        fill.style.width = fill.getAttribute('data-pct') + '%';
      }, i * 80);
    });
  }

  // ===== MAGNETIC BUTTONS =====
  (function magnetic() {
    const btns = document.querySelectorAll('.cta, .nav-pill');
    if (!btns.length) return;

    btns.forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const strength = 6;
        this.style.transform = 'translate(' + (x / rect.width) * strength + 'px, ' + (y / rect.height) * strength + 'px)';
      });

      btn.addEventListener('mouseleave', function() {
        this.style.transform = 'translate(0, 0)';
      });
    });
  })();

  // ===== RIPPLES =====
  (function ripple() {
    const btns = document.querySelectorAll('.cta, .nav-pill');
    btns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        this.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  })();

  // ===== HAMBURGER MENU =====
  (function hamburger() {
    const btn = document.getElementById('hamburger');
    const links = document.getElementById('nav-links');
    if (!btn || !links) return;
    btn.addEventListener('click', () => {
      links.classList.toggle('open');
    });
    links.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        // Lenis scroll to target
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && window.__lenis) {
          const target = document.querySelector(href);
          if (target) window.__lenis.scrollTo(target, { offset: -64 });
        }
      });
    });
  })();

  // ===== CONTACT FORM MOCK =====
  (function formMock() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('.contact-submit');
      if (!btn) return;
      const orig = btn.textContent;
      btn.textContent = 'Sent ✓';
      btn.style.pointerEvents = 'none';
      setTimeout(() => {
        btn.textContent = orig;
        btn.style.pointerEvents = '';
        form.reset();
      }, 2500);
    });
  })();

  // ===== CONTACT ROW ARROW ROTATION =====
  (function contactArrows() {
    document.querySelectorAll('.contact-row').forEach(row => {
      const val = row.querySelector('.contact-value');
      if (!val) return;
      const text = val.textContent;
      if (text.includes('↗')) {
        val.innerHTML = text.replace('↗', '<span class="arrow">↗</span>');
      }
    });
  })();

})();
