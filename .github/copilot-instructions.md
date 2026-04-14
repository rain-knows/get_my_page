# Copilot Guidelines for GetMyPage

## Architecture & Code Rules
- Follow the rules defined in `AGENTS.md` and `docs/architecture-contract.md`.
- No business logic in `frontend/src/app` or UI components (`frontend/src/components/ui`).

## UI & Design Specifications
- **Must Read**: You MUST refer to `docs/design.md` for any UI or frontend changes.
- **Tailwind CSS v4 Standard**: Strictly use Tailwind CSS v4 variables syntax (e.g., `text-(--gmp-accent)`). Never use the legacy bracket arbitrary syntax with variables like `text-[var(--gmp-accent)]`.

## Backend
- Place common helpers in `backend/src/main/java/com/getmypage/blog/common/*` rather than `util/`.
- Add Chinese method-level comments explaining the function's purpose, key parameters, and side-effects.