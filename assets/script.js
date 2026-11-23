(function () {
    'use strict';

    /* ═══════════════════════════════════════════════════════════
       Перемикач теми (світла/темна), збереження в localStorage.
       ═══════════════════════════════════════════════════════════ */
    var THEME_KEY = 'labopt-theme';
    var themeToggle = document.getElementById('theme-toggle');

    function applyTheme(theme) {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    var savedTheme = null;
    try { savedTheme = localStorage.getItem(THEME_KEY); } catch (e) { /* localStorage недоступний */ }

    if (!savedTheme && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        savedTheme = 'dark';
    }
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            var next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(next);
            try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
        });
    }

    /* ═══════════════════════════════════════════════════════════
       Зміст у стилі друкованої книги:
       кожен пункт отримує рядок [номер] [назва] [·····крапки·····] [▸],
       де стрілка — це акордеон для підпунктів (якщо вони є).
       Клік по назві, як і раніше, веде у PDF; клік по стрілці —
       розгортає/згортає підрозділи.
       ═══════════════════════════════════════════════════════════ */
    var TOC_STATE_KEY = 'labopt-toc-expanded';
    var chevronSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"></polyline></svg>';

    function buildToc() {
        var items = document.querySelectorAll('.toc-list > li');
        var accordionItems = [];

        items.forEach(function (li) {
            var num = li.querySelector(':scope > .toc-num');
            var titleLink = li.querySelector(':scope > .toc-title');
            var subList = li.querySelector(':scope > .sub-list');

            if (!titleLink) { return; }

            // Рядок пункту змісту: номер + назва + крапковий "лідер" + (стрілка)
            var row = document.createElement('div');
            row.className = 'toc-row';

            if (num) { row.appendChild(num); }
            row.appendChild(titleLink);

            var dots = document.createElement('span');
            dots.className = 'toc-dots';
            dots.setAttribute('aria-hidden', 'true');
            row.appendChild(dots);

            if (subList) {
                var toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'toc-toggle';
                toggleBtn.innerHTML = chevronSVG;
                toggleBtn.setAttribute('aria-expanded', 'false');
                toggleBtn.setAttribute('aria-label', 'Розгорнути підрозділи');
                row.appendChild(toggleBtn);

                li.insertBefore(row, subList);

                var wrap = document.createElement('div');
                wrap.className = 'sub-list-wrap';
                li.replaceChild(wrap, subList);
                wrap.appendChild(subList);
                wrap.style.maxHeight = '0px';

                (function (li, wrap, subList, toggleBtn) {
                    function setOpen(open) {
                        li.classList.toggle('toc-open', open);
                        toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
                        toggleBtn.setAttribute('aria-label', open ? 'Згорнути підрозділи' : 'Розгорнути підрозділи');
                        wrap.style.maxHeight = open ? (subList.scrollHeight + 12) + 'px' : '0px';
                    }
                    toggleBtn.addEventListener('click', function () {
                        setOpen(!li.classList.contains('toc-open'));
                    });
                    accordionItems.push({ li: li, setOpen: setOpen });
                })(li, wrap, subList, toggleBtn);
            } else {
                li.classList.add('no-sub');
                li.appendChild(row);
            }
        });

        // Кнопки "Розгорнути все" / "Згорнути все"
        var expandAllBtn = document.getElementById('toc-expand-all');
        var collapseAllBtn = document.getElementById('toc-collapse-all');

        function setAll(open) {
            accordionItems.forEach(function (item) { item.setOpen(open); });
            try { localStorage.setItem(TOC_STATE_KEY, open ? '1' : '0'); } catch (e) { /* ignore */ }
        }

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', function () { setAll(true); });
        }
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', function () { setAll(false); });
        }

        // Перерахунок max-height при зміні розміру вікна (перенесення рядків тексту)
        window.addEventListener('resize', function () {
            accordionItems.forEach(function (item) {
                if (item.li.classList.contains('toc-open')) {
                    var wrap = item.li.querySelector(':scope > .sub-list-wrap');
                    var subList = wrap.querySelector('.sub-list');
                    wrap.style.maxHeight = (subList.scrollHeight + 12) + 'px';
                }
            });
        });

        // Відновлюємо попередній стан "розгорнуто все", якщо він був збережений
        var savedState = null;
        try { savedState = localStorage.getItem(TOC_STATE_KEY); } catch (e) { /* ignore */ }
        if (savedState === '1') { setAll(true); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildToc);
    } else {
        buildToc();
    }

    /* ═══════════════════════════════════════════════════════════
       Кнопка "Нагору"
       ═══════════════════════════════════════════════════════════ */
    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function () {
            backToTop.classList.toggle('visible', window.scrollY > 400);
        });
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ═══════════════════════════════════════════════════════════
       Перемикач дизайнів: Поле / Креслення / Книга.
       Вибір зберігається в localStorage (ключ labopt-design).
       ═══════════════════════════════════════════════════════════ */
    var DESIGN_KEY = 'labopt-design';
    var DESIGNS = ['field', 'blueprint', 'book'];
    var root = document.documentElement;
    var designBtns = document.querySelectorAll('.design-switch button');

    function applyDesign(d) {
        if (DESIGNS.indexOf(d) < 0) { d = 'field'; }
        root.setAttribute('data-design', d);
        designBtns.forEach(function (b) {
            b.setAttribute('aria-pressed', b.getAttribute('data-design') === d ? 'true' : 'false');
        });
        // Змінилась геометрія — змісту й полотну треба перерахуватися
        window.dispatchEvent(new Event('resize'));
    }

    var savedDesign = null;
    try { savedDesign = localStorage.getItem(DESIGN_KEY); } catch (e) { /* ignore */ }
    applyDesign(savedDesign);

    designBtns.forEach(function (b) {
        b.addEventListener('click', function () {
            var d = b.getAttribute('data-design');
            applyDesign(d);
            try { localStorage.setItem(DESIGN_KEY, d); } catch (e) { /* ignore */ }
        });
    });

    /* ═══════════════════════════════════════════════════════════
       Інтерференція від двох щілин у шапці: кругові хвилі від двох
       когерентних джерел, що розходяться, і розподіл інтенсивності
       I ∝ cos²(π d y / λL) на екрані справа. Курсор по вертикалі
       змінює відстань між щілинами d: що більше d, то дрібніші смуги.
       ═══════════════════════════════════════════════════════════ */
    (function initOptics() {
        var hero = document.querySelector('.pdf-hero');
        if (!hero) { return; }

        var cv = document.createElement('canvas');
        cv.className = 'field-canvas';
        cv.setAttribute('aria-hidden', 'true');
        hero.insertBefore(cv, hero.firstChild);

        var ctx = cv.getContext('2d');
        var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var w = 0, h = 0, dpr = 1, raf = 0, visible = true;
        var d = 26, dTarget = 26;                  // піввідстань між щілинами, px
        var lam = 22, phase = 0;                   // довжина хвилі, px; фаза бігу хвиль
        var sx, cy, ex, span;                      // щілини, вісь, екран, піввисота екрана

        function layout() {
            sx = 0.50 * w; ex = 0.96 * w; cy = 0.34 * h;
            span = Math.min(0.30 * h, 130);
        }

        function draw() {
            if (!w || !cv.offsetParent) { return; }
            var cs = getComputedStyle(root);
            var line = cs.getPropertyValue('--fl-line');
            var c1 = cs.getPropertyValue('--fl-pos');
            var c2 = cs.getPropertyValue('--fl-neg');
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);

            // падаючий пучок (плоскі фронти) і діафрагма з двома щілинами
            ctx.strokeStyle = line; ctx.lineWidth = 1.1;
            for (var x = sx - 20 - ((phase % lam)); x > sx - 0.3 * w; x -= lam) {
                ctx.globalAlpha = Math.max(0, 1 - (sx - x) / (0.3 * w));
                ctx.beginPath(); ctx.moveTo(x, cy - span * 0.8); ctx.lineTo(x, cy + span * 0.8); ctx.stroke();
            }
            ctx.globalAlpha = 0.9; ctx.lineWidth = 3; ctx.strokeStyle = c1;
            var gap = 3;
            [[cy - span * 1.15, cy - d - gap], [cy - d + gap, cy + d - gap], [cy + d + gap, cy + span * 1.15]].forEach(function (s) {
                ctx.beginPath(); ctx.moveTo(sx, s[0]); ctx.lineTo(sx, s[1]); ctx.stroke();
            });

            // кругові хвилі від двох щілин, обрізані правою півплощиною
            ctx.save();
            ctx.beginPath(); ctx.rect(sx, cy - span * 1.15, ex - sx, span * 2.3); ctx.clip();
            ctx.lineWidth = 1;
            [-d, d].forEach(function (sy, i) {
                ctx.strokeStyle = i ? c2 : c1;
                for (var r = (phase % lam); r < ex - sx + span; r += lam) {
                    ctx.globalAlpha = 0.5 * Math.max(0, 1 - r / (ex - sx + span));
                    ctx.beginPath(); ctx.arc(sx, cy + sy, r, -Math.PI / 2, Math.PI / 2); ctx.stroke();
                }
            });
            ctx.restore();

            // екран і розподіл інтенсивності I(y) = cos²(π·2d·y / λL)
            var L = ex - sx, k = Math.PI * 2 * d / (lam * L) * 22;
            ctx.globalAlpha = 1; ctx.strokeStyle = line; ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(ex, cy - span * 1.15); ctx.lineTo(ex, cy + span * 1.15); ctx.stroke();
            ctx.strokeStyle = c2; ctx.lineWidth = 1.8; ctx.beginPath();
            for (var y = -span * 1.15; y <= span * 1.15; y += 2) {
                var I = Math.pow(Math.cos(k * y), 2) * Math.exp(-Math.pow(y / (span * 1.1), 2));
                var px = ex - I * 0.14 * w;
                if (y === -span * 1.15) { ctx.moveTo(px, cy + y); } else { ctx.lineTo(px, cy + y); }
            }
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        var last = 0;
        function frame(ts) {
            raf = 0;
            var dt = Math.min(0.05, (ts - last) / 1000 || 0.016); last = ts;
            d += (dTarget - d) * 0.06;
            phase += 38 * dt;
            draw();
            if (visible && !document.hidden) { raf = requestAnimationFrame(frame); }
        }
        function start() { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } }

        function resize() {
            var r = hero.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = r.width; h = r.height;
            cv.width = Math.round(w * dpr);
            cv.height = Math.round(h * dpr);
            layout();
            draw();
        }

        hero.addEventListener('pointermove', function (e) {
            var r = hero.getBoundingClientRect();
            var f = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
            dTarget = 12 + 40 * (1 - f);            // вгору — щілини розсунуті
        });

        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (en) {
                visible = en[0].isIntersecting;
                if (visible) { start(); }
            }).observe(hero);
        }
        document.addEventListener('visibilitychange', function () { if (!document.hidden) { start(); } });
        window.addEventListener('resize', resize);
        if (themeToggle) { themeToggle.addEventListener('click', draw); }
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function () { window.dispatchEvent(new Event('resize')); });
        }
        resize();
        start();
    })();
})();
