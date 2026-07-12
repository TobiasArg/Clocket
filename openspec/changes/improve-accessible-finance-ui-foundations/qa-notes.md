## QA notes

- Component DOM checks cover dialog role/labelling, Escape dismissal, focus restore, and active navigation state.
- Static/manual code review confirmed account and transaction delete controls are reachable as real buttons without swipe, and investment entry deletion no longer uses `window.confirm`.
- Static/manual code review confirmed settings export success/error/busy feedback uses status/alert semantics and calm Spanish copy.
- Browser automation was attempted through the repository webapp-testing workflow, but Python Playwright is not installed in this environment (`ModuleNotFoundError: No module named 'playwright'`).
