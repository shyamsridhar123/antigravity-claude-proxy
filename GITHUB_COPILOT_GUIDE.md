# Using Claude Opus 4.5 with GitHub Copilot

This guide explains how to use Claude Opus 4.5 through the proxy with GitHub Copilot-compatible tools.

## Quick Start

### 1. Start the Proxy

```bash
# Install globally
npm install -g antigravity-claude-proxy
antigravity-claude-proxy start

# Or run with npx
npx antigravity-claude-proxy start

# Or clone and run locally
git clone https://github.com/badri-s2001/antigravity-claude-proxy
cd antigravity-claude-proxy
npm install
npm start
```

### 2. Configure Your Environment

Set the OpenAI API base URL to point to the proxy:

**macOS / Linux:**
```bash
export OPENAI_BASE_URL="http://localhost:8080/v1"
export OPENAI_API_KEY="dummy"
```

**Windows (PowerShell):**
```powershell
$env:OPENAI_BASE_URL = "http://localhost:8080/v1"
$env:OPENAI_API_KEY = "dummy"
```

### 3. Use with Your Tools

The proxy automatically maps OpenAI model names to Claude models:

| OpenAI Model | Maps To |
|--------------|---------|
| `gpt-4` | Claude Opus 4.5 (with extended thinking) |
| `gpt-4-turbo` | Claude Opus 4.5 (with extended thinking) |
| `gpt-4o` | Claude Opus 4.5 (with extended thinking) |

## Model Names

You can use any of these model names - they all work:

**Via OpenAI API (recommended for Copilot tools):**
- `gpt-4` → Claude Opus 4.5
- `gpt-4-turbo` → Claude Opus 4.5
- `gpt-4o` → Claude Opus 4.5

**Direct model names:**
- `claude-opus-4-5-20251101` (official Anthropic name)
- `claude-opus-4-5-thinking` (simplified alias)
- `claude-opus-4-5` (simplified alias)

## Extended Thinking

All Claude 4.5 models automatically support **extended thinking mode**. This means:

- 📊 **Better reasoning** for complex problems
- 🔍 **Transparent thought process** (when available)
- 🎯 **Higher quality** code generation
- 🧠 **Improved** multi-step tasks

Extended thinking is automatically enabled - no configuration needed!

## Example Usage

### Python with OpenAI SDK

```python
import openai

client = openai.OpenAI(
    base_url="http://localhost:8080/v1",
    api_key="dummy"
)

# Use gpt-4 - automatically maps to Opus 4.5
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful coding assistant."},
        {"role": "user", "content": "Write a Python function to calculate fibonacci numbers"}
    ],
    max_tokens=1000
)

print(response.choices[0].message.content)
```

### Node.js with OpenAI SDK

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: 'http://localhost:8080/v1',
    apiKey: 'dummy'
});

const response = await client.chat.completions.create({
    model: 'gpt-4',  // Maps to Opus 4.5
    messages: [
        { role: 'user', content: 'Explain async/await in JavaScript' }
    ],
    max_tokens: 500
});

console.log(response.choices[0].message.content);
```

### cURL

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dummy" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "What is machine learning?"}
    ],
    "max_tokens": 200
  }'
```

## Features

### ✅ Supported Features

- **Streaming** - Real-time response streaming
- **System messages** - Custom system prompts
- **Multi-turn conversations** - Maintain context across messages
- **Function calling** - Tool use / function calling
- **Extended thinking** - Deep reasoning for complex tasks
- **Multi-account load balancing** - Automatic failover between accounts

### 🎯 Best Practices

1. **Use `gpt-4` for compatibility** - Most tools expect OpenAI model names
2. **Enable streaming** for better UX - Set `stream: true` in requests
3. **Add multiple accounts** - Avoid rate limits with `npm run accounts:add`
4. **Use appropriate max_tokens** - Opus 4.5 supports up to 16K output tokens

## Account Management

### Add Accounts

```bash
# Add a Google account via OAuth
npm run accounts:add

# Verify accounts are working
npm run accounts:verify

# Check account status and quotas
curl "http://localhost:8080/account-limits?format=table"
```

### Rate Limiting

With multiple accounts, the proxy automatically:
- 🔄 **Switches accounts** when rate limited
- ⏰ **Waits for quota reset** when needed
- 📊 **Tracks usage** across accounts

## Troubleshooting

### "Could not extract token"

Add a Google account:
```bash
npm run accounts:add
```

### Rate Limited (429 errors)

Add more accounts or wait for quota reset:
```bash
npm run accounts:add
curl "http://localhost:8080/account-limits?format=table"
```

### Connection refused

Make sure the proxy is running:
```bash
curl http://localhost:8080/health
```

## Testing

Test that Opus 4.5 works correctly:

```bash
# Test model alias resolution (no server required)
npm run test:model-aliases

# Test Opus 4.5 via OpenAI API (requires server + account)
npm run test:opus-45

# Full OpenAI API test suite
npm run test:chat-completions
```

## Comparison with Official APIs

| Feature | Anthropic API | OpenAI API | This Proxy |
|---------|--------------|------------|------------|
| Model | Claude Opus 4.5 | GPT-4o | Claude Opus 4.5 |
| Extended Thinking | ✅ | ❌ | ✅ |
| OpenAI Compatible | ❌ | ✅ | ✅ |
| Free Tier | ❌ | ❌ | ✅* |
| Multi-account | ❌ | ❌ | ✅ |

*Via Antigravity accounts

## Additional Resources

- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Proxy GitHub Repository](https://github.com/badri-s2001/antigravity-claude-proxy)
- [Report Issues](https://github.com/badri-s2001/antigravity-claude-proxy/issues)
