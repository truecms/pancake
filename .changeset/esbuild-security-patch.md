---
"@truecms/pancake-js": patch
"@truecms/syrup": patch
---

- Upgrade @truecms/pancake-js dependency on `esbuild` to `^0.25.x` to address dev-server advisory (GHSA-67mh-4wv8-2f99) without changing emitted bundles.
- Ensure `@truecms/syrup` patch version to capture dependency hygiene improvements alongside the security roll-up.
