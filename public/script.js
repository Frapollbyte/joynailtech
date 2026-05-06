// ── CONFIG ───────────────────────────────────────
// When running locally: 'http://localhost:3000/api'
// On Render: just '/api' (same domain)
const API_URL = '/api';

// Mobile Navigation
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

if (navLinks) {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (hamburger) hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

// Scroll Animations
const animateElements = document.querySelectorAll('.animate-on-scroll');

const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 100);
      scrollObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

animateElements.forEach(el => scrollObserver.observe(el));

// Booking Modal
const bookingModal = document.getElementById('bookingModal');
const modalClose = document.getElementById('modalClose');
const bookingForm = document.getElementById('bookingForm');
const successState = document.getElementById('successState');
const submitBtn = document.getElementById('submitBtn');
const closeSuccess = document.getElementById('closeSuccess');

function resetForm() {
  if (bookingForm) {
    bookingForm.style.display = 'block';
    bookingForm.reset();
  }
  if (successState) {
    successState.classList.remove('active');
  }
  document.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
}

function openModal(serviceType) {
  if (!bookingModal) return;
  bookingModal.classList.add('active');
  document.body.style.overflow = 'hidden';
  resetForm();

  if (serviceType) {
    const select = document.getElementById('clientService');
    if (select) {
      const options = select.options;
      for (let i = 0; i < options.length; i++) {
        if (options[i].value.startsWith(serviceType)) {
          select.selectedIndex = i;
          break;
        }
      }
    }
  }
}

function closeModal() {
  if (bookingModal) {
    bookingModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

if (modalClose) modalClose.addEventListener('click', closeModal);

if (bookingModal) {
  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal();
  });
}

['navBookBtn', 'heroBookBtn', 'promoBookBtn', 'footerBookBtn'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  }
});

document.querySelectorAll('.book-service').forEach(btn => {
  btn.addEventListener('click', () => openModal(btn.dataset.service));
});

document.querySelectorAll('.service-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(link.dataset.service);
  });
});

if (closeSuccess) closeSuccess.addEventListener('click', closeModal);

// Form Validation
function validateField(groupId, value, validator) {
  const group = document.getElementById(groupId);
  if (!group) return validator(value);
  if (!validator(value)) {
    group.classList.add('error');
    return false;
  } else {
    group.classList.remove('error');
    return true;
  }
}

const clientName = document.getElementById('clientName');
if (clientName) {
  clientName.addEventListener('blur', function() {
    validateField('nameGroup', this.value, v => v.trim().length >= 2);
  });
}

const clientPhone = document.getElementById('clientPhone');
if (clientPhone) {
  clientPhone.addEventListener('blur', function() {
    validateField('phoneGroup', this.value, v => /^[\+]?[-\d\s()]{7,}$/.test(v.trim()));
  });
}

const clientEmail = document.getElementById('clientEmail');
if (clientEmail) {
  clientEmail.addEventListener('blur', function() {
    if (this.value.trim()) {
      validateField('emailGroup', this.value, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()));
    } else {
      const emailGroup = document.getElementById('emailGroup');
      if (emailGroup) emailGroup.classList.remove('error');
    }
  });
}

const dateInput = document.getElementById('clientDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

// Form Submission — saves to database AND opens WhatsApp
if (bookingForm) {
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('clientName').value.trim();
    const phone   = document.getElementById('clientPhone').value.trim();
    const email   = document.getElementById('clientEmail').value.trim();
    const service = document.getElementById('clientService').value;
    const date    = document.getElementById('clientDate').value;
    const time    = document.getElementById('clientTime').value;
    const notes   = document.getElementById('clientNotes').value.trim();

    let isValid = true;
    if (!validateField('nameGroup', name, v => v.length >= 2)) isValid = false;
    if (!validateField('phoneGroup', phone, v => /^[\+]?[-\d\s()]{7,}$/.test(v))) isValid = false;
    if (email && !validateField('emailGroup', email, v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))) isValid = false;
    if (!validateField('serviceGroup', service, v => v !== '')) isValid = false;
    if (!validateField('dateGroup', date, v => v !== '')) isValid = false;
    if (!validateField('timeGroup', time, v => v !== '')) isValid = false;

    if (!isValid) return;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="submit-spinner"></span> Processing...';

    // Save booking to database — admin gets WhatsApp alert via CallMeBot API
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || null, service, date, time, notes: notes || null })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Booking failed');
      }

      // Success — show confirmation
      setTimeout(() => {
        bookingForm.style.display = 'none';
        successState.classList.add('active');
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Confirm Booking`;
      }, 800);

    } catch (err) {
      console.error('Booking error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Confirm Booking`;
      alert('Booking failed. Please try again.');
    }
  });
}

window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.style.boxShadow = window.pageYOffset > 100
    ? '0 5px 30px rgba(0,0,0,0.1)'
    : '0 2px 20px rgba(0,0,0,0.05)';
});

document.addEventListener('keydown', (e) => {
  if (bookingModal && e.key === 'Escape' && bookingModal.classList.contains('active')) {
    closeModal();
  }
});