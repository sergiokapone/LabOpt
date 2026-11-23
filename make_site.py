#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Генерує index.html (головна сторінка для GitHub Pages) зі змісту готової онлайн-версії online/*.html
та sitemap.xml + robots.txt.

Запуск (після html/build-html.ps1):  python -I make_site.py
Зміст береться із заголовків сторінок online/ (частини й роботи, їхні розділи з якорями), тому він завжди
збігається з онлайн-версією.
"""
import re
from datetime import date
from html import escape, unescape
from pathlib import Path

HERE = Path(__file__).resolve().parent
ONLINE = HERE / "online"
SITE = "https://sergiokapone.github.io/LabOpt/"
# порядок сторінок = порядок у main-html.tex (див. PAGE_NAMES у html/tools/publish_html.py)
PAGES = ["interferention", "lab5_3p1", "lab5_3p2", "lab5_4", "difraction", "lab5_5", "polarization", "lab5_7"]
HEAD = re.compile(r'<h([234]) id="(autosec-\d+)">(.*?)</h\1>', re.S)
NUM = re.compile(r'<span class="sectionnumber">(.*?)</span>', re.S)


def clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", unescape(s).replace(" ", " ").replace(" ", " ").replace("\xa0", " ")).strip()


def parse_page(name):
    """[(рівень, номер, назва, якір)] заголовків сторінки; перший — частина/робота."""
    text = (ONLINE / (name + ".html")).read_text(encoding="utf-8")
    body = text[text.find("<main"):] if "<main" in text else text
    out = []
    for m in HEAD.finditer(body):
        lvl, anchor, inner = int(m.group(1)), m.group(2), m.group(3)
        nm = NUM.search(inner)
        num = clean(nm.group(1)) if nm else ""
        title = clean(inner[nm.end():]) if nm else clean(inner)
        if lvl <= 3:
            out.append((lvl, num, title, anchor))
        elif out:
            out.append((lvl, num, title, anchor))
    return out


def render_toc() -> str:
    a = []
    ap = a.append
    ap('        <div class="section" id="toc-section">')
    ap('            <h2 class="section-heading">Зміст</h2>')
    ap('            <div class="toc-controls">')
    ap('                <button type="button" id="toc-expand-all" class="toc-ctrl-btn">Розгорнути все</button>')
    ap('                <button type="button" id="toc-collapse-all" class="toc-ctrl-btn">Згорнути все</button>')
    ap("            </div>")
    ap('            <ul class="toc-list">')
    for name in PAGES:
        hs = parse_page(name)
        if not hs:
            continue
        _lvl, num, title, _anc = hs[0]
        kind = "Теорія" if name in ("interferention", "difraction", "polarization") else "Робота " + num
        ap("                <li>")
        ap('                    <span class="toc-num">%s</span>' % escape(num))
        label = title if kind != "Теорія" else title
        ap('                    <a href="online/%s.html" class="toc-title">%s%s</a>' % (name, "Теорія: " if kind == "Теорія" else "", escape(label)))
        subs = [h for h in hs[1:] if h[0] == 4 and h[2] != "Рекомендована література"]
        if subs:
            ap('                    <ul class="sub-list">')
            for _l, n, t, anc in subs:
                ap('                        <li><a href="online/%s.html#%s">%s</a></li>' % (name, anc, escape((n + " " if n else "") + t)))
            ap("                    </ul>")
        ap("                </li>")
    ap("            </ul>")
    ap("        </div>")
    return "\n".join(a)


TEMPLATE = """<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">

    <title>Оптика | Лабораторний практикум</title>
    <meta name="description" content="Навчальний посібник «Оптика. Лабораторний практикум»: інтерференція, дифракція й поляризація світла — теорія та п'ять лабораторних робіт. PDF і онлайн-версія.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="@SITE@">

    <meta property="og:title" content="Оптика | Лабораторний практикум">
    <meta property="og:description" content="Інтерференція, дифракція й поляризація світла: теорія та п'ять лабораторних робіт.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="@SITE@">

    <script>(function(){var r=document.documentElement;try{var d=localStorage.getItem('labopt-design');r.setAttribute('data-design',['field','blueprint','book'].indexOf(d)>-1?d:'field');var t=localStorage.getItem('labopt-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){r.classList.add('dark');}}catch(e){r.setAttribute('data-design','field');}})();</script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400..600;1,7..72,400..600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap">

    <link rel="stylesheet" href="assets/styles.css">
    <link rel="stylesheet" href="assets/designs.css">
    <style>
        .hero-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;position:relative;z-index:1}
        .pdf-button-primary{background:var(--gold);border-color:var(--gold);color:#1b0e0c}
        .pdf-button-primary .btn-icon{color:inherit}
        .pdf-button-primary:hover{background:var(--gold-bright);border-color:var(--gold-bright);color:#1b0e0c}
    </style>
</head>
<body>
<div class="container">

    <div class="pdf-hero">
        <div class="hero-tools">
            <div class="design-switch" role="group" aria-label="Дизайн сторінки">
                <button type="button" data-design="field" aria-pressed="true">Поле</button>
                <button type="button" data-design="blueprint" aria-pressed="false">Креслення</button>
                <button type="button" data-design="book" aria-pressed="false">Книга</button>
            </div>
            <button class="theme-toggle" id="theme-toggle" type="button" title="Перемкнути тему" aria-label="Перемкнути тему">🌙</button>
        </div>
        <h1>Оптика</h1>
        <div class="subtitle">Лабораторний практикум</div>
        <div class="hero-rule"></div>
        <div class="hero-actions">
            <a href="LabWork.pdf" class="pdf-button pdf-button-primary">
                <span class="btn-icon">&#8595;</span> Завантажити посібник (PDF)
            </a>
            <a href="online/" class="pdf-button">
                <span class="btn-icon">&#9776;</span> Читати онлайн
            </a>
        </div>
        <p class="pdf-note">Повна версія у форматі PDF; ту саму книгу можна читати онлайн. Пункти змісту нижче відкривають онлайн-версію на потрібному місці.</p>
    </div>

    <div class="content">

        <div class="section">
            <h2 class="section-heading">Автори</h2>
            <div class="authors">
                <div class="author-card">
                    <img class="author-photo" src="https://apd.ipt.kpi.ua/wp-content/uploads/2026/03/Ivanova_VV.jpg"
                         alt="Віта Іванова" loading="lazy">
                    <strong><a href="https://apd.ipt.kpi.ua/kafedra/stuff/ivanova/" target="_blank">Іванова Віта Вікторівна</a></strong>
                    <p>Кандидат технічних наук, доцент кафедри прикладної фізики КПІ ім. Ігоря Сікорського.</p>
                </div>
                <div class="author-card">
                    <img class="author-photo" src="https://apd.ipt.kpi.ua/wp-content/uploads/2025/01/MyPhoto2.jpg"
                         alt="Сергій Пономаренко" loading="lazy">
                    <strong><a href="https://apd.ipt.kpi.ua/kafedra/stuff/ponomarenko/" target="_blank">Пономаренко Сергій Миколайович</a></strong>
                    <p>Кандидат фізико-математичних наук, доцент кафедри прикладної фізики КПІ ім. Ігоря Сікорського.</p>
                </div>
            </div>
        </div>
        <div class="preface">
            <h2>Про посібник</h2>
            <p>Навчальний посібник містить зміст, основні складові та порядок виконання лабораторних робіт з дисципліни <strong>«Оптика»</strong> для студентів Фізико-технічного інституту КПІ ім. Ігоря Сікорського, які навчаються за спеціальністю 105 «Прикладна фізика та наноматеріали».</p>
            <p>Кожна з трьох частин — інтерференція, дифракція й поляризація світла — починається коротким теоретичним викладом, після якого йдуть лабораторні роботи: мета, теоретичне підґрунтя, опис установки, хід роботи й контрольні запитання.</p>
        </div>

        <!-- ── Зміст ─────────────────────────────────────────────────── -->
@TOC@
        <!-- ── /Зміст ──────────────────────────────────────────────────── -->

        <hr>
        <p class="ref-links">
            <a href="https://apd.ipt.kpi.ua/kafedra/stuff/ponomarenko/" target="_blank">Пономаренко С.М.</a>
        </p>

    </div><!-- /content -->

    <footer>
        Оптика &nbsp;|&nbsp; Лабораторний практикум<br>
        Кафедра прикладної фізики, КПІ ім. Ігоря Сікорського
    </footer>

</div><!-- /container -->

<button class="back-to-top" id="back-to-top" type="button" title="Нагору" aria-label="Прогорнути нагору">↑</button>

<script src="assets/script.js"></script>
</body>
</html>
"""


def main() -> int:
    if not (ONLINE / "interferention.html").exists():
        print("Немає online/ — спершу html/build-html.ps1")
        return 1
    html = TEMPLATE.replace("@TOC@", render_toc()).replace("@SITE@", SITE)
    (HERE / "index.html").write_text(html, encoding="utf-8", newline="\n")
    today = date.today().isoformat()
    urls = [SITE, SITE + "online/"] + [SITE + "online/%s.html" % p for p in PAGES]
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm += ["  <url>", "    <loc>%s</loc>" % u, "    <lastmod>%s</lastmod>" % today, "  </url>"]
    sm.append("</urlset>")
    (HERE / "sitemap.xml").write_text("\n".join(sm) + "\n", encoding="utf-8")
    (HERE / "robots.txt").write_text("User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % SITE, encoding="utf-8")
    (HERE / ".nojekyll").write_text("", encoding="utf-8")
    print("index.html, sitemap.xml (%d URL), robots.txt записано в %s" % (len(urls), HERE))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
