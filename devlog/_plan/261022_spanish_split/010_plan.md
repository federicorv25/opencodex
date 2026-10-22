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

Base: `782655d2317d4c14a99d6db72e9be3368a27886d`, 23 commits after the combined
PR's last integration base. Recovered changes use that base's files and retain
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
