#!/usr/bin/env node

/**
 * GitHub Copilot Proxy Demo
 * 
 * Demonstrates the OpenAI-compatible chat completions endpoint.
 * This script shows how to use the proxy with OpenAI-like requests.
 * 
 * Note: This demo requires the server to be running with at least one account configured.
 */

import http from 'http';

const BASE_URL = 'localhost';
const PORT = 8080;

/**
 * Make a request to chat completions endpoint
 */
function chatCompletions(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            host: BASE_URL,
            port: PORT,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dummy',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            let fullData = '';
            res.on('data', chunk => { fullData += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(fullData));
                } catch (e) {
                    reject(new Error(`Failed to parse: ${fullData}`));
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

/**
 * Streaming chat completions
 */
function chatCompletionsStream(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ ...body, stream: true });
        const req = http.request({
            host: BASE_URL,
            port: PORT,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dummy',
                'Content-Length': Buffer.byteLength(data)
            }
        }, res => {
            const chunks = [];
            let buffer = '';
            
            res.on('data', chunk => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.substring(6);
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            chunks.push(parsed);
                            // Print delta content as it arrives
                            if (parsed.choices?.[0]?.delta?.content) {
                                process.stdout.write(parsed.choices[0].delta.content);
                            }
                        } catch (e) {}
                    }
                }
            });
            
            res.on('end', () => {
                process.stdout.write('\n');
                resolve(chunks);
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function demo() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         GitHub Copilot Proxy Demo                         ║');
    console.log('║         OpenAI Chat Completions API                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    // Demo 1: Simple completion
    console.log('Demo 1: Simple Completion');
    console.log('─'.repeat(60));
    console.log('Request: "Say hello"');
    console.log('');
    
    try {
        const response = await chatCompletions({
            model: 'gpt-4',  // Maps to claude-opus-4-5-thinking
            messages: [
                { role: 'user', content: 'Say "Hello from GitHub Copilot Proxy!" in a friendly way.' }
            ],
            max_tokens: 100
        });
        
        console.log('Response:', response.choices[0].message.content);
        console.log('Model:', response.model);
        console.log('Tokens:', `${response.usage.completion_tokens} completion, ${response.usage.total_tokens} total`);
    } catch (error) {
        console.log('Error:', error.message);
        if (error.message.includes('rate-limited')) {
            console.log('\nNote: You need to configure an account first:');
            console.log('  npm run accounts:add');
            return;
        }
    }
    
    console.log('');
    console.log('');

    // Demo 2: Streaming completion
    console.log('Demo 2: Streaming Completion');
    console.log('─'.repeat(60));
    console.log('Request: "Count to 5"');
    console.log('');
    console.log('Response (streaming): ');
    
    try {
        const chunks = await chatCompletionsStream({
            model: 'gpt-3.5-turbo',  // Maps to claude-sonnet-4-5-thinking
            messages: [
                { role: 'user', content: 'Count from 1 to 5, one number per line.' }
            ],
            max_tokens: 50
        });
        
        console.log('');
        console.log(`Received ${chunks.length} chunks`);
    } catch (error) {
        console.log('Error:', error.message);
    }
    
    console.log('');
    console.log('');

    // Demo 3: Function calling
    console.log('Demo 3: Function Calling');
    console.log('─'.repeat(60));
    console.log('Request: "What\'s the weather in Paris?"');
    console.log('');
    
    try {
        const response = await chatCompletions({
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
        
        const message = response.choices[0].message;
        if (message.tool_calls && message.tool_calls.length > 0) {
            console.log('Tool call requested:');
            const toolCall = message.tool_calls[0];
            console.log('  Function:', toolCall.function.name);
            console.log('  Arguments:', toolCall.function.arguments);
        } else {
            console.log('Response:', message.content);
        }
    } catch (error) {
        console.log('Error:', error.message);
    }
    
    console.log('');
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      Demo Complete                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
}

// Run demo
demo().catch(error => {
    console.error('Demo error:', error);
    process.exit(1);
});
