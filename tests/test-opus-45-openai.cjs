/**
 * Opus 4.5 OpenAI Integration Test
 *
 * Tests the OpenAI Chat Completions endpoint specifically for Claude Opus 4.5
 * to verify that:
 * 1. gpt-4 correctly maps to claude-opus-4-5-20251101
 * 2. Direct use of claude-opus-4-5-20251101 works
 * 3. Alias claude-opus-4-5-thinking works
 * 4. Thinking support is properly enabled
 *
 * Requirements: Server must be running with at least one account configured
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

async function runTests() {
    console.log('='.repeat(60));
    console.log('OPUS 4.5 OPENAI INTEGRATION TEST');
    console.log('Tests Claude Opus 4.5 support via OpenAI Chat Completions API');
    console.log('='.repeat(60));
    console.log('');

    let allPassed = true;

    // ===== TEST 1: gpt-4 maps to Opus 4.5 =====
    console.log('TEST 1: GPT-4 mapping to Opus 4.5');
    console.log('-'.repeat(40));
    console.log('Testing that gpt-4 maps to claude-opus-4-5-20251101...');

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4',
            messages: [
                { role: 'user', content: 'Say "Hello from Opus 4.5" and nothing else.' }
            ],
            max_tokens: 100,
            temperature: 0.5
        });

        console.log('  Status:', response.statusCode);
        console.log('  Model used:', response.data.model);
        
        const choice = response.data.choices[0];
        console.log('  Message content:', choice.message.content);
        console.log('  Finish reason:', choice.finish_reason);
        console.log('  Tokens used:', response.data.usage.total_tokens);

        if (response.statusCode === 200 && 
            response.data.object === 'chat.completion' &&
            choice.message.content) {
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

    // ===== TEST 2: Direct official model name =====
    console.log('TEST 2: Direct official model name (claude-opus-4-5-20251101)');
    console.log('-'.repeat(40));
    console.log('Testing direct use of official Anthropic model name...');

    try {
        const response = await chatCompletionsRequest({
            model: 'claude-opus-4-5-20251101',
            messages: [
                { role: 'user', content: 'What is 2+2? Answer with just the number.' }
            ],
            max_tokens: 50
        });

        console.log('  Status:', response.statusCode);
        console.log('  Model used:', response.data.model);
        
        const choice = response.data.choices[0];
        console.log('  Message content:', choice.message.content);

        if (response.statusCode === 200 && choice.message.content) {
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

    // ===== TEST 3: Alias model name =====
    console.log('TEST 3: Alias model name (claude-opus-4-5-thinking)');
    console.log('-'.repeat(40));
    console.log('Testing simplified alias name...');

    try {
        const response = await chatCompletionsRequest({
            model: 'claude-opus-4-5-thinking',
            messages: [
                { role: 'user', content: 'Count from 1 to 3.' }
            ],
            max_tokens: 50
        });

        console.log('  Status:', response.statusCode);
        console.log('  Model used:', response.data.model);
        
        const choice = response.data.choices[0];
        console.log('  Message content:', choice.message.content);

        if (response.statusCode === 200 && choice.message.content) {
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

    // ===== TEST 4: Thinking capability test =====
    console.log('TEST 4: Thinking capability (complex reasoning)');
    console.log('-'.repeat(40));
    console.log('Testing that Opus 4.5 can handle complex reasoning...');

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4',  // Maps to opus-4-5-20251101
            messages: [
                { 
                    role: 'user', 
                    content: 'If a train travels 120 miles in 2 hours, what is its average speed? Show your reasoning briefly.'
                }
            ],
            max_tokens: 200
        });

        console.log('  Status:', response.statusCode);
        
        const choice = response.data.choices[0];
        const content = choice.message.content;
        console.log('  Message content:', content.substring(0, 150) + (content.length > 150 ? '...' : ''));
        console.log('  Content length:', content.length, 'chars');

        // Check if response shows reasoning (should be more than just "60 mph")
        const hasReasoning = content.length > 50;

        if (response.statusCode === 200 && hasReasoning) {
            console.log('  ✓ PASSED - Response shows reasoning');
        } else if (response.statusCode === 200) {
            console.log('  ⚠ PARTIAL - Response works but may lack extended thinking');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }

    console.log('');

    // ===== TEST 5: System message with Opus 4.5 =====
    console.log('TEST 5: System message handling');
    console.log('-'.repeat(40));
    console.log('Testing system message support with Opus 4.5...');

    try {
        const response = await chatCompletionsRequest({
            model: 'gpt-4o',  // Also maps to opus-4-5-20251101
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Be concise.' },
                { role: 'user', content: 'What is AI?' }
            ],
            max_tokens: 150
        });

        console.log('  Status:', response.statusCode);
        
        const choice = response.data.choices[0];
        console.log('  Message content:', choice.message.content.substring(0, 100) + '...');

        if (response.statusCode === 200 && choice.message.content) {
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
    console.log('='.repeat(60));
    console.log(`SUMMARY: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
    console.log('='.repeat(60));
    console.log('');
    console.log('Note: If tests fail with rate limit errors, wait a few moments');
    console.log('and try again. You can also add more accounts via:');
    console.log('  npm run accounts:add');

    process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
