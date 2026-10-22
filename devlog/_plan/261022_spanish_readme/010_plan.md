# Spanish README: retained follow-up

This branch extracts the README portion of closed #7406. Submit it after the
Spanish documentation site (#7559), because its `/es/` links depend on those
pages being integrated. It is preserved on a branch rather than opened as a
competing review request.

Base: dev `5f7f7db5765c7e99ab2f52c04d9fe0e4ce7608cf`, version 2.92.0. The original
Spanish source, existing locale navigation and their source hashes are retained;
the README memory guard includes the Spanish inventory. No runtime, dashboard,
workflow or dependency implementation changes are included.

## Validation

`bun scripts/test.ts --timeout 30000` with
`tests/ci-workflows/docs-readme-translation-parity.test.ts` and
`tests/ci-workflows/docs-readme-memory-inventory.test.ts`: 97 passed, zero failed,
142 assertions. Tests used the required isolated Bun 1.4.3 binary.

Before submission, refresh dev, recheck the source hashes against the then-current
English README and run the full documentation-link guard after #7559 is present.
These focused checks do not claim independent human language acceptance, full
root CI or readiness to land before the documentation-site dependency.
