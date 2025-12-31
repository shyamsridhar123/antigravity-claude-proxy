/**
 * Chat Completions Test
 *
 * Tests the OpenAI-compatible /v1/chat/completions endpoint
 * to ensure it properly converts between OpenAI and Anthropic formats.
 */
const http = require('http');

// Server configuration
const BASE_URL = 'localhost';
const PORT = 8080;

/**
 * Make a request to the chat completions endpoint
 * @param {Object} body - Request body in OpenAI format
 * @returns {Promise<Object>}
 */
function chatCompletionsRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            host: BASE_URL,
            port: PORT,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let fullData = '';

            res.on('data', chunk => {
                fullData += chunk.toString();
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(fullData);
                    resolve({ statusCode: res.statusCode, data: response });
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${fullData}`));
                }
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * Make a streaming request to the chat completions endpoint
 * @param {Object} body - Request body in OpenAI format
 * @returns {Promise<Array>}
 */
function chatCompletionsStreamRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ ...body, stream: true });
        const req = http.request({
            host: BASE_URL,
            port: PORT,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            const chunks = [];
            let fullData = '';

            res.on('data', chunk => {
                fullData += chunk.toString();
            });

            res.on('end', () => {
                // Parse SSE chunks
                const lines = fullData.split('\n').filter(l => l.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') {
                            continue;
                        }
                        try {
                            chunks.push(JSON.parse(dataStr));
                        } catch (e) {
                            // Ignore parse errors
                        }
                    }
                }
                resolve({ statusCode: res.statusCode, chunks });
            });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('OPENAI CHAT COMPLETIONS TEST');
    console.log('Tests the /v1/chat/completions endpoint (GitHub Copilot compatible)');
    console.log('='.repeat(60));
    console.log('');

    let allPassed = true;

    // ===== TEST 1: Simple non-streaming completion =====
    console.log('TEST 1: Simple non-streaming completion');
    console.log('-'.repeat(40));

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4',
            messages: [
                { role: 'user', content: 'Say "hello world" in exactly those words.' }
            ],
            max_tokens: 100,
            temperature: 0.7
        });

        console.log('  Status:', response.statusCode);
        console.log('  Response ID:', response.data.id);
        console.log('  Model:', response.data.model);
        console.log('  Object:', response.data.object);
        
        const choice = response.data.choices[0];
        console.log('  Message role:', choice.message.role);
        console.log('  Message content:', choice.message.content.substring(0, 100));
        console.log('  Finish reason:', choice.finish_reason);
        
        console.log('  Prompt tokens:', response.data.usage.prompt_tokens);
        console.log('  Completion tokens:', response.data.usage.completion_tokens);
        console.log('  Total tokens:', response.data.usage.total_tokens);

        if (response.statusCode === 200 && 
            response.data.object === 'chat.completion' &&
            choice.message.role === 'assistant' &&
            choice.message.content &&
            response.data.usage.total_tokens > 0) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }

    console.log('');

    // ===== TEST 2: Streaming completion =====
    console.log('TEST 2: Streaming completion');
    console.log('-'.repeat(40));

    try {
        const response = await chatCompletionsStreamRequest({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'user', content: 'Count from 1 to 5.' }
            ],
            max_tokens: 100
        });

        console.log('  Status:', response.statusCode);
        console.log('  Chunks received:', response.chunks.length);

        let fullContent = '';
        let hasRole = false;
        let hasFinishReason = false;

        for (const chunk of response.chunks) {
            if (chunk.choices && chunk.choices[0]) {
                const delta = chunk.choices[0].delta;
                if (delta.role) hasRole = true;
                if (delta.content) fullContent += delta.content;
                if (chunk.choices[0].finish_reason) hasFinishReason = true;
            }
        }

        console.log('  Has role delta:', hasRole);
        console.log('  Full content length:', fullContent.length);
        console.log('  Has finish reason:', hasFinishReason);
        console.log('  Content preview:', fullContent.substring(0, 100));

        if (response.statusCode === 200 &&
            response.chunks.length > 0 &&
            hasRole &&
            fullContent.length > 0 &&
            hasFinishReason) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }

    console.log('');

    // ===== TEST 3: System message handling =====
    console.log('TEST 3: System message handling');
    console.log('-'.repeat(40));

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that only speaks in pirate language.' },
                { role: 'user', content: 'Hello!' }
            ],
            max_tokens: 100
        });

        console.log('  Status:', response.statusCode);
        const choice = response.data.choices[0];
        console.log('  Response:', choice.message.content.substring(0, 100));

        if (response.statusCode === 200 &&
            choice.message.content.length > 0) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }

    console.log('');

    // ===== TEST 4: Tool/Function calling =====
    console.log('TEST 4: Tool/Function calling');
    console.log('-'.repeat(40));

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4',
            messages: [
                { role: 'user', content: 'What is the weather in Paris?' }
            ],
            tools: [
                {
                    type: 'function',
                    function: {
                        name: 'get_weather',
                        description: 'Get the current weather for a city',
                        parameters: {
                            type: 'object',
                            properties: {
                                city: {
                                    type: 'string',
                                    description: 'The city name'
                                }
                            },
                            required: ['city']
                        }
                    }
                }
            ],
            max_tokens: 200
        });

        console.log('  Status:', response.statusCode);
        const choice = response.data.choices[0];
        console.log('  Has tool_calls:', !!choice.message.tool_calls);
        
        if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
            const toolCall = choice.message.tool_calls[0];
            console.log('  Tool call ID:', toolCall.id);
            console.log('  Function name:', toolCall.function.name);
            console.log('  Arguments:', toolCall.function.arguments);
            
            if (response.statusCode === 200 &&
                toolCall.type === 'function' &&
                toolCall.function.name === 'get_weather') {
                console.log('  ✓ PASSED');
            } else {
                console.log('  ✗ FAILED');
                allPassed = false;
            }
        } else {
            console.log('  ✗ FAILED: No tool calls in response');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }

    console.log('');
    console.log('='.repeat(60));
    console.log(`SUMMARY: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
    console.log('='.repeat(60));

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
