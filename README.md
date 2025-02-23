# Model Agent Magic

A Chrome extension that uses a multi-agent system powered by Microsoft AutoGen to improve prompts through specialized agents (Critic, Refiner, and Evaluator).

## System Architecture

- **Frontend**: React + Vite Chrome Extension
- **Backend**: FastAPI + AutoGen Multi-Agent System
- **Integration**: n8n webhook for final processing

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Perplexity API key (or OpenAI API key if using GPT-4)
- Chrome browser

## Setup Instructions

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file and add your API key
echo "OPENAI_API_KEY=your_perplexity_api_key_here" > .env

# Start the backend server
python main.py
```

The backend server will run on http://localhost:8000

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# For development:
npm run dev

# For Chrome extension:
npm run build
```

The development server will run on http://localhost:8081

### 3. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist` folder created by the build command
5. The extension should now appear in your Chrome toolbar

## Using the Multi-Agent System

1. Open the extension in your browser
2. Select a model (e.g., GPT-4, Claude, Gemini)
3. Choose a role (Web Developer, System Engineer, Data Analyst, or UX Designer)
4. Enter your prompt
5. Click "Gregify" to process through the agent pipeline:
   - Critic Agent analyzes the prompt
   - Refiner Agent improves it
   - Evaluator Agent validates and finalizes it

## API Documentation

Access the API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Configuration

### Changing Models

The system currently uses Perplexity's API. To modify the model:

1. Edit `backend/agents/config.py`
2. Update the `BASE_CONFIG` section:

```python
BASE_CONFIG = {
    "config_list": [{
        "model": "pplx-7b-chat",  # Change to your preferred model
        "api_key": os.getenv("OPENAI_API_KEY"),
        "base_url": "https://api.perplexity.ai",
    }],
}
```

Available Perplexity models:

- `pplx-7b-chat`: Smaller, faster model
- `pplx-70b-chat`: Larger, more capable model
- `pplx-online`: Online model with up-to-date knowledge
- `r1-1776`: Specialized model

## Troubleshooting

1. **CORS Issues**: Ensure the backend is running and CORS is properly configured
2. **API Key Errors**: Verify your API key in the `.env` file
3. **Model Errors**: Check model availability and credits in your Perplexity account

## Development

- Backend code is in the `backend/` directory
- Frontend code is in the `src/` directory
- Agent configurations are in `backend/agents/config.py`

## License

MIT License
