
const axios = require('axios');

async function testChat() {
    try {
        console.log('Sending request...');
        const response = await axios.post('http://localhost:5000/api/chat/bot-response', {
            userMessage: 'Hello, what products do you have?',
            chatId: 'test-123'
        });
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('Error status:', error.response.status);
            console.log('Error data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
    }
}

testChat();
