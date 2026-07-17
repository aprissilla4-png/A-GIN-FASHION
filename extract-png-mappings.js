import fs from "fs";
import path from "path";

function getBrandFromPNG(buffer) {
  // Look for text snippets in first 8000 bytes
  const slice = buffer.slice(0, 8000);
  let str = "";
  const words = [];
  
  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    if (c >= 32 && c <= 126) {
      str += String.fromCharCode(c);
    } else {
      if (str.length >= 2) {
        words.push(str.toLowerCase());
      }
      str = "";
    }
  }
  if (str.length >= 2) {
    words.push(str.toLowerCase());
  }
  
  const keywords = ["gojek", "grab", "lalamove", "jne", "jnt", "sicepat", "idexpress", "ninja", "pos", "tiki", "cargo", "anteraja", "doku"];
  
  // Find any keyword match
  for (const w of words) {
    for (const kw of keywords) {
      if (w.includes(kw)) {
        return kw;
      }
    }
  }
  
  // Return first word if it looks like a brand
  return null;
}

function main() {
  const dir = "uploads";
  const files = fs.readdirSync(dir).filter(f => f.startsWith("upload_logo_processed_") || f.startsWith("upload_logo_") || f.startsWith("upload_17835"));
  
  const mapping = {};
  for (const f of files) {
    const filePath = path.join(dir, f);
    const buffer = fs.readFileSync(filePath);
    const brand = getBrandFromPNG(buffer);
    if (brand) {
      mapping[brand] = f;
    }
  }
  
  console.log("EXTRACTED BRAND MAPPING FROM PNG FILES:");
  console.log(JSON.stringify(mapping, null, 2));
}

main();
