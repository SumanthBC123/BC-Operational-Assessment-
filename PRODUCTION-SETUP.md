# Workflow Assessment: production setup

The assessment runs as a Squarespace page at `/workflow-assessment` (Code Block).
Submissions go to a small Netlify function (`/api/lead`), which validates them
and forwards them to Make, which writes the Google Sheet. The Make webhook URL
never appears in browser code.

```
Visitor -> Squarespace page (squarespace-embed.html)
        -> POST https://<netlify-site>/api/lead   (validation, honeypot, rate limit)
        -> Make webhook (API key header)          (secret, server side only)
        -> Google Sheet "Submissions"
```

## 1. Netlify (endpoint)

1. In Netlify choose **Add new site > Import from Git**, pick the
   `BC-Operational-Assessment-` repo and the `production` branch. No build command,
   publish directory `.` (already in `netlify.toml`).
2. **Site configuration > Environment variables** (mark them as secrets):

   | Variable | Value |
   |---|---|
   | `MAKE_WEBHOOK_URL` | the Make webhook address |
   | `MAKE_API_KEY` | the key from Make step 3 below (add after step 3) |
   | `ALLOWED_ORIGINS` | `https://www.bchanel.com,https://bchanel.com` |
   | `RATE_SALT` | any long random string |

3. Deploy, then note the site address (for example `https://xyz.netlify.app`).
4. Rebuild the embed with that address and paste the result into the Squarespace Code Block:

   ```
   python tools/build_embed.py --endpoint https://xyz.netlify.app/api/lead
   ```

Rate limits (per hashed IP and per hashed email, stored in Netlify Blobs):
5 submissions per 10 minutes and 15 per hour per IP, 3 per day per email.

## 2. Squarespace

1. Create the page, URL slug `workflow-assessment`.
2. Page settings > SEO: title `Workflow Automation Assessment | BChanel`, description
   `Select one recurring workflow, answer five short questions, and see how BChanel solved a comparable operational problem and what a similar workflow could include for your team.`
   Social image: upload `og-image.png`. Favicon is site-wide.
3. Add one Code Block and paste the whole of `squarespace-embed.html`.
4. Create the `/privacy-policy` page from the approved policy text.
5. Cookie consent (site-wide): paste `squarespace-site-consent.html` into
   **Settings > Developer Tools > Code Injection > Header**, and turn off the
   Squarespace Google Analytics integration so page views are not counted twice.
   The snippet sets Google Consent Mode defaults to denied before GA loads, shows the
   banner (Accept Analytics, Reject Non-Essential Cookies, Privacy Policy), and
   remembers the choice.

## 3. Make

The scenario mappings and data structure are already updated (Q4 join, UTM term and
content, workflow ID, annual effort, internal score and priority, case URL, consent).
After the Netlify endpoint is live, protect the webhook so the old public address stops
working: open the webhook in Make, enable **API key authentication**, create a key, and
put it in the `MAKE_API_KEY` variable above.

## 4. Tests

```
npm install
npm test                                  # validation tests
node tests/lead-endpoint.test.mjs         # endpoint tests with a mock webhook
```
