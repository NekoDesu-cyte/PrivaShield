# Project Rules & Consistency

## 1. Documentation-First Engineering
Every change to the codebase **must** be accompanied by a synchronized update to:
- **PRD.md**: If the feature requirements or user journeys change.
- **ADR.md**: If technical choices, libraries, or architectural patterns change.
- **Technical_Detail.md**: If the pipeline, API design, or data flow changes.
- **Guide Usage.md**: If API endpoints or usage patterns change.
- **pipeline_test.ipynb**: If the detection logic or data processing flow changes.

## 2. Validation Protocol
- **Single Source of Truth**: The documentation IS the architecture. Code that contradicts documentation is technically a bug.
- **Verification**: Before concluding any task, perform a final audit of all files in `docs/` to ensure they accurately represent the current state.

## 3. Workspace Hygiene
- No `__pycache__` files in the repository.
- All temporary files (uploaded images, processing logs) must remain within the `uploads/` directory, which is ignored by Git.
- Always maintain clear separation between core logic (`backend/app/core/`) and orchestration (`backend/app/api/`).
