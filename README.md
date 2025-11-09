
# AIS Practice (IXL-style static scaffold)

This starter lets you build a professional practice site where **each topic is its own standalone HTML file**—simple to author, easy to host.

## Structure
```
/ixl-lite
  /chapters/grade3/
    addition.html
    fractions_like_denom.html
  /engine/
    core.js
    ui.js
    router.js
  /assets/
    styles.css
  /data/
    addition.json
    fractions_like_denom.json
  index.html
  manifest.json
```
- `index.html` is the catalog. It reads `manifest.json` and renders topic cards.
- Topic HTML pages reference shared engine files but remain independent.
- Questions live in `/data/*.json`—non-dev friendly.

## Add a new topic
1. Duplicate any topic HTML inside `/chapters/<grade>/your_topic.html`.
2. Set `TOPIC_ID` inside the page, and point its `dataUrl` to `/data/your_topic.json`.
3. Create `/data/your_topic.json` like `{ "prompt":"...", "answer":"...", "hint":"..." }`.
4. Append an entry to `manifest.json`:
```json
{ "slug":"grade3/your_topic", "title":"Grade 3 • Your Topic", "tags":["grade3"], "level":"Easy" }
```

## Deploy
Static hosting: Vercel, Netlify, GitHub Pages, S3.

## Scale later
Add a backend for per-student analytics, auth, badges. Keep topic files as static if you want offline-friendly pages.
