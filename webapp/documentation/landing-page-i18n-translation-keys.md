# Landing Page i18n – Translation Key Registry

This document is the canonical reference for all system translation keys used in the Landing Page webapp. It aligns with the strings externalized in `src/i18n/locales/en.json` and supports Crowdin-based translations with English as the default and fallback locale.

## Key namespaces

| Namespace   | Purpose                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| `labels.*`  | Product summary, tax info, help footer, checkout loading states, success/redirect messages |
| `buttons.*` | Sign-in and create-account button labels on the Act Fast step                              |
| `errors.*`  | Client-side cart/checkout errors and backend API error keys (including `errors.error.lp.*`) |

---

## Keys by namespace

### labels.*

| Key                              | Default (English)                                              | Used in                          | Parameters   |
| -------------------------------- | -------------------------------------------------------------- | -------------------------------- | ------------ |
| `labels.onlyRemaining`           | Only {count} remaining                                         | Summary.vue                      | `count`      |
| `labels.outOfStock`              | This item is out of stock!                                     | Summary.vue                      |              |
| `labels.priceIncludesTax`        | Price includes tax                                             | Summary.vue, ActFast.vue         |              |
| `labels.priceExcludesTax`        | Price does not include tax                                     | Summary.vue, ActFast.vue         |              |
| `labels.needHelpEmail`           | Need help? Email us at                                         | HelpFooter.vue                   |              |
| `labels.needHelpCall`            | Need help? Call us at                                          | HelpFooter.vue                   |              |
| `labels.needHelpEmailAndCall`    | Need help? Email us at {email} or call us at {phone}           | HelpFooter.vue (`<i18n>`)        | `email`, `phone` (slots) |
| `labels.signInWithCredentials`   | Sign In with your {brand} credentials                          | ActFast.vue                      | `brand`      |
| `labels.purchaseSuccessful`      | Your purchase was successful.                                  | Success.vue                      |              |
| `labels.redirecting`             | You will be redirected in 3 seconds...                       | Success.vue                      |              |
| `labels.fetchingData`            | Fetching data...                                               | MTCheckout.vue                   |              |
| `labels.buildingCart`            | Building cart...                                               | MTCheckout.vue                   |              |
| `labels.finalizingCart`          | Finalizing cart...                                             | MTCheckout.vue                   |              |
| `labels.loadingCheckout`         | Loading Checkout...                                            | MTCheckout.vue                   |              |
| `labels.loadingNote`             | Note: this can take up to 10 seconds                           | MTCheckout.vue                   |              |

### buttons.*

| Key                     | Default (English) | Used in    |
| ----------------------- | ----------------- | ---------- |
| `buttons.signIn`        | Sign In           | ActFast.vue |
| `buttons.createAccount` | Create Account    | ActFast.vue |

### errors.*

Used for client-side messages and API error keys. When the backend returns `error_key` (dot notation, e.g. `error.lp.not_found`), the frontend resolves it as `errors.${errorKey}` via `ts()`; otherwise it falls back to the API `message` or inline fallback.

| Key                                      | Default (English)                                          | Used in                              |
| ---------------------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `errors.buildingCart`                    | Error building cart.                                       | MTCheckout.vue                       |
| `errors.applyingDiscount`                | Error applying discount to cart.                           | MTCheckout.vue                       |
| `errors.error.lp.permission_denied`      | Do not have right permissions to use this page.            | Backend / LandingPage.vue, MTCheckout.vue |
| `errors.error.lp.capture_view_failed`    | Could not capture LP view.                                 | Backend / MTCheckout.vue           |
| `errors.error.lp.capture_checkout_failed`| Could not complete LP checkout.                            | Backend                              |
| `errors.error.lp.cart_build_failed`      | Could not build cart.                                      | Backend                              |
| `errors.error.lp.discount_failed`        | Could not apply discount.                                  | Backend                              |
| `errors.error.lp.not_found`              | Landing page not found.                                    | Backend / LandingPage.vue            |
| `errors.error.server`                    | Something went wrong. Please try again later.              | Backend                              |

---

## Content not in this registry

The following come from the landing-page API (`parameters`) and are **not** system translation keys:

- `parameters.name`, `parameters.description` (may include HTML)
- `parameters.button_text`
- `parameters.success` (custom success message when `redirect` is false)

---

## Components using translations

| Component      | `loadTranslationsFlag` | `ts()` / `<i18n>` |
| -------------- | ------------------------ | ----------------- |
| Summary.vue    | Yes (`account_id`)       | Yes               |
| ActFast.vue    | Yes                      | Yes               |
| HelpFooter.vue | Yes (`accountId` prop)   | Yes / `<i18n>`    |
| Success.vue    | Yes                      | Yes               |
| MTCheckout.vue | Yes                      | Yes               |
| LandingPage.vue| Yes (in `getParameters`) | Errors only       |

`MTLogin.vue`, `MTSignUp.vue`, and `Hidden.vue` do not use the translation mixin.

---

## Special cases

### `labels.needHelpEmailAndCall`

Rendered with vue-i18n’s `<i18n>` component (not `ts()`) so email and phone links can be slotted into the sentence. Translators must preserve the `{email}` and `{phone}` slot placeholders in Crowdin.

### `labels.onlyRemaining` and `labels.signInWithCredentials`

Use `ts(key, fallback, params)` with `{count}` and `{brand}` respectively. Params are interpolated in both the fallback (flag off) and translated string (flag on).

### Backend error keys

API responses may include `error_key` (e.g. `error.lp.not_found`). [`api/index.js`](../src/api/index.js) attaches this as `err.errorKey`. Components resolve:

```javascript
this.ts(`errors.${errorKey}`, message)
```

---

## Key naming conventions

1. **Namespaces**
   Use a single top-level namespace per category: `labels`, `buttons`, `errors`. Backend error keys are nested under `errors.error.lp.*` (and `errors.error.server` for generic server errors).

2. **Key format**
   Use camelCase for key segments (e.g. `priceIncludesTax`, `purchaseSuccessful`). Backend error keys use snake_case (e.g. `permission_denied`, `not_found`) and are nested under `errors.error.lp.*`.

3. **Adding new keys**
   - Add the key to this registry with default English text and “Used in” location.
   - Add the entry to `src/i18n/locales/en.json` (and Crowdin source).
   - Use `ts(key, fallback)` or `ts(key, fallback, params)` in components so behavior when the feature flag is off or translation is missing remains correct.

4. **Adding new languages**
   Add locale JSON via Crowdin CDN (see [translation-loader-setup.md](translation-loader-setup.md)). No code refactor is required for locales already listed in `localeConstants.js`; extend that list if adding a new supported locale.

5. **Parameters**
   Keys that support interpolation (e.g. `labels.onlyRemaining` with `{count}`) must document parameter names so translators can use them correctly.

---

## Related documentation

- [feature-flags.md](feature-flags.md) – `landingPageTranslations` flag and ConfigCat (global vs per-account).
- [translation-loader-setup.md](translation-loader-setup.md) – Crowdin CDN, language detection, and caching.
