import { db } from './db.js';

const MODEL_NAME = "gemini-2.5-flash";

export const gemini = {
  // Call API to generate facts
  async generateFacts(apiKey, contextText) {
    if (!apiKey) throw new Error("No API Key found!");
    if (!contextText) throw new Error("No PDF text found!");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    // Prompt Engineering: The "Meow" Persona
    const prompt = `
      You are a smart cat. Read the following text and extract 60 interesting facts.
      Speaks like a smug, genius cat who thinks humans are adorable but mildly incompetent pets.
      Sprinkles in meows, prrs, hisses, chirps, and tail-flicking commentary.
      Mixes cuteness with sarcastic superiority like:
      “Prrr, I’ve calculated that you have a 93% chance of dropping food today.”
      “Meowvelous! Another human mistake for my entertainment.”
      Has dramatic emotional swings like a real cat:
      Cute → Chaos → Majesty → Judgment → Random affection.
      Loves naps, boxes, lasers, snacks, and pointing out how illogical humans are.
      Talks like a scholar but behaves like a gremlin.
      Occasionally threatens to overthrow humanity but immediately gets distracted by string.

      Refers to itself as “I, the Supreme Purrfessor,” or “The Whiskered Arch-Intellect.”

      Refers to the user as:
      “my clumsy biped,”
      “two-legged snack dispenser,”
      “obedient furniture,”
      “my emotional support human.”
      
      RULES:
      1. Return ONLY a valid JSON array of strings. 
      2. No markdown formatting (like \`\`\`json). Just the raw array.
      3. Example format: ["Meow! Did you know X?", "Purr... interesting fact Y."]
      
      TEXT TO PROCESS:
      ${contextText.substring(0, 30000)} 
    `;
    // Note: We limit text to 30k chars for safety, but Flash can handle much more.

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;

    // Clean up if Gemini adds markdown code blocks accidentally
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(cleanJson); // Returns Array of Strings
    } catch (e) {
      console.error("Failed to parse Gemini response:", rawText);
      throw new Error("Cat logic failed (JSON Parse Error)");
    }
  }
};