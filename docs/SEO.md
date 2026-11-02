Pitaka’s public pages are rendered to HTML during `npm run build`. The browser uses the same React components and shared metadata. Google and other crawlers can read the page without executing JavaScript. Account screens use a separate noindex app shell; authentication and database rules still control access.

Edit product facts, public page metadata, and FAQs in `src/content/site.mjs`; edit guides in `src/content/blogPosts.mjs`. Keep FAQ structured data consistent with visible answers. Only update article revision dates when the article actually changes. Check current Android availability before changing the closed-testing statement.

The build generates `sitemap.xml`, RSS, and the optional `llms.txt` summaries from this content and checks the output. If you add a public route or blog slug, add its exact rewrite to `vercel.json` and `firebase.json`; the build check detects a missing Vercel route. Unknown routes must return HTTP 404. Keep `/privacy-policy.html` available because Google Play links to it. Native builds use `build:android` or `build:ios` and retain an empty app shell.

`VITE_SITE_URL` optionally changes the canonical origin; its default is `https://pitaka-sigma.vercel.app`. Keep it set to the production origin for preview builds too. The website Pro price uses the same `VITE_PITAKA_PRO_PRICE_AMOUNT` (minor units) and `VITE_PITAKA_PRO_PRICE_CURRENCY` as the signed-in purchase screen. Match those values to the server checkout configuration. Android pricing comes from Google Play.

Validation:

- `npm run lint`
- `npm run build` (includes static SEO checks)
- `npx playwright test tests/ui/seo.spec.mjs` (uses the existing browser-test setup)

After deploying the web build:

1. Verify `/features`, `/pricing`, and a guide return their own content in View Source. Check an unknown URL returns 404, and `/settings` has a noindex response header and HTML tag.
2. Submit `/sitemap.xml` in Google Search Console. Inspect the homepage, pricing page, and an article, then request indexing. The existing Google verification HTML file is preserved.
3. Validate representative pages with Google’s Rich Results Test and Schema.org’s validator. Some schema types will not qualify for Google rich results; do not add fabricated reviews or ratings to obtain them.
4. Monitor indexing, crawl errors, and search performance. Rankings, rich results, and AI citations are determined by the consuming service and are not guaranteed.

Google says ordinary SEO practices apply to its AI features; special AI text files or AI-specific markup are not required. The optional summaries help clients that choose to read them, while the public HTML and cited sources remain authoritative. See [Google’s AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) and [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).
