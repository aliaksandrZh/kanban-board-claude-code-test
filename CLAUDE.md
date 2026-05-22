User Requirements `docs/prd.md`.

## Development Rules

- User-agnostic development.
- Save unresolved blockers or issues to `/logs`; they will be addressed to the user.
- Create a README file for project documentation.
- If you see any related skill, do not hesitate or skip it—always load it. It may contain valuable information, style guides, documentation or preferences.
- Verify everything is committed and pushed when you're finished.

## Scope-Based Iterative Commits Rule
Make small iterative commits grouped by a single development scope such as a page, service, component, or integration. Each commit should cover one self-contained unit of work within that scope (e.g., "UserProfile page implementation", "Auth service integration").

Avoid mixing multiple scopes in one commit. Keep commits frequent enough to reflect progress, but structured around feature boundaries rather than individual code changes. Each commit should leave the application in a working or safely incremental state where possible.

Every time a commit is made, it must be pushed to the remote repository immediately. Do not keep local commits unpushed. This ensures continuous backup, visible progress, and reduces risk of losing work or diverging history.