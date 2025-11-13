
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** CRMV2
- **Date:** 2025-11-13
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001
- **Test Name:** Authentication - Successful Login with Valid Credentials
- **Test Code:** [TC001_Authentication___Successful_Login_with_Valid_Credentials.py](./TC001_Authentication___Successful_Login_with_Valid_Credentials.py)
- **Test Error:** Login page is broken due to a build error preventing the login form from rendering. Cannot proceed with login test for valid credentials and MFA enforcement.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/3c891f90-44b1-4a55-a5a0-35b396d6d640
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002
- **Test Name:** Authentication - Failed Login with Invalid Credentials
- **Test Code:** [TC002_Authentication___Failed_Login_with_Invalid_Credentials.py](./TC002_Authentication___Failed_Login_with_Invalid_Credentials.py)
- **Test Error:** The login page is currently showing a build error (Parsing ecmascript source code failed in ContactList.tsx). Because of this, I could not perform the login tests with invalid credentials to verify rejection and error messages. The issue has been reported. Task cannot be completed until the build error is fixed.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/283e485c-29c0-4011-8e2e-4000a520931f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003
- **Test Name:** Dashboard - KPI and Chart Load Performance
- **Test Code:** [TC003_Dashboard___KPI_and_Chart_Load_Performance.py](./TC003_Dashboard___KPI_and_Chart_Load_Performance.py)
- **Test Error:** The dashboard main page could not be tested because the login page is broken due to a build error in the source code (ContactList.tsx). The login form is not rendered, so login and navigation to the dashboard is impossible. Hence, KPI cards, trend analytics, and recent activities could not be verified or performance measured. Please fix the build error and retry.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/5431b680-dcd5-4514-8f20-a8148f3e0540
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004
- **Test Name:** Multi-Tenant Data Isolation with RLS Policies
- **Test Code:** [TC004_Multi_Tenant_Data_Isolation_with_RLS_Policies.py](./TC004_Multi_Tenant_Data_Isolation_with_RLS_Policies.py)
- **Test Error:** The login page is currently broken due to a build error in ContactList.tsx, preventing login and further testing of tenant data isolation using Row-Level Security. The issue has been reported. Unable to verify tenant data isolation or perform CRUD operations as requested due to this blocking error.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/ae91f46e-188d-41e0-9484-259537dce2dc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005
- **Test Name:** Customer Management - CRUD Operations and Bulk Actions
- **Test Code:** [TC005_Customer_Management___CRUD_Operations_and_Bulk_Actions.py](./TC005_Customer_Management___CRUD_Operations_and_Bulk_Actions.py)
- **Test Error:** Testing cannot proceed because the login page is broken with a build error in ContactList.tsx. The customer management module cannot be tested until this is fixed.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/f087d230-c7cd-4ad7-8a5d-99cee5a1e3bc
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006
- **Test Name:** Quote Management - PDF Generation and Automatic Expiry
- **Test Code:** [TC006_Quote_Management___PDF_Generation_and_Automatic_Expiry.py](./TC006_Quote_Management___PDF_Generation_and_Automatic_Expiry.py)
- **Test Error:** The testing task for quote CRUD operations, PDF generation, revision tracking, and expiry workflow could not be completed due to a critical build error on the login page preventing access to the application. The issue has been reported for developer attention. Please fix the build error to enable further testing.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/d8f2ad3c-a4d7-409c-951f-bcfcafdee866
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007
- **Test Name:** Invoice Management - Payment Tracking and Kanban View
- **Test Code:** [TC007_Invoice_Management___Payment_Tracking_and_Kanban_View.py](./TC007_Invoice_Management___Payment_Tracking_and_Kanban_View.py)
- **Test Error:** The testing task to verify invoice creation, editing, PDF export, payment status tracking, and kanban board visualization could not be completed due to a build error on the login page. The error prevents logging in and accessing the application features. The issue has been reported.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/cbbe3c56-c6c3-4d41-9f61-205f5919b0b5
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008
- **Test Name:** Role-Based Access Control Enforcement
- **Test Code:** [TC008_Role_Based_Access_Control_Enforcement.py](./TC008_Role_Based_Access_Control_Enforcement.py)
- **Test Error:** The login page is currently broken due to a build error in the ContactList.tsx component, preventing the login form from rendering. Because of this, I could not perform the role-based access verification as requested. The issue has been reported. Please fix the build error to enable further testing of user role permissions and access controls.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/c91c8b11-3aca-4515-bba0-a44fe9c0d65b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009
- **Test Name:** Real-Time Notification System Functionality
- **Test Code:** [TC009_Real_Time_Notification_System_Functionality.py](./TC009_Real_Time_Notification_System_Functionality.py)
- **Test Error:** 
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/c8a0c93b-fed6-4200-b7e1-08268d0202d3
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010
- **Test Name:** Localization and Language Switch
- **Test Code:** [TC010_Localization_and_Language_Switch.py](./TC010_Localization_and_Language_Switch.py)
- **Test Error:** The UI language switch test could not be completed due to a critical build error on the login page. The error prevents login and further interaction needed to verify language switching between Turkish and English. The issue has been reported for resolution.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/92348b09-49cf-4445-b376-309b90786c6f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011
- **Test Name:** Activity Log - CRUD Operation Tracking with Metadata
- **Test Code:** [TC011_Activity_Log___CRUD_Operation_Tracking_with_Metadata.py](./TC011_Activity_Log___CRUD_Operation_Tracking_with_Metadata.py)
- **Test Error:** The login page is currently broken due to a build error in the ContactList.tsx component, which prevents the login form from rendering and blocks the ability to perform user CRUD actions and verify audit logs. This issue has been reported. Further testing cannot proceed until this is fixed.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/7bf1baa8-980c-4cf7-82b7-01908dc4d8e1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012
- **Test Name:** Workflow Automation - Quote Expiry and Deal Monitoring
- **Test Code:** [TC012_Workflow_Automation___Quote_Expiry_and_Deal_Monitoring.py](./TC012_Workflow_Automation___Quote_Expiry_and_Deal_Monitoring.py)
- **Test Error:** The testing of workflow automations for expired quotes and deal monitoring could not be completed due to a build error on the login page that prevents access to the system. The issue has been reported for resolution.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/773380f3-56ed-437e-8732-b4091a407fad
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013
- **Test Name:** Scheduled Cron Jobs Running and Recovery
- **Test Code:** [TC013_Scheduled_Cron_Jobs_Running_and_Recovery.py](./TC013_Scheduled_Cron_Jobs_Running_and_Recovery.py)
- **Test Error:** The task to verify scheduled cron jobs for invoice monitoring, stock alerts, and task reminders could not be completed because the login page is broken due to a build error in the source code (ContactList.tsx). This prevents logging in and accessing the system to test the cron jobs. The issue has been reported. Please fix the build error to enable further testing.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/113f0987-1dd4-42ac-b7e1-65d4af1fd28c
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014
- **Test Name:** Report Generation and Export Accuracy
- **Test Code:** [TC014_Report_Generation_and_Export_Accuracy.py](./TC014_Report_Generation_and_Export_Accuracy.py)
- **Test Error:** The testing task to verify reports for customers, sales, finance, and products could not be completed due to a build error on the login page. The error prevents login and access to the reporting module. The issue has been reported for resolution. Task stopped.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/8392c833-d213-4114-9c03-6417c4524696
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015
- **Test Name:** Document Management - Upload, Access Control and Versioning
- **Test Code:** [TC015_Document_Management___Upload_Access_Control_and_Versioning.py](./TC015_Document_Management___Upload_Access_Control_and_Versioning.py)
- **Test Error:** The login page at http://localhost:3000/tr/login shows a critical build error preventing login and further testing. Due to this, I could not perform the document upload, access permission verification, or versioning tests. The issue has been reported. Task is now complete with failure due to this blocking error.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/edb9c2cd-e268-4399-8a7a-450bb0e39b87
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016
- **Test Name:** UI Components Render Correctly on Supported Browsers and Devices
- **Test Code:** [TC016_UI_Components_Render_Correctly_on_Supported_Browsers_and_Devices.py](./TC016_UI_Components_Render_Correctly_on_Supported_Browsers_and_Devices.py)
- **Test Error:** The UI components on the login page cannot be verified because the application fails to render due to a build error in ContactList.tsx. This critical error prevents the login form and other UI elements from loading and interacting as expected. The issue has been reported. Task is now complete.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/363c51c8-095e-4f1e-9107-445b212f2d4b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017
- **Test Name:** Performance Optimization Verification - Prefetch, Lazy Loading, Skeleton States
- **Test Code:** [TC017_Performance_Optimization_Verification___Prefetch_Lazy_Loading_Skeleton_States.py](./TC017_Performance_Optimization_Verification___Prefetch_Lazy_Loading_Skeleton_States.py)
- **Test Error:** Testing stopped due to build error on login page preventing interaction with login form. Cannot proceed with prefetching, lazy loading, or skeleton state verification.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/f948d609-0139-46f9-8be1-acbe126ae995
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018
- **Test Name:** Email Campaign - Template Management, Sending and Tracking
- **Test Code:** [TC018_Email_Campaign___Template_Management_Sending_and_Tracking.py](./TC018_Email_Campaign___Template_Management_Sending_and_Tracking.py)
- **Test Error:** The email campaign template creation, modification, sending, and tracking verification could not be completed due to a critical build error on the login page. The error prevents logging in and accessing the necessary features. The issue has been reported for resolution.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/0d7a4967-3d06-4bbf-9e47-05b42e891e6b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019
- **Test Name:** Security Audit - Cross-Tenant Data Leak and Privilege Escalation Prevention
- **Test Code:** [TC019_Security_Audit___Cross_Tenant_Data_Leak_and_Privilege_Escalation_Prevention.py](./TC019_Security_Audit___Cross_Tenant_Data_Leak_and_Privilege_Escalation_Prevention.py)
- **Test Error:** Cannot proceed with testing data leak and privilege escalation due to build error on login page preventing login and access to dashboard. Reported the issue.
Browser Console Logs:
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
[ERROR] ./src/components/contacts/ContactList.tsx:377:9
Parsing ecmascript source code failed
  375 |         />
  376 |
> 377 |         {/* Detail Modal */}
      |         ^
  378 |         {selectedContactId && (
  379 |           <ContactDetailModal
  380 |             contactId={selectedContactId}

Expected '</', got '{'

Import trace:
  Server Component:
    ./src/components/contacts/ContactList.tsx
    ./src/app/[locale]/contacts/page.tsx (at http://localhost:3000/_next/static/chunks/node_modules_next_dist_b0daae9a._.js:2359:31)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/50417f03-b110-4901-abda-03e6e22fa14a/77d47399-cdd0-4985-9af2-d598ee1b06cf
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **0.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---