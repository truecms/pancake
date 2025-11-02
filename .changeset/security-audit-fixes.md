---
"@truecms/pancake-js": patch
"@truecms/syrup": patch
---

- Upgrade the JS bundler to esbuild 0.25.x so recent npm advisories are addressed without changing emitted bundles.
- Replace the legacy request client in syrup with @cypress/request to pull in patched form-data and tough-cookie dependencies.
