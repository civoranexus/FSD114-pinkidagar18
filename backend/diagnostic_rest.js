const axios = require('axios');
require('dotenv').config();

async function listModels() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Using API Key:", apiKey ? "Present" : "Missing");

        // Try to list models directly via REST
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        console.log("Available Models:");
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (${m.displayName})`);
        });
    } catch (error) {
        console.error("REST Error:", error.response?.data || error.message);
    }
}

listModels();
