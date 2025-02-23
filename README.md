# Gregify

A Chrome extension that enhances your prompts using two powerful approaches:
- **RAG (Retrieval-Augmented Generation)**: Context-aware prompt enhancement
- **MAS (Multi-Agent System)**: Multi-stage prompt optimization through specialized agents

## Features

### Dual Processing Modes

#### RAG (Retrieval-Augmented Generation)
RAG mode enhances prompts by incorporating relevant context and knowledge:
- Analyzes your prompt against a knowledge base of effective prompting patterns
- Retrieves similar successful prompts and their outcomes
- Augments your prompt with proven patterns and best practices
- Provides quick, context-aware improvements
- Best for: Quick improvements and general prompt enhancement

#### MAS (Multi-Agent System)
MAS mode uses a collaborative system of specialized AI agents working together:
1. **Critic Agent**: 
   - Analyzes prompt structure and potential weaknesses
   - Identifies areas for improvement
   - Suggests optimization strategies

2. **Refiner Agent**:
   - Implements improvements based on Critic's feedback
   - Enhances clarity and specificity
   - Adds necessary context and constraints

3. **Evaluator Agent**:
   - Validates the refined prompt
   - Ensures all requirements are met
   - Produces the final optimized version
- Best for: Deep optimization and professional use cases

### Additional Features
- **Model Selection**: Choose between different AI models
- **Role-based Optimization**: Select from specialized roles for targeted improvements
- **Modern UI**: Clean, intuitive interface with real-time progress tracking
- **One-click Copy**: Easy copying of improved prompts

## System Architecture

- **Frontend**: React + Vite Chrome Extension
- **Backend**: FastAPI + n8n Webhook
- **UI Framework**: Tailwind CSS
- **State Management**: React Hooks

## Prerequisites

- Node.js 16+
- npm or yarn
- Chrome browser

## Setup Instructions

### Frontend Setup

```bash
# Install dependencies
npm install

# For development:
npm run dev

# For Chrome extension:
npm run build
```

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder created by the build command
5. The extension should now appear in your Chrome toolbar

## Using Gregify

1. Click the Gregify extension icon in your Chrome toolbar
2. Choose your preferred mode (RAG or MAS)
3. Select a model and role
4. Enter your prompt
5. Click "Gregify" to process
6. Copy the improved prompt with one click

## Features in Detail

### RAG Mode
- Quick, context-aware improvements
- Real-time processing
- Instant results

### MAS Mode
- Multi-stage optimization process
- Detailed agent feedback
- More comprehensive improvements

## Development

- Frontend code is in the `src/` directory
- Components are in `src/components`
- Pages are in `src/pages`

## License

MIT License
