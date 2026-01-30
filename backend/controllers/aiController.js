const { GoogleGenerativeAI } = require('@google/generative-ai');

// @desc    Get AI Tutor response
// @route   POST /api/ai/tutor
// @access  Protected (Student)
exports.getAiTutorResponse = async (req, res, next) => {
    try {
        const { messages } = req.body;

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

        // Initialize Gemini AI with explicit API version if possible (v1 is more stable for 1.5-flash)
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

        // Try models in order of preference
        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                // Using V1 API version explicitly to avoid 404 issues on v1beta
                const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' });

                const history = messages.slice(0, -1).map(msg => ({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                }));

                const lastMessage = messages[messages.length - 1].content;

                const chat = model.startChat({
                    history: history,
                    generationConfig: {
                        maxOutputTokens: 1000,
                    },
                });

                const result = await chat.sendMessage(lastMessage);
                const response = await result.response;
                const text = response.text();

                if (text) {
                    return res.status(200).json({
                        success: true,
                        data: { text: text, modelUsed: modelName }
                    });
                }
            } catch (error) {
                console.warn(`Failed with model ${modelName}:`, error.message);
                lastError = error;
                // Continue to next model
            }
        }

        throw lastError || new Error('All Gemini models failed');

    } catch (error) {
        console.error('Gemini AI error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get response from Gemini AI',
            error: error.message || 'Unknown error occurred'
        });
    }
};
