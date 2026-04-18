/* =============================================
   PORTFOLIO — script.js
   ============================================= */

'use strict';

// ─── 1. LOADER ──────────────────────────────
const loader = document.getElementById('loader');
window.addEventListener('load', () => {
  setTimeout(() => loader.classList.add('hidden'), 900);
});

// ─── 2. CUSTOM CURSOR ───────────────────────
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursorTrail');

let mx = 0,
  my = 0;
let tx = 0,
  ty = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animateTrail() {
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  cursorTrail.style.left = tx + 'px';
  cursorTrail.style.top = ty + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();

// Cursor grow on interactive elements
document
  .querySelectorAll(
    'a, button, .project-card, .skill-card, .filter-btn, .tl-prev, .tl-next',
  )
  .forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2.4)';
      cursor.style.background = 'var(--accent2)';
      cursorTrail.style.transform = 'translate(-50%,-50%) scale(1.5)';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      cursor.style.background = 'var(--accent)';
      cursorTrail.style.transform = 'translate(-50%,-50%) scale(1)';
    });
  });

// ─── 3. NAV SCROLL ──────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

// ─── 4. MOBILE MENU ─────────────────────────
const navBurger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('mobileMenu');

navBurger.addEventListener('click', () => {
  navBurger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => {
    navBurger.classList.remove('open');
    mobileMenu.classList.remove('open');
  });
});

// ─── 5. PARTICLE CANVAS ─────────────────────
(function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function () {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.r = Math.random() * 1.8 + 0.3;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.a = Math.random() * 0.5 + 0.2;
  };
  Particle.prototype.update = function () {
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  };

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  const COLORS = ['110,231,247', '167,139,250', '52,211,153'];

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p, i) => {
      p.update();
      const c = COLORS[i % 3];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${c},${p.a})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(110,231,247,${0.07 * (1 - d / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ─── 6. TYPED EFFECT ────────────────────────
(function initTyped() {
  const el = document.getElementById('typed');
  const words = [
    'code & aesthetics.',
    'logic & elegance.',
    'design & performance.',
    'art & engineering.',
  ];
  let wi = 0,
    ci = 0,
    deleting = false;

  function type() {
    const word = words[wi];
    const current = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
    el.textContent = current;

    let delay = deleting ? 60 : 110;
    if (!deleting && ci > word.length) {
      deleting = true;
      delay = 1800;
    }
    if (deleting && ci < 0) {
      deleting = false;
      wi = (wi + 1) % words.length;
      ci = 0;
      delay = 400;
    }
    setTimeout(type, delay);
  }
  type();
})();

// ─── 7. COUNTER ANIMATION ───────────────────
function animateCounter(el, target) {
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current;
  }, 40);
}

// ─── 8. INTERSECTION OBSERVER (AOS + SKILLS + COUNTER) ───
const aosCandidates = document.querySelectorAll('[data-aos]');
const skillBars = document.querySelectorAll('.bar-fill');
const timelineItems = document.querySelectorAll('.timeline-item');
const counters = document.querySelectorAll('.stat-num');

let countersStarted = false;
let skillsStarted = false;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.15 },
);

aosCandidates.forEach((el) => observer.observe(el));
timelineItems.forEach((el) => observer.observe(el));

// Skills observer
const skillsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !skillsStarted) {
        skillsStarted = true;
        skillBars.forEach((bar) => {
          const w = bar.getAttribute('data-w');
          bar.style.width = w + '%';
        });
      }
    });
  },
  { threshold: 0.3 },
);

const skillsSection = document.querySelector('.skills');
if (skillsSection) skillsObserver.observe(skillsSection);

// Counter observer
const heroSection = document.querySelector('.hero');
const heroObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        counters.forEach((el) => {
          animateCounter(el, parseInt(el.getAttribute('data-target')));
        });
      }
    });
  },
  { threshold: 0.4 },
);

if (heroSection) heroObserver.observe(heroSection);

// ─── 9. PROJECT FILTER ──────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    projectCards.forEach((card) => {
      const cat = card.getAttribute('data-category');
      if (filter === 'all' || cat === filter) {
        card.classList.remove('hidden');
        card.style.animation = 'fadeIn 0.4s ease';
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

// ─── 10. TESTIMONIALS SLIDER ────────────────
const testimonialCards = document.querySelectorAll('.testimonial-card');
const tlDots = document.querySelectorAll('.tl-dot');
const tlPrev = document.getElementById('tlPrev');
const tlNext = document.getElementById('tlNext');
let tlIndex = 0;

function showTestimonial(i) {
  testimonialCards.forEach((c, idx) => c.classList.toggle('active', idx === i));
  tlDots.forEach((d, idx) => d.classList.toggle('active', idx === i));
}

tlNext.addEventListener('click', () => {
  tlIndex = (tlIndex + 1) % testimonialCards.length;
  showTestimonial(tlIndex);
});
tlPrev.addEventListener('click', () => {
  tlIndex = (tlIndex - 1 + testimonialCards.length) % testimonialCards.length;
  showTestimonial(tlIndex);
});
tlDots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    tlIndex = i;
    showTestimonial(i);
  });
});

// Auto rotate
setInterval(() => {
  tlIndex = (tlIndex + 1) % testimonialCards.length;
  showTestimonial(tlIndex);
}, 5000);

// ─── 11. CONTACT FORM ───────────────────────
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const submitText = document.querySelector('.submit-text');
const submitLoad = document.querySelector('.submit-loading');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  submitText.style.display = 'none';
  submitLoad.style.display = 'inline';

  setTimeout(() => {
    submitText.style.display = 'inline';
    submitLoad.style.display = 'none';
    formSuccess.style.display = 'block';
    contactForm.reset();
    setTimeout(() => (formSuccess.style.display = 'none'), 4000);
  }, 1500);
});

// ─── 12. BACK TO TOP ────────────────────────
const backTop = document.getElementById('backTop');
window.addEventListener('scroll', () => {
  backTop.classList.toggle('visible', window.scrollY > 500);
});
backTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── 13. THEME TOGGLE ───────────────────────
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeIcon.textContent = document.body.classList.contains('light-mode')
    ? '🌙'
    : '☀';
});

// ─── 14. SMOOTH ANCHOR SCROLL ───────────────
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── 15. PARALLAX ORBS ON MOUSE MOVE ────────
const orbs = document.querySelectorAll('.orb');
document.addEventListener('mousemove', (e) => {
  const xP = (e.clientX / window.innerWidth - 0.5) * 2;
  const yP = (e.clientY / window.innerHeight - 0.5) * 2;
  orbs.forEach((orb, i) => {
    const depth = (i + 1) * 12;
    orb.style.transform = `translate(${xP * depth}px, ${yP * depth}px)`;
  });
});

// ─── 16. GLOWING CARD HOVER GLOW FOLLOW ─────
document.querySelectorAll('.project-card, .skill-card').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

// ─── 17. NAV ACTIVE LINK HIGHLIGHT ──────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

function highlightNav() {
  const scrollY = window.scrollY + 80;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach((link) => {
        link.style.color =
          link.getAttribute('href') === '#' + id ? 'var(--accent)' : '';
      });
    }
  });
}
window.addEventListener('scroll', highlightNav);

// ─── 18. PAGE ENTRY ANIMATION STAGGER ───────
(function staggerEntry() {
  const delay = 0.1;
  document.querySelectorAll('.nav-link').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-12px)';
    el.style.transition = `opacity 0.4s ${0.6 + i * delay}s ease, transform 0.4s ${0.6 + i * delay}s ease`;
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 50);
  });
})();

// ─── 19. GLOW FOLLOW SKILL CARDS ────────────
document.querySelectorAll('.skill-card').forEach((card) => {
  const glow = document.createElement('div');
  glow.style.cssText = `
    position:absolute;inset:0;border-radius:inherit;pointer-events:none;
    background:radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(110,231,247,0.08), transparent 55%);
    transition:opacity 0.3s;opacity:0;
  `;
  card.style.position = 'relative';
  card.appendChild(glow);

  card.addEventListener('mouseenter', () => (glow.style.opacity = '1'));
  card.addEventListener('mouseleave', () => (glow.style.opacity = '0'));
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty(
      '--mx',
      ((e.clientX - r.left) / r.width) * 100 + '%',
    );
    card.style.setProperty(
      '--my',
      ((e.clientY - r.top) / r.height) * 100 + '%',
    );
  });
});

// ─── 20. MAGNETIC BUTTON EFFECT ─────────────
document.querySelectorAll('.btn-primary, .nav-cta').forEach((btn) => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px) translateY(-2px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

console.log(
  '%c🚀 Portfolio loaded!',
  'color:#6ee7f7;font-weight:bold;font-size:16px;',
);
