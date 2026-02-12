const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Get AI Tutor response
// @route   POST /api/ai/tutor
// @access  Protected (Student)
exports.getAiTutorResponse = async (req, res, next) => {
    const { messages } = req.body;

    try {
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide messages array'
            });
        }

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            const lastUserMessage = messages[messages.length - 1].content;
            return res.status(200).json({
                success: true,
                data: {
                    text: `[GEMINI STUB] I received your message: "${lastUserMessage}". To enable real Gemini AI responses, please add GEMINI_API_KEY to your backend .env file. I am your free learning assistant!`
                }
            });
        }

        // Initialize Gemini AI
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Try models in order of preference
        // We prioritize 1.5-flash and flash-latest as they are most stable for free-tier quotas
        const modelsToTry = ["gemini-1.5-flash", "gemini-flash-latest", "gemini-pro-latest", "gemini-2.0-flash"];
        let lastError = null;

        // Limit history to the last 6 messages to stay within free tier limits
        const contextLimit = 6;
        const messagesToProcess = messages.slice(-contextLimit);

        // Filter valid messages for history (must alternate user/model and not contain our local error messages)
        const validMessages = messagesToProcess.filter(msg =>
            msg.content &&
            msg.content !== 'Sorry, I encountered an error. Please try again.' &&
            !msg.content.includes('Sorry, I encountered an error:')
        );

        if (validMessages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid messages to process'
            });
        }

        for (const modelName of modelsToTry) {
            try {
                console.log(`[AI] Attempting ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const lastMessage = validMessages[validMessages.length - 1].content;
                const historyItems = validMessages.slice(0, -1);

                // Gemini requires history to start with 'user' and alternate
                // If it doesn't, we'll just send the last message without history
                let useHistory = true;
                if (historyItems.length > 0 && historyItems[0].role !== 'user') {
                    useHistory = false;
                }

                let text = '';
                if (useHistory && historyItems.length > 0) {
                    const chat = model.startChat({
                        history: historyItems.map(msg => ({
                            role: msg.role === 'assistant' ? 'model' : 'user',
                            parts: [{ text: msg.content }]
                        })),
                        generationConfig: { maxOutputTokens: 1000 }
                    });
                    const result = await chat.sendMessage(lastMessage);
                    const response = await result.response;
                    text = response.text();
                } else {
                    // Simple generation if history is empty or invalid
                    const result = await model.generateContent(lastMessage);
                    const response = await result.response;
                    text = response.text();
                }

                if (text) {
                    console.log(`[AI] Success with ${modelName}`);
                    return res.status(200).json({
                        success: true,
                        data: { text: text, modelUsed: modelName }
                    });
                }
            } catch (error) {
                console.warn(`[AI] Model ${modelName} failed:`, error.message);
                lastError = error;

                // If it's a 429 (Too many requests) or 403 (Invalid key), don't bother trying other models
                if (error.message?.includes('429') || error.message?.includes('403')) {
                    break;
                }
            }
        }

        throw lastError || new Error('All AI models failed');

    } catch (error) {
        console.error('[AI ERROR]:', error);

        // Check for specific common errors
        const errorMsg = error.message || '';

        // Handle Geo-blocking or API Key restrictions gracefully
        if (errorMsg.includes('User location is not supported') || errorMsg.includes('403')) {
            const lastUserMessage = messages[messages.length - 1].content;
            console.log('[AI] Geo-blocked or Access Denied. Falling back to Simulation Mode.');

            return res.status(200).json({
                success: true,
                data: {
                    text: `[SIMULATION MODE] I received your question: "${lastUserMessage}". 
                    
⚠️ NOTE: It looks like Gemini AI is restricted in your current region or your API key settings. 

To fix this:
1. Ensure your API key has "Generative Language API" enabled in Google AI Studio.
2. Check if your region is supported by Gemini.

In the meantime, I am here to help you simulate the learning experience! How else can I assist?`,
                    modelUsed: 'simulation-fallback'
                }
            });
        }

        let friendlyMsg = 'Failed to get response from Gemini AI';
        if (errorMsg.includes('API_KEY_INVALID')) friendlyMsg = 'Invalid Gemini API Key. Please check your .env file.';
        if (errorMsg.includes('429')) friendlyMsg = 'AI Tutor is busy (Rate Limited). Please try again in 1 minute.';

        res.status(500).json({
            success: false,
            message: friendlyMsg,
            error: errorMsg || 'Unknown error occurred'
        });
    }
};
