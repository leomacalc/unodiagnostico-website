/* ============================================
   UNO DIAGNÓSTICO - Main JavaScript
   AI-Managed Static Site
   ============================================ */

document.addEventListener('DOMContentLoaded', function () {

  // --- Mobile Menu Toggle ---
  var mobileToggle = document.querySelector('.mobile-toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', function () {
      mobileNav.classList.toggle('active');
      mobileToggle.classList.toggle('active');
    });

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
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var headerOffset = 80;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Service Modal ---
  var serviceCards = document.querySelectorAll('.service-card[data-service]');
  var modalOverlay = document.getElementById('service-modal');
  var modalClose = document.querySelector('.modal-close');

  if (serviceCards.length && modalOverlay) {
    serviceCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var serviceId = this.getAttribute('data-service');
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
    var modalTitle = document.getElementById('modal-title');
    var modalDescription = document.getElementById('modal-description');
    var modalPreparations = document.getElementById('modal-preparations');

    var card = document.querySelector('[data-service="' + serviceId + '"]');
    if (!card) return;

    var title = card.getAttribute('data-title');
    var description = card.getAttribute('data-description');
    var preparations = JSON.parse(card.getAttribute('data-preparations') || '[]');

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
  var header = document.querySelector('.header');
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

  // --- Blog Modal ---
  var blogModal = document.getElementById('blog-modal');
  var blogModalClose = document.querySelector('.blog-modal-close');
  var blogLinks = document.querySelectorAll('.blog-link[data-blog]');

  if (blogLinks.length && blogModal) {
    blogLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var blogId = this.getAttribute('data-blog');
        showBlogModal(blogId);
      });
    });

    blogModalClose.addEventListener('click', closeBlogModal);
    blogModal.addEventListener('click', function (e) {
      if (e.target === blogModal) closeBlogModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && blogModal.classList.contains('active')) closeBlogModal();
    });
  }

  function showBlogModal(blogId) {
    var card = document.querySelector('[data-blog-id="' + blogId + '"]');
    if (!card) return;

    var title = card.querySelector('h3').textContent;
    var date = card.querySelector('.blog-date').textContent;
    var fullContent = card.querySelector('.blog-full-content');
    var image = card.querySelector('.blog-image img');

    document.getElementById('blog-modal-title').textContent = title;
    document.getElementById('blog-modal-date').textContent = date;
    document.getElementById('blog-modal-content').innerHTML = fullContent ? fullContent.innerHTML : '';

    var modalImage = document.getElementById('blog-modal-image');
    if (image) {
      modalImage.innerHTML = '<img src="' + image.src + '" alt="' + title + '">';
      modalImage.style.display = '';
    } else {
      modalImage.style.display = 'none';
    }

    blogModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeBlogModal() {
    blogModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // --- FAQ Accordion ---
  var faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function (question) {
    question.addEventListener('click', function () {
      var faqItem = this.parentElement;
      var wasOpen = faqItem.classList.contains('open');

      // Close all other items
      document.querySelectorAll('.faq-item.open').forEach(function (item) {
        item.classList.remove('open');
      });

      // Toggle clicked item
      if (!wasOpen) {
        faqItem.classList.add('open');
      }
    });
  });

  // --- Blog date formatting ---
  document.querySelectorAll('[data-date]').forEach(function (el) {
    var dateStr = el.getAttribute('data-date');
    if (dateStr) {
      var date = new Date(dateStr + 'T12:00:00');
      var options = { day: 'numeric', month: 'long', year: 'numeric' };
      el.textContent = date.toLocaleDateString('pt-BR', options);
    }
  });

  // --- Intersection Observer for animations ---
  var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.service-card, .doctor-card, .blog-card, .payment-card, .trust-item, .faq-item').forEach(function (el) {
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

