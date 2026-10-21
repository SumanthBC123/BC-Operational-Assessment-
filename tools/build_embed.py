#!/usr/bin/env python
"""Build squarespace-embed.html (the Squarespace Code Block version) from the
standalone source files, so the two never drift apart.

    python tools/build_embed.py --endpoint https://YOUR-SITE.netlify.app/api/lead

Inputs : index.html, styles.css, assessment-data.js, script.js
Output : squarespace-embed.html  (paste the whole file into one Code Block)
"""
import argparse
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCOPE = '#wf-assessment'

# Rules that belong to the standalone page only (page chrome, cookie banner,
# policy page, prototype banner). The confirm overlay is re-added below as a
# viewport-fixed block outside the scope.
SKIP_PREFIXES = ('.confirm-', '.cookie-', '.policy', '.mock-banner', '.topbar', '.logo-')


def read(name):
    with open(os.path.join(ROOT, name), encoding='utf-8') as f:
        return f.read()


def split_blocks(css):
    """Yield (prelude, body) for each top-level rule, comments removed."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    i, n = 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j == -1:
            break
        prelude = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == '{':
                depth += 1
            elif css[k] == '}':
                depth -= 1
            k += 1
        yield prelude, css[j + 1:k - 1].strip()
        i = k


def scope_selector(sel):
    sel = sel.strip()
    if sel == ':root':
        return SCOPE
    if sel == '*':
        return f'{SCOPE}, {SCOPE} *'
    if sel == 'body':
        return None
    return f'{SCOPE} {sel}'


def scope_css(css):
    out = []
    for prelude, body in split_blocks(css):
        if prelude.startswith('@media'):
            inner = scope_css(body)
            if inner.strip():
                out.append(f'{prelude} {{\n{inner}\n}}')
            continue
        if prelude.startswith('@keyframes'):
            out.append(f'{prelude} {{ {body} }}')
            continue
        selectors = [s.strip() for s in prelude.split(',')]
        scoped = []
        for s in selectors:
            if s.startswith(SKIP_PREFIXES):
                continue
            r = scope_selector(s)
            if r:
                scoped.append(r)
        if scoped:
            out.append(f'{", ".join(scoped)} {{ {body} }}')
    return '\n'.join(out)


OVERLAY_CSS = """
/* Confirm dialog: viewport-fixed, so deliberately outside the #wf-assessment scope */
.wfa-confirm-overlay { position: fixed; inset: 0; background: rgba(31, 43, 58, 0.45); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 9998; }
.wfa-confirm-overlay[hidden] { display: none; }
.wfa-confirm-modal { background: #fff; border-radius: 10px; padding: 24px; max-width: 380px; width: 100%; box-shadow: 0 12px 32px rgba(31, 43, 58, 0.22); font-family: 'Raleway', sans-serif; }
.wfa-confirm-modal p { margin: 0 0 18px; color: #1f2b3a; font-size: 0.96rem; line-height: 1.5; }
.wfa-confirm-actions { display: flex; justify-content: flex-end; gap: 10px; }
.wfa-confirm-actions .btn { display: inline-flex; align-items: center; justify-content: center; border: none; border-radius: 8px; padding: 10px 20px; font-size: 0.94rem; font-weight: 600; cursor: pointer; font-family: 'Space Grotesk', sans-serif; }
.wfa-confirm-actions .btn:focus-visible { outline: 2px solid #2c8c84; outline-offset: 2px; }
.wfa-confirm-actions .btn-primary { background: #37aea4; color: #fff; }
.wfa-confirm-actions .btn-primary:hover { background: #2c8c84; }
.wfa-confirm-actions .btn-secondary { background: transparent; color: #2d4a6e; border: 1.5px solid #dfe6ec; }
"""

# Squarespace themes style headings, links, lists and buttons globally. Re-assert
# the assessment's own typography inside the scope so the page keeps its design.
SQS_RESETS = """
#wf-assessment { font-family: 'Raleway', sans-serif; color: var(--ink); background: var(--bg); line-height: 1.4; text-align: left; }
#wf-assessment h1, #wf-assessment h2, #wf-assessment h3, #wf-assessment h4 { text-transform: none; letter-spacing: normal; }
#wf-assessment button { font-family: inherit; }
#wf-assessment .btn { font-family: 'Space Grotesk', sans-serif; }
#wf-assessment .option, #wf-assessment .industry-card { font-family: 'Raleway', sans-serif; }
#wf-assessment .industry-card { font-family: 'Space Grotesk', sans-serif; }
#wf-assessment a.btn { text-decoration: none; }
#wf-assessment .wfa-footnote a { color: #2c8c84; text-decoration: underline; }
#wf-assessment .wfa-footnote a:focus-visible { outline: 2px solid #2c8c84; outline-offset: 2px; }
"""


def extract_body_markup(html):
    main = re.search(r'<main>(.*?)</main>', html, flags=re.S).group(1)
    # footer: keep the informational line and the Privacy Policy link only
    foot = (
        '<p class="wfa-footnote">This review is provided for informational purposes only. '
        '<a href="https://www.bchanel.com/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a></p>'
    )
    return main.strip(), foot


def build_js(endpoint):
    data = read('assessment-data.js')
    script = read('script.js')
    # The app boots from a DOMContentLoaded listener; inside a Code Block the DOM
    # already exists, so run the same body immediately.
    assert "document.addEventListener('DOMContentLoaded', () => {" in script
    script = script.replace("document.addEventListener('DOMContentLoaded', () => {", '(() => {', 1)
    assert script.rstrip().endswith('});')
    script = script.rstrip()[:-3] + '})();\n'
    return (
        "(function () {\n"
        "'use strict';\n"
        f"window.WFA_LEAD_ENDPOINT = {endpoint!r};\n"
        "function boot() {\n"
        "// Theme wrappers can apply transforms that break position:fixed, so mount the dialog on <body>.\n"
        "var overlay = document.getElementById('confirm-overlay');\n"
        "if (overlay && overlay.parentNode !== document.body) document.body.appendChild(overlay);\n"
        f"{data}\n{script}\n"
        "}\n"
        "if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);\n"
        "else boot();\n"
        "})();"
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--endpoint', default='REPLACE_WITH_NETLIFY_URL/api/lead')
    args = ap.parse_args()

    html = read('index.html')
    css = scope_css(read('styles.css'))
    main_markup, footer = extract_body_markup(html)
    main_markup = main_markup.replace('<section id="screen-hero"', '<section id="screen-hero"')

    overlay_html = (
        '<div id="confirm-overlay" class="wfa-confirm-overlay" hidden>\n'
        '  <div class="wfa-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-message">\n'
        '    <p id="confirm-message"></p>\n'
        '    <div class="wfa-confirm-actions">\n'
        '      <button id="confirm-cancel" class="btn btn-secondary" type="button">Cancel</button>\n'
        '      <button id="confirm-ok" class="btn btn-primary" type="button">Continue</button>\n'
        '    </div>\n'
        '  </div>\n'
        '</div>'
    )

    out = f"""<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Raleway:wght@400;500;600;700&display=swap" rel="stylesheet">

<style>
{css}
{SQS_RESETS}
{OVERLAY_CSS}
</style>

<div id="wf-assessment">
{main_markup}
{footer}
</div>

{overlay_html}

<script>
{build_js(args.endpoint)}
</script>
"""
    with open(os.path.join(ROOT, 'squarespace-embed.html'), 'w', encoding='utf-8') as f:
        f.write(out)
    print('wrote squarespace-embed.html', len(out), 'bytes; endpoint =', args.endpoint)


if __name__ == '__main__':
    main()
