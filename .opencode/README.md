# OpenCode OpenSpec adapter

`commands/` and `skills/` are the versioned OpenCode integration for the
repository's OpenSpec workflow. The package manifest and lockfile are tracked
so a contributor can restore the integration with:

```bash
npm --prefix .opencode ci
```

`node_modules/` is generated local state and must remain untracked. Shared,
tool-agnostic skills belong in `.agents/skills/`.
