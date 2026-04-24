<div align="center">
  <img src="./demo.png" alt="UI Sentinel Demo" width="100%">
  
  # UI Sentinel v3.0

  **Autonomous AI-Powered Browser QA & Automation Agent**

  *UI Sentinel transforms complex web workflows into autonomous missions. By leveraging vision-language models and an asynchronous Plan-Act-Observe architecture, it navigates complex DOMs, executes precise tool operations, and reports back in real time.*
</div>

---

## 🏗 System Architecture

UI Sentinel abandons the brittle constraints of statically-scripted UI interactions for a resilient autonomous agent pattern. 

### 1. Plan-Act-Observe Execution Loop
At the core of the engine resides the asynchronous Planner. The agent captures the current DOM state natively via Playwright and renders an optimized bounding-box overlay. The Brain (a Vision-Language Model) digests the visual schema plus recent action history, rejecting hallucinations through rigorous `Pydantic` schema enforcement before executing the logical next operation.

### 2. High-Performance Asynchronous I/O
The backend is powered by `FastAPI` and async `Playwright`. Blocking synchronous executions (such as parsing `PIL` image structures or calling the Gemini APIs) are strictly relegated to separate thread pools using `asyncio.to_thread`. This results in highly concurrent, non-blocking telemetry streams. Server-Sent Events (SSE) pipe real-time streaming updates from the agent's core straight to the client without polling overhead.

### 3. Glassmorphic React Application Layer
The frontend utilizes `Next.js 15` (App Router) to proxy upstream API calls cleanly. The interface employs a high-fidelity deep space `Slate` scale with cyan reactive indicators, assembled using `Tailwind CSS`. Complex state flows and log streams are seamlessly animated into the DOM via `Framer Motion`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+) 
- Playwright system dependencies

### 1. Installation

First, clone the repository and set up the Python backend infrastructure:

```bash
# Clone the repository
git clone https://github.com/yourusername/ui-sentinel.git
cd ui-sentinel

# Set up the Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install the strict dependencies & Playwright browsers
pip install -r requirements.txt
playwright install chromium
```

Install the Next.js frontend dependencies:

```bash
cd frontend
npm install
cd ..
```

### 2. Environment Variables

Create your environment configuration for the core logic layer.
Copy the example file to initiate your `.env`:

```bash
cp .env.example .env
```

Open `.env` and set your LLM connection (currently wired for Gemini Pro Vision infrastructure):
```env
GEMINI_API_KEY=your-api-key-here
```

### 3. Running the Stack

You must boot both the FastAPI agent engine and the Next.js presentation layer.

**Terminal 1: Agent Infrastructure (FastAPI)**
```bash
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2: Command Center UI (Next.js)**
```bash
cd frontend
npm run dev
```

Visit the dashboard at `http://localhost:3000` to initiate a sequence.

---

## 🛠 Tech Stack

- **AI Core:** Google Gemini Vision, Pydantic (Strict typing)
- **Browser Physics:** Playwright (Async execution)
- **Backend Edge:** Python, FastAPI, SSE Streaming
- **Frontend Layer:** Next.js 15, Tailwind CSS, Framer Motion, Lucide React

## 📈 Roadmap
- [ ] Concurrent multi-agent deployment sessions
- [ ] Implement local-only vision models via Ollama
- [ ] WebSocket migration for bi-directional interruption
- [ ] Headless background queues for CI/CD integration

---
*Created by [Your Name](https://github.com/yourusername)*
