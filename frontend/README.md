# Gregify Frontend

This directory contains the Chrome extension UI and frontend code for Gregify, an AI-powered prompt enhancement tool.

## Development

To start the development server:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

To build the extension:

```bash
npm run build
```

This will create a `dist` directory with the compiled extension files.

## Project Structure

- `src/` - Source code directory
  - `components/` - Reusable UI components
  - `contexts/` - React context providers
  - `features/` - Feature-specific components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility libraries
  - `pages/` - Main application pages
  - `services/` - API and service integrations
  - `styles/` - Global styles
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions
  - `App.tsx` - Main application component
  - `main.tsx` - Application entry point
  - `contentScript.ts` - Chrome extension content script
  - `background.ts` - Chrome extension background script
- `public/` - Static assets
  - `icons/` - Extension icons

## Extension Features

- Prompt enhancement using RAG technology
- Multi-agent systems for comprehensive responses
- Integration with ChatGPT
- Local storage for prompt history

## Building for Production

To build the extension for production and package it for the Chrome Web Store:

```bash
npm run build:extension
```

This will create a ZIP file ready for submission to the Chrome Web Store.
