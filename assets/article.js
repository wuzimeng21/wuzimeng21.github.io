// 阅读进度与代码复制。文章正文由静态 HTML 提供，关闭脚本也能阅读。
(() => {
  'use strict';
  const notice = document.getElementById('copy-notice');
  let noticeTimer;
  document.querySelectorAll('.article-content pre').forEach(pre => {
    const code = pre.querySelector('code');
    if (!code) return;
    const label = document.createElement('span');
    label.className = 'code-label'; label.setAttribute('aria-hidden', 'true');
    const language = [...code.classList].find(name => name.startsWith('language-'));
    label.textContent = language ? language.slice(9).toUpperCase() : 'CODE';
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'copy-code'; button.textContent = '复制代码';
    button.setAttribute('aria-label', '复制这段代码');
    button.addEventListener('click', async () => {
      document.querySelectorAll('.copy-code').forEach(item => { item.textContent = '复制代码'; });
      try {
        const text = code.textContent;
        if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
        else {
          const textarea = document.createElement('textarea'); textarea.value = text;
          textarea.style.position = 'fixed'; textarea.style.opacity = '0';
          document.body.append(textarea); textarea.select();
          const copied = document.execCommand('copy'); textarea.remove();
          if (!copied) throw new Error('复制不可用');
        }
        button.textContent = '已复制'; notice.textContent = '代码已复制';
      } catch { notice.textContent = '暂时无法复制，请手动选择代码。'; }
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => { button.textContent = '复制代码'; notice.textContent = ''; }, 2200);
    });
    pre.prepend(label, button);
  });
  const progress = document.querySelector('.reading-progress');
  function updateProgress() {
    const height = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${height > 0 ? Math.min(100, scrollY / height * 100) : 100}%`;
  }
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', updateProgress); updateProgress();
})();
