# 🧠 Kalpanā AI — LLM API Testing Interface

A premium, dark-themed single-page web application for interactively testing all endpoints of the **Kalpanā AI RIF Engine API**.

## Features

- **📊 Dashboard** — Real-time health check, system status, and model overview
- **💬 Chat Playground** — Full chat interface with model selection, temperature/token controls, and RIF context metrics
- **📚 Knowledge Packs** — Compile text/files into Knowledge Packs, manage, download, and import `.kp` files
- **🔌 LLM Providers** — Register custom API keys for Groq, OpenAI, Together, Cerebras, OpenRouter
- **🤖 Models** — View all available models with verified context extension matrix
- **📖 API Reference** — Quick reference with curl/Python code examples

## API Endpoints Covered

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Health check & system info |
| `/v1/models` | GET | List available LLM models |
| `/v1/providers` | GET | List known LLM providers |
| `/v1/providers/register` | POST | Register custom LLM provider |
| `/v1/chat/completions` | POST | Chat with RIF context retrieval |
| `/v1/knowledge_packs/compile` | POST | Compile text → Knowledge Pack |
| `/v1/knowledge_packs/compile_file` | POST | Compile PDF/TXT → Knowledge Pack |
| `/v1/knowledge_packs/upload` | POST | Import a `.kp` file |
| `/v1/knowledge_packs/{id}/download` | GET | Download `.kp` file |
| `/v1/knowledge_packs` | GET | List active knowledge packs |
| `/v1/knowledge_packs/{id}` | DELETE | Delete a knowledge pack |

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser
3. The interface automatically connects to the live API at `https://madurox-kalpana-api-cpu.hf.space`

## Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom dark glassmorphism theme with animations
- **Vanilla JavaScript** — Zero dependencies, pure API interaction

## API Base URL

```
https://madurox-kalpana-api-cpu.hf.space
```

## License

MIT
