exports.handler = async function(event, context) {
    return {
        statusCode: 200,
        body: JSON.stringify({
            hasApiKey: !!process.env.OPENAI_API_KEY,
            keyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 3) : null
        })
    };
};
