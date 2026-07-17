const https = require('https');
const fs = require('fs');

const logos = {
  'JNE': 'https://upload.wikimedia.org/wikipedia/commons/9/9d/JNE_logo.svg',
  'J_T': 'https://upload.wikimedia.org/wikipedia/commons/5/52/J%26T_Express_logo.svg',
  'SICEPAT': 'https://upload.wikimedia.org/wikipedia/commons/0/05/SiCepat_Ekspres_logo.svg',
  'GOJEK': 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Gojek_logo_2019.svg',
  'GRAB': 'https://upload.wikimedia.org/wikipedia/commons/4/43/Grab_%28application%29_logo.svg',
  'IDEXPRESS': 'https://upload.wikimedia.org/wikipedia/commons/1/10/ID_Express_logo.svg',
  'POS': 'https://upload.wikimedia.org/wikipedia/commons/3/36/Logo_Pos_Indonesia.svg',
  'NINJA': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Ninja_Van_logo.svg',
  'TIKI': 'https://upload.wikimedia.org/wikipedia/commons/2/25/Tiki_logo.svg',
  'LALAMOVE': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Lalamove_logo.svg'
};

const download = (name, url) => {
  const file = fs.createWriteStream(`uploads/${name}.svg`);
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
    response.pipe(file);
    file.on('finish', () => file.close());
  });
};

for (const [name, url] of Object.entries(logos)) {
  download(name, url);
}
console.log('Downloading...');
