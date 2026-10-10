# Deployment Plan

1. Fetch and reset `main` on production environment to merge commit.
2. Build production artifacts (`npm run build`).
3. Safely restart production Next.js server on port 3000.
4. Do NOT restart Hermes Gateway or 9Router unless explicitly required.
