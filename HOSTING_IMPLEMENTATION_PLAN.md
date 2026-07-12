# Hosting Implementation Plan — nitheeskanna Portfolio

**Goal:** Get `index.html` (and its assets) live on the internet at your own custom domain, using GitHub Pages for hosting and name.com (via the GitHub Student Developer Pack) for the domain.

You already have Git and a GitHub account set up, so this plan skips those installs and goes straight to deployment.

---

## 0. What you're actually deploying (read this first)

Your site is a **static site** — plain HTML, CSS, and JavaScript, no backend, no database, no build step. That's the easiest possible thing to host, and GitHub Pages is a perfect fit for it.

Files that make up the site (found in `D:\Portfolio`):

- `index.html` — the page
- `styles.css`, `script.js` — styling and behavior
- `logo.png`, `nithees_bw.png`, `white_bat_symbol.png` — images
- `lovelace.mp4` — the Project Lovelace demo video
- `movies/Anbe_sivam/poster.jpg` — image used in the "fun" section
- `test.pdf` — looks like your resume, linked from the page
- The rest of the page's images (Unsplash photos) are loaded from external URLs, so you don't need to upload those yourself.

**Important — clean this up before you push anything to GitHub:**

1. There's a `.gemini` folder inside `D:\Portfolio` containing a Chrome browser profile (extensions, cached files — over 1,700 files). This is **not part of your website** — it's leftover data from a different tool. Do not upload it to GitHub. Step 1 below shows you how to exclude it.
2. A few project cards (04, 05–10) have their GitHub link set to `#` (a placeholder that goes nowhere). Decide if you want to link real repos or remove the icon before launch.
3. The "Get in touch" mailto links point to `nithees2424@gmail.com` — double check that's the address you want people to email (it's not the address associated with this session, `nithees4242@gmail.com`, so worth a quick sanity check).
4. `lovelace.mp4` — check its file size (right-click the file in File Explorer → Properties). GitHub hard-blocks any single file over 100 MB, and repos start warning you above 50 MB per file. If the video is large:
   - Compress it (e.g. with HandBrake, or `ffmpeg -crf 28`), or
   - Host it externally (YouTube unlisted, or Cloudflare Stream) and swap the `<video>` tag for an embed.
   Do this check now — it's much easier than fixing it after the repo is already tracking a giant file.
5. There's no favicon (`<link rel="icon">`) in the `<head>`. Not required, but nice to add — a `favicon.png`/`favicon.ico` in the folder plus one line in `index.html`.

---

## 1. Prepare the repository

GitHub Pages serves a repo's contents as a website. For a *personal* site tied to your account root domain, GitHub has a special repo name convention: `<your-github-username>.github.io`.

1. On GitHub, create a **new, empty, public repository** named exactly:
   ```
   <your-username>.github.io
   ```
   (Replace `<your-username>` with your actual GitHub username. Don't add a README/gitignore/license during creation — you'll push existing files.)

2. On your machine, open a terminal in `D:\Portfolio` and initialize git (skip `git init` if it's already a repo):
   ```bash
   cd D:\Portfolio
   git init
   ```

3. Create a `.gitignore` file in `D:\Portfolio` so the `.gemini` folder (and any other junk) never gets committed:
   ```
   .gemini/
   node_modules/
   .DS_Store
   Thumbs.db
   ```

4. Stage, commit, and push:
   ```bash
   git add .
   git commit -m "Initial portfolio commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```

   If `git status` still shows `.gemini` files after adding `.gitignore`, run `git rm -r --cached .gemini` once, then commit again — this untracks it without deleting it from your disk.

---

## 2. Turn on GitHub Pages

1. In your repo on GitHub, go to **Settings → Pages**.
2. Under "Build and deployment", set **Source** to `Deploy from a branch`.
3. Set **Branch** to `main` and folder to `/ (root)`. Save.
4. Wait 1–2 minutes, then visit `https://<your-username>.github.io`. Your site should be live there already, before you even touch a custom domain.

---

## 3. Buy your domain (name.com, via GitHub Student Developer Pack)

Since you have GitHub Student Developer Pack access, name.com's education offer gives students a free domain (one of ~25 eligible TLDs, like `.dev`, `.app`, `.studio`, etc.) for the first year:

1. Go to `education.github.com/pack` and confirm your Student Pack is active.
2. From the pack, find the **name.com** offer (or go directly to `name.com/partner/github-students`) and sign in/link your GitHub account to claim it.
3. Search for and register your domain (e.g. `nitheeskanna.dev`). Note the exact TLD you pick — eligibility for the free year is limited to specific extensions, so confirm the price shows $0 before checking out.
4. Keep the name.com account login handy — you'll need its DNS management screen next.

---

## 4. Point your domain at GitHub Pages (DNS)

You need two things: your **apex domain** (`nitheeskanna.dev`) to point at GitHub's servers via A records, and `www.nitheeskanna.dev` to point at your GitHub Pages URL via a CNAME record.

1. In name.com, open **My Domains → (your domain) → DNS Records**.
2. Add four **A records**, host `@`, pointing to GitHub Pages' IP addresses:
   ```
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```
3. Add one **CNAME record**, host `www`, pointing to:
   ```
   <your-username>.github.io
   ```
4. (Optional, IPv6) Add AAAA records, host `@`:
   ```
   2606:50c0:8000::153
   2606:50c0:8001::153
   2606:50c0:8002::153
   2606:50c0:8003::153
   ```
5. Back on GitHub: **Settings → Pages → Custom domain**, type in `nitheeskanna.dev`, and save. GitHub will automatically commit a `CNAME` file to your repo root — don't delete it later.
6. DNS changes can take anywhere from a few minutes to 24 hours to propagate. Check status with a tool like `dnschecker.org`, or just keep refreshing.
7. Once GitHub verifies the domain (a checkmark appears on the Pages settings screen), tick **Enforce HTTPS**. GitHub auto-issues a free SSL certificate — this step just makes sure visitors are always redirected to `https://`.

---

## 5. Verify everything works

Go through this checklist once the domain resolves:

- [ ] `https://nitheeskanna.dev` loads the site
- [ ] `https://www.nitheeskanna.dev` also loads (redirects to the apex, or vice versa — GitHub handles this automatically)
- [ ] Padlock/HTTPS shows as secure, no mixed-content warnings
- [ ] All nav links scroll to the right sections (About, Journey, Projects, Certifications, Contact)
- [ ] `lovelace.mp4` actually plays inline and isn't broken
- [ ] `test.pdf` opens correctly when clicked
- [ ] The "Get in touch" mailto links open a compose window with the correct address
- [ ] GitHub project links (Project Lovelace, Orchestra-RAG, AI Workflow Identifier) go to the right repos
- [ ] Open Chrome DevTools → Console: confirm there are no 404s for missing assets
- [ ] Run a quick Lighthouse/PageSpeed check (Chrome DevTools → Lighthouse tab) — the video is the biggest performance risk on this page, so keep an eye on the load time score

---

## 6. Making updates after launch

Every future change is just:

```bash
git add .
git commit -m "Describe what changed"
git push
```

GitHub Pages automatically rebuilds and redeploys within about a minute of every push to `main`. No servers to manage, no manual redeploy step.

---

## 7. Optional next steps (not required to go live)

- Add a `favicon.ico`/`favicon.png` and reference it in `<head>`.
- Add a custom `404.html` in the repo root for broken links.
- Submit the site to **Google Search Console** (verify ownership via a DNS TXT record on name.com) so it gets indexed by Google.
- Add lightweight analytics (Plausible, Fathom, or GA4) if you want visitor stats.
- Add Open Graph meta tags (`og:title`, `og:image`, etc.) so the link looks good when shared on LinkedIn/Twitter/WhatsApp.

---

### Sources used for the DNS/domain facts above
- [Managing a custom domain for your GitHub Pages site — GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [About custom domains and GitHub Pages — GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [Name.com: Free Domain for Students](https://www.name.com/partner/github-students)
- [GitHub Student Developer Pack — GitHub Education](https://education.github.com/pack)
