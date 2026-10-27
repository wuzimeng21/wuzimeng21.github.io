/* 页面交互保持无依赖，双击 index.html 或部署到项目子路径均可使用。 */
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const data = window.SITE_DATA || { articles: [], searchSections: [] };
  const articles = data.articles || [];
  const themeButton = document.querySelector('.theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    themeButton.setAttribute('aria-label', theme === 'dark' ? '切换为浅色模式' : '切换为深色模式');
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1d2522' : '#f8f7f3';
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('shadow-theme'); } catch { /* 部分浏览器禁用本地存储，继续使用系统主题。 */ }
  applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : (prefersDark.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('shadow-theme', theme); } catch { /* 存储受限不影响切换。 */ }
  });

  // 外部地址限定为 HTTP(S)，站内地址采用相对路径或锚点。
  function safeUrl(value) {
    if (typeof value !== 'string') return '#notes';
    if (value.startsWith('#') || value.startsWith('./')) return value;
    try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#notes'; } catch { return '#notes'; }
  }
  function createLink(url, className) {
    const a = document.createElement('a');
    a.href = safeUrl(url);
    a.className = className;
    if (/^https?:/.test(a.getAttribute('href'))) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  }
  function renderArticles(category = '全部') {
    if (!articles.length) return;
    const list = document.getElementById('article-list');
    list.replaceChildren();
    const filtered = articles.filter(article => category === '全部' || article.category === category);
    if (!filtered.length) { const p = document.createElement('p'); p.className = 'empty-result'; p.textContent = '这个主题的文章还在整理，先看看其他记录吧。'; list.append(p); return; }
    filtered.forEach((article, index) => {
      const a = createLink(article.url, 'article-row');
      const number = document.createElement('span'); number.className = 'article-number'; number.textContent = String(index + 1).padStart(2, '0');
      const content = document.createElement('div'); content.className = 'article-copy';
      const meta = document.createElement('p'); meta.className = 'article-meta';
      const categoryLabel = document.createElement('span'); categoryLabel.textContent = article.category;
      const source = document.createElement('span'); source.textContent = article.source || '笔记';
      meta.append(categoryLabel, source);
      const title = document.createElement('h3'); title.textContent = article.title;
      const description = document.createElement('p'); description.className = 'article-description'; description.textContent = article.description || '';
      content.append(meta, title, description);
      const arrow = document.createElement('span'); arrow.className = 'article-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      a.append(number, content, arrow); list.append(a);
    });
  }
  renderArticles();
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
      renderArticles(button.dataset.filter);
    });
  });

  const dialog = document.getElementById('search-dialog');
  const input = document.getElementById('site-search');
  const results = document.getElementById('search-results');
  const searchIndex = [...articles.map(article => ({ ...article, type: article.category })), ...(data.searchSections || [])];
  function renderSearch() {
    const terms = input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    results.replaceChildren();
    const matched = searchIndex.filter(item => terms.every(term => `${item.title} ${item.description || ''} ${item.type || ''}`.toLocaleLowerCase().includes(term))).slice(0, 10);
    if (!matched.length) { const p = document.createElement('p'); p.className = 'empty-result'; p.textContent = '还没有找到相关记录，换一个关键词试试。'; results.append(p); return; }
    matched.forEach(item => {
      const a = createLink(item.url, 'search-result');
      const title = document.createElement('strong'); title.textContent = item.title;
      const type = document.createElement('span'); type.textContent = item.type || '文章';
      a.append(title, type);
      a.addEventListener('click', () => dialog.close());
      results.append(a);
    });
  }
  function openSearch() { input.value = ''; renderSearch(); dialog.showModal(); input.focus(); }
  document.querySelector('.search-trigger').addEventListener('click', openSearch);
  document.querySelector('.search-close').addEventListener('click', () => dialog.close());
  input.addEventListener('input', renderSearch);
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open) { event.preventDefault(); dialog.close(); return; }
    if (event.key === '/' && !dialog.open && !event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable) { event.preventDefault(); openSearch(); }
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  const navLinks = [...document.querySelectorAll('.nav-link')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { navLinks.forEach(link => { const active = link.getAttribute('href') === `#${entry.target.id}`; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); }); } });
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('#home, #notes, #projects, #about').forEach(section => observer.observe(section));
  }
})();
