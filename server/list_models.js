const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    let url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    let allModels = [];
    while (url) {
      const res = await fetch(url);
      const data = await res.json();
      if (data.models) allModels.push(...data.models.map(m => m.name));
      url = data.nextPageToken ? `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}&pageToken=${data.nextPageToken}` : null;
    }
    console.log(allModels.join('\\n'));
  } catch(e) {
    console.error(e);
  }
}

listModels();
