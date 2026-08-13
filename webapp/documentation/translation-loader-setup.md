# Translation loader setup – Landing Page webapp

Non-English strings are loaded at runtime from Crowdin’s CDN. English defaults are bundled in [`src/i18n/locales/en.json`](../src/i18n/locales/en.json).

## Environment variable

| Variable                   | Purpose |
| -------------------------- | ------- |
| `VUE_APP_CROWDIN_CDN_URL`  | Crowdin distribution base URL (no trailing slash required) |

Example (local): see [`.env.example`](../.env.example).

In deployed environments, the URL is injected at build time from AWS SSM: `/landing-page-service/{stage}/VUE_APP_CROWDIN_CDN_URL`.

If unset or empty, `loadTranslations` returns `{}` and the app falls back to bundled English.

## Fetch URL pattern

```
{VUE_APP_CROWDIN_CDN_URL}/{locale}/messages.json
```

Example: `https://distributions.crowdin.net/{hash}/fr-CA/messages.json`

Implemented in [`src/i18n/translationLoader.js`](../src/i18n/translationLoader.js).

## Supported locales

Defined in [`src/i18n/localeConstants.js`](../src/i18n/localeConstants.js):

| Locale   | Notes |
| -------- | ----- |
| `en-US`  | Default; uses bundled `en.json`, no CDN fetch |
| `fr-CA`  | French (Canada) |
| `fr-FR`  | French (France) — `?lang=fr` with region `fr` maps here |
| `es-LA`  | Spanish (Latin America) |
| `pt-BR`  | Portuguese (Brazil) |
| `de-DE`  | German |
| `it-IT`  | Italian |
| `nl-NL`  | Dutch |
| `sv-SE`  | Swedish |
| `da-DK`  | Danish |
| `no-NO`  | Norwegian (`no`, `nb`, `nn` browser codes map here) |

Language-only codes (e.g. `de`, `it`) resolve via `DEFAULT_REGION` (e.g. `de` → `de-DE`).

## Language detection

[`src/i18n/languageDetector.js`](../src/i18n/languageDetector.js) resolves locale in order:

1. **Query param** — `?lang=fr-CA` (or `fr`, `es`, etc.; normalized to a supported locale)
2. **Browser** — `navigator.languages`, then `navigator.language`
3. **Default** — `en-US`

Detection runs inside `initI18n` only when the global `landingPageTranslations` flag is on (see [feature-flags.md](feature-flags.md)).

## Initialization and timeout

[`src/i18n/index.js`](../src/i18n/index.js) — `initI18n(useTranslations)`:

- Skips entirely when `useTranslations` is false.
- Skips CDN when detected locale is `en-US`.
- Races CDN fetch against a **3 second** timeout; on timeout, uses empty messages for that locale.
- Sets vue-i18n locale and messages; `fallbackLocale` is `en` (bundled English).

If CDN messages are empty or slow, vue-i18n falls back to English for missing keys.

## Crowdin workflow (summary)

1. Source strings live in `src/i18n/locales/en.json`.
2. Crowdin project syncs from that file (project configuration is outside this repo).
3. Published distribution exposes per-locale `messages.json` on the CDN URL above.

## Related documentation

- [landing-page-i18n-translation-keys.md](landing-page-i18n-translation-keys.md) – All keys and namespaces.
- [feature-flags.md](feature-flags.md) – When CDN loading and `ts()` are active.
