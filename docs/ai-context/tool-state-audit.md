# Tool state audit — 2026-10-24

Scope: every tool in `config/workbench.ts`, including the calculators and composer routes.
Automatic drafts are browser-local, shared across locales and independent of login. They never enter account/preset sync.

| Tools | Before | After |
| --- | --- | --- |
| payload | Inputs and inspector position lost | Input, formatting, split width, inspector tab and selected path restored |
| type-checker, object-to-types, json-schema | Unsaved source and root names lost | Source and root names restored |
| object-compare, text-diff, regex | Inputs/options lost | Both inputs, regex flags/replacement/options restored |
| encoder, hash-digest | Only explicit URLs/presets restored | Last inputs and options also restored |
| csv-json | Inputs and conversion options lost | Both editors, direction, delimiter and header restored |
| ascii-unicode, cron, color, timestamp, number-base, url-parser, ipv6-expand, subnet-calculator, http-status-codes | Inputs/options lost | Last bound fields restored; derived results recomputed |
| token-inspector, llm-vram-calc, llm-grammar-generator, voice-ai-latency | Inputs/options lost | Last bound fields restored |
| esp32-llm-bridge | Configuration lost | Configuration restored except Wi-Fi password |
| hmac | Message, key and algorithm lost | Message and algorithm restored; secret deliberately excluded |
| jwt-decode | Tab and tokens lost | Playground tab restored; bearer tokens and signing/verification secrets deliberately excluded |
| random-string | Options and generated strings lost | Options restored; fresh random strings generated (outputs can be passwords) |
| uuid-ulid | Options/output lost on a clean visit; reload regenerated output | Options and generated IDs restored, including reload with matching type/count URL |
| ohms-law, resistor-color-code | Input values and band choices lost | Values and band choices restored |
| serial-monitor | Options, draft command and log lost | Baud rate, newline option, draft command and log restored; port stays disconnected |
| dns-lookup, whois-rdap, certificate-check | Input/options lost | Input/options restored; result, consent and active requests are not replayed |
| site-checker | Monitor list already saved, new-monitor form lost | Existing list retained plus draft form/options; consent stays explicit |
| metronome, delay-calculator, note-frequency, tone-generator, guitar-tuner | Options lost | Bound options restored, including tuner timbre; audio/microphone stays stopped |
| jam-station | Musical setup lost | Style, key, scale, tempo and volume restored; playback stopped |
| beatmaker | Unsaved project lost | Project, steps, velocity, pitch, rolls, mute/solo and master volume restored; playback stopped |
| qpsk-modulator | Sequence/view/options lost | Sequence, simulation options and view restored; resumed draft starts paused |
| embedded (calculators) | State only carried in current URL | Last calculator, E-series and registry field values also survive a clean visit |
| snippets | Saved snippets persisted, unfinished form lost | Unfinished title/tags/body also restored |
| notes | Documents persisted, first document always opened | Last selected existing document restored |
| chiptune (composer) | Song saved after 400 ms; selection lost | Song saved immediately, track/note selection restored |
| image-convert, image-base64, audio-convert | Uploaded file lost | Last file retained locally in IndexedDB; image quality restored; clear removes file; audio preview stays paused |
| mermaid | Diagram already persisted | Existing persistence retained |
| excalidraw | Scene already persisted | Existing persistence retained |
| patterns | Lesson and edits already persisted | Existing persistence retained |
| usage-analytics | History already persisted | Existing persistence retained |
| spectrum-analyzer, level-meter, beat-counter | Live measurements reset | Deliberately transient: no microphone auto-start, replay of stale samples or reuse of performance-clock timestamps |

## Boundaries

- Explicit query links and handoffs take precedence over drafts. UUID output is restored for matching type/count links; different parameters generate fresh IDs. Existing tool URL/hash import behavior remains intact.
- Generic text drafts use versioned `hios:tool-draft:v1:*` keys, at most 2,000,000 serialized characters and 1,000,000 per restored string. Oversized drafts are not a durable document store. Storage remains subject to browser quota/private-mode settings.
- Uploaded files use the `hios-tool-files` IndexedDB database, one last file per converter, rather than base64 copies in localStorage. Clear deletes the stored file. Storage may be unavailable or evicted by the browser.
- Draft data is checked as string records, then passed through each tool's existing field validators. Invalid storage must not prevent tool use.
- No automatic account upload, downloads, network checks, serial reconnection, microphone permission request, or audible playback is added.
- Undo history, transient dialogs, generated error messages and live meters are not durable state. Payload tree expansion/search and viewport scrolling remain transient; selected path, tab and splitter are retained.

## Verification

`tests/tool-drafts.spec.ts` covers return/reload/locale changes, explicit URL and handoff priority, clearing, invalid/blocked storage, secret exclusion, network/audio inactivity, project and calculator restoration, notes/inspector selection, generated IDs, and local file restoration/deletion. Existing workspace/preset tests remain regression coverage for explicit saved work.
