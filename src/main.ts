import './styles.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import ResumeSwapButton from '@/components/ui/resume-swap-button';
import { AnimatedThemeToggle } from '@/components/ui/animated-theme-toggle';
import AvailabilityBadge from '@/components/ui/availability-badge';
import InteractiveDotGrid from '@/components/ui/interactive-dot-grid';
import InteractiveRowList from '@/components/ui/interactive-row-list';
import { HoverImagePreview } from '@/lib/hover-image-preview';
import { initEditorialSignature } from '@/lib/editorial-signature';
import { initNameScrambleElements } from '@/lib/scramble-text';
import { siteConfig } from '@/data/portfolio';

// 1. Enforce manual scroll restoration early so refresh / reload ALWAYS starts at top
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
const isPageReload = navEntries.length > 0 && navEntries[0].type === 'reload';

// Immediately reset to top on reload or initial visit without anchor
if (isPageReload || !window.location.hash || window.location.hash === '#top') {
  if (isPageReload && window.location.hash) {
    try {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch {}
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
}

// Ensure pageshow event (bfcache, reloads) also guarantees top position
window.addEventListener('pageshow', (event) => {
  if (event.persisted || isPageReload || !window.location.hash || window.location.hash === '#top') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }
});

// Mark document as ready on next frame to safely enable smooth scroll transitions
window.requestAnimationFrame(() => {
  document.documentElement.classList.add('is-ready');
});

// Initialize global cursor-tracking image preview popover
new HoverImagePreview({
  triggerSelector: '[data-preview-src]',
  offsetX: 24,
  offsetY: 24,
  lerpFactor: 0.14,
});

// Mount Interactive Dot Grid Background
const dotGridMount = document.getElementById('interactive-dot-grid-root');
if (dotGridMount) {
  ReactDOM.createRoot(dotGridMount).render(React.createElement(InteractiveDotGrid));
}

// Initial theme check to avoid flash
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Mount React Theme Toggle in the header
const themeToggleMount = document.getElementById('theme-toggle-root');
if (themeToggleMount) {
  ReactDOM.createRoot(themeToggleMount).render(React.createElement(AnimatedThemeToggle));
}

// Mount React Availability Badge with Animated Border in the header
const availMount = document.getElementById('availability-badge-root');
if (availMount) {
  const staticBadge = availMount.nextElementSibling as HTMLElement | null;
  if (staticBadge?.classList.contains('static-availability')) {
    staticBadge.style.display = 'none';
  }
  ReactDOM.createRoot(availMount).render(React.createElement(AvailabilityBadge));
}

// Mount React Resume Swap Button in the About section
const reactMount = document.getElementById('resume-button-react');
if (reactMount) {
  const fallback = reactMount.nextElementSibling as HTMLElement | null;
  if (fallback?.classList.contains('resume-btn')) {
    fallback.style.display = 'none';
  }
  ReactDOM.createRoot(reactMount).render(React.createElement(ResumeSwapButton));
}

// Mount React Interactive Row List in Skills / Capabilities section
const skillsMount = document.getElementById('interactive-row-list-root');
if (skillsMount) {
  const fallback = skillsMount.nextElementSibling as HTMLElement | null;
  if (fallback?.classList.contains('fallback-skills')) {
    fallback.style.display = 'none';
  }
  ReactDOM.createRoot(skillsMount).render(React.createElement(InteractiveRowList));
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Section reveal observer
const revealItems = document.querySelectorAll<HTMLElement>('.section-reveal');
if (reduceMotion) {
  revealItems.forEach((item) => item.classList.add('in-view'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
  );
  revealItems.forEach((item) => observer.observe(item));
}

// Copy email interaction with accessible feedback
const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-email]');
if (copyButton) {
  copyButton.addEventListener('click', async () => {
    const email = copyButton.dataset.copyEmail ?? siteConfig.owner.email;
    const label = copyButton.querySelector<HTMLElement>('.copy-text');
    try {
      await navigator.clipboard.writeText(email);
      if (label) label.textContent = 'COPIED ✓';
      window.setTimeout(() => {
        if (label) label.textContent = 'COPY EMAIL';
      }, 1800);
    } catch {
      window.location.href = `mailto:${email}`;
    }
  });
}

// Floating back-to-top control
const backToTopBtn = document.getElementById('back-to-top') as HTMLButtonElement | null;
if (backToTopBtn) {
  let isVisible = false;
  const toggleBackToTop = () => {
    const shouldBeVisible = window.scrollY > 380;
    if (shouldBeVisible !== isVisible) {
      isVisible = shouldBeVisible;
      backToTopBtn.classList.toggle('is-visible', isVisible);
      backToTopBtn.tabIndex = isVisible ? 0 : -1;
    }
  };

  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  });
}

// Subtle pointer-relative preview displacement on fine pointers
if (!reduceMotion && isFinePointer) {
  const projectRows = document.querySelectorAll<HTMLElement>('.project-row');
  projectRows.forEach((row) => {
    row.addEventListener('pointermove', (event) => {
      if (window.innerWidth < 901) return;
      const rect = row.getBoundingClientRect();
      const visual = row.querySelector<HTMLElement>('.project-visual');
      if (!visual) return;
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 6;
      visual.style.transform = `translateY(-50%) translate(${x}px, ${y}px) scale(1)`;
    });

    row.addEventListener('pointerleave', () => {
      const visual = row.querySelector<HTMLElement>('.project-visual');
      if (visual) {
        visual.style.transform = '';
      }
    });
  });
}

// ==========================================================================
// Project Case Study Modal System (Accessible Dialog Pattern)
// ==========================================================================
const projectModal = document.getElementById('project-modal') as HTMLDialogElement | null;
const modalCloseBtn = document.getElementById('modal-close');
const modalContactLink = document.getElementById('modal-contact-link');
let lastFocusedElement: HTMLElement | null = null;

const openProjectModal = (projectId: string) => {
  const data = siteConfig.projects[projectId];
  if (!data || !projectModal) return;

  lastFocusedElement = document.activeElement as HTMLElement | null;

  const numEl = document.getElementById('modal-number');
  const catEl = document.getElementById('modal-category');
  const titleEl = document.getElementById('modal-title');
  const subEl = document.getElementById('modal-subtitle');
  const overEl = document.getElementById('modal-overview');
  const highEl = document.getElementById('modal-highlights');
  const stackEl = document.getElementById('modal-stack');
  const ghEl = document.getElementById('modal-github') as HTMLAnchorElement | null;

  if (numEl) numEl.textContent = data.number;
  if (catEl) catEl.textContent = data.category;
  if (titleEl) titleEl.textContent = data.title;
  if (subEl) subEl.textContent = data.subtitle;

  if (overEl) {
    overEl.innerHTML = '';
    const paragraphs = data.overview.split('\n\n').filter(Boolean);
    paragraphs.forEach((pText) => {
      const p = document.createElement('p');
      p.className = 'modal-desc-para';
      p.textContent = pText.trim();
      overEl.appendChild(p);
    });
  }

  if (highEl) {
    highEl.innerHTML = '';
    data.highlights.forEach((item) => {
      const li = document.createElement('li');
      li.className = 'modal-highlight-item';

      const bullet = document.createElement('span');
      bullet.className = 'modal-highlight-bullet';
      bullet.setAttribute('aria-hidden', 'true');

      const text = document.createElement('p');
      text.className = 'modal-highlight-text';

      const colonIdx = item.indexOf(':');
      if (colonIdx > 0 && colonIdx < 35) {
        const prefix = item.substring(0, colonIdx + 1);
        const remainder = item.substring(colonIdx + 1);
        const strong = document.createElement('strong');
        strong.textContent = prefix;
        text.appendChild(strong);
        text.appendChild(document.createTextNode(remainder));
      } else {
        text.textContent = item;
      }

      li.appendChild(bullet);
      li.appendChild(text);
      highEl.appendChild(li);
    });
  }

  if (stackEl) {
    stackEl.innerHTML = '';
    data.stack.forEach((tech) => {
      const span = document.createElement('span');
      span.className = 'stack-pill';
      span.textContent = tech;
      stackEl.appendChild(span);
    });
  }

  if (ghEl) {
    ghEl.href = data.github;
    const labelSpan = ghEl.querySelector('span');
    const buttonText = data.isDirectRepo ? 'View GitHub Repository' : 'GitHub Profile';
    if (labelSpan) {
      labelSpan.textContent = buttonText;
    } else {
      ghEl.textContent = buttonText;
    }
    ghEl.setAttribute(
      'aria-label',
      data.isDirectRepo
        ? `View ${data.title} repository on GitHub (opens in new tab)`
        : `View Santanu Dey GitHub Profile (opens in new tab)`
    );
  }

  // Lock background scroll and show modal
  document.body.style.overflow = 'hidden';
  projectModal.showModal();
  modalCloseBtn?.focus();
};

const closeProjectModal = () => {
  document.body.style.overflow = '';
  if (projectModal?.open) {
    projectModal.close();
  }
};

projectModal?.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
});

// Modal trigger binding: trigger on buttons marked as modal triggers or primary case study CTAs
document.querySelectorAll<HTMLElement>('.card-modal-trigger, button.card-cta-primary[data-project-id]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = btn.dataset.projectId;
    if (id) openProjectModal(id);
  });
});

// Architectural Details Tabbed Module (Railway Reservation System)
const archModules = document.querySelectorAll<HTMLElement>('[data-arch-module]');
archModules.forEach((module) => {
  const tabs = module.querySelectorAll<HTMLButtonElement>('.arch-tab-btn');
  const panels = module.querySelectorAll<HTMLElement>('.arch-tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = tab.dataset.tabTarget;
      if (!targetId) return;

      tabs.forEach((t) => {
        const isCurrent = t === tab;
        t.classList.toggle('active', isCurrent);
        t.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });

      panels.forEach((panel) => {
        const isMatch = panel.id === `panel-${targetId}`;
        panel.classList.toggle('active', isMatch);
        if (isMatch) {
          panel.removeAttribute('hidden');
        } else {
          panel.setAttribute('hidden', '');
        }
      });
    });
  });
});

modalCloseBtn?.addEventListener('click', closeProjectModal);
modalContactLink?.addEventListener('click', closeProjectModal);

// Close on backdrop click
projectModal?.addEventListener('click', (event) => {
  const rect = projectModal.getBoundingClientRect();
  const isInDialog = (
    rect.top <= event.clientY &&
    event.clientY <= rect.top + rect.height &&
    rect.left <= event.clientX &&
    event.clientX <= rect.left + rect.width
  );
  if (!isInDialog) {
    closeProjectModal();
  }
});

// Initialize Editorial Signature & Dynamic Footer Controller
initEditorialSignature();

// Initialize Subtle, Restrained Name Scramble Reveal on explicitly designated name elements
const nameScramblers = initNameScrambleElements('[data-scramble-name]');

// Enable interactive scramble on hover over brand pill (Santanu Dey)
const brandPill = document.querySelector<HTMLElement>('.brand-pill');
const brandScrambler = nameScramblers.find((s) => s.getElement().classList.contains('brand-name'));
if (brandPill && brandScrambler && !reduceMotion) {
  brandPill.addEventListener('mouseenter', () => {
    brandScrambler.play();
  });
}

// Handle legitimate deep anchor navigation only if NOT a reload
if (!isPageReload && window.location.hash && window.location.hash !== '#top') {
  const targetId = window.location.hash.substring(1);
  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    window.requestAnimationFrame(() => {
      targetEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
}
