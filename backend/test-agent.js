// Quick test script for AI agent (CommonJS version)
const dotenv = require('dotenv');
dotenv.config();

async function testAgent() {
  console.log('🧪 Testing AI Agent...\n');

  try {
    // Dynamic import for ES modules
    const { getChatReply } = await import('./agents/agent.js');

    // Test 1: Basic chat
    console.log('Test 1: Basic emergency question');
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful emergency response assistant.'
      },
      {
        role: 'user',
        content: 'Someone is choking, what should I do?'
      }
    ];

    const response = await getChatReply(messages);
    console.log('✅ Response received:');
    console.log(response);
    console.log('\n---\n');

    // Test 2: Multi-language
    console.log('Test 2: Telugu language test');
    const teluguMessages = [
      {
        role: 'system',
        content: 'You are a helpful emergency response assistant. Respond in Telugu.'
      },
      {
        role: 'user',
        content: 'సహాయం' // Help in Telugu
      }
    ];

    const teluguResponse = await getChatReply(teluguMessages);
    console.log('✅ Telugu response received:');
    console.log(teluguResponse);
    console.log('\n---\n');

    console.log('✅ All tests passed! AI agent is working correctly.');
    console.log('\n🎉 You can now start the backend server with: npm run dev');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. GITHUB_TOKEN is set in .env file');
    console.error('2. Token has correct permissions');
    console.error('3. Internet connection is working');
    process.exit(1);
  }
}

testAgent();
