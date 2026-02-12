require('dotenv').config();
console.log('--- Environment Check ---');
console.log('MONGODB_URI starts with:', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) : 'UNDEFINED');
console.log('GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
console.log('--- End Check ---');
