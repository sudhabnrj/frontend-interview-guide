// UI Interaction Utilities
const UI = {
  init() {
    this.initScrollProgress();
    this.initBackToTop();
    this.initToast();
  },

  // Update top reading progress bar
  initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progressBar.style.width = scrolled + '%';
    });
  },

  // Back to top floating button logic
  initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('show');
      } else {
        btn.classList.remove('show');
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  },

  // Clipboard copying helper
  copyToClipboard(text, successMessage = 'Copied successfully') {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast(successMessage);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed'; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        this.showToast(successMessage);
      } catch (err2) {
        console.error('Fallback copy failed: ', err2);
      }
      document.body.removeChild(textArea);
    });
  },

  // Toast notifications trigger
  initToast() {
    const container = document.createElement('div');
    container.className = 'toast-container-custom';
    container.innerHTML = `
      <div id="customToast" class="toast-custom">
        <i class="fas fa-check-circle me-1 text-success"></i>
        <span id="toastMessage">Copied successfully</span>
      </div>
    `;
    document.body.appendChild(container);
  },

  showToast(message) {
    const toast = document.getElementById('customToast');
    const textSpan = document.getElementById('toastMessage');
    if (!toast || !textSpan) return;

    textSpan.textContent = message;
    toast.classList.add('show');

    // Clear previous timeout if exists
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }

    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  },

  // Expand or collapse all answers
  expandAll() {
    const collapseElements = document.querySelectorAll('.collapse');
    const triggers = document.querySelectorAll('.question-toggle-trigger');
    
    collapseElements.forEach(el => {
      if (!el.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(el, { toggle: false });
        bsCollapse.show();
      }
    });

    triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'true');
    });
  },

  collapseAll() {
    const collapseElements = document.querySelectorAll('.collapse');
    const triggers = document.querySelectorAll('.question-toggle-trigger');
    
    collapseElements.forEach(el => {
      if (el.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(el, { toggle: false });
        bsCollapse.hide();
      }
    });

    triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
    });
  }
};

window.UI = UI;
