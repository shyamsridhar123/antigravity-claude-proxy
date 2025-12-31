/**
 * Model Aliases Test
 *
 * Tests the model alias resolution system to ensure:
 * 1. Simplified aliases resolve to official names
 * 2. Official names pass through unchanged
 * 3. isThinkingModel detects Claude 4.5+ models correctly
 */

// Use dynamic import for ES modules
async function runTests() {
    console.log('='.repeat(60));
    console.log('MODEL ALIASES TEST');
    console.log('Tests model alias resolution and thinking model detection');
    console.log('='.repeat(60));
    console.log('');

    let allPassed = true;

    try {
        // Import ES modules
        const { resolveModelName, isThinkingModel } = await import('../src/constants.js');

        // ===== TEST 1: Alias resolution =====
        console.log('TEST 1: Model alias resolution');
        console.log('-'.repeat(40));

        const testCases = [
            // Aliases should resolve to official names
            { input: 'claude-opus-4-5-thinking', expected: 'claude-opus-4-5-20251101' },
            { input: 'claude-opus-4-5', expected: 'claude-opus-4-5-20251101' },
            { input: 'claude-sonnet-4-5-thinking', expected: 'claude-sonnet-4-5-20241022' },
            { input: 'claude-sonnet-4-5', expected: 'claude-sonnet-4-5-20241022' },
            // Official names should pass through unchanged
            { input: 'claude-opus-4-5-20251101', expected: 'claude-opus-4-5-20251101' },
            { input: 'claude-sonnet-4-5-20241022', expected: 'claude-sonnet-4-5-20241022' },
            // Unknown models should pass through unchanged
            { input: 'gpt-4', expected: 'gpt-4' },
            { input: 'gemini-3-flash', expected: 'gemini-3-flash' },
        ];

        let test1Passed = true;
        for (const { input, expected } of testCases) {
            const result = resolveModelName(input);
            const passed = result === expected;
            console.log(`  ${input} → ${result} ${passed ? '✓' : '✗ Expected: ' + expected}`);
            if (!passed) test1Passed = false;
        }

        if (test1Passed) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }

        console.log('');

        // ===== TEST 2: Thinking model detection =====
        console.log('TEST 2: Thinking model detection');
        console.log('-'.repeat(40));

        const thinkingTestCases = [
            // Claude 4.5+ models with/without thinking suffix should be detected
            { model: 'claude-opus-4-5-thinking', expected: true },
            { model: 'claude-opus-4-5-20251101', expected: true },
            { model: 'claude-opus-4-5', expected: true },
            { model: 'claude-sonnet-4-5-thinking', expected: true },
            { model: 'claude-sonnet-4-5-20241022', expected: true },
            { model: 'claude-sonnet-4-5', expected: true },
            // Older models without "thinking" should not be detected
            { model: 'claude-3-5-sonnet-20241022', expected: false },
            { model: 'claude-3-opus', expected: false },
            // Gemini 3+ should be detected
            { model: 'gemini-3-flash', expected: true },
            { model: 'gemini-3-pro-high', expected: true },
            { model: 'gemini-2-flash', expected: false },
        ];

        let test2Passed = true;
        for (const { model, expected } of thinkingTestCases) {
            const result = isThinkingModel(model);
            const passed = result === expected;
            console.log(`  ${model} → ${result} ${passed ? '✓' : '✗ Expected: ' + expected}`);
            if (!passed) test2Passed = false;
        }

        if (test2Passed) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }

        console.log('');

        // ===== TEST 3: Case insensitivity =====
        console.log('TEST 3: Case insensitivity');
        console.log('-'.repeat(40));

        const caseTestCases = [
            { input: 'Claude-Opus-4-5-Thinking', expected: 'claude-opus-4-5-20251101' },
            { input: 'CLAUDE-OPUS-4-5', expected: 'claude-opus-4-5-20251101' },
        ];

        let test3Passed = true;
        for (const { input, expected } of caseTestCases) {
            const result = resolveModelName(input);
            const passed = result === expected;
            console.log(`  ${input} → ${result} ${passed ? '✓' : '✗ Expected: ' + expected}`);
            if (!passed) test3Passed = false;
        }

        if (test3Passed) {
            console.log('  ✓ PASSED');
        } else {
            console.log('  ✗ FAILED');
            allPassed = false;
        }

        console.log('');
        console.log('='.repeat(60));
        console.log(`SUMMARY: ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}`);
        console.log('='.repeat(60));

        process.exit(allPassed ? 0 : 1);

    } catch (error) {
        console.error('Error running tests:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
