const { OpenAI } = require('openai');

exports.handler = async function(event, context) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // Simple test completion
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'user',
                    content: 'Say "OpenAI API is working correctly!"'
                }
            ],
            max_tokens: 20
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: completion.choices[0].message.content
            })
        };
    } catch (error) {
        console.error('OpenAI API Test Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}; 