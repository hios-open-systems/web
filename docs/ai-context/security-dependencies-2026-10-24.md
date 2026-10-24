# Dependency security maintenance — 2026-10-24

Baseline audit: 20 affected packages (3 critical, 12 high, 4 moderate, 1 low).
Updated lockfile audit: zero known vulnerabilities, including development dependencies.
This is dependency advisory coverage, not proof that the application has no security defects.

## Direct dependencies

- Next.js and eslint-config-next: 15.5.28, staying on the current major.
- OpenNext Cloudflare: 1.20.13; fixes the encoded-path cache interception advisory. The project enables cache interception, but its middleware handles locale routing rather than authorization.
- Wrangler: 4.152.0.
- Cloudflare Workers types: 5.20261024.1, matching Wrangler's peer requirement.
- Mermaid: 11.17.2, retaining the current major and strict rendering configuration.
- Removed @lmstudio/sdk: only `orquestador-hios.ts` used it. Even SDK 2.1.0 still requires Zod 3, which has no patched release for GHSA-mrhx-c7xc-m3w5. The script now calls LM Studio's documented local chat-completions endpoint with native fetch. Model, prompt and output path are unchanged. Requires the LM Studio server on port 1234; redirects are rejected and empty/invalid responses cannot overwrite the generated file. Tests mock the server and do not run inference or modify Android sources.

## Scoped overrides

| Consumer | Dependency | Reason |
| --- | --- | --- |
| Existing Nano ID 3 consumers | nanoid ^3.3.20 | Patched legacy/CommonJS line; replaces the old global override |
| @excalidraw/mermaid-to-excalidraw | nanoid ^5.1.16 | Replaces its pinned affected 4.0.2 with the patched ESM API; avoids forcing version 3 on this consumer |
| @node-minify/core | glob ^10.5.0 | Upstream pins affected 10.3.3; retains major 10 and avoids downgrading OpenNext |
| miniflare | undici ^7.30.1 | Patched branch 7 despite upstream pin; avoids downgrading Wrangler |
| mermaid | katex ^0.18.2 | Fixes GHSA-238p-pmpm-9mq7 without a Mermaid 12 migration; browser math rendering is covered |
| SWC consumers | @swc/helpers ^0.5.23 | Satisfies the current SWC compiler peer requirement while retaining the 0.5 API |
| @excalidraw/excalidraw | @radix-ui/react-tabs ^1.2.1 | Supports the project's React 19 version, replacing Excalidraw's older pinned tabs package |

Compatible transitive updates are recorded in package-lock.json, including DOMPurify, js-yaml, brace-expansion, source-map-js and the OpenNext toolchain. Existing prismjs/lodash-es/postcss overrides remain in place. No `npm audit fix --force` was used.

The obsolete Pages-era `legacy-peer-deps=true` workaround is removed. Normal npm peer validation is enabled; `npm ls --all` has no invalid or missing dependencies. The optional picomatch peer is now resolved by npm normally.

## Validation

- Clean `npm ci` completed; after peer alignment, `npm ci --dry-run --ignore-scripts` validated the final manifest/lockfile and `npm ls --all` reported no problems.
- Full and production-only `npm audit`: zero known vulnerabilities.
- `npm run lint`, all 45 self-test groups, and the complete `opennextjs-cloudflare build` passed.
- Browser tests ran against the generated Worker with `wrangler dev --local`: 109 passed in total, one existing skipped test. Two stale calculator assertions were updated (E-series UI/result and saved-preset count) and both passed on rerun; no calculator implementation changed.
- Added CI browser coverage for Mermaid-to-Excalidraw conversion with Nano ID 5, KaTeX math rendering and script sanitization.
- Built-page checks passed: SEO for 372 rendered pages, 364 sitemap URLs and hardware software-page content across all four locales.
- LM Studio behavior is verified with mocked HTTP responses; no live inference or generated Android file writes were performed.

## References

- [Next.js image optimization patch](https://github.com/advisories/GHSA-2464-fhr4-w9xw)
- [OpenNext cache interception patch](https://github.com/advisories/GHSA-2vc4-c4r6-p6v6)
- [Zod resource consumption advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- [LM Studio local chat completions](https://lmstudio.ai/docs/developer/openai-compat/chat-completions)

No push or deployment is part of this maintenance task.
