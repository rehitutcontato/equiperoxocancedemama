/**
 * ROSA EM ALERTA — MAIN APPLICATION SCRIPT
 * Animações editoriais, navegação suave e contadores dinâmicos
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initStatsCounters();
  initSmoothScroll();
});

// NAVEGAÇÃO & MENU MOBILE
function initNavigation() {
  const header = document.querySelector('.site-header');
  const toggleBtn = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.header-nav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Efeito de scroll na navbar
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Toggle do menu mobile
  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const isOpen = navMenu.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen);
    });

    // Fechar ao clicar em qualquer link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target) && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
      }
    });
  }
}

// ROLAGEM SUAVE
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ANIMAÇÃO DE CONTADORES NUMÉRICOS (INCA)
function initStatsCounters() {
  const statElements = document.querySelectorAll('.stat-number[data-target]');
  if (!statElements.length) return;

  const observerOptions = {
    threshold: 0.4
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  statElements.forEach(el => observer.observe(el));
}

function animateCounter(element) {
  const target = parseFloat(element.getAttribute('data-target'));
  const isFloat = element.getAttribute('data-float') === 'true';
  const prefix = element.getAttribute('data-prefix') || '';
  const suffix = element.getAttribute('data-suffix') || '';
  const duration = 1800; // 1.8s
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Easing suave cubic-out
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const currentVal = target * easeProgress;

    if (isFloat) {
      element.textContent = `${prefix}${currentVal.toFixed(2).replace('.', ',')}${suffix}`;
    } else {
      element.textContent = `${prefix}${Math.floor(currentVal).toLocaleString('pt-BR')}${suffix}`;
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      if (isFloat) {
        element.textContent = `${prefix}${target.toFixed(2).replace('.', ',')}${suffix}`;
      } else {
        element.textContent = `${prefix}${target.toLocaleString('pt-BR')}${suffix}`;
      }
    }
  }

  requestAnimationFrame(update);
}
