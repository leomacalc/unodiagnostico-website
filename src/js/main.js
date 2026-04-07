/* ============================================
   UNO DIAGNÓSTICO - Main JavaScript
   AI-Managed Static Site
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Mobile Menu Toggle ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
      mobileToggle.classList.toggle('active');
    });

    // Close mobile nav on link click
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('active');
        mobileToggle.classList.remove('active');
      });
    });
  }

  // --- Smooth Scroll for anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Service Modal ---
  const serviceCards = document.querySelectorAll('.service-card[data-service]');
  const modalOverlay = document.getElementById('service-modal');
  const modalClose = document.querySelector('.modal-close');

  if (serviceCards.length && modalOverlay) {
    serviceCards.forEach(function (card) {
      card.addEventListener('click', function () {
        const serviceId = this.getAttribute('data-service');
        showServiceModal(serviceId);
      });
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  function showServiceModal(serviceId) {
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalPreparations = document.getElementById('modal-preparations');

    // Data is embedded in the HTML as data attributes on cards
    const card = document.querySelector('[data-service="' + serviceId + '"]');
    if (!card) return;

    const title = card.getAttribute('data-title');
    const description = card.getAttribute('data-description');
    const preparations = JSON.parse(card.getAttribute('data-preparations') || '[]');

    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalPreparations.innerHTML = preparations
      .map(function (p) { return '<li>' + p + '</li>'; })
      .join('');

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // --- Header scroll effect ---
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- Hero Carousel ---
  var heroSlides = document.querySelectorAll('.hero-slide');
  var heroDots = document.querySelectorAll('.hero-dot');
  var currentSlide = 0;
  var slideInterval = null;

  function showSlide(index) {
    heroSlides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === index);
    });
    heroDots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === index);
    });
    currentSlide = index;
  }

  function nextSlide() {
    showSlide((currentSlide + 1) % heroSlides.length);
  }

  if (heroSlides.length > 1) {
    slideInterval = setInterval(nextSlide, 5000);

    heroDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var slideIndex = parseInt(this.getAttribute('data-slide'));
        showSlide(slideIndex);
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, 5000);
      });
    });
  }

  // --- Blog date formatting ---
  document.querySelectorAll('[data-date]').forEach(function (el) {
    const dateStr = el.getAttribute('data-date');
    if (dateStr) {
      const date = new Date(dateStr + 'T12:00:00');
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      el.textContent = date.toLocaleDateString('pt-BR', options);
    }
  });

  // --- Intersection Observer for animations ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.service-card, .doctor-card, .blog-card').forEach(function (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Add animation class styles
  var style = document.createElement('style');
  style.textContent = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
});
