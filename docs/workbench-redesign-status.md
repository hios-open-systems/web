# Workbench redesign: implementation checkpoint

This branch is an implementation checkpoint, not the completion of the full redesign plan.

## Included

- Shared activity discovery, catalog search and command palette ranking.
- Local IndexedDB workspaces, ordered resource shortcuts, templates and versioned JSON transfer.
- Preset adapters, explicit content upload consent, account-scoped D1 APIs and revision conflict handling.
- Payload Lab worker, bounded iterative analysis, virtualized tree, paths, subset handoffs and explicit share links.
- Four locale translations, related project/article resources, audio resource cleanup and privacy-conscious telemetry.

## Remaining acceptance work

- Stabilize authenticated browser tests for two sessions and offline conflict recovery. API isolation, stale-revision rejection and implicit-content rejection have passed against local D1; the latest complete authenticated browser run did not pass.
- Complete individual functional acceptance for all 54 catalog entries. Route smoke coverage is not full functional acceptance.
- Complete the audit matrix and remaining family-specific improvements.
- Make Payload Lab table pagination operate on worker-held data beyond the truncated preview, and improve deeply nested output recovery.
- Verify account changes, legacy migrations, hardware interactions, keyboard access and mobile behavior across the complete catalog.

## Release requirement

`main` uses Cloudflare push-to-deploy. Migration `migrations/0006_workspaces.sql` must be applied to the target D1 database before releasing the workspace APIs. Deployment does not apply migrations automatically. No remote migration has been executed as part of this checkpoint.

## Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `npx playwright test tests/workspaces.spec.ts tests/workbench-catalog.spec.ts tests/mobile-workspaces.spec.ts`
- Local authenticated tests: `node scripts/seed-workspace-tests.mjs`, then `npx playwright test -c playwright.workspaces.config.ts`.

The authenticated fixtures use an isolated local D1 database and dummy sessions; they are not production credentials.
