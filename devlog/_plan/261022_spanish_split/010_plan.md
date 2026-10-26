# Spanish localization: split after #7406

## Delivery order

The owner closed #7406 on October 22 because its combined locale changes were
too broad for the review queue and conflicted with dev. The original published
branch stays intact. Recover the contribution in independent branches rooted at
current dev, starting with the documentation site as requested:

1. `codex/spanish-docs`: docs-site Spanish, directly related canonical/translated
   documentation corrections, and the existing documentation regression guards.
2. `codex/spanish-dashboard`: shared Desktop/browser dashboard locale, total
   auxiliary maps, formatting, tests and the dashboard contract.
3. `codex/spanish-readme`: README translation/navigation/manifest and its guard.

Submit the first PR first. Preserve the later branches without opening multiple
review requests at once. Each submission must refresh dev and revalidate its
own diff; a clean merge today does not guarantee compatibility with future dev.

## Documentation base and scope

Initial base: `782655d2317d4c14a99d6db72e9be3368a27886d`, 23 commits after the combined
PR's last integration base. Before submission dev advanced to
`5f7f7db5765c7e99ab2f52c04d9fe0e4ce7608cf`; it was merged and its published
macOS storage-refusal clarification was synchronized in Spanish. Recovered changes use that base's files and retain
its new CLI registration and fallback navigation. The docs branch changes no
dashboard catalog, backend source, dependency, release or workflow implementation.

Spanish covers all 74 current canonical paths, including the new fallback guide.
The refresh includes Remote Link peer versions, Windows refusal/recovery, apply
digests, client restart, service/install JSON and Claude reasoning details.
The sidecar note distinguishes web-search xAI from routed vision in both English
and Spanish. Other latest findings fix product metadata, prose number separators,
the plugin `name` string, and Pi loopback examples in all translated guides.
The timezone-dependent GUI test belongs to the separate dashboard branch.

## Validation receipts

- Frozen root/docs installs: no dependency or lockfile changes. System Bun is
  1.4.4; tests use the required Bun 1.4.3 in ignored scratch space. Its official
  archive SHA-256 was verified against the GitHub release asset digest.
- Root `bun run typecheck`: passed.
- Final Spanish docs after the Pi contract guard: 15 passed, 0 failed (2,126 assertions).
- Structure and privacy scan: passed on staged files.
- Actual-browser inspection: Spanish landing/fallback guide at 1366 px, Pi at
  390 px, localized code controls, no horizontal page overflow, and 17 Spanish
  Pagefind results for fallback. Captures remain outside the source branch.
- Initial Spanish docs and both layout tests: 41 passed, 0 failed.
- All docs guards, structure/hygiene/size and CLI export: 445 passed, one size
  scan timed out while the docs build was running. Isolated size-guard retry
  with `--timeout 120000`: 9 passed, 0 failed; repository scan took 691 ms.
- `OPENCODEX_DOCS_OFFLINE=1 bun run build`: 667 pages and 97,587 checked internal
  links; Pagefind and sitemap completed. Existing unsupported sshconfig
  highlighting falls back to text.

The full root suite is not claimed passing for this branch. The preceding
combined-PR run hit its 900-second limit, with Windows symlink EPERM and timing
failures. This documentation-only split uses the root policy's resource
exception with explicit source-reading guards and exporter regressions instead.
Exact-head upstream CI and independent human language/render acceptance remain
required. No native Desktop acceptance is claimed.

## Review hold

Keep the first submission Draft for owner/localization acceptance. Do not reuse
old CI receipts as validation of a new head. Do not repeatedly request bot
reviews or wait for their completion after publication; the contributor will
inspect the result. Screenshot evidence belongs outside the feature branches.

## PR #7559 consolidated review correction

Reviewed all 36 CodeRabbit threads against canonical English and, for operational
claims, the current service guards, stop path, sidecar settings and CI workflow.
The corrections cover authentication, service repair/restart, search disable and
journal recovery, preview exit codes, adapter contracts and Spanish terminology.
Two suggested premises needed qualification: explicit `ocx stop` stops a managed
service and then restores native Codex; a valid refused preview can exit 0 because
inspection succeeded without applying a change. Neither was changed into the
incorrect behavior suggested by the review wording.

The adjacent semantic pass also restored default-off wording for subagent force,
native subagent defaults, native WebSocket controls and custom context inference.
It checked account/queue/adapter state distinctions and removed unavailable
benchmark-filter instructions from every locale. The current backend, dependency
and workflow implementations remain outside this contribution.

Merged dev at `ec8b8cfac11e8f179c4351f01baa32d76a71dd1b`, preserving both the new
chat layout shard and this branch's docs shard, then at
`9164950d926c770875a267edfeb74183af5caebc` and the docs-only update
`880127dbd356c720779222a14a97c11adc8cf881`. Spanish now includes Desktop
picker-state uncertainty, Antigravity family-quota evidence and the five-slot
`spawn_agent` model-selection rules, including both account-selector cases.

Current validation: frozen root/docs installs, root typecheck and structure check
passed. The explicit docs/layout/hygiene/export/preview/service-auth group ran 588
tests: 587 passed and the repository file-size scan timed out under the parallel
runner. Its isolated retry passed all 9 cases, with the repository scan completing
in 602 ms; no size cap or guard was changed. The root-suite resource exception
above still applies. The final Spanish-doc regression run passed all 15 tests
(2,132 assertions). The final offline site build completed with 667 pages and
97,652 checked internal links, Pagefind and sitemap. Desktop authentication and
service-token sections, mobile sidecar controls, six rendered coding benchmark
boards and Spanish search results were inspected in the real browser. The token
search returned 49 results. Screenshot evidence is pinned outside the source
branch at `588c95e9e636700f2035311017328d5670451e4a` on `pr-assets`.
Privacy scan and diff whitespace checks passed. Keep the Draft and independent
human language/render-acceptance hold; an agent's inspection is not that approval.

## PR #7559 owner-requested refresh, October 23

Addressed the owner's [October 24 UTC triage comment](https://github.com/lidge-jun/opencodex/pull/7559#issuecomment-6378349500).
Merged `dev` first at `2494848f56e8a4f283722b2ebd816977e828c7af`, then at
`ceef4889e4666dc0492a375d272eafa5b785361e` (2.93.0), preserving published history.
All eight upstream test-layout shards remain byte-for-byte identical to that
base; the Spanish documentation shard is appended without dropping any shard.
The provider documentation retains upstream's new Alibaba Token Plan section.

Corrected the remaining nonblank condition in `es/reference/adapters.md`: a
string must contain a non-whitespace character to be converted, while empty and
whitespace-only strings remain unchanged. The existing runtime regression file
checks those cases and exact whitespace preservation. Updated Spanish to match
current JEV session pinning and saved strategies, Antigravity per-account model
availability, provider discovery and credits, Hermes affinity, native effort
normalization, Remote Link readiness/retry diagnostics, and the Bun 1.4.4 runtime.
The landing also translates the new code-signing-policy link while retaining the
required English signing attribution verbatim.

Validation for this refresh:

- Frozen root, GUI and docs-site installs passed; no contribution-owned lockfile
  or dependency changes. Tests use isolated Bun 1.4.3 through `scripts/test.ts`.
- All docs guards plus layout, structure, hygiene, routed-agent conversion and
  CLI-export regressions: 512 passed, 0 failed, 4,661 assertions across 20 files.
- Separate file-size guard: 9 passed, 0 failed, 85 assertions. No cap changed.
- After the final upstream merge, fixture teardown, Codex auth-context and
  server-management-auth regressions: 143 passed, 0 failed, 693 assertions.
- After the final Spanish edits, the Spanish documentation guard was rechecked:
  15 passed, 0 failed, 2,138 assertions. These 15 are already included in the
  512-test group and are not an additional coverage count.
- Root typecheck and structure check passed again after the final upstream merge.
- The offline documentation build checks all 667 pages, internal links, Pagefind
  and sitemap. Final build and staged privacy-scan receipts are recorded in the
  PR's Verification section before publication.
- Actual-browser DOM checks confirmed the corrected adapter paragraph and JEV
  section, Spanish language metadata, mobile navigation, and no page overflow at
  1366px and 390px. The browser screenshot service returned "Unable to capture
  screenshot", including on a fresh tab, so this refresh has no new capture and
  does not claim fresh visual acceptance. Existing captures stay on `pr-assets`.

The documented full-root-suite resource exception still applies. Hosted CI for
the new exact head, including the owner's requested `lane=all`, requires
maintainer authorization. Human Spanish/render acceptance and fresh review are
still pending; keep Draft and do not describe a skipped bot review or an
`action_required` workflow as passing. Request one consolidated CodeRabbit
review after publication without waiting for its result.

## Consolidated language and contract review, October 24

The contributor authorized corrections after a read-only audit of the completed
[CodeRabbit review](https://github.com/lidge-jun/opencodex/pull/7559#pullrequestreview-5636437341).
Its eleven inline findings and two outside-diff findings are addressed together:
native-context activation and trial wording, the Droid bridge limitation,
code-mode tool names, architecture metadata, live/offline CLI management,
cleanup preview behavior, catalog-refresh exit codes, empty effort lists,
current bundled Bun, the localized signing-policy link, and log scan limits.
Both files reported for missing final newlines were confirmed and corrected.

The service-install caution was checked against `src/service/cli.ts`,
`src/service/orchestration.ts` and `src/service/health.ts`: installation stops
the tracked standalone listener before loading the managed service, then probes
the installed service port. English and Spanish now explain that handover and
show a post-install service-status check. This documents existing behavior.

Read CodeRabbit's official [command reference](https://docs.coderabbit.ai/reference/review-commands),
[configuration reference](https://docs.coderabbit.ai/reference/configuration),
[path instructions](https://docs.coderabbit.ai/configuration/path-instructions)
and [pre-merge checks](https://docs.coderabbit.ai/pr-reviews/pre-merge-checks).
The repository uses the assertive profile and disables automatic Draft review.
Keep those settings intact. Add useful docstrings to the changed localization
and parity helpers instead of suppressing coverage checks. Publish one
consolidated update and request one full review, rather than triggering reviews
on a sequence of partial pushes. A full review is not an exhaustive guarantee.

Merged current `dev` at `26598df2c4c07d781e344ac6119953fed77ecb27`,
preserving the complete upstream test-layout roster and this branch's docs shard.
Spanish now includes JEV pin-editor validation, Qoder provider-only catalogs and
replay-envelope refusal, connected-client stop preservation, account-slot
identity and headless listings, safe subagent limit conversion, edited-value
ownership, the native context-window override, Kimi K3.1 pricing and the
display-only Business Premium capacity weight.

The broader pass examined every page's metadata, ran command/identifier/link
parity across all 74 canonical paths, checked negation candidates against their
English paragraphs, and reviewed operational contracts in the affected guides.
It corrected literal mistranslations in model names, protocol terminology and
negative conditions, plus unclear recovery and cost-limit wording. Only the
two current-bundle statements in each Windows-memory guide changed version;
historical Bun observations remain historical. A manifest-derived regression
now covers those statements to prevent the same version drift.

Frozen installs, typecheck and structure checks passed. The expanded docs,
layout, hygiene, routed-agent, CLI-export, combo-target and service-preflight
group passed 556 tests with 5,043 assertions across 23 files. The direct
file-size-ratchet command passed; its first test scan exceeded 120 seconds
(8 passed, 1 timeout). The separate retry after the build passed all 9 tests
(85 assertions; repository scan 611 ms), without modifying a cap. Final Spanish
parity and CLI combo-file validation passed 68 tests (2,304 assertions); the 15
Spanish cases overlap the first group, while the 53 combo cases are additional.
The build completed with 667 pages, 97,690 checked internal links, Pagefind and
sitemap. All nine landing locales were checked for an existing localized
signing-policy target or the canonical fallback, retaining the required signing
attribution. The full-root-suite resource exception remains explicit; no
old-head CI is presented as validation of this update.

Actual-browser inspection confirmed the Spanish signing-policy navigation,
1280px landing and policy layout, 390px native-context rendering and mobile
navigation without page overflow, and 41 Spanish Pagefind results for context.
Fresh screenshots are published on the separate `pr-assets` branch, not this
source branch. The inspection also found and corrected the hero's accessible
English conjunction and untranslated beta announcement.

Federico's human Spanish acceptance was recorded on the preceding published
head. The current correction is not a claim that he executed a new browser or
native Desktop test. Keep the fresh-review and maintainer-acceptance gates open
until their actual outcomes are available.

## Final upstream refresh and verification, October 25

Before publication, `dev` advanced another 25 commits. Merged
`8ebe46b2076445d100cef1e52af4d98d78f8f1e1` without conflicts and retained the
upstream layout shards. Synchronized the nine changed canonical pages:
contribution/test-runner guidance, hard-lock candidate inspection, Hermes named
profiles and marketplace detection, Moonshot K3.1 seeds, Pi startup failures,
native citation projection, expected-Home sync flags, Kiro overage refusals,
and response-download backpressure. The test runner pin is now Bun 1.4.4,
matching the shipped runtime; the Spanish contributor version is covered by
the manifest-derived regression. Also clarified Kimi cache-key rejection,
effort-only LazyCodex saves, and identical-catalog no-op behavior.

Final frozen installs changed no dependencies. Typecheck and structure checks
passed. Under the current 1.4.4 pin, the focused docs/layout/CLI/service group
passed 611 tests (5,218 assertions, 24 files). Eight additional relevant runtime
files passed 181 tests (3,465 assertions), including Hermes profiles, guarded
sync, Kiro, native compact and pinned HTTP. After the final prose edits, the
Spanish and Bun guards passed 18 tests (2,155 assertions), overlapping the first
group. The first file-size repository scan exceeded 120 seconds (8 passed,
1 timeout; 172 seconds observed in the case). The direct ratchet command
passed, then an isolated retry passed all 9 tests (85 assertions; repository
scan 447 ms), without a baseline or cap change. These results cover 801 unique
focused cases; they do not claim a full-root-suite result or establish the
cause of either earlier scan timeout.

The final offline build completed with 667 pages, 97,705 checked internal links,
Pagefind and sitemap. Actual-browser inspection checked the newly synchronized
Hermes and expected-Home sync sections at 390px and recaptured the Spanish
landing at 1280px. The browser viewport was restored afterward. The additional
captures are on the fork's separate `pr-assets` branch at
`73c6b4592d0bd103c9717d049a0c6020b0321dd9`, under `spanish-docs-20261025/`;
no image is added to this source branch.

Publish the correction commits together, document staged privacy validation,
resolve the eleven corrected inline threads, and request one full review.
Do not wait for CodeRabbit's result. The full-root resource exception,
authorized current-head CI, requested manual `lane=all`, and maintainer
acceptance remain explicit gates; the PR stays Draft.

## Consolidated review correction, October 26

The contributor authorized correcting the eight new inline findings from the
completed CodeRabbit review of `8400645a26c36520f5df33ece80c8f49ed0c47b5`.
Merged 33 newer `dev` commits through
`81ce59591c06b2f1bde71748588fda69078662a2` (2.93.0), preserving history in
`f462c6907a898dc5a324a1032043daf923d48828`. The only conflict appended both
the upstream combo shard and this contribution's docs shard. The resulting
roster, all upstream shard contents, and the expected fixture roster were
compared with upstream; no upstream entry was dropped.

The eight corrections cover prompt-base replacement, separate foreground Hub
and dashboard terminals, Stop ownership/refusals, cost coverage, proxy precedence,
sidecar save/apply receipts, Advisor failure/retry behavior, and manual Desktop
update instructions. English is clarified where it also obscured existing
behavior; the two-terminal correction is applied across all nine physical
documentation locales. No runtime or CI policy is changed by this contribution.

The cost explanation was verified against `src/usage/summary.ts` and its cost
regressions. A known-zero-spend refusal is not unknown potentially billed work;
it does not make a subsequently measured attempt unpriced. A row consisting
only of known-zero refusals contributes no measured request fact, and a summary
containing only those rows is unmetered. A cancellation or unmeasured upstream
attempt can still be potentially billable. The updated prose preserves these
distinct cases rather than treating every failed request alike.

Reviewed the complete prompt-layer and Advisor guides against current English
and the relevant runtime. Corrected additive layers versus replacing variants,
account attribution, repair/ownership, cached skill catalogs, unquoted JSON keys,
consultation deduplication, and task continuation after an unavailable preflight.
Actual-browser inspection also exposed mistranslated Remote Workspace grant,
prompt-acceptance, hard-link, ordered-message and containment language. Rechecked
that complete guide against English, retaining all commands and identifiers.
Escaped the English and Spanish `<default>` labels so their text renders instead
of being interpreted as HTML.

Synchronized the 18 canonical pages changed by the new upstream commits. Spanish
now includes Flex selection, opt-in combo cooldown reprobes, JEV Decisions
validation, Qoder/WorkBuddy homes and admission, provider seed repairs, MiniMax
retirement, Antigravity Chat limits, literal SSH Include paths, retired OpenCode
sidecars, restart handover, native compaction/tool rules, WebSocket liveness,
effort floors, Cursor globs and Windows launcher/update process-tree behavior.

The existing docs guard now exercises separate foreground/GUI blocks in all
nine locales. Its code-span scanner correctly treats backslashes inside code
spans as literal, including a trailing-backslash path followed by identifiers.
The regression rejects an altered later identifier while preserving escaped
prose openers. This follows CommonMark 0.31.2 section 6.1; the helper remains a
technical-parity scanner, not a general Markdown parser. All 74 paths retain
command-block and inline-identifier parity.

Frozen root, GUI and docs installs passed without lockfile changes. Bun 1.4.4
matches the test/runtime pin. Typecheck, structure and the direct file-size
ratchet command passed without changing a cap. The isolated wrapper was used
for all tests:

- Docs/layout/structure/hygiene/CLI group: 536 passed, 0 failed, 4,803 assertions,
  21 files. This includes all `docs-*.test.ts` guards, both layout tests,
  structure-ssot, ci-structure-gate, repo-hygiene, cli-export-command,
  cli-combo-set-targets and cli-combo-parity.
- Advisor/agent/cost/service/update group: 580 passed and one Windows fixture
  failure, 4,185 assertions, 25 files. The failure is `advisor-budget.test.ts`
  "a symlink is refused before SQLite can mutate its target": Windows returned
  EPERM while `symlinkSync` created the fixture, before the behavior under test.
  The test and implementation match upstream; neither was changed or skipped.
- Current-dev runtime group: 533 passed, 8 skipped, 0 failed, 5,145 assertions,
  20 files. It covers Flex, cooldown reprobes, JEV, client homes, provider seeds,
  Cursor globs, required tools, compaction, WebSocket liveness, the CLI launcher,
  sidecar usage and Antigravity Chat. The eight existing Windows skips cover
  Cursor symlinks, POSIX SSH Include escaping and six PATH-based Bun cases;
  those platform branches remain for authorized Linux/macOS CI.
- Re-ran the unchanged Advisor budget file on Linux using official Bun 1.4.4
  image `oven/bun@sha256:1d22548f177f4ff38e0c15baa3c2c46c6c2060ba2d1bc573bb4720b407548f1d`:
  4 passed, 0 failed, 13 assertions, including the symlink refusal. The disposable
  container had no network, a read-only checkout and a private temporary
  filesystem; no Windows permissions or personal configuration were changed.
  Three cases overlap the Windows group, so these are not four new unique cases.
- The final docs/layout group above was rerun after the last prose and scanner
  regression edits; it includes the Spanish and Bun guards. An earlier isolated
  recheck passed 20 tests with 2,188 assertions, overlapping that group.

The exact reproduction commands and final build, browser and staged privacy
receipts are included in the PR description. The full-root-suite resource
exception remains: this turn does not claim a passing full root run, and the
preceding combined-PR 900-second run included failures not all classified as
environmental. The unexecuted remainder and cross-platform coverage still need
authorized exact-head CI and the maintainer's requested manual `lane=all`.

CodeRabbit reported 100% docstring coverage on the preceding head, but its
LanguageTool check did not cover everything because the organization's local
character budget was exhausted. The manual language/contract pass and parity
tests do not turn that into an exhaustive grammar-tool success. Keep that
limitation and fresh review separate from contributor language acceptance.

The final offline build completed with 667 pages and 97,816 checked internal
links, including Pagefind and sitemap. The built nine-locale signing-policy and
attribution check passed. Actual-browser inspection at 1280px verified the
prompt-variant replacement warning and visible `<default>` label; at 390px it
verified the two-terminal Hub setup and Advisor failure guidance. These pages
had Spanish language metadata and no horizontal page overflow. The Spanish
Pagefind query `asesor` returned 12 results and its Advisor result opened the
Spanish guide. The viewport was restored afterward; the preview remains at
`http://127.0.0.1:4323/es/`. Native Desktop was not exercised, and personal
Desktop port 10100, credentials and configuration were not used.

Four fresh screenshots are on the fork's separate `pr-assets` branch at
`0a6e2aae19a79947362eb1530eb84b120addbcc1`, under
`spanish-docs-20261026/`. None is added to this source branch. Rechecked upstream
before publication: the branch contains the fetched current `dev` tip.
Publish the consolidated source update, resolve only the eight corrected
threads, and request one full review without waiting for it. Keep Draft until
fresh review, authorized exact-head CI and maintainer acceptance are recorded;
historical contributor language acceptance is not a new human or native test.
