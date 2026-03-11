// src/ai/generateScript.ts
import { generateScriptWithAI } from './aiModel';

const generateScript = async (topic: string, style: string) => {
  try {
    const response = await generateScriptWithAI(topic, style);
    return response.data.script; // 这里假设返回的 JSON 格式包含一个 script 字段
  } catch (error) {
    console.error('Error generating script:', error);
    return '';
  }
};

export default generateScript;