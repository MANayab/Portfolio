# Mohammed Abdul Nayab — Portfolio

Personal portfolio website for **Mohammed Abdul Nayab**, an operations, administration
and CRM professional based in Hyderabad, Telangana, India, with international work
experience across India, the UAE and Canada.

**Live site:** https://manayab.github.io/Portfolio/

## Stack

- Static HTML5, custom CSS (no framework), minimal vanilla JavaScript
- No build step, no backend, no external dependencies beyond Google Fonts
- Deployed as a GitHub Pages **project site** at `/Portfolio/`

## Structure

```
index.html          Main page — hero, about, expertise, experience,
                     career progression, international experience,
                     education, languages, contact
styles.css           Design system + all page styles
script.js             Mobile nav toggle, active-link highlighting, footer year
sitemap.xml          XML sitemap (single canonical URL)
robots.txt           Crawl rules + sitemap reference
404.html             Custom not-found page
site.webmanifest     Web app manifest
favicon.svg          Monogram favicon (SVG)
README.md            This file
```

## Local preview

No build tools are required. From this folder, run any static server, e.g.:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

Because the production site is served from a GitHub Pages **project path**
(`/Portfolio/`), all internal asset references in the HTML use **relative paths**
(`styles.css`, `script.js`, `favicon.svg`, etc.) rather than root-relative paths,
so the site works correctly both locally and at `https://manayab.github.io/Portfolio/`.

## Deployment (GitHub Pages)

1. Push this repository's contents to the `main` branch of
   `https://github.com/MANayab/Portfolio`.
2. In the repository settings, enable **GitHub Pages** for the `main` branch,
   root (`/`) folder.
3. The site will be published at `https://manayab.github.io/Portfolio/`.

## Content source

All professional information (employers, job titles, dates, locations,
education, competencies and languages) is taken directly from the CV supplied
by Mohammed Abdul Nayab. No projects, certifications, employers or social
profiles have been invented; none are listed because none were present in the
source CV.

## SEO / AEO

- Single H1, semantic landmark structure, descriptive meta title/description
- Canonical URL, Open Graph and Twitter/X card metadata
- `schema.org` JSON-LD (`Person`, `ProfilePage`, `ItemList`, `BreadcrumbList`)
  describing the same facts as the visible HTML
- `sitemap.xml` and `robots.txt` pointing to the canonical production URL

## Accessibility

- Semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`)
- Visible keyboard focus states throughout
- Skip-to-content link
- `prefers-reduced-motion` respected (smooth scroll and transitions disabled)
- Sufficient color contrast on the dark navy / brass palette
