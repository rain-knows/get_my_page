# GetMyPage Agent Guide (Codex / Multi-Agent)

This file defines the architecture contract entrypoint for coding agents.

## Read Order (Required)

1. `docs/architecture-contract.md`
2. `README.md` (project layout + dev commands)
3. Relevant subsystem docs under `docs/`

## Mandatory Rules

- Do not place business logic in `frontend/src/app`.
- Do not place business components in `frontend/src/components/ui`.
- Put feature logic in `frontend/src/features/*` first; `frontend/src/hooks` is only for cross-feature generic hooks.
- Keep backend common helpers under `backend/src/main/java/com/getmypage/blog/common/*`, not legacy `util/`.
- Keep public API contracts backward compatible unless the task explicitly requests breaking changes.
- If architecture changes, update `docs/architecture-contract.md` and related docs in the same change.

## Output Expectations

- Prefer minimal, incremental changes.
- Keep imports aligned with layering constraints.
- Run available lint/build/tests before finishing when environment allows.
