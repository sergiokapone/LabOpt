# Онлайн-версія «Оптика. Лабораторний практикум»

HTML-версія робиться з тих самих `.tex`, що й PDF (LuaLaTeX + lwarp + MathJax), без правок розділів.

```powershell
cd html && npm install          # один раз: mathjax-full для перевірки формул
.\html\build-html.ps1           # повна збірка -> online/ (≈1 хв)
python -I make_site.py          # головна сторінка index.html + sitemap.xml + robots.txt
```

Потрібні: `lualatex`, `lwarpmk`, `biber`, `pdfcrop`, `pdftocairo`, `python`, `node` (для Pagefind-пошуку через `npx`).

| Файл | Призначення |
|---|---|
| `html/main-html.tex` | HTML-аналог `LabWork.tex` (той самий порядок частин і робіт) |
| `html/LabBookHTML.cls` | клас для lwarp; блок «Рисування» і математичні макроси беруться з `LabBook.cls` / `html/mathmacros.tex` |
| `html/mathmacros.tex` | `\vect`, `\Efield`… (для LaTeX і MathJax); змінюючи їх у `LabBook.cls`, змініть і тут |
| `html/tools/` | `prepare_html.py`, `publish_html.py` (перейменування сторінок, пошук, SVG), `mathjax2lwarp.py` |
| `html/assets/` | `conspect.css`, `book.js`, шрифт — публікуються в `online/assets/` |
| `assets/`, `make_site.py` | головна сторінка сайту |

Порядок сторінок (`PAGE_NAMES` у `publish_html.py` і `PAGES` у `make_site.py`) = порядок у `main-html.tex`;
додаючи роботу, змініть обидва списки. Джерела літератури — `bibliography/optics.bib`.

**Публікація:** GitHub Pages з гілки `main`, корінь репозиторію. Сайт: https://sergiokapone.github.io/LabOpt/ ,
книга: `/online/`.
