/* =========================================================
   Academic CV — main.js
   Interactions: theme toggle, scroll spy, publication filters,
   abstract expand/collapse, scroll reveal, back-to-top.
   ========================================================= */

(function () {
  'use strict';

  /* ---------------- theme ---------------- */
  var root = document.documentElement;

  function applyTheme(theme) {
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  /* the CV opens in the bright light theme by default */
  applyTheme('light');

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
  }

  /* ---------------- click ripple ---------------- */
  var rippleSelector = '.filter, .pub-toggle, .back-top, .lb-close';

  function spawnRipple(el, event) {
    var rect = el.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = size + 'px';
    span.style.left = (event.clientX - rect.left - size / 2) + 'px';
    span.style.top = (event.clientY - rect.top - size / 2) + 'px';
    el.classList.add('ripple-host');
    el.appendChild(span);
    window.setTimeout(function () {
      if (span.parentNode) { span.parentNode.removeChild(span); }
    }, 640);
  }

  document.addEventListener('click', function (e) {
    var host = e.target.closest ? e.target.closest(rippleSelector) : null;
    if (host) { spawnRipple(host, e); }
  });

  /* ---------------- publication filters ---------------- */
  var filters = document.querySelectorAll('.filter');
  var pubs = document.querySelectorAll('#pubList .pub');

  function replayPubAnimation() {
    pubs.forEach(function (pub) {
      if (pub.classList.contains('is-hidden')) { return; }
      pub.classList.remove('is-appear');
      void pub.offsetWidth;
      pub.classList.add('is-appear');
    });
  }

  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-active')) { return; }
      filters.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      var key = btn.getAttribute('data-filter');
      pubs.forEach(function (pub) {
        var tags = (pub.getAttribute('data-tags') || '').split(/\s+/);
        var show = key === 'all' || tags.indexOf(key) !== -1;
        pub.classList.toggle('is-hidden', !show);
      });
      replayPubAnimation();
    });
  });

  /* ---------------- abstract expand ---------------- */
  document.querySelectorAll('.pub-toggle').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.nextElementSibling;
      if (!panel) { return; }
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      var label = btn.firstChild;
      if (label && label.nodeType === 3) {
        label.nodeValue = open ? '收起 ' : '详情 ';
      }
    });
  });

  /* ---------------- architecture lightbox ---------------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var lbClose = document.getElementById('lbClose');

  function openLightbox(src, caption, alt) {
    if (!lightbox || !lbImg || !src) { return; }
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbImg.classList.remove('is-zoomed');
    if (lbCaption) { lbCaption.textContent = caption || ''; }
    lightbox.hidden = false;
    window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) { return; }
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    window.setTimeout(function () {
      lightbox.hidden = true;
      if (lbImg) { lbImg.src = ''; }
    }, 220);
  }

  document.querySelectorAll('.arch-frame').forEach(function (frame) {
    frame.addEventListener('click', function () {
      var img = frame.querySelector('img');
      var fig = frame.closest('.arch');
      if (!img) { return; }
      openLightbox(
        img.getAttribute('src'),
        fig ? fig.getAttribute('data-caption') : '',
        img.getAttribute('alt')
      );
    });
  });

  if (lbClose) { lbClose.addEventListener('click', closeLightbox); }

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) { closeLightbox(); }
    });
  }

  if (lbImg) {
    lbImg.addEventListener('click', function (e) {
      e.stopPropagation();
      lbImg.classList.toggle('is-zoomed');
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) { closeLightbox(); }
  });

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* safety net: if the observer never delivered (broken/blocked IO), never
     leave content stuck at opacity 0 */
  window.setTimeout(function () {
    var revealed = document.querySelectorAll('.reveal.is-in').length;
    if (revealed === 0) {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }, 3000);

  /* ---------------- research paper carousel ---------------- */
  (function initCarousel() {
    var carousel = document.getElementById('paperCarousel');
    if (!carousel) { return; }

    var track = document.getElementById('carouselTrack');
    var slides = track ? track.querySelectorAll('.carousel-slide') : [];
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var dotsWrap = document.getElementById('carouselDots');
    var count = slides.length;
    if (count < 2) { return; }

    var AUTOPLAY_MS = 7000;   /* deliberately unhurried */
    var index = 0;
    var timer = null;
    var dots = [];
    var reduced = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (dotsWrap) {
      for (var i = 0; i < count; i++) {
        (function (n) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'dot';
          dot.setAttribute('aria-label', '第 ' + (n + 1) + ' 篇');
          dot.addEventListener('click', function () { goTo(n); restart(); });
          dotsWrap.appendChild(dot);
          dots.push(dot);
        })(i);
      }
    }

    function render() {
      track.style.transform = 'translateX(' + (-index * 100) + '%)';
      for (var i = 0; i < count; i++) {
        if (dots[i]) { dots[i].classList.toggle('is-active', i === index); }
        slides[i].setAttribute('aria-hidden', i === index ? 'false' : 'true');
      }
    }

    function goTo(n) {
      index = (n % count + count) % count;
      render();
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    var hovering = false;
    var focused = false;
    function held() { return hovering || focused; }

    function stop() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }

    function start() {
      if (reduced || held() || timer) { return; }
      timer = window.setInterval(function () {
        /* stay put while a figure is enlarged */
        var lb = document.getElementById('lightbox');
        if (lb && !lb.hidden) { return; }
        if (document.hidden) { return; }
        next();
      }, AUTOPLAY_MS);
    }

    function restart() { stop(); start(); }

    function inView() {
      var r = carousel.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }

    if (prevBtn) { prevBtn.addEventListener('click', function () { prev(); restart(); }); }
    if (nextBtn) { nextBtn.addEventListener('click', function () { next(); restart(); }); }

    /* hovering (or focusing) the carousel holds the current paper in place */
    carousel.addEventListener('mouseenter', function () { hovering = true; stop(); });
    carousel.addEventListener('mouseleave', function () { hovering = false; start(); });
    carousel.addEventListener('focusin', function () { focused = true; stop(); });
    carousel.addEventListener('focusout', function () { focused = false; start(); });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); } else { start(); }
    });

    document.addEventListener('keydown', function (e) {
      var lb = document.getElementById('lightbox');
      if (lb && !lb.hidden) { return; }
      if (!inView()) { return; }
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      else if (e.key === 'ArrowRight') { next(); restart(); }
    });

    render();
    start();
  })();

  /* ---------------- smooth anchor navigation ----------------
     done in JS rather than via a global `scroll-behavior: smooth`, so that
     native mouse-wheel scrolling keeps its normal, immediate feel */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (!hash || hash === '#') { return; }
      var target = document.querySelector(hash);
      if (!target) { return; }
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', hash);
      }
    });
  });

  /* ---------------- scroll spy ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a'));
  var sections = navLinks
    .map(function (link) { return document.querySelector(link.getAttribute('href')); })
    .filter(Boolean);

  function syncNav() {
    var pos = window.scrollY + 140;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) { current = sec; }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('href') === '#' + current.id);
    });
  }

  /* ---------------- back to top ---------------- */
  var backTop = document.getElementById('backTop');

  function onScroll() {
    if (backTop) {
      backTop.classList.toggle('is-visible', window.scrollY > 420);
    }
    syncNav();
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------- footer year ---------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  onScroll();
})();
