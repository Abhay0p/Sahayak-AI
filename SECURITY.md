# Security Policy

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 1.0.0   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within Sahayak AI, please send an e-mail to the security team (placeholder: security@sahayakai.org). All security vulnerabilities will be promptly addressed.

## General Security Guidelines

### 1. Secrets Management
- **Never commit `.env` files or API keys.**
- Check `.gitignore` before making your first commit.
- Use a `.env.local` for local development testing.

### 2. Authorization & RBAC
- Frontend visibility checks (e.g., hiding a button) are **not** security boundaries.
- All backend routes must validate the incoming JWT and verify that the user's role permits the requested action.

### 3. Patient Data Privacy
- Health/routine data is sensitive. Ensure that database queries isolate records to authorized `profileId`s.
