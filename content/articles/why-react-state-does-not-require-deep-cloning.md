---
title: Why React State Does Not Require Deep Cloning
slug: why-react-state-does-not-require-deep-cloning
description: Understanding structural sharing, shallow equality checks, and why deep cloning objects in React state is an anti-pattern that hurts performance.
type: note
tags:
  - react
  - javascript
  - webdev
  - performance
publishedAt: 2026-09-03
---

A common misconception among developers transitioning to React is that updating nested state requires creating an expensive deep clone using `structuredClone()` or `JSON.parse(JSON.stringify())`.

In reality, React's reconciliation engine only checks object references by shallow comparison (`Object.is`). Deep cloning is not only unnecessary; it actively destroys React's performance optimizations.

## 1. How React Detects State Changes

React relies on referential identity to decide whether a state update occurred:

```javascript
function shouldComponentUpdate(prevValue, nextValue) {
  return !Object.is(prevValue, nextValue);
}
```

If the reference of the top-level state object changed, React schedules a re-render. React never traverses down deeply nested trees to inspect whether inner values changed.

## 2. Structural Sharing: The Right Way

Instead of deep copying an entire object tree, you only copy the objects along the path of mutation. All untouched branches retain their original references.

```typescript
interface UserProfile {
  id: string;
  name: string;
  settings: {
    theme: 'light' | 'dark';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

// Updating only email notification preference:
setUserProfile((prev) => ({
  ...prev,
  settings: {
    ...prev.settings,
    notifications: {
      ...prev.settings.notifications,
      email: true, // Only this path has newly allocated references
    },
  },
}));
```

### Why Structural Sharing Matters

1. **Memory efficiency:** Unmodified nodes in the state tree share memory with previous renders.
2. **Memoization preservation:** Components wrapped in `React.memo()` or hooks like `useMemo()` comparing unmodified branches will bail out of re-renders because `prev.settings === next.settings` remains true when settings are untouched.

> **Rule of Thumb:** If a component doesn't need to re-render when a sibling property changes, make sure that property's reference doesn't change. Deep cloning breaks this rule across your entire state tree.
