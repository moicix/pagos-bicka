# Project Overview

This is an [Airtable Block](https://airtable.com/developers/blocks) project. It's built using [React](https://reactjs.org/) and styled with [Tailwind CSS](https://tailwindcss.com/). The main entry point for the application is `frontend/index.js`.

The block currently displays a "Hello world" message.

# Building and Running

There are no explicit build or run commands in `package.json`. Airtable Blocks are typically run within the Airtable UI.

To check for code quality, run the linter:

```bash
npm run lint
```

# Development Conventions

*   **Linting:** The project uses ESLint for linting JavaScript files. The configuration can be found in `eslint.config.mjs`.
*   **Styling:** The project uses Tailwind CSS. The configuration is in `tailwind.config.js` and the main stylesheet is `frontend/style.css`.
*   **Dependencies:** Project dependencies are managed with `npm`.
