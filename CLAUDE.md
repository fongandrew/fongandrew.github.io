# CLAUDE.md

## Project Overview

This is a GitHub Pages static website hosting web demos and tools. It's a pure HTML/CSS/JavaScript site with no build process or dependencies.

## Architecture

The site structure is intentionally simple:
- **Root directory**: Main landing page (`index.html`) and shared styles (`main.css`)
- **`pages/`**: Demo pages. Some of these include intentionally broken or misbehaving code.
- **`tools/`**: Interactive web utilities (e.g., Unicode character picker)

## Development

No build commands needed - edit files directly and test in browser. The site deploys automatically via GitHub Pages when pushed to the repository.

## Code Style

Follow the existing patterns in .prettierrc
- Use tabs (width 4) for indentation
- Single quotes for JavaScript strings
- Include semicolons in JavaScript
- Keep HTML semantic and accessible
- Use modern CSS/JS features without transpilation
- Follow `.prettierrc` settings for formatting
