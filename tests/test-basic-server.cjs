/**
 * Basic Syntax and Server Test
 * 
 * Tests that the server starts successfully and endpoints are accessible.
 * Does not require accounts to be configured.
 */
const http = require('http');

// Server configuration
const BASE_URL = 'localhost';
const PORT = 8080;

/**
 * Make a simple GET request
 */
function getRequest(path) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            host: BASE_URL,
            port: PORT,
            path: path,
            method: 'GET'
        }, res => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: json });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('BASIC SERVER TEST');
    console.log('Tests server startup and endpoint accessibility');
    console.log('='.repeat(60));
    console.log('');

    let allPassed = true;

    // Test 1: Health endpoint
    console.log('TEST 1: Health endpoint');
    console.log('-'.repeat(40));
    try {
        const response = await getRequest('/health');
        console.log('  Status:', response.statusCode);
        console.log('  Response:', JSON.stringify(response.data, null, 2));
        
        if (response.statusCode === 200 || response.statusCode === 503) {
            console.log('  ✓ PASSED - Endpoint accessible');
        } else {
            console.log('  ✗ FAILED - Unexpected status code');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }
    console.log('');

    // Test 2: Models endpoint
    console.log('TEST 2: Models endpoint');
    console.log('-'.repeat(40));
    try {
        const response = await getRequest('/v1/models');
        console.log('  Status:', response.statusCode);
        
        if (response.statusCode === 200 || response.statusCode === 503) {
            console.log('  ✓ PASSED - Endpoint accessible');
        } else {
            console.log('  ✗ FAILED - Unexpected status code');
            allPassed = false;
        }
    } catch (error) {
        console.log('  ✗ FAILED:', error.message);
        allPassed = false;
    }
    console.log('');

    // Test 3: Check OpenAI converter module loads without errors
    console.log('TEST 3: OpenAI converter module');
    console.log('-'.repeat(40));
    try {
        // Dynamic import for ES module
        const converterPath = '../src/format/openai-converter.js';
        const { convertOpenAIToAnthropic, convertAnthropicToOpenAI } = await import(converterPath);
        
        // Test basic conversion
        const openaiRequest = {
            model: 'gpt-4',
            messages: [
                { role: 'user', content: 'Hello' }
            ],
            max_tokens: 100
        };
        
        const anthropicRequest = convertOpenAIToAnthropic(openaiRequest);
        console.log('  Converted model:', anthropicRequest.model);
        console.log('  Message count:', anthropicRequest.messages.length);
        
        if (anthropicRequest.model && anthropicRequest.messages.length > 0) {
            console.log('  ✓ PASSED - Converter works correctly');
        } else {
            console.log('  ✗ FAILED - Invalid conversion');
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
