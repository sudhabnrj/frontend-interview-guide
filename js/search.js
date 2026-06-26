// Search and Filtering Logic
const Search = {
  init() {
    this.searchInput = document.getElementById('searchInput');
    this.questionsContainer = document.getElementById('questionsContainer');
    
    if (!this.searchInput) return;

    // Listen to input change
    this.searchInput.addEventListener('input', () => {
      this.performSearch(this.searchInput.value.trim());
    });

    // Keyboard shortcut Ctrl + F to focus search input
    window.addEventListener('keydown', (e) => {
      // Check if Ctrl+F (or Cmd+F for Mac) is pressed
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
    });
  },

  performSearch(query) {
    const cards = document.querySelectorAll('.question-card');
    const sections = document.querySelectorAll('.category-section');
    const noResultsAlert = document.getElementById('noResultsAlert');
    
    // Clear highlights first
    cards.forEach(card => {
      if (card.dataset.originalHtml) {
        // Find if the card currently has collapse shown
        const collapseEl = card.querySelector('.collapse');
        const isShown = collapseEl ? collapseEl.classList.contains('show') : false;
        
        card.innerHTML = card.dataset.originalHtml;
        
        // Restore collapse state
        const newCollapseEl = card.querySelector('.collapse');
        const toggleTrigger = card.querySelector('.question-toggle-trigger');
        if (newCollapseEl && isShown) {
          newCollapseEl.classList.add('show');
          if (toggleTrigger) {
            toggleTrigger.setAttribute('aria-expanded', 'true');
          }
        }
      }
    });

    if (!query) {
      // If query is empty, show all cards and sections, restore original count badges
      cards.forEach(card => {
        card.style.display = 'block';
      });
      sections.forEach(sec => {
        sec.style.display = 'block';
      });
      if (noResultsAlert) noResultsAlert.classList.add('d-none');
      
      this.updateSidebarCounters();
      this.updateTotalCount(cards.length);
      return;
    }

    // Create case-insensitive regex for search matching and highlighting
    // Escape special regex characters in the query
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');
    
    let totalVisible = 0;
    
    // Filter cards
    cards.forEach(card => {
      // Search inside question title and answer text
      const titleEl = card.querySelector('.card-title-text');
      const answerEl = card.querySelector('.answer-container');
      const categoryBadge = card.querySelector('.badge');
      
      const titleText = titleEl ? titleEl.textContent : '';
      const answerText = answerEl ? answerEl.textContent : '';
      const categoryText = categoryBadge ? categoryBadge.textContent : '';
      
      const isMatch = titleText.match(regex) || answerText.match(regex) || categoryText.match(regex);
      
      if (isMatch) {
        card.style.display = 'block';
        totalVisible++;
        
        // Highlight terms inside title and answer text nodes safely
        if (titleEl) this.highlightTextNodes(titleEl, regex);
        if (answerEl) this.highlightTextNodes(answerEl, regex);
        if (categoryBadge) this.highlightTextNodes(categoryBadge, regex);
      } else {
        card.style.display = 'none';
      }
    });

    // Update section visibility (hide section if all its cards are hidden)
    sections.forEach(sec => {
      const secCards = sec.querySelectorAll('.question-card');
      let secVisible = 0;
      secCards.forEach(c => {
        if (c.style.display !== 'none') secVisible++;
      });
      
      if (secVisible > 0) {
        sec.style.display = 'block';
      } else {
        sec.style.display = 'none';
      }
    });

    // Handle "No Results" state
    if (totalVisible === 0) {
      if (noResultsAlert) {
        noResultsAlert.classList.remove('d-none');
      } else {
        const alert = document.createElement('div');
        alert.id = 'noResultsAlert';
        alert.className = 'alert alert-info text-center py-4 my-5';
        alert.innerHTML = `
          <i class="fas fa-search fa-2x mb-3 text-muted"></i>
          <h4>No Questions Found</h4>
          <p class="text-muted mb-0">We couldn't find any questions matching "${query}". Try different terms.</p>
        `;
        this.questionsContainer.appendChild(alert);
      }
    } else {
      if (noResultsAlert) noResultsAlert.classList.add('d-none');
    }

    // Update numbers
    this.updateSidebarCounters();
    this.updateTotalCount(totalVisible);
  },

  // Highlight matched terms only in text nodes to prevent HTML breakage
  highlightTextNodes(element, regex) {
    if (!element) return;
    const walk = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while (node = walk.nextNode()) {
      nodes.push(node);
    }
    
    nodes.forEach(textNode => {
      const parent = textNode.parentNode;
      // Skip if inside tags that shouldn't be highlighted or already highlighted
      if (parent && parent.tagName !== 'SCRIPT' && parent.tagName !== 'STYLE' && parent.tagName !== 'MARK' && parent.tagName !== 'A') {
        const text = textNode.nodeValue;
        if (regex.test(text)) {
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          
          text.replace(regex, (match, index) => {
            if (index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
            }
            
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = match;
            fragment.appendChild(mark);
            
            lastIndex = index + match.length;
          });
          
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
          }
          
          parent.replaceChild(fragment, textNode);
        }
      }
    });
  },

  // Update sidebar count badges based on filtered cards
  updateSidebarCounters() {
    const categories = ["AI", "UI / UX", "React", "JavaScript", "Next.js"];
    
    categories.forEach(cat => {
      // Find cards in this category section that are visible
      // Map category name to section ID
      const sectionId = cat.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + 'Section';
      const section = document.getElementById(sectionId);
      let count = 0;
      
      if (section) {
        const cards = section.querySelectorAll('.question-card');
        cards.forEach(c => {
          if (c.style.display !== 'none') count++;
        });
      }
      
      // Update badge in sidebar link
      // Sidebar link IDs format: catLink-ai, catLink-uiux, etc.
      const badgeId = 'badge-' + cat.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.textContent = count;
        // Optionally grey out badge/link if count is 0
        const link = badge.closest('.category-nav-link');
        if (link) {
          if (count === 0) {
            link.style.opacity = '0.5';
          } else {
            link.style.opacity = '1';
          }
        }
      }
    });
  },

  // Update total matches indicator
  updateTotalCount(count) {
    const totalBadges = document.querySelectorAll('.total-questions-badge');
    totalBadges.forEach(badge => {
      badge.textContent = count;
    });
  }
};

window.Search = Search;
