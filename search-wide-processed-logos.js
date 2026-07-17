import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const dir = "uploads";
  const files = fs.readdirSync(dir).filter(f => f.startsWith("upload_"));
  
  const results = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    try {
      const metadata = await sharp(filePath).metadata();
      results.push({
        name: f,
        size: fs.statSync(filePath).size,
        width: metadata.width,
        height: metadata.height,
        ratio: metadata.width / metadata.height
      });
    } catch (e) {
      // Ignore
    }
  }
  
  // Sort by ratio descending
  results.sort((a, b) => b.ratio - a.ratio);
  
  console.log("Top 30 widest images:");
  for (const r of results.slice(0, 30)) {
    console.log(`Name: ${r.name} | ratio: ${r.ratio.toFixed(2)} | size: ${r.size} | width: ${r.width} | height: ${r.height}`);
  }
}

main().catch(console.error);
