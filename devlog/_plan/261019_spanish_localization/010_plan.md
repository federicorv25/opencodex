# Spanish localization: preparation and single-PR delivery plan

## Status and source baseline

- Preparation and implementation date: 2026-10-19 (America/La_Paz). Spanish implementation and review corrections are prepared; initial Draft delivery and subsequent review-readiness verification are recorded below.
- Repository: `lidge-jun/opencodex`; local branch: `feat/spanish-localization`; integration target: `dev`.
- Initial `dev` baseline: `79fa97be6e6ae974ccd31d9aeedc2da96a0baa73`; refreshed through `bddd61f74bc89f45e6740845823b47f7a0a2f629`, `74463a2f73ac8a8011554385cbd45c42d16441a3`, `1cf98c05d9db5a458dd78f835d38dc393f32f0fe` and `eb4bf967001327624acca1341a9a51aba0a3ca05` to `12025981e5a304cdb6b1b54f525ba8554f623977`. The clone includes branch history and current checked-out sources; historical blobs are fetched on demand.
- Initial delivery's `dev` package version: `2.90.0`. Latest published release checked on the initial date: [`v2.89.0`](https://github.com/lidge-jun/opencodex/releases/tag/v2.89.0). The October 21 follow-up below supersedes this development snapshot; release and development versions are distinct.
- Toolchain: Bun `1.4.3` for tests, Node `v24.21.0`, Git `2.56.0.windows.1`. The root dependency on bundled Bun `1.4.2` stays unchanged.
- Loaded catalog baseline: 4,078 English keys and 11 GUI locales (`en`, `de`, `fr`, `ko`, `zh`, `zh-TW`, `ru`, `ja`, `tr`, `vi`, `pt`).
- Documentation baseline: 8 configured site locales and 73 canonical English Markdown/MDX source pages. These are measured snapshot values, never hard-coded future acceptance counts.
- The user-supplied August design is historical reference. Current checked-out instructions, English sources, tests and contracts govern implementation.

## Agreed contribution

Deliver **one PR against `dev`** containing the Spanish dashboard used by Desktop and browsers, the public website, the documentation tree and the Spanish README. Implement and verify the subsystems in separate steps on this branch, then present them together.

The selected scope excludes native Desktop bootstrap screens, tray menus, updater and installer localization. Those use a separate native shell; dashboard language support becomes available in Desktop when a package includes the updated GUI. A browser check does not establish native Desktop acceptance.

No Spanish source files, fork, push, PR, release or installation replacement have been created in this preparation stage.

### Instructions and accepted precedents

Read again before editing or publishing: root `AGENTS.md`, nearest scoped `AGENTS.md`, `MAINTAINERS.md`, `CONTRIBUTING.md`, the PR template, CODEOWNERS, and the trusted PR-quality/hygiene scripts. Root and GUI instructions, docs-site and scripts instructions, contribution/quality contracts, architecture ownership and current locale wiring were reviewed during preparation.

- [Issue #1551](https://github.com/lidge-jun/opencodex/issues/1551) permits documentation as a separate scope; the user subsequently selected one combined PR. The [owner response](https://github.com/lidge-jun/opencodex/issues/1551#issuecomment-5324945300) welcomes an English-parity `es` locale against `dev`.
- [French #1733](https://github.com/lidge-jun/opencodex/pull/1733) merged GUI, website, documentation and README together. The [approval](https://github.com/lidge-jun/opencodex/pull/1733#pullrequestreview-4944415405) cites GUI key/placeholder parity, documentation path parity, auxiliary coverage, addressed findings and current-head checks.
- [Vietnamese #4984](https://github.com/lidge-jun/opencodex/pull/4984) merged exhaustive locale wiring. Later fixes #5005 and #5020 demonstrate why newly added English keys and separately declared native-main namespaces must be audited.
- [Portuguese #6458](https://github.com/lidge-jun/opencodex/pull/6458) was closed and carried into `dev` in [5d7efbb74](https://github.com/lidge-jun/opencodex/commit/5d7efbb749ffb72efa6696571b73a4a874a8c61d). It is not a directly merged PR. Its implementation highlights pre-paint language selection, quota maps, catalog size exemptions and semantic corrections.

Use these as integration and review precedents. Translate from current English; do not reuse their historical key/page/test counts or bypass present contributor rules. Historical reviewers do not replace the current maintainer roster.

## Implementation sequence

### 1. Reconcile with the latest development version

Fetch `origin/dev` before implementation and again before final readiness. Once the fork is configured, use `upstream/dev` as the canonical comparison. Record the exact base and head SHAs.

Reconcile new English keys, documentation pages, auxiliary unions and changed meanings after each synchronization. Before final handoff, base the contribution on the latest fetched `dev` and rerun checks invalidated by the synchronization. Recheck changed visual evidence against the resulting head. The gate's present 10-commit tolerance is not a substitute for the user's request to cover the latest development source.

### 2. Add Spanish to the existing dashboard architecture

- Create `gui/src/i18n/es.ts` directly from the current English catalog. Preserve the exact key set and interpolation names/multiplicity; provide non-empty translations and a reviewed, narrow allowlist for intentionally identical technical terms.
- Extend `LabLocale`, `DICTS`, `LOCALES`, stored-value validation and navigator detection. Use internal `es`, visible `Español`, HTML `es`, and map browser `es-*` variants to this single locale. A valid stored selection retains priority.
- Keep `LanguageProvider`, `useT`, `Trans`, storage key `ocx-lang` and interpolation behavior. Do not introduce another i18n framework, new dependencies, unchecked casts or new English fallbacks.
- Update the pre-paint locale map and browser detection in `gui/index.html`, so the initial HTML language agrees with the mounted provider.
- Translate Compatibility Lab base keys, overlays and supplements; the closed native-main translation namespace; all Log Guard maps; routing compatibility and vision-reasoning labels.
- Extend the locale union, locale order and row tuples in `desktop-compatibility-copy.ts`, and use its Spanish projection in the new catalog. Translate display copy while retaining wire values, commands, URLs, headers, IDs and configuration keys.
- Add Spanish HTTP labels/descriptions and regional normalization to `status-codes.ts`, including generic status classes.
- Map Spanish to `es-ES` in both quota-formatting helpers: `QuotaBars.tsx` and `ProviderCapacityQuota.tsx`. Audit other formatters and preserve deliberately fixed display contracts, including the plain-dollar format enforced by existing tests.
- Add `es` to `gui/scripts/sync-locale-keys.mjs`; its existing omission of `vi`/`pt` is a baseline observation, not permission for unrelated locale cleanup. Do not run bulk synchronization over other catalogs as part of this preparation.
- Register the Spanish catalog using the existing translation-catalog file-size exemption mechanism and its tests/baseline metadata. Never raise existing file caps to accommodate the change.
- Review architecture documents mapped to `gui/`; update the current localization contract in `structure/dashboard-and-usage.md` and any dependent whose explanation actually changes.

Use neutral, concise Spanish: dashboard = panel, providers = proveedores, settings = configuración, logs = registros, usage = uso, reasoning = razonamiento. Preserve branded names and protocol/configuration identifiers. Contextually review negations, destructive actions, recovery, credential precedence and ownership guidance.

### 3. Localize the public website, documentation and README

The Astro/Starlight website has a separate language system from the React dashboard. Register `es` / `Español` in `docs-site/astro.config.mjs`, including sidebar labels, and extend the custom header's language type/options and path-preserving language links.

- Add `docs-site/src/content/docs/es/` with the current canonical English page paths, including the home page, Desktop installation/use, getting started, guides, references, benchmarks, contributing and troubleshooting. Recompute the source inventory rather than copying the older French page roster.
- Translate titles, descriptions, body prose, accessibility text and visible interface text from current English. Keep executable examples, flags, code identifiers, credentials placeholders, routes and documented defaults consistent with English.
- Add Spanish to `Landing.astro`, `Header.astro`, `SiteJsonLd.astro`, and benchmark/UI translation data such as `frontier-i18n.ts`. Preserve component structure and generated output ownership.
- Keep `/es/` URLs, language metadata, canonical/alternate metadata, structured data, sitemap, search and translated page links consistent. Rewrite links to translated headings where needed and verify language switches keep the corresponding document path.
- Add `readme/README.es.md` from the current root README, update existing language bars and `readme/i18n-manifest.json`, and extend the repository's README parity checks using their existing model.
- Review the mapped documentation architecture and update contract explanations only where this contribution changes them.

French review threads specifically caught altered API-key versus OAuth behavior, canonical Pool mode names, and backend exception semantics. Review Spanish explanations against current English and referenced code so localization does not change operational advice.

### 4. Add regression coverage and inspect the real render

Dashboard cases:

- Spanish base/effective catalogs: exact keys, placeholders, duplicate-key guard, no blank entries, and no accidental English outside the reviewed allowlist.
- Spanish registration, all supported `es-*` browser variants, persisted selection precedence, blocked/invalid storage behavior, and initial HTML language.
- Language switching on the same mounted root, persistence after reload, HTML language updates and switching back to an existing language.
- Every auxiliary namespace, localized status classes and date/number/quota formatters; preserve the existing fixed-dollar assertions.
- Update exhaustive test maps, explicit locale rosters and the fixed 11-locale assertion in `subagent-surface-warning.test.tsx`. Extend `logs-cost-plain-dollar.test.ts`, DSH/Aside copy expectations and relevant root locale guards.

Website/README cases:

- Derive English versus Spanish documentation path parity from the current source/configuration; a newly added English page must be visible to the guard.
- Validate locale navigation, internal links/anchors, translated accessibility labels, metadata, search results and README/manifest parity. Use the existing root docs-test domain and layout registration rules if adding a root test.
- Run the docs build and inspect the real Spanish landing page, Desktop guide, long reference page and language switching at desktop and narrow widths.

Review the dashboard with synthetic data across navigation, providers/models, usage/logs/storage, integrations, account/login dialogs, Lab and Log Guard. Inspect clipped text, overflow, tooltips, warnings and keyboard/focus behavior. Save actual-head screenshots locally for later upload to the PR description; do not commit screenshot evidence to this branch.

## Preparation verification

All commands below ran on the source baseline above, before locale implementation. Logs are local ignored artifacts under `.tmp/spanish-localization/evidence/`.

| Check | Result |
| --- | --- |
| Root `bun install --frozen-lockfile` | Exit 0; 104 packages installed |
| GUI `bun install --frozen-lockfile` | Exit 0; 41 packages installed |
| Docs `bun install --frozen-lockfile` | Exit 0; 369 packages installed |
| Root `bun run typecheck` | Exit 0 |
| Focused GUI locale tests with pinned Bun and explicit root preload | 71 pass, 0 fail, 8 files; 13,909 assertions |
| GUI `bun run lint:i18n` | Exit 0 |
| GUI `bun run build` | Exit 0; 462 modules transformed |
| Docs `OPENCODEX_DOCS_OFFLINE=1 bun run build` | Exit 0; 585 pages; 83,057 internal links checked; search and sitemap generated |
| Root `bun run privacy:scan` and direct Bun 1.4.3 scan | Exit 0; repository privacy scan passed in both invocations |
| Targeted preparation-note privacy scan | Exit 0; no findings |

The focused test command was run from `gui/`:

```powershell
bun ../scripts/test-with-pinned-bun.ts --isolate --preload ../tests/preload.ts ./tests/i18n-locales.test.ts ./tests/i18n-language-switch.test.tsx ./tests/locale-parity.test.ts ./tests/claude-desktop-locale.test.ts ./tests/compatibility-lab-i18n.test.ts ./tests/fr-localization.test.ts ./tests/native-main-translations.test.ts ./tests/logs-cost-plain-dollar.test.ts
```

A reusable local PowerShell launcher is prepared at `.tmp/spanish-localization/Run-LocaleBaseline.ps1`. It uses the repository's explicit preload, which creates isolated OpenCodex/Codex/client homes, removes inherited production credential variables and arms the real-home guard. Existing tests supply synthetic DOM/state and translation fixtures. No running production proxy is used.

Baseline warnings: Vite reports existing chunks above 500 kB; Astro reports the absent/empty optional `i18n` content collection. Both builds completed successfully. These warnings were observed on unchanged source and are not Spanish changes.

No full root suite, full GUI suite, React Doctor, actual-browser inspection or native Desktop build has been performed in this preparation. Rust/Cargo were not detected on PATH. These results establish a preparation baseline, not review readiness or Spanish acceptance.

Before the combined PR becomes review-ready, run the current required root typecheck, root suite, privacy and structure checks; full GUI tests, lint, i18n lint and build; applicable React Doctor; README/docs parity and file-size guards; and the docs build. Use the pinned test wrapper. Any allowed full-suite resource exception needs exact commands, results, reason and uncovered scope, and never turns unrun checks into passing results.

## Publication and completion

- Implement all agreed surfaces on this branch, then create/reuse the contributor fork. Configure `origin` for the fork and `upstream` for the original repository before pushing.
- Open one Draft PR to `dev`, titled `feat(i18n): add Spanish dashboard and documentation localization`, with `Refs #1551`.
- Fill the exact current template sections `Summary`, `Verification` and `Checklist` in English. Include actual-head GUI and website screenshots in the description, named commands/results, translation provenance and any documented limitations.
- Keep the four readiness items aligned with `.github/scripts/pr-quality.cjs`: required local validation documented, recent `dev` base, correct Codex/CodeRabbit findings resolved, and ready-for-review confirmation. New commits invalidate earlier attestations and potentially affected evidence.
- Do not change workflow triggers, release behavior, dependencies, auth implementation or existing locale behavior as incidental cleanup. Preserve attribution if actual contributor work is carried.
- Required checks must succeed on the current PR head. Contributor integration requires the current maintainer approval under `MAINTAINERS.md`; merging into `dev` does not itself publish a Desktop update.
- Complete when Spanish has current English GUI key/placeholder parity, full agreed documentation/README parity, complete auxiliary coverage, real-render evidence, passing required validation and a reviewable single PR.

## Initial Draft delivery record

This section preserves the original delivery evidence. The review-readiness record below supersedes its pending-work status and older scoped test totals.

The combined contribution adds the `es` dashboard catalog and auxiliary namespaces, regional browser detection and prepaint language, persistent selection, HTTP-status copy and quota date formats. The catalog follows all 4,078 current English keys. Existing locales retain their behavior. The shared dashboard is the surface used by Desktop and browsers; native tray/startup/updater text is outside this contribution.

The website registers Spanish navigation, landing copy, structured data and benchmark labels. The Spanish tree mirrors all 73 canonical documentation paths. `readme/README.es.md`, every README language bar and the source-hash manifest are updated together. The refreshed English archive contract is reflected in Spanish: 512 MiB / 256 files, explicit refusal codes and manual cleanup. Code examples, HTML code elements, CLI identifiers and admonition structure have regression coverage.

Translation was drafted locally with [Helsinki-NLP/opus-mt-tc-big-en-es](https://huggingface.co/Helsinki-NLP/opus-mt-tc-big-en-es), whose model card declares CC-BY-4.0, using an isolated CTranslate2 conversion at revision `685e28454c38f960d9cddc89e3a6881ec62dc765`. Runtime, model and helper scripts are ignored local scratch files, not project dependencies or committed assets. Subsequent copyediting covers the landing, navigation, README, Desktop and quickstart guides, technical identifiers, privacy/consent warnings and inspected dashboard surfaces. Further linguistic review of the long reference pages is requested in the Draft PR; this is not represented as human acceptance.

| Implementation check | Recorded result |
| --- | --- |
| Root typecheck after refreshing `dev` | Passed |
| Full GUI suite | 3,493 passed, zero failures; 58,734 assertions across 354 files |
| Final copy retest: Spanish/locale/switch/Lab/native/status/quota/Anthropic coverage | 97 passed, zero failures; 31,666 assertions across nine files |
| GUI lint and i18n lint | Passed |
| GUI production build | Passed; 463 modules; pre-existing large-chunk warning remains |
| Root documentation, README, hygiene, structure and layout files with `--timeout 120000` on `74463a2f7` | 417 passed, zero failures; 3,089 assertions across 18 files |
| Same scoped set on final `1cf98c05d` base | 416 passed; inline-identifier guard caught one omitted `maxIntervalMs` token. Corrected; all five tests in that guard file passed retesting (891 assertions) |
| Final `--changed=dev --timeout 120000` run | 226 passed, zero failures; 2,298 assertions across 16 files |
| Docs production build, offline | Passed; 658 pages and 95,628 internal links; search and sitemap generated |
| React Doctor 0.9.11, changed scope against `upstream/dev` | No issues; repository wrapper's `origin/main` ref is absent in this dev-only fork checkout |
| Root privacy scan, direct Bun 1.4.3 execution of `scripts/privacy-scan.ts` | Passed |
| Final structure SSOT check | Passed |
| Root full-suite attempt | Incomplete: stopped after observing 3,104 passing and 26 failing cases; not a passing full-suite result |

The full root attempt encountered Windows `EPERM` symlink creation failures in unchanged spend-ledger/client tests, default timeouts, and `EBUSY` cleanup of `config-dir-acl-harden` background work followed by spend-ledger ownership conflicts. The default full-suite run became impractical in this environment. This uses the documented resource/environment exception in `AGENTS.md`: directly affected regression files remain mandatory, broader backend/platform coverage remains outstanding in CI, and the PR stays Draft. These failures are not claimed to have passed or to have been reproduced on an untouched baseline.

The root full-suite attempt ran on the intermediate `bddd61f74` base. Further English documentation updates through `1cf98c05d` were reconciled, covering inline audio, MiMo tool-call recovery, Mistral vision and rate-limit defaults, pool credit renewal, DeepSeek image-file opt-in and allowed roles, bounded Desktop profile reads, account project fallback, OpenGateway handling and quota/login diagnostics. Technical identifiers and examples are checked against this final English snapshot. Final scoped results are reported in the PR; no complete root-suite pass on the final base is claimed.

The first full GUI run had 3,489 passes and three failures: missing `keep-warm` / `Agent SDK` anchors and a filesystem-scan timeout. Both translation anchors were corrected and all three failing files passed focused retesting. The full GUI recheck passed all 3,493 tests; subsequent copyediting passed the 97 focused tests above. No native Desktop build or human-run acceptance test is claimed.

Browser evidence uses an actual built GUI with an isolated OpenCodex runtime and a disabled synthetic provider, plus the built static docs site in Chrome. It exercises mounted language switching and reload persistence, desktop/mobile layouts, providers/models/integrations, subagents, usage/logs/storage, Desktop documentation, a long reference, benchmark views and language-preserving website links. Captures and machine-readable observations remain under ignored scratch space. The installed personal Desktop configuration and running proxy are not used as test fixtures. Screenshots for GitHub belong on the fork's separate `pr-assets` branch and are linked by immutable asset commit, never added to the PR branch.

The contributor fork is configured as `origin`; the original repository remains `upstream`. The pull request targets `dev`, uses the current English template and `Refs #1551`, and retains unchecked review-readiness attestations until local scope, current-head CI, review findings and maintainer readiness are satisfied. Final command results and any remaining limitations are recorded in the PR description.

## Review-readiness record

The single contribution is [PR #7406](https://github.com/lidge-jun/opencodex/pull/7406). Review corrections cover all 34 CodeRabbit inline findings and the out-of-diff locale-count observation. They include benchmark disclosure, current routing precedence, API-key/OAuth distinctions, Pi's loopback export, default subagent mode, native reasoning ownership, opt-in Log Guard, deferred star consent, error labels, executable table syntax, signed-binary warnings and conditional recovery. Long paragraphs were revised in context; critical configuration, admission, platform, consent and recovery instructions were edited directly. Technical examples, identifiers, placeholders, tables and complete instruction lists have parity guards. The English source was corrected where it contradicted the current implementation or policy.

The refreshed `12025981e` base contains upstream #7408 and #7414. The Spanish Codex guide now documents exact account bindings versus manual Pool preference, native-main duplicate exclusion, workspace identity and the actionable account-list fields. This contribution itself has no backend implementation, workflow, dependency manifest or lockfile changes relative to that base.

| Review check | Result |
| --- | --- |
| Full GUI suite | 3,493 passed, zero failures; 58,734 assertions across 354 files |
| Final Spanish/parity/mounted-switch/Lab GUI files after review corrections | 19 passed, zero failures; 33,177 assertions across four files |
| GUI lint, i18n lint and production build | Passed; pre-existing chunk-size warning remains |
| Root typecheck on `12025981e` base | Passed |
| Final docs/README/hygiene/structure/layout set | 444 passed, zero failures; 3,455 assertions across 18 files |
| Changed-import suite on the refreshed base | 493 passed, zero failures; 3,946 assertions across 24 files |
| Upstream duplicate-main and Pool caller-fallback regressions after synchronization | 34 passed, zero failures; 78 assertions across two files |
| Final offline documentation build | Passed; 658 pages, 95,628 internal links, Pagefind search and sitemap |
| Final privacy scan and structure SSOT check | Passed |
| React Doctor 0.9.11 against `upstream/dev`, changed GUI scope | No issues |

The root-suite resource exception was investigated further using an isolated non-root Linux container with pinned Bun 1.4.3, 2 CPUs and 4 GiB. The full run used the exact previously published tree `150628e19fea7cfbd4982b72f127a7596d38ec87`, observed 21,964 passes and 24 failures, and hit the wrapper's 900-second limit with files unrun. Installing missing jq/Node tools and correcting fixture-parent permissions allowed the eight failing files to rerun: 155 passes, one skip and four failures. Two CLI-help cases require a host service manager. The other two failures were reproduced on a clean `1cf98c05d` snapshot: 22 passes and two failures. Upstream #7408 then fixed the cold-spawn disposition failure; the refreshed file passed all 20 cases. The unchanged Grok config-write-lock fixture discrepancy remains a reproduced baseline failure. There is no complete full-root-suite pass; broad backend/platform validation remains required in upstream CI before merge.

Actual-browser evidence uses the built GUI and built docs with isolated client homes and a disabled synthetic provider. Final inspection corrected a split reference table and additional technical terminology. No personal Desktop configuration, native Desktop build, live model request or human-executed acceptance test is claimed. Captures are uploaded separately to the fork's `pr-assets` branch and linked by immutable commit in the PR description.

CodeRabbit was explicitly requested on the Draft. A manual Codex review request returned its account rate-limit message without a code review; this is an unavailable review, not a clean result. The contributor readiness checklist must describe this limitation accurately. Required fork Actions still need maintainer authorization and successful results on the exact final PR head, plus maintainer approval, before integration. The PR description carries the final head/tree, build, scan, browser and review-thread evidence.

Follow-through review resolved the 34 original inline threads and recorded the corrections in the PR conversation. A full CodeRabbit review was explicitly requested after its incremental checkpoint recovery failed. A consistency pass also corrected rate-limit versus pricing terminology, API-key labels, disabled/type labels, Claude Desktop branding, restore-point labels and the v1 encrypted-task guide. The Spanish catalog guard now rejects the specific mistranslation classes found in both raw and effective catalogs and preserves the executable `[codex].agents.{role}` configuration path. The revised guide preserves all canonical executable examples, technical identifiers, tables and stable section anchors. Final real-browser checks cover the integration/API-key screen and rewritten guide.

The full review then identified 12 additional issues. Corrections distinguish independent management/data credentials, refresh the quickstart roster, document eligible runTurn search precedence and Antigravity's default-on exception, use an environment reference for the xAI video key, preserve transcription model IDs, restore the unauthenticated-sender negation, reject unavailable exact-account routes, include ten-minute spent-quota cooldowns, split foreground startup and service checks into two terminals, reconcile current Windows stream-mode guidance and correct Lab verdict states. Canonical English pages were synchronized where the same stale claim existed. Transcription model names were formatted as literal code identifiers.

The next incremental review reported four observations: qualify default v2 delegation failure and its explicit exceptions, repair the provider-policy paragraph, state the shared 130-second audio timeout, and remove a partial model-family regex that accepted substring matches. The documentation now states the defaults and exceptions in both English and Spanish. Identifier parity reuses exact inline-code spans across all model families/namespaces, alongside existing fenced-example parity; regression examples include o1/o3/o4, codex, slash namespaces and colon tags and reject longer substituted tokens. No GUI implementation changed in this follow-up.

That review also included two outside-diff copy findings: the Lab subject column now uses `Sujeto`, matching the represented entity, and the singular corrupt-artifact status uses `Corrupto`. The raw/effective catalog and supplemental-label regression checks cover both corrections.

The following review identified a missing hybrid-mode exception in the v2 overview and an outside-diff Anthropic account-pool wording issue. Both guides now explain that `keepNativeChatGptOnV1` preserves native ChatGPT parents on v1 while routed entries use v2, including in the comparison table. The Spanish pool descriptions distinguish new sessions from the active account whose usage reaches the configured threshold, retaining all placeholders and ordered refusal recovery. Adjacent fill-first wording without a threshold follows the same account/session distinction.

## October 21 consolidated correction and audit

The next full CodeRabbit review reported eleven actionable threads on `1e60fede9e306a7e530caddbc7fa0a0a537019bb`. This follow-up merges `dev` at `2945ebb364b90ad2e0f3fe71e69a375045aec39d` (2.91.0), retaining the published history. Dependency manifests, lockfiles, workflows and backend runtime match that base; no independent dependency or authentication change is introduced.

Corrections cover the inert provider-directory policy, macOS versus Linux deb installation, ten-minute spent-quota precedence, nonzero partial Aside outcomes, Pi foreground startup in two terminals, Remote Hub restart, the external video-pricing link, SSH messaging, retained exact-account roster IDs in every affected reference locale, and fenced-code parity. The OpenCode comment's premise was checked against `isApiAuthRequired` and existing loopback tests: configuring a client key does not itself require authentication on a loopback-bound listener. The guides now distinguish that listener from reaching a wildcard-bound authenticated listener through a local URL. The runtime admission policy is unchanged.

The wider review checks all 73 Spanish documentation paths and all 4,078 raw/effective catalog keys for executable identifiers, numbers, placeholders, links, tables and structure. Semantic candidate searches cover negations, recovery, units, brands and result codes; full contextual rewrites cover the contribution, installation and OpenCode chapters, with adjacent Pi, video, integrations and CLI corrections. This is contributor review, not an independent human-language approval or a guarantee that all prose is perfect.

Additional confirmed defects included the general CLI nonzero-exit statement, translated OpenCode/Node/Rust/ngrok names, malformed login and management-token help, and translated TOML table names `[agents]`/`[features]`. The expanded catalog guard failed on the old TOML copy and passed after correction. Current Spanish docs include the new `/readyz` feature names, passive `/api/quota-pool`, `voice-session-id`, reasoning metadata and Codex 0.164 assertion modes. A render check found English code-block controls on Windows; an explicit cross-platform content-locale resolver fixes those labels. The final clean docs build and browser both show Spanish copy controls. The existing test-layout registry reached 2,000 lines after the merge; its Spanish entry moved unchanged into an explicit shard rather than increasing a cap.

| Follow-up verification | Result and coverage |
| --- | --- |
| Root/GUI/docs frozen installs | Passed, with the lockfiles inherited from `dev` |
| Full GUI suite | 3,494 passed, zero failures, 83,225 assertions across 354 files; final copy edits additionally covered by the focused locale run |
| Final Spanish GUI contract | Eight passed, zero failures, 49,255 assertions; includes regional detection, blocked storage, mounted switching, auxiliary labels, technical identifiers and quota formatting |
| GUI lint, i18n lint and final build | Passed; existing bundle-size warning remains |
| Root typecheck and structure check | Passed |
| Docs/README/structure/hygiene/layout batch | 451 passed, zero failures across 18 files before the code-control regression was added |
| Final docs and layout regression | 39 passed, zero failures across two files, including all 14 Spanish documentation cases |
| Changed-import coverage | 499 passed; two repository-wide source scans exceeded their default five-second per-test limit under load; isolated retry with a 30-second test limit passed all 16 tests in the two scan files |
| Current readiness/quota/assertion contracts | 24 passed, zero failures across four files |
| Roster retention/migration and admission cases | 68 passed, zero failures across three files |
| Clean offline docs build | 658 pages, Pagefind and sitemap built; 95,636 internal links checked |
| Full root suite attempt | `bun run test` stopped at its 900-second parallel-lane limit with exit 124: 4,755 observed passes, 40 failures, 42 skips; incomplete and not a pass |
| Root failure triage | Three representative files rerun with `--timeout 30000`: 63 passed and nine failures, all fixture `symlinkSync` EPERM refusals on this Windows host; earlier timing cases in those files passed. The remaining full-suite failures are not all individually baseline-reproduced |

Browser checks use the actual production GUI and docs, synthetic disabled providers and isolated homes. They cover Spanish/English switching on the mounted Models screen, persistence on reload, `lang="es"`, 390-pixel mobile layout, Pi's separate terminals, OpenCode, localized code controls and Spanish Pagefind results. The preview server's handling of underscore-containing Pagefind asset extensions was repaired in ignored scratch tooling; it is not a shipped-site change. No personal Desktop configuration, live provider request, native Desktop execution or human acceptance is claimed. Screenshots remain outside the PR source branch.

The PR stays Draft under the maintainer's localization/owner acceptance hold. The approved hosted execution and passing checks on `1e60fede` are previous-head evidence only; new-head approval and required CI must be inspected separately. The consolidated publication requests one full CodeRabbit review without waiting for its result, as instructed by the contributor.
