/* eslint-disable no-console */
import axios from 'axios';

// --- Configuration ---
// IMPORTANT: Paste a valid JWT Access Token here before running the script.
// You can obtain this from your browser's local storage after logging in.
const ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTI0NDU3NWRmZjY2MTBjNTA2ZTE2MWEiLCJpYXQiOjE3NjQ0MjkxMjksImV4cCI6MTc2NDUxNTUyOX0.OkZBEuLmITVHq2EpZkLDMPYQcuwI4wk_ZL0b0sAaH9Y';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// This is a valid bot payload based on the Zod schema in the `createBot` action.
const botPayload = {
    name: `Verification Bot #${Date.now()}`,
    visibility: 'PRIVATE',
    strategy: 'RSI_STRATEGY',
    assets: ['BTCUSDT'], // Make sure this asset exists
    config: {
        tradeAmount: 10,
        expirySeconds: 60,
        maxConcurrentTrades: 1,
        stopLossAmount: 0,
        takeProfitAmount: 0,
    },
    parameters: {
        period: 14,
    },
};

async function verifyBotCreation() {
    // if (ACCESS_TOKEN === 'YOUR_ACCESS_TOKEN_HERE') {
    //     console.error('\x1b[31m%s\x1b[0m', 'ERROR: Please paste a valid JWT Access Token into the ACCESS_TOKEN variable in the script.');
    //     return;
    // }

    console.log('\x1b[36m%s\x1b[0m', 'Attempting to create a bot with the following payload:');
    console.log(botPayload);

    try {
        const { data } = await axios.post(
            `${API_BASE_URL}/bots`,
            botPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        console.log('\x1b[32m%s\x1b[0m', '\n✅ Bot creation successful!');
        console.log('Server response:');
        console.log(data);

    } catch (error: any) {
        console.error('\x1b[31m%s\x1b[0m', '\n❌ Bot creation failed.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

verifyBotCreation();
