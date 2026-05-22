## User Requirements
- /docs

## Development Rules
- Develop in a user-agnostic manner.
- Save unresolved blockers or issues to /logs; they will be addressed with the user later.
- Create a README file for project documentation.
- If you find any related skill, do not hesitate or skip it — always load it. It may contain valuable information, style guides, documentation, or preferences.
- Verify that everything is committed and pushed when the work is finished.
- Everything you implement must be covered by unit tests.
- Once all work is complete, run Playwright MCP, take screenshots of the pages, and save them to the repository.
- No additional restrictions. You may run commands, search, and use any resources required to complete the task.

## Scope-Based Iterative Commits Rule
- Make small iterative commits grouped by a single development scope, such as a page, service, component, or integration. Each commit should represent one self-contained unit of work within that scope (for example: "UserProfile page implementation" or "Auth service integration").
- Avoid mixing multiple scopes in a single commit. Keep commits frequent enough to reflect progress, but organize them around feature boundaries rather than individual code changes. Whenever possible, each commit should leave the application in a working or safely incremental state.
- Every time a commit is created, it must be pushed to the remote repository immediately. Do not leave commits only in the local repository. This ensures continuous backup, visible progress, and reduces the risk of lost work or diverging history.