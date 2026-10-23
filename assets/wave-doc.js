/* ==========================================================================
   Wave long-form pages — policies (/policies/*) and help pages
   (shipping & returns, warranty, FAQ, troubleshooting).
   Loaded from layout/theme.liquid on those pages only; styles in
   assets/wave-policy.css.

   - Docs: marks section headings, builds an "On this page" contents list
     beside the text (sticky on desktop, a dropdown on mobile).
   - FAQs: adds a search box and category jump links above the questions.
   ========================================================================== */

(() => {
  const desktop = window.matchMedia('(min-width: 1024px)');

  const isBoldLine = (p) => {
    const b = p.firstElementChild;
    const text = p.textContent.trim();
    return p.tagName === 'P' && b && p.children.length === 1 && /^(STRONG|B)$/.test(b.tagName) &&
      text === b.textContent.trim() && text.length > 0 && text.length < 90;
  };
  const hasText = (el) => el.textContent.trim().length > 0;

  // Section headings: h2s, else h3s, else h4s / bold-only paragraphs ("4 YOUR STATUS")
  const findHeadings = (rte) => {
    let heads = [...rte.querySelectorAll('h2')].filter(hasText);
    if (heads.length < 2) heads = [...rte.querySelectorAll('h3')].filter(hasText);
    if (heads.length < 2) {
      heads = [...rte.querySelectorAll('h4, h5, h6, p')].filter((el) => el.tagName !== 'P' ? hasText(el) : isBoldLine(el));
      return heads;
    }
    // Copy that runs a while before the first heading gets its own entry,
    // named after its first bold line (shipping: "Standard Delivery …")
    const first = heads[0];
    const lead = [...rte.querySelectorAll('p')].find((p) => isBoldLine(p) &&
      (p.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING));
    if (lead) {
      const range = document.createRange();
      range.setStart(rte, 0);
      range.setEndBefore(first);
      if (range.toString().trim().length > 600) heads.unshift(lead);
    }
    return heads;
  };

  const label = (el) => {
    let text = el.textContent.replace(/\s+/g, ' ').trim().replace(/:$/, '');
    if (text === text.toUpperCase()) text = text.toLowerCase().replace(/[a-z]/, (c) => c.toUpperCase());
    return text;
  };

  const slug = (text, used) => {
    let id = 'wp-' + (text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'section');
    while (used[id] || document.getElementById(id)) id += '-2';
    used[id] = true;
    return id;
  };

  // grid: the element that becomes [contents | text]; rte: the text itself
  const buildDoc = (grid, rte) => {
    rte.classList.add('wp-doc');
    const heads = findHeadings(rte);
    heads.forEach((h) => h.classList.add('wp-sec'));
    rte.querySelectorAll('p').forEach((p) => {
      if (!p.classList.contains('wp-sec') && isBoldLine(p)) p.classList.add('wp-sub');
    });
    if (heads.length < 3) return;

    const used = {};
    const toc = document.createElement('details');
    toc.className = 'wp-toc';
    toc.open = desktop.matches;
    toc.innerHTML = '<summary>On this page</summary><ol role="list"></ol>';
    const list = toc.querySelector('ol');
    const links = heads.map((h) => {
      const text = label(h);
      if (!h.id) h.id = slug(text, used);
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = text;
      a.addEventListener('click', () => {
        if (!desktop.matches) toc.open = false;
      });
      li.appendChild(a);
      list.appendChild(li);
      return a;
    });
    grid.prepend(toc);
    grid.classList.add('wp-has-toc');

    if (!('IntersectionObserver' in window)) return;
    const visible = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      const current = heads.find((h) => visible.has(h));
      if (!current) return;
      links.forEach((a, i) => a.classList.toggle('is-active', heads[i] === current));
    }, { rootMargin: '0px 0px -55% 0px' });
    heads.forEach((h) => io.observe(h));
  };

  // Policies: Shopify's own markup
  const policy = document.querySelector('.wp-policy .shopify-policy__container');
  if (policy) {
    const rte = policy.querySelector('.shopify-policy__body .rte');
    if (rte) buildDoc(policy, rte);
  }

  // Help docs: the long rich-text block (shipping & returns, warranty)
  document.querySelectorAll('.wh--doc .rich-text').forEach((block) => {
    const rte = block.querySelector('.rte');
    if (!rte || rte.textContent.length < 1200) return;
    const grid = document.createElement('div');
    grid.className = 'wh-doc';
    block.parentNode.insertBefore(grid, block);
    grid.appendChild(block);
    buildDoc(grid, rte);
  });

  // FAQs: search + category jump links
  document.querySelectorAll('.wh--faq .faqs').forEach((faqs, n) => {
    const groups = [...faqs.querySelectorAll('.faq')];
    const items = [...faqs.querySelectorAll('.accordion:not(.accordion--text)')];
    if (items.length < 6) return;

    const bar = document.createElement('div');
    bar.className = 'wh-faqbar';
    bar.innerHTML =
      '<label class="wh-search"><span class="wh-sr">Search questions</span>' +
      '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="9" cy="9" r="6.5" stroke="currentColor" stroke-width="1.8"/><path d="m14 14 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '<input type="search" placeholder="Search questions" autocomplete="off"></label>';

    const used = {};
    const titled = groups
      .map((g) => ({ g, h: g.querySelector('.accordion--text .heading') }))
      .filter((x) => x.h && hasText(x.h));
    if (titled.length > 1) {
      const nav = document.createElement('nav');
      nav.className = 'wh-cats';
      nav.setAttribute('aria-label', 'Question topics');
      titled.forEach(({ g, h }) => {
        if (!g.id) g.id = slug(h.textContent.trim() + '-' + n, used);
        const a = document.createElement('a');
        a.href = '#' + g.id;
        a.textContent = h.textContent.trim();
        nav.appendChild(a);
      });
      bar.appendChild(nav);
    }

    const empty = document.createElement('p');
    empty.className = 'wh-empty';
    empty.hidden = true;
    empty.setAttribute('role', 'status');

    faqs.parentNode.insertBefore(bar, faqs);
    faqs.parentNode.insertBefore(empty, faqs.nextSibling);

    const input = bar.querySelector('input');
    const texts = items.map((it) => it.textContent.toLowerCase());
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const words = q.split(/\s+/).filter(Boolean);
      let shown = 0;
      items.forEach((it, i) => {
        const hit = words.every((w) => texts[i].includes(w));
        it.hidden = !hit;
        if (hit) shown++;
      });
      groups.forEach((g) => {
        g.hidden = q !== '' && !g.querySelector('.accordion:not(.accordion--text):not([hidden])');
      });
      faqs.classList.toggle('is-filtered', q !== '');
      empty.hidden = shown > 0;
      if (!shown) empty.textContent = 'No questions match "' + input.value.trim() + '". Try another word, or contact us below.';
    });
  });
})();
