# Import/XSS and secret review

Scope: Markdown notes, Mermaid, Excalidraw native imports/paste/restoration, SVG image previews, the Patterns sandbox, workspace JSON import validation, raw HTML/JSON-LD sinks and secret handling in source/build/CI. All work and tests are local; no push, deploy or production changes.

## Confirmed issue and correction

A crafted Excalidraw file could put an HTTP URL in a file's dataURL field. Native file import bypassed the existing text-paste guard. A browser regression reproduced a request to /api/version?imported-image on drop, before the fix. Such references can trigger authenticated GET requests or attempted external requests without the expected disclosure.

The existing Excalidraw build adapter now guards the shared Image.src assignment. Only embedded image data and same-origin blob URLs are allowed. This covers native pickers, drops, pasted scenes and embedded scene metadata without replacing the editor's UI. Unsafe images remain unavailable instead of being fetched. The adapter checks both development and production distributions and fails the build if the upstream image sink changes; its tests must be retained when upgrading Excalidraw.

Mermaid's resource syntax filter now normalizes CSS escapes and comments, including escapes inside JSON configuration, before checking url/import/image constructs. Strict Mermaid sanitization remains enabled. The new tests cover escaped resource URLs, executable HTML in Markdown, SVG image isolation and sandbox access to parent DOM/storage/cookies. This is not a claim that an executable XSS was found: the reproduced drawing issue is an unwanted-resource request, while the other cases guard security boundaries.

## Secrets

Gitleaks 8.30.1 was downloaded from the official release and checked against its published SHA-256 checksum. Scans used full redaction and local reports, with no uploading of repository contents or candidate values.

- All 655 commits reachable through local refs: no detected leaks.
- Snapshot of current tracked and non-ignored files: no detected leaks.
- Built browser JavaScript: four scanner alerts were triaged. Two were minified-code/catalog matches, one spanned a PEM input placeholder (no complete private-key PEM payload), and one was the published Firebase client configuration shipped by the Excalidraw dependency, not a HIOS credential. No broad scanner allowlist was added. Firebase documents the distinction between client configuration and secrets: https://firebase.google.com/docs/projects/learn-more and https://firebase.google.com/docs/projects/api-keys.
- Application environment-variable usages were reviewed: GitHub/Turnstile secrets are server-side; client references are the public Turnstile site key and deployment version.
- CI now scans full fetched Git history before tests/deployment, using a fixed scanner version and pinned archive checksum, with redacted output.
- .env variants and .dev.vars variants are ignored, retaining explicit example-file exceptions. Examples remain subject to scanning.

No credential rotation or history rewriting was performed because no leaked credential was identified. Scanning cannot prove the absence of all secrets, and this review does not audit Cloudflare/GitHub account permissions or ignored personal credentials.

## Validation

See npm run test:import-security, npm run test:mermaid and tests/security-imports.spec.ts. The new browser suite is included alongside existing dependency/local-input tests in CI.

Validation completed: lint, 46 self-test groups, OpenNext production build, 16 browser scenarios (new import/XSS tests plus existing local-input/dependency regressions), and all 7 API security scenarios on the local Worker/D1 passed. API integration tests are now excluded from the lightweight self-test discovery and remain a separate required Worker check in CI; the dev variant exhibited a connection reset after an oversized request during the initial combined run.
