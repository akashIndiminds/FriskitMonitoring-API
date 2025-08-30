import OpenAI from 'openai';
import { config } from './index.js';

let openaiClient = null;

export const getOpenAIClient = () => {
  if (!openaiClient && config.openai.apiKey) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey
    });
  }
  return openaiClient;
};

export const isOpenAIConfigured = () => {
  return !!config.openai.apiKey && config.openai.apiKey !== 'your_openai_api_key_here';
};