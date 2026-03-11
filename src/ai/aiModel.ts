// src/ai/aiModel.ts
import axios from 'axios';

const generateScriptWithAI = async (topic: string, style: string) => {
  try {
    const response = await axios.post('https://api.your-ai-service.com/generate', {
      topic,
      style,
    });
    return response;
  } catch (error) {
    throw new Error('Failed to generate script with AI: ' + error.message);
  }
};

export { generateScriptWithAI };