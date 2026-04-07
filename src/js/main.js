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

  // --- Contact form ---
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(contactForm);
      const subject = formData.get('subject');
      const name = formData.get('name');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const message = formData.get('message');

      // Build WhatsApp message as fallback
      const whatsappText = encodeURIComponent(
        'Contato via site - ' + subject + '\n\n' +
        'Nome: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Telefone: ' + phone + '\n' +
        'Mensagem: ' + message
      );

      const whatsappNumber = document.body.getAttribute('data-whatsapp') || '558521816818';
      window.open('https://api.whatsapp.com/send?phone=' + whatsappNumber + '&text=' + whatsappText, '_blank');

      contactForm.reset();
      alert('Mensagem enviada via WhatsApp! Obrigado pelo contato.');
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

  document.querySelectorAll('.service-card, .doctor-card, .blog-card, .contact-info-item').forEach(function (el) {
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
