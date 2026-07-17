import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const dir = "uploads";
  const files = fs.readdirSync(dir).filter(f => f.startsWith("upload_"));
  
  const results = [];
  for (const f of files) {
    const filePath = path.join(dir, f);
    const stat = fs.statSync(filePath);
    if (stat.size >= 5000 && stat.size <= 50000) {
      try {
        const metadata = await sharp(filePath).metadata();
        results.push({
          name: f,
          size: stat.size,
          width: metadata.width,
          height: metadata.height,
          ratio: metadata.width / metadata.height
        });
      } catch (e) {
        // Ignore
      }
    }
  }
  
  console.log(`Found ${results.length} files between 5KB and 50KB:`);
  console.log(results.slice(0, 50));
}

main().catch(console.error);
