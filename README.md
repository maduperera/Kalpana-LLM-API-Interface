# 🧠 Kalpanā AI — LLM API Testing Interface & Architectural Guide

A premium, dark-themed single-page web application for interactively testing all endpoints of the **Kalpanā AI RIF Engine API**.

---

## 🔗 Links & Official Documentation

- **Interactive OpenAPI Docs**: [https://madurox-kalpana-api-cpu.hf.space/docs](https://madurox-kalpana-api-cpu.hf.space/docs)
- **Live Hugging Face Space**: [MaduRox/Kalpana-API-CPU](https://huggingface.co/spaces/MaduRox/Kalpana-API-CPU)
- **GitHub Repository**: [maduperera/Kalpana-LLM-API-Interface](https://github.com/maduperera/Kalpana-LLM-API-Interface)
- **API Base URL**: `https://madurox-kalpana-api-cpu.hf.space`

---

## 🏗️ Architectural Pipeline: Traditional RAG vs Kalpanā RIF

Kalpanā RIF (Recurrent Information Flow) evolves traditional RAG by replacing bloated vector databases with a **bounded O(1) constant-size holographic state (~8 MB)**.

```mermaid
graph TD
    subgraph Traditional RAG Pipeline
        A1[100K-3M Token Document] --> B1[Chunking & Dense Embeddings]
        B1 --> C1[(Vector DB - Pinecone/Qdrant)\nRAM Grows Linearly O N]
        C1 --> D1[Top-K Similarity Search\nHigh Latency 50-200ms]
        D1 --> E1[Uncompressed Context Injected\nHigh Token Bill $$$]
        E1 --> F1[Remote LLM]
    end

    subgraph Kalpanā RIF Holographic Pipeline
        A2[100K-3M Token Document] --> B2[Kalpanā Phase-Conjugate Chunker]
        B2 --> C2[Knowledge Pack .kp\nO 1 Constant Bounded RAM ~8MB]
        C2 --> D2[Holographic Matrix Retrieval\nSub-5ms Latency]
        D2 --> E2[Extracted RIF Context ~1.6K Tokens\n90%-99% Token Cost Savings]
        E2 --> F2[Registered Provider LLM\nGroq / OpenAI / Gemini / etc.]
    end
```

---

## 📌 Endpoint Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check & system info |
| `/v1/models` | GET | List available LLM models |
| `/v1/providers` | GET | List known LLM providers |
| `/v1/providers/register` | POST | Register custom LLM provider (API key) |
| `/v1/providers/reset` | POST | Reset registered provider keys |
| `/v1/chat/completions` | POST | Chat with RIF context retrieval |
| `/v1/knowledge_packs/compile` | POST | Compile raw text → Knowledge Pack |
| `/v1/knowledge_packs/compile_file` | POST | Compile PDF/TXT file → Knowledge Pack |
| `/v1/knowledge_packs/upload` | POST | Import a .kp file |
| `/v1/knowledge_packs/{pack_id}/download` | GET | Download .kp file |
| `/v1/knowledge_packs` | GET | List active knowledge packs |
| `/v1/knowledge_packs/{pack_id}` | DELETE | Delete a knowledge pack |

---

## 🧪 Step-by-Step Testing Scenarios

### Scenario 1: General Query (No Document Attached)
1. Go to **🔌 LLM Providers** tab.
2. Select your provider (**Groq**, **Google Gemini**, **OpenAI**, **Together**, **Cerebras**, **OpenRouter**).
3. Enter your API Key and click **🔌 Register Provider**.
4. Switch to **💬 Chat Playground**, leave `Active Pack ID` blank, and type your question (e.g. *"What is quantum computing?"*).

### Scenario 2: Document-Based Q&A (PDF / Knowledge Pack Attached)
1. Go to **📚 Knowledge Packs** tab -> **📄 Compile File**.
2. Select a PDF/TXT document and click **📄 Compile File into .kp**.
3. Copy the generated `pack_id` (e.g. `kp_a1b2c3d4`).
4. Go to **💬 Chat Playground**, paste the `pack_id` into **Active Pack ID**, and ask questions specific to your document!

---

## 📄 License

MIT
