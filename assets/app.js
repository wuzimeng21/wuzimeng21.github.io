// 静态文章目录、主题筛选和搜索；不依赖外部服务。
(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const data = window.SITE_DATA || { articles: [], searchSections: [] };
  const articles = data.articles || [];
  const siteRoot = new URL(document.body.dataset.siteRoot || './', location.href);
  const isArticle = document.body.dataset.page === 'article';
  const themeButton = document.querySelector('.theme-toggle');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
    themeButton.setAttribute('aria-label', theme === 'dark' ? '切换为浅色模式' : '切换为深色模式');
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0d1117' : '#ffffff';
  }
  let savedTheme;
  try { savedTheme = localStorage.getItem('notes-theme'); } catch { /* 存储不可用时使用系统主题。 */ }
  applyTheme(['light','dark'].includes(savedTheme) ? savedTheme : (prefersDark.matches ? 'dark' : 'light'));
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('notes-theme', theme); } catch { /* 不影响当前切换。 */ }
  });
  function safeUrl(value) {
    if (typeof value !== 'string') return new URL('index.html#notes',siteRoot).href;
    if (value.startsWith('#')) return isArticle ? new URL(`index.html${value}`,siteRoot).href : value;
    if (value.startsWith('./')) return new URL(value,siteRoot).href;
    try { const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.href:new URL('index.html#notes',siteRoot).href; } catch { return new URL('index.html#notes',siteRoot).href; }
  }
  function createLink(url,className) {
    const a=document.createElement('a');a.href=safeUrl(url);a.className=className;
    if (/^https?:/.test(a.href)&&new URL(a.href).origin!==location.origin) {a.target='_blank';a.rel='noopener noreferrer';}
    return a;
  }
  const list=document.getElementById('article-list');
  const categories=new Set(['全部',...articles.map(article=>article.category)]);
  function renderArticles(category='全部',updateHistory=false) {
    if (!list) return;
    if (!categories.has(category)) category='全部';
    const filtered=articles.filter(article=>category==='全部'||article.category===category);
    list.replaceChildren();
    document.getElementById('list-title').textContent=category==='全部'?'全部文章':category;
    document.getElementById('result-count').textContent=`${filtered.length} 篇`;
    document.querySelectorAll('.category-link').forEach(link=>{const active=link.dataset.category===category;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
    if (!filtered.length) {const p=document.createElement('p');p.className='empty-result';p.textContent='该分类暂无文章。';list.append(p);}
    filtered.forEach(article=>{
      const a=createLink(article.url,'article-row');
      const copy=document.createElement('div');copy.className='article-copy';
      const meta=document.createElement('p');meta.className='article-meta';
      for(const label of [article.category,article.url.startsWith('./')?'站内文章':'外部原文']){const span=document.createElement('span');span.textContent=label;meta.append(span);}
      const title=document.createElement('h3');title.textContent=article.title;
      const description=document.createElement('p');description.className='article-description';description.textContent=article.description||'';
      copy.append(meta,title,description);a.append(copy);
      if(article.published){const date=document.createElement('time');date.className='article-date';date.dateTime=article.published;date.textContent=article.published;a.append(date);}
      const arrow=document.createElement('span');arrow.className='article-arrow';arrow.textContent=article.url.startsWith('./')?'→':'↗';arrow.setAttribute('aria-hidden','true');a.append(arrow);list.append(a);
    });
    if(updateHistory){const url=new URL(location.href);if(category==='全部')url.searchParams.delete('category');else url.searchParams.set('category',category);history.pushState({category},'',url);}
  }
  const initialCategory=new URL(location.href).searchParams.get('category')||'全部';
  renderArticles(initialCategory);
  document.querySelectorAll('[data-category]').forEach(link=>link.addEventListener('click',event=>{if(isArticle)return;event.preventDefault();renderArticles(link.dataset.category,true);document.getElementById('notes').scrollIntoView({block:'start'});}));
  addEventListener('popstate',()=>renderArticles(new URL(location.href).searchParams.get('category')||'全部'));

  const dialog=document.getElementById('search-dialog');
  const input=document.getElementById('site-search');
  const results=document.getElementById('search-results');
  const searchIndex=[...articles.map(article=>({...article,type:article.category})),...(data.searchSections||[])];
  function renderSearch(){
    const terms=input.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);results.replaceChildren();
    const matched=searchIndex.filter(item=>terms.every(term=>`${item.title} ${item.description||''} ${item.type||''}`.toLocaleLowerCase().includes(term))).slice(0,12);
    if(!matched.length){const p=document.createElement('p');p.className='empty-result';p.textContent='没有找到匹配的文章。';results.append(p);return;}
    matched.forEach(item=>{const a=createLink(item.url,'search-result');const title=document.createElement('strong');title.textContent=item.title;const type=document.createElement('span');type.textContent=item.type||'文章';a.append(title,type);a.addEventListener('click',()=>dialog.close());results.append(a);});
  }
  function openSearch(){input.value='';renderSearch();dialog.showModal();input.focus();}
  document.querySelector('.search-trigger').addEventListener('click',openSearch);
  document.querySelector('.search-close').addEventListener('click',()=>dialog.close());
  input.addEventListener('input',renderSearch);
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&dialog.open){event.preventDefault();dialog.close();return;}if(event.key==='/'&&!dialog.open&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.activeElement.isContentEditable){event.preventDefault();openSearch();}});
  const year=document.getElementById('year');if(year)year.textContent=String(new Date().getFullYear());
})();
