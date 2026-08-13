# lp-webapp
Landing Pages SPA for MarianaTek clients.

## Up and running

- `npm install`
- Copy env template: `cp .env.example .env` (fill in values as needed)
- Serve with hot reload at localhost:8080: `npm run dev`

# Build Setup
- build for production with minification - `npm run build`
- build for staging with minification - `npm run build-staging`


# DEPLOY to S3
- build for production with minification - `npm run deploy-prod`
- build for staging with minification - `npm run deploy-prod`

or

After the build completes and drops the files in `/dist/`,
simply upload the JS and CSS files to s3 under the bucket
`assets.brandbot.com` in the `landing-page-service` directory.
Since we remove cache-busting, you may need to invalidate the cache in cloudfront.

## Environment variables

| Variable                   | Role                                                                 |
| -------------------------- | -------------------------------------------------------------------- |
| `CONFIGCAT_SDK_KEY`        | ConfigCat SDK key for feature flags (e.g. `landingPageTranslations`) |
| `VUE_APP_CROWDIN_CDN_URL`  | Crowdin distribution URL for non-English locale JSON                 |

See [`.env.example`](.env.example) for local setup.

## Landing Page i18n

System translation keys for the Landing Page UI are externalized via vue-i18n, with English bundled in `src/i18n/locales/en.json` and other locales loaded from Crowdin CDN when feature flags allow.

- [documentation/landing-page-i18n-translation-keys.md](documentation/landing-page-i18n-translation-keys.md) — Key registry (`labels`, `buttons`, `errors`), defaults, and component usage.
- [documentation/feature-flags.md](documentation/feature-flags.md) — `landingPageTranslations` (global bootstrap vs per-account).
- [documentation/translation-loader-setup.md](documentation/translation-loader-setup.md) — Crowdin CDN, supported locales, `?lang=`, and cache.
