# Antigravity Claude Proxy

[![npm version](https://img.shields.io/npm/v/antigravity-claude-proxy.svg)](https://www.npmjs.com/package/antigravity-claude-proxy)
[![npm downloads](https://img.shields.io/npm/dm/antigravity-claude-proxy.svg)](https://www.npmjs.com/package/antigravity-claude-proxy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<a href="https://buymeacoffee.com/badrinarayanans" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50"></a>

A proxy server that exposes **Anthropic-compatible** and **OpenAI-compatible** APIs backed by **Antigravity's Cloud Code**, letting you use Claude and Gemini models with **Claude Code CLI** and **GitHub Copilot-compatible tools**.

![Antigravity Claude Proxy Banner](images/banner.png)

## How It Works

```
┌──────────────────────┐     ┌─────────────────────┐     ┌────────────────────────────┐
│   Claude Code /      │────▶│  This Proxy Server  │────▶│  Antigravity Cloud Code    │
│   Copilot Tools      │     │  (Anthropic/OpenAI  │     │  (daily-cloudcode-pa.      │
│   (API format)       │     │   → Google Gen AI)  │     │   sandbox.googleapis.com)  │
└──────────────────────┘     └─────────────────────┘     └────────────────────────────┘
```

**Supports two API formats:**
1. **Anthropic Messages API** (`/v1/messages`) - For Claude Code CLI
2. **OpenAI Chat Completions API** (`/v1/chat/completions`) - For GitHub Copilot-compatible tools

**Request flow:**
1. Receives requests in **Anthropic or OpenAI format**
2. Uses OAuth tokens from added Google accounts (or Antigravity's local database)
3. Transforms to **Google Generative AI format** with Cloud Code wrapping
4. Sends to Antigravity's Cloud Code API
5. Converts responses back to **original format** with full thinking/streaming support

## Prerequisites

- **Node.js** 18 or later
- **Antigravity** installed (for single-account mode) OR Google account(s) for multi-account mode

---

## Installation

### Option 1: npm (Recommended)

```bash
# Run directly with npx (no install needed)
npx antigravity-claude-proxy start

# Or install globally
npm install -g antigravity-claude-proxy
antigravity-claude-proxy start
```

### Option 2: Clone Repository

```bash
git clone https://github.com/badri-s2001/antigravity-claude-proxy.git
cd antigravity-claude-proxy
npm install
npm start
```

---

## Quick Start

### 1. Add Account(s)

You have two options:

**Option A: Use Antigravity (Single Account)**

If you have Antigravity installed and logged in, the proxy will automatically extract your token. No additional setup needed.

**Option B: Add Google Accounts via OAuth (Recommended for Multi-Account)**

Add one or more Google accounts for load balancing:

```bash
# If installed via npm
antigravity-claude-proxy accounts add

# If using npx
npx antigravity-claude-proxy accounts add

# If cloned locally
npm run accounts:add
```

This opens your browser for Google OAuth. Sign in and authorize access. Repeat for multiple accounts.

Manage accounts:

```bash
# List all accounts
antigravity-claude-proxy accounts list

# Verify accounts are working
antigravity-claude-proxy accounts verify

# Interactive account management
antigravity-claude-proxy accounts
```

### 2. Start the Proxy Server

```bash
# If installed via npm
antigravity-claude-proxy start

# If using npx
npx antigravity-claude-proxy start

# If cloned locally
npm start
```

The server runs on `http://localhost:8080` by default.

### 3. Verify It's Working

```bash
# Health check
curl http://localhost:8080/health

# Check account status and quota limits
curl "http://localhost:8080/account-limits?format=table"
```

---

## Using with Claude Code CLI

### Configure Claude Code

Create or edit the Claude Code settings file:

**macOS:** `~/.claude/settings.json`
**Linux:** `~/.claude/settings.json`
**Windows:** `%USERPROFILE%\.claude\settings.json`

Add this configuration:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "test",
    "ANTHROPIC_BASE_URL": "http://localhost:8080",
    "ANTHROPIC_MODEL": "claude-opus-4-5-20251101",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-5-20251101",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5-20241022",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-sonnet-4-5-20241022",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-sonnet-4-5-20241022"
  }
}
```

**Using Aliases:** You can also use simplified aliases (both work the same):

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "test",
    "ANTHROPIC_BASE_URL": "http://localhost:8080",
    "ANTHROPIC_MODEL": "claude-opus-4-5-thinking",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-5-thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-5-thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-sonnet-4-5-thinking",
    "CLAUDE_CODE_SUBAGENT_MODEL": "claude-sonnet-4-5-thinking"
  }
}
```

Or to use Gemini models:

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "test",
    "ANTHROPIC_BASE_URL": "http://localhost:8080",
    "ANTHROPIC_MODEL": "gemini-3-pro-high",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "gemini-3-pro-high",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "gemini-3-flash",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gemini-2.5-flash-lite",
    "CLAUDE_CODE_SUBAGENT_MODEL": "gemini-3-flash"
  }
}
```

### Load Environment Variables

Add the proxy settings to your shell profile:

**macOS / Linux:**

```bash
echo 'export ANTHROPIC_BASE_URL="http://localhost:8080"' >> ~/.zshrc
echo 'export ANTHROPIC_API_KEY="test"' >> ~/.zshrc
source ~/.zshrc
```

> For Bash users, replace `~/.zshrc` with `~/.bashrc`

**Windows (PowerShell):**

```powershell
Add-Content $PROFILE "`n`$env:ANTHROPIC_BASE_URL = 'http://localhost:8080'"
Add-Content $PROFILE "`$env:ANTHROPIC_API_KEY = 'test'"
. $PROFILE
```

**Windows (Command Prompt):**

```cmd
setx ANTHROPIC_BASE_URL "http://localhost:8080"
setx ANTHROPIC_API_KEY "test"
```

Restart your terminal for changes to take effect.

---

## Using with GitHub Copilot-Compatible Tools

The proxy also exposes an **OpenAI-compatible `/v1/chat/completions` endpoint**, making it work with any tool that expects the OpenAI Chat Completions API format (like GitHub Copilot proxies, LangChain, etc.).

### Configuration

Set the OpenAI base URL environment variable:

**macOS / Linux:**

```bash
echo 'export OPENAI_BASE_URL="http://localhost:8080/v1"' >> ~/.zshrc
echo 'export OPENAI_API_KEY="dummy"' >> ~/.zshrc
source ~/.zshrc
```

> For Bash users, replace `~/.zshrc` with `~/.bashrc`

**Windows (PowerShell):**

```powershell
Add-Content $PROFILE "`n`$env:OPENAI_BASE_URL = 'http://localhost:8080/v1'"
Add-Content $PROFILE "`$env:OPENAI_API_KEY = 'dummy'"
. $PROFILE
```

**Windows (Command Prompt):**

```cmd
setx OPENAI_BASE_URL "http://localhost:8080/v1"
setx OPENAI_API_KEY "dummy"
```

### Example Usage

**Python with OpenAI SDK:**

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="dummy"  # Not validated, any value works
)

response = client.chat.completions.create(
    model="gpt-4",  # Maps to claude-opus-4-5-20251101 (Opus 4.5 with thinking)
    messages=[
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

**cURL:**

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}],
    "max_tokens": 100
  }'
```

### Model Mappings

OpenAI model names are automatically mapped to Claude/Gemini models:

| OpenAI Model | Maps To |
|--------------|---------|
| `gpt-4`, `gpt-4-turbo`, `gpt-4o` | `claude-opus-4-5-20251101` (Opus 4.5 with extended thinking) |
| `gpt-3.5-turbo` | `claude-sonnet-4-5-20241022` (Sonnet 4.5 with extended thinking) |
| `gpt-4o-mini` | `claude-sonnet-4-5-20241022` (Sonnet 4.5 with extended thinking) |
| `gemini-pro` | `gemini-3-pro-high` |
| `gemini-flash` | `gemini-3-flash` |

You can also use the actual model names directly (e.g., `claude-opus-4-5-20251101`, `claude-sonnet-4-5-20241022`).

**Model Aliases:** The proxy supports simplified aliases for convenience:
- `claude-opus-4-5-thinking` or `claude-opus-4-5` → `claude-opus-4-5-20251101`
- `claude-sonnet-4-5-thinking` or `claude-sonnet-4-5` → `claude-sonnet-4-5-20241022`

### Demo

Run the included demo script to see the proxy in action:

```bash
# Start the proxy server
npm start

# In another terminal, run the demo
node demo-copilot-proxy.js
```

The demo shows:
1. Simple non-streaming completion
2. Streaming completion with real-time output
3. Function/tool calling

---

### Run Claude Code

```bash
# Make sure the proxy is running first
antigravity-claude-proxy start

# In another terminal, run Claude Code
claude
```

> **Note:** If Claude Code asks you to select a login method, add `"hasCompletedOnboarding": true` to `~/.claude.json` (macOS/Linux) or `%USERPROFILE%\.claude.json` (Windows), then restart your terminal and try again.

---

## Available Models

### Claude Models

| Model ID | Alias | Description |
|----------|-------|-------------|
| `claude-opus-4-5-20251101` | `claude-opus-4-5-thinking`, `claude-opus-4-5` | Claude Opus 4.5 with extended thinking (latest release) |
| `claude-sonnet-4-5-20241022` | `claude-sonnet-4-5-thinking`, `claude-sonnet-4-5` | Claude Sonnet 4.5 with extended thinking |

**Note:** All Claude 4.5 models support extended thinking mode automatically. You can use either the official model ID (with datestamp) or the simplified alias.

### Gemini Models

| Model ID | Description |
|----------|-------------|
| `gemini-3-flash` | Gemini 3 Flash with thinking |
| `gemini-3-pro-low` | Gemini 3 Pro Low with thinking |
| `gemini-3-pro-high` | Gemini 3 Pro High with thinking |

Gemini models include full thinking support with `thoughtSignature` handling for multi-turn conversations.

---

## Multi-Account Load Balancing

When you add multiple accounts, the proxy automatically:

- **Sticky account selection**: Stays on the same account to maximize prompt cache hits
- **Smart rate limit handling**: Waits for short rate limits (≤2 min), switches accounts for longer ones
- **Automatic cooldown**: Rate-limited accounts become available after reset time expires
- **Invalid account detection**: Accounts needing re-authentication are marked and skipped
- **Prompt caching support**: Stable session IDs enable cache hits across conversation turns

Check account status anytime:

```bash
curl "http://localhost:8080/account-limits?format=table"
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/account-limits` | GET | Account status and quota limits (add `?format=table` for ASCII table) |
| `/v1/messages` | POST | Anthropic Messages API (for Claude Code) |
| `/v1/chat/completions` | POST | OpenAI Chat Completions API (for GitHub Copilot-compatible tools) |
| `/v1/models` | GET | List available models |
| `/refresh-token` | POST | Force token refresh |

---

## Testing

Run the test suite (requires server running):

```bash
# Start server in one terminal
npm start

# Run tests in another terminal
npm test
```

Individual tests:

```bash
npm run test:model-aliases  # Model alias resolution (no server required)
npm run test:opus-45        # Claude Opus 4.5 via OpenAI API
npm run test:chat-completions # OpenAI Chat Completions API
npm run test:signatures     # Thinking signatures
npm run test:multiturn      # Multi-turn with tools
npm run test:streaming      # Streaming SSE events
npm run test:interleaved    # Interleaved thinking
npm run test:images         # Image processing
npm run test:caching        # Prompt caching
```

> **Note:** Most tests require at least one account to be configured (via `npm run accounts:add` or Antigravity app). The `test:model-aliases` test can run without a server.

---

## Troubleshooting

### "Could not extract token from Antigravity"

If using single-account mode with Antigravity:
1. Make sure Antigravity app is installed and running
2. Ensure you're logged in to Antigravity

Or add accounts via OAuth instead: `antigravity-claude-proxy accounts add`

### 401 Authentication Errors

The token might have expired. Try:
```bash
curl -X POST http://localhost:8080/refresh-token
```

Or re-authenticate the account:
```bash
antigravity-claude-proxy accounts
```

### Rate Limiting (429)

With multiple accounts, the proxy automatically switches to the next available account. With a single account, you'll need to wait for the rate limit to reset.

### Account Shows as "Invalid"

Re-authenticate the account:
```bash
antigravity-claude-proxy accounts
# Choose "Re-authenticate" for the invalid account
```

---

## Safety, Usage, and Risk Notices

### Intended Use

- Personal / internal development only
- Respect internal quotas and data handling policies
- Not for production services or bypassing intended limits

### Not Suitable For

- Production application traffic
- High-volume automated extraction
- Any use that violates Acceptable Use Policies

### Warning (Assumption of Risk)

By using this software, you acknowledge and accept the following:

- **Terms of Service risk**: This approach may violate the Terms of Service of AI model providers (Anthropic, Google, etc.). You are solely responsible for ensuring compliance with all applicable terms and policies.

- **Account risk**: Providers may detect this usage pattern and take punitive action, including suspension, permanent ban, or loss of access to paid subscriptions.

- **No guarantees**: Providers may change APIs, authentication, or policies at any time, which can break this method without notice.

- **Assumption of risk**: You assume all legal, financial, and technical risks. The authors and contributors of this project bear no responsibility for any consequences arising from your use.

**Use at your own risk. Proceed only if you understand and accept these risks.**

---

## Legal

- **Not affiliated with Google or Anthropic.** This is an independent open-source project and is not endorsed by, sponsored by, or affiliated with Google LLC or Anthropic PBC.

- "Antigravity", "Gemini", "Google Cloud", and "Google" are trademarks of Google LLC.

- "Claude" and "Anthropic" are trademarks of Anthropic PBC.

- Software is provided "as is", without warranty. You are responsible for complying with all applicable Terms of Service and Acceptable Use Policies.

---

## Credits

This project is based on insights and code from:

- [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth) - Antigravity OAuth plugin for OpenCode
- [claude-code-proxy](https://github.com/1rgs/claude-code-proxy) - Anthropic API proxy using LiteLLM

---

## License

MIT

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=badri-s2001/antigravity-claude-proxy&type=date&legend=top-left&cache-control=no-cache)](https://www.star-history.com/#badri-s2001/antigravity-claude-proxy&type=date&legend=top-left)