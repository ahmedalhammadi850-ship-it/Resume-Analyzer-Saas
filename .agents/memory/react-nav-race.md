---
name: React navigation race condition with async state + wouter
description: Calling setLocation inline after setState in an async handler navigates before state commits, causing ProtectedRoute to see stale state
---

## The Rule
After calling `setState` (or context state setters) in an async function, do NOT call `setLocation(...)` immediately after. Use a `useEffect` that watches the state and triggers the navigation there.

## Why
In React 18, state updates inside async functions (e.g., inside an `await` handler) are batched, but `setLocation` from wouter uses `history.pushState` which causes an immediate navigation and re-render. The new route renders BEFORE React commits the pending state updates, so `ProtectedRoute` sees the old `userProfile = null` and redirects back to `/login`.

## How to apply
```tsx
// BAD — navigation races state commit
setJwtSession(token, user);
setLocation("/dashboard");

// GOOD — navigation fires after state is committed
setJwtSession(token, user);
// let the useEffect handle it:
useEffect(() => {
  if (!loading && userProfile) setLocation("/dashboard");
}, [loading, userProfile]);
```

This applies any time you: (1) call a context setter that updates auth state, then (2) immediately navigate to a protected route.
