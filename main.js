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
            thumbHtml = `<img src="${item.imageUrl}" alt="${item.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; display: block;" />`;
          } else {
            thumbHtml = `<div class="project-thumb-placeholder">${item.imagePlaceholder}</div>`;
          }

          const cardHtml = `
            <div class="project-card ${featuredClass}" data-category="${item.category}" id="card-${item.id}">
              <div class="project-thumb">
                ${thumbHtml}
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
        const response = await fetch('https://formsubmit.co/ajax/shorya95@gmail.com', {
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

    const modalHeroContainer = document.getElementById('modalHeroContainer');
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

    function openModal(item) {
      if (item.imageUrl) {
        modalHeroContainer.innerHTML = `<img src="${item.imageUrl}" alt="${item.name}" class="modal-hero-img" />`;
      } else {
        modalHeroContainer.innerHTML = `<div class="modal-hero-placeholder">${item.imagePlaceholder || item.name}</div>`;
      }

      const categoryNames = {
        saas: 'SaaS & AI',
        interior: 'Interior & Decor',
        fashion: 'Fashion & Luxury',
        beauty: 'Wellness & Beauty',
        education: 'Education & EdTech',
        b2b: 'B2B & Enterprise',
        impact: 'Health & Impact',
        branding: 'Branding & Media'
      };
      modalCategory.textContent = categoryNames[item.category] || item.category;
      modalTitle.textContent = item.name;
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
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

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

});
