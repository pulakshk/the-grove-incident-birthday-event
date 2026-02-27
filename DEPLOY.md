# Deploy Guide (No Serverless, Static Mapping)

## 1) Architecture now
- `GitHub Pages`: hosts the invite site (`index.html`, `minisite.html`, `site-config.js`).
- `Google Form + Google Sheet`: stores RSVP submissions.
- Character generation is static and deterministic from the guest roster in `minisite.html`.

No API keys and no backend needed.

## 2) Push to GitHub
From `/Users/pocketfm/Documents/birthday`:

```bash
git add .
git commit -m "Switch to static roster mapping + improved game + sheet RSVP"
git remote add origin <your-github-repo-url>   # skip if already added
git push -u origin main
```

If `origin` already exists:

```bash
git remote set-url origin <your-github-repo-url>
git push -u origin main
```

## 3) Enable GitHub Pages
1. Open your repo on GitHub.
2. Go to `Settings -> Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main`, folder: `/ (root)`.
5. Save.

Site URL format:
`https://<username>.github.io/<repo>/`

## 4) Create RSVP form and sheet
1. Create a Google Form with these fields:
- Name
- Role
- Alias
- RSVP status
- ETA
- Corporate superpower
- Live mission task

2. In the form, open `Responses` and click `Link to Sheets`.
3. This linked Google Sheet is where responses are stored.

## 5) Configure `site-config.js`
Edit `/Users/pocketfm/Documents/birthday/site-config.js`:
- `rsvpFormUrl`: your form `.../viewform` URL
- `rsvpFormActionUrl`: your form `.../formResponse` URL
- `rsvpFields`: correct `entry.xxxxx` IDs for each form field

## 6) How to get `entry.xxxxx` IDs
1. In Google Form, click menu -> `Get pre-filled link`.
2. Fill sample values and generate link.
3. URL params look like `entry.123456789=value`.
4. Copy these IDs into `site-config.js`.

Example:

```js
rsvpFields: {
  name: "entry.123456789",
  role: "entry.987654321",
  alias: "entry.111222333",
  attendance: "entry.444555666",
  eta: "entry.777888999",
  superpower: "entry.222333444",
  task: "entry.555666777"
}
```

## 7) Verify end-to-end
1. Open your GitHub Pages URL.
2. Complete profile and game.
3. Character dossier should appear without any API call.
4. Set RSVP status + ETA.
5. Click the single `RSVP to Confirm` button.
6. Confirm row appears in your linked Google Sheet.
7. If direct submit is blocked by a browser, the site auto-opens the backup prefilled Google Form tab.
