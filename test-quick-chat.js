const axios = require('axios');

async function testQuickChat() {
    const keywords = ['red shirt', 'shipping', 'refund', 'hello'];

    console.log('Testing Quick Chat Responses...\n');

    for (const keyword of keywords) {
        try {
            console.log(`Sending message: "${keyword}"`);
            const response = await axios.post('http://localhost:5000/api/chat/bot-response', {
                userMessage: keyword,
                chatId: 'test-quick-chat'
            });
            console.log(`Response for "${keyword}":`);
            console.log(response.data.message);
            console.log('-----------------------------------');
        } catch (error) {
            console.error(`Error testing "${keyword}":`, error.message);
        }
    }
}

testQuickChat();
