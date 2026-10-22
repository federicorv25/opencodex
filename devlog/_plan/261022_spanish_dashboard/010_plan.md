# Shared dashboard Spanish: separate follow-up

This branch recovers only the shared Desktop/browser dashboard contribution from
closed #7406. The first submission is docs-site PR #7559. Keep this follow-up
separate while the owner reviews that smaller scope; the original branch stays
available and no installed Desktop configuration is used for validation.

## Base and changes

- Base: dev `5f7f7db5765c7e99ab2f52c04d9fe0e4ce7608cf`, version 2.92.0.
- Spanish uses the existing `Locale`, catalog, auxiliary labels and formatting
  contracts. Regional browser detection and `ocx-lang` persistence are retained.
- All 29 new fallback entries from dev are translated with their placeholders.
- The remaining #7406 date-test finding is fixed: a December target ten days
  away exercises `quota.resetsAt`, asserts the Spanish `dic` abbreviation and
  checks the formatted time. It does not depend on tomorrow's date branch.
- The English dashboard guide and architecture contract describe the new locale.
- Native startup/tray/updater copy remains outside the shared dashboard scope.

## Validation

- Frozen GUI install: no manifest or lockfile changes.
- Full GUI tests with pinned Bun 1.4.3: 3,502 passed, zero failed, 83,688
  assertions across 355 files, 305.84 seconds.
- Spanish focused tests: eight passed, 49,605 assertions. The same file passed
  under UTC, America/La_Paz and Pacific/Kiritimati (eight tests in each zone).
- GUI lint, i18n lint and production build: passed. Existing large-chunk warning
  remains.
- Root size and structure guards: 60 passed, zero failed.
- Root typecheck and privacy scan: passed. The standalone dashboard branch's
  docs build completed with 593 pages and 84,780 checked internal links; it
  intentionally does not contain the 74 Spanish-site pages from #7559.
- Actual browser with an isolated synthetic provider: mounted English/Spanish
  switch, Spanish persistence after reload, `lang="es"`, current fallback copy,
  and desktop/mobile render at 1366/390px without horizontal page overflow.
  Captures remain in ignored scratch space, outside the source branch.

Before this branch is submitted, refresh dev and check all locale consumers
again. Exact-head CI and independent human language/render acceptance are still
required. No full-root-suite or native Desktop pass is claimed.
