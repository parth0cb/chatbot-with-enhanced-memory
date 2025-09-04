# Chatbot with enhanced memory

A conversational AI with persistent memory capabilities. This chatbot deliberately remembers important information across conversations, allowing for more context-aware and personalized interactions.

## Features

- **Long-term Memory**: The application automatically identifies and stores important information from conversations in a memory timeline
- **Context-Aware Responses**: Memories are incorporated into the system prompt to influence future responses
- **API Flexibility**: Supports any OpenAI-compatible API endpoint

## Technology Stack

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript
- **AI Integration**: OpenAI Python library

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/chatbot-with-enhanced-memory.git
cd chatbot-with-enhanced-memory
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

1. Start the application:
```bash
python app.py
```

2. Open your browser and navigate to `http://localhost:5000`

3. Enter your API credentials:
   - **API Key**: Your OpenAI or compatible API key
   - **Base URL**: API endpoint (e.g., `https://api.openai.com/v1` for OpenAI, or your local LLM endpoint)
   - **Model Name**: The model to use (e.g., `gpt-3.5-turbo`, `gpt-4`, or your local model name)

4. Begin chatting! The application will:
   - Maintain your conversation history
   - Automatically identify and store important information in the memory timeline
   - Use stored memories to provide more contextually relevant responses

## Memory System

The application uses a memory system that follows these rules:

### When Information is Saved
- New information the assistant didn't previously know
- Information likely to be useful in future conversations
- Corrections to previous misunderstandings
- Specific user requests to remember something

### When Information is NOT Saved
- General knowledge
- Trivial or fleeting comments
- Redundant information
- Sensitive information (unless explicitly requested)

The assistant is designed to be thoughtful and minimal in its memory usage, only saving information with clear long-term value.

## Project Structure

```
chatbot-with-enhanced-memory/
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
├── static/
│   ├── chat.js               # Client-side JavaScript
│   └── style.css             # Stylesheet
└── templates/
    ├── index.html            # Login page
    └── chat.html             # Chat interface
```

## Security Considerations

- All user input is sanitized using Bleach to prevent XSS attacks
- API keys are stored in Flask sessions (in-memory)
- HTML content from the AI response is cleaned before rendering

## Customization

You can modify the memory system by editing the system prompt in `app.py`. The current rules for memory storage can be adjusted to be more or less aggressive based on your needs.

## Troubleshooting

- **Connection Issues**: Verify your API key, base URL, and model name are correct
- **Formatting Problems**: Ensure your AI provider supports the requested model
- **Memory Not Persisting**: Memories are stored in the session and will be cleared when you close the browser or click "Reset Chat"

## License

MIT
