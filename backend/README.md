# Gregify Backend API

The Gregify backend provides a RESTful API for enhancing prompts using a multi-agent system powered by LLMs. It enables sophisticated prompt improvement through a coordinated system of specialized agents.

## Features

- **Multi-Agent Prompt Enhancement**: Coordinated system of critic, refiner, and evaluator agents
- **Role-Based Enhancement**: Optimizes prompts for specific domains (web development, system engineering, etc.)
- **Direct API Enhancement**: Fast prompt enhancement directly via LLM
- **Health Monitoring**: Endpoints for monitoring API health and testing connections

## Technology Stack

- **Framework**: FastAPI
- **LLM Integration**: Perplexity AI (via OpenAI-compatible API)
- **Agent Framework**: AutoGen
- **Server**: Uvicorn

## Project Structure

```
backend/
├── app/                # Main application code
│   ├── api/            # API endpoints and routers
│   ├── core/           # Core configurations and settings
│   ├── models/         # Data models and schemas
│   ├── services/       # Services for business logic
│   │   └── agents/     # Multi-agent system implementation
│   └── utils/          # Utility functions
├── tests/              # Test suite
├── .env                # Environment variables (not in git)
├── .env.example        # Example environment file
├── requirements.txt    # Python dependencies
├── server.py           # Entry point script
└── README.md           # This file
```

## Setup Instructions

### Prerequisites

- Python 3.9+ installed
- Perplexity AI API key (or compatible OpenAI-style API)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/gregify.git
   cd gregify/backend
   ```

2. Create a virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file from the example:

   ```bash
   cp .env.example .env
   ```

5. Edit the `.env` file and add your API key:
   ```
   OPENAI_API_KEY=your_perplexity_api_key_here
   HOST=0.0.0.0
   PORT=8000
   ```

### Running the Server

Start the development server:

```bash
python server.py
```

The API will be available at http://localhost:8000

You can also use uvicorn directly:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

### General Endpoints

- `GET /` - Root endpoint with API information
- `GET /health` - Health check endpoint
- `GET /test-api` - Test LLM API connectivity

### Prompt Endpoints

- `POST /normal-prompt` - Process a prompt directly with the LLM
- `POST /process-prompt` - Process a prompt through the multi-agent system

## Multi-Agent System

The backend implements a three-agent system for prompt enhancement:

1. **Critic Agent**: Analyzes the initial prompt and identifies issues in clarity, specificity, and technical accuracy.

2. **Refiner Agent**: Takes the original prompt and critic's feedback to create an enhanced version that addresses identified issues.

3. **Evaluator Agent**: Validates the refined prompt, ensuring all issues are addressed and the prompt is well-structured.

This system provides more sophisticated prompt enhancement compared to single-agent approaches, with improvements in clarity, technical accuracy, and domain-specific optimization.

## Development

### Code Formatting

Format code with Black:

```bash
black app tests
```

### Linting

Run Flake8:

```bash
flake8 app tests
```

### Running Tests

Execute the test suite:

```bash
pytest
```

## License

[Specify your license here]

## Contact

[Your contact information]
