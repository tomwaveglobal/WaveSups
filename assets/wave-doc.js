/* ==========================================================================
   Wave policy pages (/policies/*) — "On this page" contents list.
   Loaded from layout/theme.liquid on policy pages only; styles in
   assets/wave-policy.css.

   Marks the policy's section headings and builds a contents list beside the
   text (sticky on desktop, a dropdown on mobile) that follows the reader.
   ========================================================================== */

(() => {
  const container = document.querySelector('.wp-policy .shopify-policy__container');
  const rte = container && container.querySelector('.shopify-policy__body .rte');
  if (!rte) return;

  const desktop = window.matchMedia('(min-width: 1024px)');
  const hasText = (el) => el.textContent.trim().length > 0;
  const isBoldLine = (p) => {
    const b = p.firstElementChild;
    const text = p.textContent.trim();
    return b && p.children.length === 1 && /^(STRONG|B)$/.test(b.tagName) &&
      text === b.textContent.trim() && text.length > 0 && text.length < 90;
  };

  // Section headings: h2s, else h3s, else h4s / bold-only paragraphs ("4 YOUR STATUS")
  let heads = [...rte.querySelectorAll('h2')].filter(hasText);
  if (heads.length < 2) heads = [...rte.querySelectorAll('h3')].filter(hasText);
  if (heads.length < 2) {
    heads = [...rte.querySelectorAll('h4, h5, h6, p')].filter((el) => (el.tagName === 'P' ? isBoldLine(el) : hasText(el)));
  }
  heads.forEach((h) => h.classList.add('wp-sec'));
  if (heads.length < 3) return;

  const used = {};
  const toc = document.createElement('details');
  toc.className = 'wp-toc';
  toc.open = desktop.matches;
  toc.innerHTML = '<summary>On this page</summary><ol role="list"></ol>';
  const list = toc.querySelector('ol');
  const links = heads.map((h) => {
    let label = h.textContent.replace(/\s+/g, ' ').trim();
    if (label === label.toUpperCase()) label = label.toLowerCase().replace(/[a-z]/, (c) => c.toUpperCase());
    let id = h.id || 'wp-' + (label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section');
    while (used[id] || (!h.id && document.getElementById(id))) id += '-2';
    used[id] = true;
    h.id = id;
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = label;
    a.addEventListener('click', () => {
      if (!desktop.matches) toc.open = false;
    });
    li.appendChild(a);
    list.appendChild(li);
    return a;
  });
  container.prepend(toc);
  container.classList.add('wp-has-toc');

  if (!('IntersectionObserver' in window)) return;
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const current = heads.find((h) => visible.has(h));
    if (!current) return;
    links.forEach((a, i) => a.classList.toggle('is-active', heads[i] === current));
  }, { rootMargin: '0px 0px -55% 0px' });
  heads.forEach((h) => io.observe(h));
})();
