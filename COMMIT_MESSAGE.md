# Commit Message for Security Fix & Dependencies Update

## Commit Title (Summary):
```
fix: Upgrade Next.js to 15.4.10 and update dependencies
```

## Commit Description:
```
Security Fix:
- Upgrade Next.js from 15.4.6 to 15.4.10 to fix critical CVE vulnerabilities
  - CVE-2025-55182 (React Server Components RCE)
  - CVE-2025-66478 (Next.js security advisory)
  - GHSA-9qr9-h5gf-34mp (GitHub Security Advisory)

Dependencies:
- Update @supabase/supabase-js to ^2.79.0
- Add tsx ^4.20.6 for TypeScript execution

New npm scripts:
- db:migrate: Run database migrations
- db:reset: Reset database
- db:seed: Seed database with initial data
- env:validate: Validate environment variables
- setup:env: Setup new Supabase environment
- login:diagnose: Diagnose login issues
- login:fix: Fix login issues
- login:test: Test login end-to-end

This addresses the Vercel security PR #1 automatically generated fix.
```

