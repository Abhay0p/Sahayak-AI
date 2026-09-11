# Contributing to Sahayak AI

Thank you for your interest in contributing to Sahayak AI! 

## Branch Naming Convention
- Feature: `feat/short-description`
- Bugfix: `fix/issue-description`
- Documentation: `docs/what-changed`
- Refactor: `refactor/component-name`

## Commit Style
We use standard conventional commits:
- `feat: added new memory game`
- `fix: resolved SOS notification bug`
- `docs: updated architecture diagram`

## Development Workflow
1. Fork the repository.
2. Create your feature branch.
3. Make your changes.
4. **Mandatory**: Run `npm run lint`, `npx tsc --noEmit` and `npm run build` locally to ensure the build passes.
5. Push to your branch and open a Pull Request.

## Security Expectations
- **NEVER** commit secrets, API keys, `.env` files, or database credentials.
- Do not log sensitive user health data in the console.

## Regression Testing Requirement
Before submitting a PR, you must verify that your changes did not break the existing portals. Because Sahayak uses a shared UI component library, a change for the Caregiver portal may accidentally impact the Elderly portal. Test thoroughly!
