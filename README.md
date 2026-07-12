# Nithees Kanna — Portfolio

Personal portfolio website for Nithees Kanna, AI & Machine Learning Developer. Built with plain HTML, CSS, and JavaScript — no build step required.

## Project structure

```
.
├── index.html              # Single-page site
├── .nojekyll               # Tells GitHub Pages to serve /assets as-is (no Jekyll)
├── README.md
└── assets/
    ├── css/styles.css      # All styles
    ├── js/script.js        # All scripts
    ├── fonts/              # Coolvetica.ttf
    ├── img/                # All images, grouped by area
    │   ├── brand/          # Logo, profile, symbols
    │   ├── actors/  directors/  music/  sports/  playlist/
    │   ├── movies/  (+ movies/logos/)
    │   └── games/   (+ games/logos/)
    ├── video/              # lovelace.mp4 demo
    └── docs/               # resume.pdf
```

All asset references in the code are **relative** (no leading `/`), so the site works both at a domain root and under a GitHub Pages project subpath.

## Run locally

Any static file server works. For example:

```bash
python -m http.server 8947
# then open http://localhost:8947
```

## Deploy with GitHub Pages

1. Push this repository to GitHub.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source = Deploy from a branch**, **Branch = `main`**, **Folder = `/ (root)`**, then **Save**.
4. The site publishes at `https://<username>.github.io/<repo>/` within a minute or two.

> `.nojekyll` is included so GitHub Pages serves the `assets/` directory untouched.

## Custom domain (name.com)

When your domain is ready:

1. Create a file named `CNAME` in the repo root containing only your domain, e.g.:
   ```
   www.example.com
   ```
2. In name.com DNS settings, add records pointing at GitHub Pages:
   - **CNAME** record: `www` → `<username>.github.io`
   - Optional apex/root (`example.com`) via four **A** records to GitHub Pages IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. In **Settings → Pages → Custom domain**, enter the domain and enable **Enforce HTTPS**.

DNS changes can take up to a few hours to propagate.
