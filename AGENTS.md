# Repository instructions

These instructions apply to all work in this repository.

## Before editing

- Read `README.md` and the relevant document in `docs/`.
- Run `git status -sb` and preserve unrelated user changes.
- For calculation changes, treat `docs/CALCULATION_CONTRACTS.md` and existing tests as the behavioral contract.

## Architecture boundaries

- Keep calculation semantics in pure modules under `src/lib/`; pages own UI state only.
- Never use `eval`, `new Function`, or dynamic JavaScript execution in the expression engine.
- MathLive is a visual editor and converter, not the source of calculation semantics.
- Keep history session-only unless the user explicitly requests a persistence design.
- Add new pages through hash routing and `React.lazy`; preserve the `/tool/` Vite base.
- Do not introduce network requests, analytics, storage, authentication, or user tracking without explicit scope and privacy review.

## Required validation

- Add or update tests for every calculation rule, parser change, route, or MathLive conversion.
- Run `pnpm check` before handing off a completed change.
- UI changes require browser checks at desktop and mobile widths, including keyboard focus and reduced-motion behavior where relevant.
- Preserve the t-distribution regression value `p=0.975`, `df=10` → `2.228139`.

## Documentation

- Update README only for top-level capabilities and navigation.
- Put architecture decisions in `docs/ARCHITECTURE.md`, numerical behavior in `docs/CALCULATION_CONTRACTS.md`, and operational procedures in `docs/MAINTENANCE.md`.
- Keep `CONTRIBUTING.md`, scripts, CI steps, and documented commands synchronized.
- Do not push or publish changes unless the user explicitly asks.
