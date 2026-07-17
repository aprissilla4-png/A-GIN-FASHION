const sharp = require('sharp');

async function main() {
  const file = './src/assets/images/a_gin_logo_1783167930297.jpg';
  
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  // Crop to 75% height to remove the "MADE TO MOVE" generated text
  const newHeight = Math.floor(height * 0.75);
  
  const newData = Buffer.alloc(width * newHeight * 4); // 4 channels (RGBA)

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const newIdx = (y * width + x) * 4;
      
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      const lightness = Math.floor((r + g + b) / 3);
      
      // Target color: #1B1B1B
      newData[newIdx] = 27;     // R
      newData[newIdx + 1] = 27; // G
      newData[newIdx + 2] = 27; // B
      
      // Target color: #1B1B1B which is very dark. 
      // The original image has white logo on black background.
      // Light pixels -> High alpha. Dark pixels -> Low/Zero alpha.
      
      // Let's make alpha proportional to lightness.
      if (lightness < 20) {
        newData[newIdx + 3] = 0;
      } else {
        let a = Math.floor((lightness - 20) * (255 / (255 - 20)) * 1.5);
        if (a > 255) a = 255;
        newData[newIdx + 3] = a;
      }
    }
  }

  await sharp(newData, {
    raw: { width, height: newHeight, channels: 4 }
  })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile('./uploads/a_gin_logo_transparent_black_v4.png');

  console.log('Saved to ./uploads/a_gin_logo_transparent_black_v4.png');
}
main().catch(console.error);
