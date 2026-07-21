# Shared project skills

This directory is the canonical, versioned source for skills shared by the
assistants configured for Clocket.

- Add or change shared skills only under `skills/<skill-name>/`.
- Keep each skill self-contained, with a `SKILL.md` entrypoint.
- Do not store user-specific configuration, caches, or installed packages here.
- `.kiro/skills/` links to these skills; do not copy a skill into that adapter.

Tool-specific OpenSpec workflows intentionally remain in `.codex/` and
`.opencode/`, where their command syntax differs.
