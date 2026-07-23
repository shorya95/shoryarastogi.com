// ============================================================
// SHORYA RASTOGI — Portfolio Website JS
// Features: Scroll Reveal, Nav, Tab Filtering, Form
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── NAV SCROLL EFFECT ──────────────────────────────────────
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });

  // ── MOBILE MENU ────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a') : [];

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ── SCROLL REVEAL ──────────────────────────────────────────
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal, .timeline-item').forEach(el => {
    revealObserver.observe(el);
  });

  // ── PORTFOLIO TAB FILTERING + PAGINATION ──────────────────
  const tabBtns       = document.querySelectorAll('.tab-btn');
  const projectCards  = document.querySelectorAll('.project-card');
  const pagination    = document.getElementById('portfolioPagination');
  const pagesEl       = document.getElementById('paginationPages');
  const prevBtn       = document.getElementById('paginationPrev');
  const nextBtn       = document.getElementById('paginationNext');

  const ITEMS_PER_PAGE = 5; // 1 featured (span-2) + 1 regular on row 1, then 3 on row 2
  let currentFilter    = 'all';
  let currentPage      = 1;

  function getFilteredCards() {
    return [...projectCards].filter(card =>
      currentFilter === 'all' || card.dataset.category === currentFilter
    );
  }

  function renderPage() {
    const filtered   = getFilteredCards();
    const isAll      = currentFilter === 'all';
    const totalPages = isAll ? Math.ceil(filtered.length / ITEMS_PER_PAGE) : 1;

    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    const start = isAll ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
    const end   = isAll ? start + ITEMS_PER_PAGE : filtered.length;

    const pageSlice = filtered.slice(start, end);

    // Clear all page-featured assignments
    projectCards.forEach(card => card.classList.remove('page-featured'));

    // Show/hide + animate
    projectCards.forEach(card => {
      const inFilter = currentFilter === 'all' || card.dataset.category === currentFilter;
      const idx      = filtered.indexOf(card);
      const inPage   = idx >= start && idx < end;
      const visible  = inFilter && inPage;

      card.classList.toggle('hidden', !visible);

      if (visible) {
        const pageIdx = pageSlice.indexOf(card);
        card.style.animationDelay = `${pageIdx * 0.06}s`;
        card.style.animation = 'none';
        card.offsetHeight;
        card.style.animation = 'fadeInUp 0.45s ease forwards';
      }
    });

    // First card on every "all" page gets full-width featured treatment
    if (isAll && pageSlice.length > 0) {
      pageSlice[0].classList.add('page-featured');
    }

    // Pagination controls
    if (pagination) {
      pagination.style.display = (isAll && totalPages > 1) ? 'flex' : 'none';
    }

    if (pagesEl) {
      pagesEl.innerHTML = '';
      for (let p = 1; p <= totalPages; p++) {
        const dot = document.createElement('button');
        dot.className = 'pagination-dot' + (p === currentPage ? ' active' : '');
        dot.setAttribute('aria-label', `Page ${p}`);
        dot.textContent = p;
        dot.addEventListener('click', () => {
          currentPage = p;
          renderPage();
          document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        pagesEl.appendChild(dot);
      }
    }

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      currentPage   = 1;
      renderPage();
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    currentPage--;
    renderPage();
    document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    currentPage++;
    renderPage();
    document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  renderPage();



  // ── CONTACT FORM ───────────────────────────────────────────
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.btn-submit');
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      // Simulate send (replace with real backend/Formspree)
      setTimeout(() => {
        form.style.display = 'none';
        if (formSuccess) {
          formSuccess.classList.add('visible');
        }
      }, 1200);
    });
  }

  // ── SMOOTH ANCHOR SCROLL ───────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── HERO TYPING ANIMATION ──────────────────────────────────
  const heroSubtext = document.getElementById('heroSubtext');
  if (heroSubtext) {
    const phrases = [
      'SaaS Products',
      'Shopify Stores',
      'AI Experiences',
      'Digital Products',
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function type() {
      const current = phrases[phraseIndex];

      if (!isDeleting) {
        heroSubtext.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          isDeleting = true;
          setTimeout(type, 1800);
          return;
        }
      } else {
        heroSubtext.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
        }
      }
      setTimeout(type, isDeleting ? 60 : 90);
    }
    setTimeout(type, 1000);
  }

  // ── EXPERIENCE TIMELINE DIAL ─────────────────────────────
  const expSlides = document.querySelectorAll('.exp-slide');
  const dialItems = document.querySelectorAll('.dial-item');
  const dialPrev = document.getElementById('dialPrev');
  const dialNext = document.getElementById('dialNext');
  
  if (expSlides.length > 0 && dialItems.length > 0) {
    let currentExpIndex = 0;

    function goToSlide(index) {
      if (index < 0 || index >= expSlides.length) return;
      currentExpIndex = index;

      // Update Slides
      expSlides.forEach((slide, i) => {
        if (i === currentExpIndex) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });

      // Update Dial
      dialItems.forEach((item, i) => {
        if (i === currentExpIndex) {
          item.classList.add('active');
          item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          item.classList.remove('active');
        }
      });

      // Update Nav Buttons
      if (dialPrev) dialPrev.disabled = currentExpIndex === 0;
      if (dialNext) dialNext.disabled = currentExpIndex === expSlides.length - 1;
    }

    dialItems.forEach((item, index) => {
      item.addEventListener('click', () => goToSlide(index));
    });

    if (dialPrev) {
      dialPrev.addEventListener('click', () => goToSlide(currentExpIndex - 1));
    }
    if (dialNext) {
      dialNext.addEventListener('click', () => goToSlide(currentExpIndex + 1));
    }
  }

});
