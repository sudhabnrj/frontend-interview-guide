// Main Application Coordinator
const App = {
  questions: [],

  init() {
    this.fetchQuestions();
  },

  // Fetch compiled Q&A dataset
  async fetchQuestions() {
    try {
      const response = await fetch('data/questions.json');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }
      this.questions = await response.json();
      
      this.render();
      
      // Initialize other modules
      if (window.UI) window.UI.init();
      if (window.Search) window.Search.init();
      
      this.initCollapseListeners();
      
      // Update sidebar counts
      if (window.Search) window.Search.updateSidebarCounters();
      if (window.Search) window.Search.updateTotalCount(this.questions.length);
      
    } catch (error) {
      console.error('Error initializing application:', error);
      const container = document.getElementById('questionsContainer');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger text-center my-5 py-4">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h4>Failed to Load Questions</h4>
            <p class="text-muted">There was an error loading the questions database. Please ensure you are running a local web server (e.g. Live Server or http-server) and the path is correct.</p>
            <button class="btn btn-primary btn-sm mt-2" onclick="location.reload()">Retry</button>
          </div>
        `;
      }
    }
  },

  // Group questions by category and render them
  render() {
    const container = document.getElementById('questionsContainer');
    if (!container) return;

    container.innerHTML = '';
    
    // Strict categories order
    const categories = ["AI", "UI / UX", "React", "JavaScript", "Next.js"];

    categories.forEach(cat => {
      const catQuestions = this.questions.filter(q => q.category === cat);
      if (catQuestions.length === 0) return;

      const cleanCatId = cat.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      // Create Category Section wrapper
      const section = document.createElement('section');
      section.id = `${cleanCatId}Section`;
      section.className = 'category-section';
      
      // Section title with category divider
      section.innerHTML = `
        <h2 class="category-section-title">
          <span>${cat} Interview Questions</span>
        </h2>
        <div class="cards-list">
          ${catQuestions.map(q => this.renderCard(q)).join('')}
        </div>
      `;
      
      container.appendChild(section);
    });

    // Save initial card innerHTML in data attributes for search query resets
    const cards = document.querySelectorAll('.question-card');
    cards.forEach(card => {
      card.dataset.originalHtml = card.innerHTML;
    });
  },

  // Generates single Q&A Card layout
  renderCard(q) {
    const isDiagramAvailable = q.diagrams && q.diagrams.length > 0;
    
    // Custom category class styles
    let badgeClass = 'badge-primary';
    const cleanCat = q.category.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleanCat === 'ai') badgeClass = 'badge-ai';
    else if (cleanCat === 'uiux') badgeClass = 'badge-uiux';
    else if (cleanCat === 'react') badgeClass = 'badge-react';
    else if (cleanCat === 'javascript') badgeClass = 'badge-js';
    else if (cleanCat === 'nextjs') badgeClass = 'badge-nextjs';
    
    const parsedAnswer = this.parseMarkdown(q.answer);
    
    let diagramsHtml = '';
    if (isDiagramAvailable) {
      q.diagrams.forEach(diagPath => {
        diagramsHtml += `
          <div class="diagram-container my-3">
            <img src="${diagPath}" alt="Technical Diagram" class="diagram-img" loading="lazy" />
          </div>
        `;
      });
    }

    // Estimate Reading Time (Average 200 Words Per Minute)
    const textToCount = q.question + ' ' + q.answer.replace(/<[^>]*>/g, '');
    const wordCount = textToCount.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return `
      <div class="question-card" id="card-${q.id}" data-category="${q.category}">
        <div class="card-header-clean">
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${badgeClass}">${q.category}</span>
            <span class="text-muted fw-semibold" style="font-size: 0.85rem;">Question #${q.id}</span>
          </div>
          <div class="card-meta">
            <span><i class="far fa-clock"></i> ${readingTime} min read</span>
          </div>
        </div>
        <div class="card-body-clean">
          <div class="question-toggle-trigger" data-bs-toggle="collapse" data-bs-target="#collapse-${q.id}" aria-expanded="false" aria-controls="collapse-${q.id}">
            <h3 class="card-title-text">${q.question}</h3>
            <span class="collapse-arrow"><i class="fas fa-chevron-down"></i></span>
          </div>
          
          <div class="d-flex flex-wrap gap-2 mt-3">
            <button class="btn-card-action" onclick="App.copyQuestion(${q.id})">
              <i class="far fa-copy"></i> Copy Q
            </button>
            <button class="btn-card-action" onclick="App.copyAnswer(${q.id})">
              <i class="far fa-copy"></i> Copy A
            </button>
            <button class="btn-card-action" onclick="App.copyFullQA(${q.id})">
              <i class="far fa-copy"></i> Copy Q&A
            </button>
          </div>
          
          <div class="collapse" id="collapse-${q.id}">
            <div class="answer-container">
              ${parsedAnswer}
              ${diagramsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Parser helper to render simple Markdown structure to HTML
  parseMarkdown(text) {
    if (!text) return '';
    
    // 1. Code blocks
    let html = text.replace(/```(\w*)\n([\s\S]*?)\n```/g, (match, lang, code) => {
      const escapedCode = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<pre><code class="language-${lang}">${escapedCode}</code></pre>`;
    });
    
    // 2. Inline code snippets
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    
    // 3. Markdown Tables converter
    html = html.replace(/(?:^|\n)(\|.*\|(?:\n\|.*\|)*)/g, (match, tableText) => {
      const rows = tableText.trim().split('\n');
      if (rows.length < 2) return match;
      
      let tableHtml = '<div class="table-responsive"><table class="table table-bordered table-striped">';
      let hasHeader = false;
      
      rows.forEach((row, rIdx) => {
        if (row.includes('---')) {
          hasHeader = true;
          return;
        }
        
        const cols = row.split('|')
          .map(c => c.trim())
          .filter((c, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);
        
        if (rIdx === 0 && !hasHeader) {
          tableHtml += '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        } else {
          if (rIdx === 2 && hasHeader) {
            tableHtml += '<tbody>';
          }
          tableHtml += '<tr>' + cols.map(c => `<td>${c}</td>`).join('') + '</tr>';
        }
      });
      
      tableHtml += '</tbody></table></div>';
      return tableHtml;
    });
    
    // 4. Convert bullet points
    let inList = false;
    const lines = html.split('\n');
    const processedLines = [];
    
    lines.forEach((line) => {
      const trimmed = line.trim();
      const listMatch = trimmed.match(/^([-\*●])\s+(.*)$/);
      if (listMatch) {
        if (!inList) {
          processedLines.push('<ul>');
          inList = true;
        }
        processedLines.push(`<li>${listMatch[2]}</li>`);
      } else {
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }
        processedLines.push(line);
      }
    });
    if (inList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join('\n');
    
    // 5. Wrap paragraph blocks
    const blocks = html.split(/\n\n+/);
    const formattedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<pre') || trimmed.startsWith('<div class="table') || trimmed.startsWith('<ul>') || trimmed.startsWith('<ol>')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    });
    
    return formattedBlocks.join('\n');
  },

  // Setup click listeners for Expand/Collapse dynamic state
  initCollapseListeners() {
    const container = document.getElementById('questionsContainer');
    
    // Event delegation
    container.addEventListener('show.bs.collapse', (e) => {
      const card = e.target.closest('.question-card');
      if (card) {
        const trigger = card.querySelector('.question-toggle-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'true');
        }
      }
    });

    container.addEventListener('hide.bs.collapse', (e) => {
      const card = e.target.closest('.question-card');
      if (card) {
        const trigger = card.querySelector('.question-toggle-trigger');
        if (trigger) {
          trigger.setAttribute('aria-expanded', 'false');
        }
      }
    });
  },

  // Clipboard copy functions
  copyQuestion(id) {
    const q = this.questions.find(item => item.id === id);
    if (!q || !window.UI) return;
    
    const textToCopy = `Question #${q.id} [Category: ${q.category}]\n\nQuestion:\n${q.question}`;
    window.UI.copyToClipboard(textToCopy, 'Question copied successfully');
  },

  copyAnswer(id) {
    const q = this.questions.find(item => item.id === id);
    if (!q || !window.UI) return;
    
    const textToCopy = `Answer to Question #${q.id}:\n\n${q.answer.replace(/<[^>]*>/g, '')}`;
    window.UI.copyToClipboard(textToCopy, 'Answer copied successfully');
  },

  copyFullQA(id) {
    const q = this.questions.find(item => item.id === id);
    if (!q || !window.UI) return;
    
    const textToCopy = `Question #${q.id} [Category: ${q.category}]\n\nQuestion:\n${q.question}\n\nAnswer:\n${q.answer.replace(/<[^>]*>/g, '')}`;
    window.UI.copyToClipboard(textToCopy, 'Question & Answer copied successfully');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

window.App = App;
