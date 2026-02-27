# Deploy Guide (GitHub Pages + Gemini Proxy + Google Sheet RSVP)

## 1) What is being hosted where
- `GitHub Pages`: serves the invite UI (`minisite.html`, `site-config.js`, styles, JS).
- `Cloudflare Worker`: serverless proxy that calls Gemini using your API key safely.
- `Google Form + Google Sheet`: RSVP collection.

You cannot safely call Gemini directly from GitHub Pages because the API key would be exposed.

## 2) Prepare the repo
From `/Users/pocketfm/Documents/birthday`:

```bash
git init
git add .
git commit -m "Birthday invite v2: game unlock + AI dossier + RSVP"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

## 3) Enable GitHub Pages
1. Open repo on GitHub.
2. Go to `Settings -> Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main`, Folder: `/ (root)`.
5. Save.

Your site URL will be like:
`https://<username>.github.io/<repo>/minisite.html`

## 4) Deploy the Gemini serverless proxy (Cloudflare Worker)

Prerequisites:
- Cloudflare account
- Node installed locally

Commands:

```bash
npm install -g wrangler
wrangler login
```

From repo root (`/Users/pocketfm/Documents/birthday`):

```bash
wrangler secret put GEMINI_API_KEY
# paste your Gemini key when prompted

wrangler deploy
```

After deploy, copy your Worker URL, e.g.
`https://grove-character-proxy.<subdomain>.workers.dev`

The API endpoint used by the site is:
`https://grove-character-proxy.<subdomain>.workers.dev/api/character`

## 5) Configure `site-config.js`
Edit `/Users/pocketfm/Documents/birthday/site-config.js`:
- `apiUrl` -> your Worker `/api/character` URL.
- `rsvpFormUrl` -> your Google Form `viewform` URL.
- `rsvpFields` -> entry IDs from your prefilled form URL.

Commit and push after editing:

```bash
git add site-config.js
git commit -m "Configure production API + RSVP form"
git push
```

## 6) Create RSVP form that auto-collates into a Sheet
1. Create a Google Form with fields:
- Name
- Role
- Alias
- Attending

2. In Form, open `Responses` tab -> click `Link to Sheets`.
3. This creates a connected Sheet where all submissions auto-append.

## 7) Get Form entry IDs (for prefill)
1. In Google Form, click 3-dot menu -> `Get pre-filled link`.
2. Fill sample values and click `Get link`.
3. The generated URL has params like `entry.123456789=value`.
4. Map those IDs into `site-config.js`:

```js
rsvpFields: {
  name: "entry.123456789",
  role: "entry.987654321",
  alias: "entry.111222333",
  attendance: "entry.444555666"
}
```

Now the RSVP button opens form with values already filled.

## 8) Quick validation checklist
1. Open `minisite.html` on your GitHub Pages URL.
2. Fill profile and finish the runner game.
3. Verify AI character appears.
4. Click RSVP and check fields are prefilled.
5. Submit form and verify row appears in linked Google Sheet.

## 9) Optional hardening
- In Worker, restrict CORS `Access-Control-Allow-Origin` to your exact GitHub Pages origin.
- Add rate limiting to Worker if link is shared widely.
