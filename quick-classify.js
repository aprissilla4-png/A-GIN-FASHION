import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const dir = "uploads";
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".png") || f.endsWith(".jpeg") || f.endsWith(".jpg"));
  
  console.log(`Classifying ${files.length} images...`);
  
  for (const f of files) {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    if (stat.size > 100000) continue; // Keep it small

    try {
      const buffer = fs.readFileSync(filePath);
      const base64Data = buffer.toString("base64");
      
      const response = await ai.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent([
        {
          inlineData: {
            mimeType: f.endsWith(".png") ? "image/png" : "image/jpeg",
            data: base64Data,
          }
        },
        "What brand or logo is this? (e.g. Mandiri, JNE, etc.). Answer in 1 word."
      ]);
      
      const text = response.response.text().trim();
      if (!text.toLowerCase().includes("unknown") && text.length < 20) {
        console.log(`${f}: ${text}`);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (err) {}
  }
}

main().catch(console.error);
