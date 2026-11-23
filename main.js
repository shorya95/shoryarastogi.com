// ============================================================
// SHORYA RASTOGI — Portfolio Website JS
// Features: Scroll Reveal, Nav, Tab Filtering, Form
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── CLEAN URL (Remove index.html from URL bar) ─────────────
  if (window.location.pathname.endsWith('/index.html')) {
    const cleanUrl = window.location.origin + window.location.pathname.replace(/\/index\.html$/, '/') + window.location.hash;
    window.history.replaceState(null, '', cleanUrl);
  }

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

  // ── PORTFOLIO FETCHING + RENDERING ────────────────────────
  const portfolioGrid = document.querySelector('.portfolio-grid');
  if (portfolioGrid) {
    fetch('portfolio.json?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        portfolioGrid.innerHTML = ''; // Clear loading state if any
        data.forEach(item => {
          const featuredClass = '';
          
          let linksHtml = '';
          item.links.forEach(link => {
            const secClass = link.isSecondary ? ' secondary' : '';
            linksHtml += `<a href="${link.url}" target="_blank" rel="noopener" class="project-link${secClass}">${link.text}</a>\n`;
          });

          let thumbHtml = '';
          if (item.imageUrl) {
            thumbHtml = `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" decoding="async" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
          } else {
            thumbHtml = `<div class="project-thumb-placeholder">${item.imagePlaceholder}</div>`;
          }

          const slideCount = (item.slides || []).length;
          const badgeHtml = slideCount > 1
            ? `<span class="project-slide-count"><i class="fa-regular fa-images"></i> ${slideCount} slides</span>`
            : '';

          const cardHtml = `
            <div class="project-card ${featuredClass}" data-category="${item.category}" id="card-${item.id}">
              <div class="project-thumb">
                ${thumbHtml}
                ${badgeHtml}
              </div>
              <div class="project-info">
                <div class="project-name">${item.name}</div>
                <div class="project-desc">${item.description}</div>
              </div>
            </div>
          `;
          portfolioGrid.insertAdjacentHTML('beforeend', cardHtml);
        });
        
        window.portfolioData = data;

        // Category counts come from the data; hide categories with no projects
        document.querySelectorAll('.tab-btn').forEach(btn => {
          const f = btn.dataset.filter;
          const n = f === 'all' ? data.length : data.filter(p => p.category === f).length;
          const countEl = btn.querySelector('.tab-count');
          if (countEl) countEl.textContent = n;
          btn.style.display = n === 0 ? 'none' : '';
        });

        initPortfolioLogic();
        initModalLogic();
      })
      .catch(err => console.error('Error loading portfolio:', err));
  }

  function initPortfolioLogic() {
    const tabBtns       = document.querySelectorAll('.tab-btn');
    const projectCards  = document.querySelectorAll('.project-card');
    const pagination    = document.getElementById('portfolioPagination');
    const pagesEl       = document.getElementById('paginationPages');
    const prevBtn       = document.getElementById('paginationPrev');
    const nextBtn       = document.getElementById('paginationNext');

    const ITEMS_PER_PAGE = 4;
    let currentFilter    = 'all';
    let currentPage      = 1;

    function cardMatchesFilter(card) {
      return currentFilter === 'all' || card.dataset.category === currentFilter;
    }

    function getFilteredCards() {
      return [...projectCards].filter(cardMatchesFilter);
    }

    function renderPage() {
      const filtered   = getFilteredCards();
      const isAll      = currentFilter === 'all';
      const totalPages = isAll ? Math.ceil(filtered.length / ITEMS_PER_PAGE) : 1;

      currentPage = Math.min(Math.max(1, currentPage), totalPages);

      const start = isAll ? (currentPage - 1) * ITEMS_PER_PAGE : 0;
      const end   = isAll ? start + ITEMS_PER_PAGE : filtered.length;

      const pageSlice = filtered.slice(start, end);

      projectCards.forEach(card => {
        const inFilter = cardMatchesFilter(card);
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
      // Clean up previous event listeners if initialized multiple times
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');
        currentFilter = newBtn.dataset.filter;
        currentPage   = 1;
        renderPage();
      });
    });

    if (prevBtn) {
      const newPrev = prevBtn.cloneNode(true);
      prevBtn.parentNode.replaceChild(newPrev, prevBtn);
      newPrev.addEventListener('click', () => {
        currentPage--;
        renderPage();
        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    
    if (nextBtn) {
      const newNext = nextBtn.cloneNode(true);
      nextBtn.parentNode.replaceChild(newNext, nextBtn);
      newNext.addEventListener('click', () => {
        currentPage++;
        renderPage();
        document.getElementById('portfolio').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    renderPage();
  }



  // ── CONTACT FORM ───────────────────────────────────────────
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.innerHTML;
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      const firstName = document.getElementById('firstName')?.value || '';
      const lastName = document.getElementById('lastName')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const projectType = document.getElementById('projectType')?.value || '';
      const message = document.getElementById('message')?.value || '';

      const payload = {
        name: `${firstName} ${lastName}`.trim(),
        email: email,
        projectType: projectType,
        message: message,
        _subject: `New Portfolio Inquiry from ${firstName} ${lastName}`,
        _template: 'table'
      };

      try {
        const response = await fetch('https://formsubmit.co/ajax/iam@shoryarastogi.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          form.style.display = 'none';
          if (formSuccess) {
            formSuccess.classList.add('visible');
          }
        } else {
          alert('Something went wrong while sending your message. Please try again.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      } catch (err) {
        console.error('Contact form submission error:', err);
        alert('Could not connect to form service. Please check your internet connection and try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
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

  // ── CASE STUDY MODAL LOGIC ────────────────────────────
  function initModalLogic() {
    const modal = document.getElementById('projectModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (!modal) return;

    const modalBox = document.getElementById('modalBox');
    const modalTopName = document.getElementById('modalTopName');
    const modalTopMeta = document.getElementById('modalTopMeta');
    const csToc = document.getElementById('csToc');
    const csSlides = document.getElementById('csSlides');
    const csNextBtn = document.getElementById('csNextBtn');
    const csNextWrap = document.getElementById('csNextWrap');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalSummary = document.getElementById('modalSummary');
    const modalSkillsSection = document.getElementById('modalSkillsSection');
    const modalSkillsList = document.getElementById('modalSkillsList');
    const modalDetailedContent = document.getElementById('modalDetailedContent');
    const modalLinks = document.getElementById('modalLinks');

    // Attach click listeners to cards
    document.querySelectorAll('.project-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.project-link')) return;

        const cardId = card.id.replace('card-', '');
        const item = (window.portfolioData || []).find(p => p.id === cardId);
        if (item) {
          openModal(item);
        }
      });
    });

    function openModal(item, opts = {}) {
      currentItem = item;

      // Slides: the case study images, stacked in order (falls back to the card image)
      let slides = item.slides && item.slides.length ? item.slides : [];
      if (!slides.length && item.imageUrl) slides = [{ src: item.imageUrl, label: item.name }];
      const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      csSlides.innerHTML = slides.map((s, i) => {
        const size = s.w && s.h ? ` width="${s.w}" height="${s.h}"` : '';
        const loading = i < 2 ? 'eager' : 'lazy';
        return `<figure class="cs-slide" id="cs-slide-${i + 1}"><img src="${s.src}" alt="${esc(item.name)} — ${esc(s.label || '')}"${size} loading="${loading}" decoding="async" /></figure>`;
      }).join('');

      if (slides.length > 2) {
        csToc.innerHTML = '<span class="cs-toc-title">In this case study</span>' +
          slides.map((s, i) => `<button type="button" data-slide="${i + 1}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(s.label || 'Slide ' + (i + 1))}</button>`).join('');
        csToc.style.display = '';
      } else {
        csToc.innerHTML = '';
        csToc.style.display = 'none';
      }

      // Next case study (in portfolio order, wrapping around)
      const all = window.portfolioData || [];
      const idx = all.findIndex(p => p.id === item.id);
      const next = all.length > 1 ? all[(idx + 1) % all.length] : null;
      if (next) {
        csNextBtn.textContent = next.name + ' →';
        csNextBtn.dataset.id = next.id;
        csNextWrap.style.display = '';
      } else {
        csNextWrap.style.display = 'none';
      }

      if (modalBox) modalBox.scrollTop = 0;

      const categoryNames = {
        saas: 'SaaS & AI',
        interior: 'Interior & Decor',
        fashion: 'Fashion & Luxury',
        beauty: 'Wellness & Beauty',
        education: 'Education & EdTech',
        b2b: 'B2B & Enterprise',
        branding: 'Media'
      };
      modalCategory.textContent = categoryNames[item.category] || item.category;
      modalTitle.textContent = item.name;
      modalTopName.textContent = item.name;
      modalTopMeta.textContent = (categoryNames[item.category] || item.category) +
        (slides.length > 1 ? ` · ${slides.length} slides` : '');
      modalSummary.textContent = item.description || '';

      if (item.skills && item.skills.length > 0) {
        modalSkillsList.innerHTML = item.skills.map(s => `<span class="modal-skill-badge">${s}</span>`).join('');
        modalSkillsSection.style.display = 'block';
      } else {
        modalSkillsList.innerHTML = '';
        modalSkillsSection.style.display = 'none';
      }

      if (item.detailedContent && item.detailedContent.trim().length > 0) {
        modalDetailedContent.innerHTML = item.detailedContent;
        modalDetailedContent.style.display = 'block';
      } else {
        modalDetailedContent.innerHTML = '';
        modalDetailedContent.style.display = 'none';
      }

      if (item.links && item.links.length > 0) {
        let linksHtml = '';
        item.links.forEach(link => {
          const btnClass = link.isSecondary ? 'btn btn-outline btn-sm' : 'btn btn-primary btn-sm';
          linksHtml += `<a href="${link.url}" target="_blank" rel="noopener" class="${btnClass}">${link.text}</a>`;
        });
        modalLinks.innerHTML = linksHtml;
        modalLinks.style.display = 'flex';
      } else {
        modalLinks.innerHTML = '';
        modalLinks.style.display = 'none';
      }

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      resetCopyBtn();

      // Give each case study its own shareable URL (e.g. /#allsteps)
      if (opts.updateUrl !== false && window.location.hash !== '#' + item.id) {
        history.pushState({ project: item.id }, '', '#' + item.id);
      }
      document.title = item.name + ' — Shorya Rastogi';

      if (typeof gtag === 'function') {
        gtag('event', 'view_case_study', { project_id: item.id, project_name: item.name });
      }
    }

    function closeModal(opts = {}) {
      if (!modal.classList.contains('open')) return;
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      currentItem = null;
      document.title = defaultTitle;

      if (opts.updateUrl !== false && findProjectFromHash()) {
        history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }

    // ── Deep links: open the case study named in the URL hash ──
    let currentItem = null;
    const defaultTitle = document.title;

    function findProjectFromHash() {
      const slug = decodeURIComponent(window.location.hash.replace(/^#\/?/, '')).toLowerCase();
      if (!slug) return null;
      return (window.portfolioData || []).find(p => p.id.toLowerCase() === slug) || null;
    }

    function syncModalWithUrl() {
      const item = findProjectFromHash();
      if (item) {
        if (!currentItem || currentItem.id !== item.id) openModal(item, { updateUrl: false });
      } else {
        closeModal({ updateUrl: false });
      }
    }

    window.addEventListener('popstate', syncModalWithUrl);
    window.addEventListener('hashchange', syncModalWithUrl);

    // ── Copy link button ──
    const modalCopyLinkBtn = document.getElementById('modalCopyLinkBtn');
    function resetCopyBtn() {
      if (modalCopyLinkBtn) modalCopyLinkBtn.innerHTML = '<i class="fa-solid fa-link"></i> Copy link';
    }
    if (modalCopyLinkBtn) {
      modalCopyLinkBtn.addEventListener('click', async () => {
        if (!currentItem) return;
        const url = window.location.origin + '/#' + currentItem.id;
        try {
          await navigator.clipboard.writeText(url);
        } catch (err) {
          const tmp = document.createElement('textarea');
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          tmp.remove();
        }
        modalCopyLinkBtn.innerHTML = '<i class="fa-solid fa-check"></i> Link copied';
        setTimeout(resetCopyBtn, 2000);
      });
    }

    // Opened from a shared link: put the portfolio behind the popup, then open it
    const initialItem = findProjectFromHash();
    if (initialItem) {
      const portfolioSection = document.getElementById('portfolio');
      if (portfolioSection) portfolioSection.scrollIntoView({ behavior: 'instant', block: 'start' });
      openModal(initialItem, { updateUrl: false });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }
    const modalBackBtn = document.getElementById('modalBackBtn');
    if (modalBackBtn) modalBackBtn.addEventListener('click', closeModal);

    // Section list: scroll inside the viewer (no hash change, so the viewer stays open)
    csToc.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-slide]');
      if (!btn) return;
      const target = document.getElementById('cs-slide-' + btn.dataset.slide);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Highlight the section currently in view
    if ('IntersectionObserver' in window) {
      const tocObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const n = entry.target.id.replace('cs-slide-', '');
          csToc.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.slide === n));
        });
      }, { root: modalBox, rootMargin: '-30% 0px -60% 0px' });
      new MutationObserver(() => {
        tocObserver.disconnect();
        csSlides.querySelectorAll('.cs-slide').forEach(f => tocObserver.observe(f));
      }).observe(csSlides, { childList: true });
    }

    csNextBtn.addEventListener('click', () => {
      const next = (window.portfolioData || []).find(p => p.id === csNextBtn.dataset.id);
      if (next) openModal(next);
    });

    // "Start a project" buttons: close the viewer, go to the contact form
    modal.querySelectorAll('[data-cs-contact]').forEach(btn => {
      btn.addEventListener('click', () => {
        closeModal();
        const contact = document.getElementById('contact');
        if (contact) setTimeout(() => contact.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  // ── ABOUT SECTION AUTO-SLIDER ──
  const aboutSlides = document.querySelectorAll('.about-slide');
  const aboutDots   = document.querySelectorAll('.about-slider-dots .dot');
  if (aboutSlides.length > 0) {
    let currentIdx = 0;
    let slideTimer = null;

    function goToSlide(idx) {
      aboutSlides.forEach((slide, i) => {
        slide.classList.toggle('active', i === idx);
      });
      aboutDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
      });
      currentIdx = idx;
    }

    function advanceSlide() {
      const nextIdx = (currentIdx + 1) % aboutSlides.length;
      goToSlide(nextIdx);
    }

    function startSlider() {
      slideTimer = setInterval(advanceSlide, 4000);
    }

    aboutDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        clearInterval(slideTimer);
        goToSlide(idx);
        startSlider();
      });
    });

    startSlider();
  }

});
