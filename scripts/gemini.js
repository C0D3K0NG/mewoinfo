import { db } from './db.js';

// Try 'gemini-1.5-flash' first. If it fails, we will see why.
const MODEL_NAME = "gemini-2.5-flash-lite"; 

export const gemini = {
  async generateFacts(apiKey, contextText) {
    if (!apiKey) throw new Error("No API Key found!");
    if (!contextText) throw new Error("No PDF text found!");

    console.log("📄 Sending text length:", contextText.length); // DEBUG 1

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const prompt = `
      You are a smart cat. Read the following text and extract 50 interesting facts.
      Rewrite them in a funny, cute "cat persona" (use meow, purr, hiss, human slave, etc.).
      
      RULES:
      1. Return ONLY a valid JSON array of strings. 
      2. No markdown formatting (like \`\`\`json). Just the raw array.
      3. Example format: ["Meow! Did you know X?", "Purr... interesting fact Y."]
      
      TEXT TO PROCESS:
      ${contextText.substring(0, 30000)} 
    `;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // --- NEW DEBUGGING LOGIC ---
    if (!response.ok) {
      const errorBody = await response.text(); // Google's secret error message
      console.error("🛑 GOOGLE ERROR DETAILS:", errorBody);
      throw new Error(`Gemini Refused: ${response.status} - ${errorBody}`);
    }
    // ---------------------------

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error("Failed to parse Gemini response:", rawText);
      throw new Error("Cat logic failed (JSON Parse Error)");
    }
  }
};