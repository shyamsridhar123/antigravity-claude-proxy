/**
 * OpenAI Format Converter
 * Converts OpenAI Chat Completions API format to/from Anthropic Messages API format
 */

/**
 * Convert OpenAI chat completion request to Anthropic Messages API format
 * @param {Object} openaiRequest - OpenAI format request
 * @returns {Object} Anthropic Messages API format request
 */
export function convertOpenAIToAnthropic(openaiRequest) {
    const {
        model,
        messages,
        max_tokens,
        temperature,
        top_p,
        stream,
        tools,
        tool_choice,
        stop,
        response_format,
        ...otherParams
    } = openaiRequest;

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
        throw new Error('messages must be an array');
    }
    if (messages.length === 0) {
        throw new Error('messages array cannot be empty');
    }

    // Map OpenAI model names to our supported models
    // Using official Anthropic model IDs with datestamps for better compatibility
    const modelMap = {
        'gpt-4': 'claude-opus-4-5-20251101',
        'gpt-4-turbo': 'claude-opus-4-5-20251101',
        'gpt-4o': 'claude-opus-4-5-20251101',
        'gpt-3.5-turbo': 'claude-sonnet-4-5-20241022',
        'gpt-4o-mini': 'claude-sonnet-4-5-20241022',
        // Gemini mappings
        'gemini-pro': 'gemini-3-pro-high',
        'gemini-flash': 'gemini-3-flash',
    };

    // Extract system message if present
    let systemMessage = null;
    const anthropicMessages = [];

    for (const msg of messages) {
        if (msg.role === 'system') {
            // Combine system messages into one
            if (systemMessage) {
                systemMessage += '\n\n' + msg.content;
            } else {
                systemMessage = msg.content;
            }
        } else if (msg.role === 'user' || msg.role === 'assistant') {
            // Convert content format
            let content;
            if (typeof msg.content === 'string') {
                content = msg.content;
            } else if (Array.isArray(msg.content)) {
                // Handle multi-part content (text, images, etc.)
                content = msg.content.map(part => {
                    if (part.type === 'text') {
                        return { type: 'text', text: part.text };
                    } else if (part.type === 'image_url') {
                        // Convert OpenAI image_url to Anthropic format
                        const imageUrl = part.image_url.url;
                        if (imageUrl.startsWith('data:')) {
                            // Base64 encoded image
                            const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
                            if (matches) {
                                return {
                                    type: 'image',
                                    source: {
                                        type: 'base64',
                                        media_type: matches[1],
                                        data: matches[2]
                                    }
                                };
                            }
                        } else {
                            // URL image
                            return {
                                type: 'image',
                                source: {
                                    type: 'url',
                                    url: imageUrl
                                }
                            };
                        }
                    }
                    return part;
                });
            } else {
                content = String(msg.content);
            }

            // Handle tool calls (function calls in OpenAI)
            if (msg.tool_calls && msg.tool_calls.length > 0) {
                // Convert OpenAI tool_calls to Anthropic tool_use
                const contentBlocks = Array.isArray(content) ? content : (content ? [{ type: 'text', text: content }] : []);
                
                for (const toolCall of msg.tool_calls) {
                    contentBlocks.push({
                        type: 'tool_use',
                        id: toolCall.id,
                        name: toolCall.function.name,
                        input: JSON.parse(toolCall.function.arguments)
                    });
                }
                
                anthropicMessages.push({
                    role: 'assistant',
                    content: contentBlocks
                });
            } else if (msg.role === 'tool') {
                // OpenAI tool response -> Anthropic tool_result
                const toolCallId = msg.tool_call_id;
                const toolContent = msg.content;
                
                // Find or create user message for tool results
                const lastMsg = anthropicMessages[anthropicMessages.length - 1];
                if (lastMsg && lastMsg.role === 'user' && Array.isArray(lastMsg.content)) {
                    // Append to existing user message
                    lastMsg.content.push({
                        type: 'tool_result',
                        tool_use_id: toolCallId,
                        content: toolContent
                    });
                } else {
                    // Create new user message with tool result
                    anthropicMessages.push({
                        role: 'user',
                        content: [{
                            type: 'tool_result',
                            tool_use_id: toolCallId,
                            content: toolContent
                        }]
                    });
                }
            } else {
                anthropicMessages.push({
                    role: msg.role,
                    content
                });
            }
        }
    }

    // Convert tools format if present
    let anthropicTools = null;
    if (tools && tools.length > 0) {
        anthropicTools = tools.map(tool => {
            if (tool.type === 'function') {
                return {
                    name: tool.function.name,
                    description: tool.function.description || '',
                    input_schema: tool.function.parameters || { type: 'object', properties: {} }
                };
            }
            return tool;
        });
    }

    // Convert tool_choice
    let anthropicToolChoice = undefined;
    if (tool_choice) {
        if (tool_choice === 'auto') {
            anthropicToolChoice = { type: 'auto' };
        } else if (tool_choice === 'none') {
            anthropicToolChoice = { type: 'any' }; // Anthropic doesn't have "none", use "any" as closest
        } else if (typeof tool_choice === 'object' && tool_choice.type === 'function') {
            anthropicToolChoice = { type: 'tool', name: tool_choice.function.name };
        }
    }

    // Build Anthropic request
    const anthropicRequest = {
        model: modelMap[model] || model || 'claude-sonnet-4-5-20241022',
        messages: anthropicMessages,
        max_tokens: max_tokens || 4096,
        stream: stream || false
    };

    // Add optional parameters
    if (systemMessage) {
        anthropicRequest.system = systemMessage;
    }
    if (temperature !== undefined) {
        anthropicRequest.temperature = temperature;
    }
    if (top_p !== undefined) {
        anthropicRequest.top_p = top_p;
    }
    if (anthropicTools) {
        anthropicRequest.tools = anthropicTools;
    }
    if (anthropicToolChoice) {
        anthropicRequest.tool_choice = anthropicToolChoice;
    }
    if (stop) {
        anthropicRequest.stop_sequences = Array.isArray(stop) ? stop : [stop];
    }

    return anthropicRequest;
}

/**
 * Convert Anthropic Messages API response to OpenAI Chat Completions format
 * @param {Object} anthropicResponse - Anthropic format response
 * @param {string} model - Model name used in request
 * @returns {Object} OpenAI Chat Completions format response
 */
export function convertAnthropicToOpenAI(anthropicResponse, model = 'gpt-4') {
    const {
        id,
        type,
        role,
        content,
        model: responseModel,
        stop_reason,
        stop_sequence,
        usage
    } = anthropicResponse;

    // Convert content blocks to OpenAI format
    let messageContent = '';
    const toolCalls = [];

    if (Array.isArray(content)) {
        for (const block of content) {
            if (block.type === 'text') {
                messageContent += block.text;
            } else if (block.type === 'tool_use') {
                // Convert Anthropic tool_use to OpenAI tool_calls
                toolCalls.push({
                    id: block.id,
                    type: 'function',
                    function: {
                        name: block.name,
                        arguments: JSON.stringify(block.input)
                    }
                });
            }
        }
    } else if (typeof content === 'string') {
        messageContent = content;
    }

    // Map stop reasons
    const finishReasonMap = {
        'end_turn': 'stop',
        'max_tokens': 'length',
        'stop_sequence': 'stop',
        'tool_use': 'tool_calls'
    };

    const message = {
        role: 'assistant',
        content: messageContent || null
    };

    if (toolCalls.length > 0) {
        message.tool_calls = toolCalls;
    }

    const openaiResponse = {
        id: id || `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model,
        choices: [{
            index: 0,
            message,
            finish_reason: finishReasonMap[stop_reason] || 'stop'
        }],
        usage: {
            prompt_tokens: usage?.input_tokens || 0,
            completion_tokens: usage?.output_tokens || 0,
            total_tokens: (usage?.input_tokens || 0) + (usage?.output_tokens || 0)
        }
    };

    return openaiResponse;
}

/**
 * Convert Anthropic streaming event to OpenAI streaming chunk format
 * @param {Object} anthropicEvent - Anthropic SSE event
 * @param {string} model - Model name used in request
 * @returns {Object|null} OpenAI streaming chunk or null if not applicable
 */
export function convertAnthropicStreamToOpenAI(anthropicEvent, model = 'gpt-4') {
    const { type, ...data } = anthropicEvent;

    // Generate consistent ID for the stream
    const streamId = `chatcmpl-${Date.now()}`;

    if (type === 'message_start') {
        // Initial message
        return {
            id: streamId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: { role: 'assistant', content: '' },
                finish_reason: null
            }]
        };
    } else if (type === 'content_block_start') {
        // Start of content block
        if (data.content_block?.type === 'text') {
            return {
                id: streamId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                    index: 0,
                    delta: { content: '' },
                    finish_reason: null
                }]
            };
        } else if (data.content_block?.type === 'tool_use') {
            // Tool use start
            return {
                id: streamId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                    index: 0,
                    delta: {
                        tool_calls: [{
                            index: data.index || 0,
                            id: data.content_block.id,
                            type: 'function',
                            function: {
                                name: data.content_block.name,
                                arguments: ''
                            }
                        }]
                    },
                    finish_reason: null
                }]
            };
        }
    } else if (type === 'content_block_delta') {
        if (data.delta?.type === 'text_delta') {
            return {
                id: streamId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                    index: 0,
                    delta: { content: data.delta.text },
                    finish_reason: null
                }]
            };
        } else if (data.delta?.type === 'input_json_delta') {
            // Tool use arguments streaming
            return {
                id: streamId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: model,
                choices: [{
                    index: 0,
                    delta: {
                        tool_calls: [{
                            index: data.index || 0,
                            function: {
                                arguments: data.delta.partial_json
                            }
                        }]
                    },
                    finish_reason: null
                }]
            };
        }
    } else if (type === 'message_delta') {
        // Message end with stop reason
        const finishReasonMap = {
            'end_turn': 'stop',
            'max_tokens': 'length',
            'stop_sequence': 'stop',
            'tool_use': 'tool_calls'
        };

        return {
            id: streamId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: {},
                finish_reason: finishReasonMap[data.delta?.stop_reason] || 'stop'
            }]
        };
    } else if (type === 'message_stop') {
        // Final message
        return {
            id: streamId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: model,
            choices: [{
                index: 0,
                delta: {},
                finish_reason: 'stop'
            }]
        };
    }

    return null; // Ignore other event types
}

/**
 * Convert Anthropic error to OpenAI error format
 * @param {Object} error - Error object
 * @returns {Object} OpenAI error format
 */
export function convertAnthropicErrorToOpenAI(error) {
    const errorTypeMap = {
        'invalid_request_error': 'invalid_request_error',
        'authentication_error': 'authentication_error',
        'permission_error': 'permission_denied',
        'not_found_error': 'invalid_request_error',
        'rate_limit_error': 'rate_limit_exceeded',
        'api_error': 'server_error',
        'overloaded_error': 'server_error'
    };

    return {
        error: {
            message: error.message || error.error?.message || 'An error occurred',
            type: errorTypeMap[error.error?.type || error.type] || 'server_error',
            code: error.error?.code || null
        }
    };
}
