const fs = require('fs');

const logos = {
  'IDEXPRESS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/ID_Express_logo.svg/1200px-ID_Express_logo.svg.png',
  'POS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_Pos_Indonesia.svg/1200px-Logo_Pos_Indonesia.svg.png',
  'NINJA': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Ninja_Van_logo.svg/1200px-Ninja_Van_logo.svg.png',
  'GRAB': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Grab_%28application%29_logo.svg/1200px-Grab_%28application%29_logo.svg.png',
  'GOJEK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Gojek_logo_2019.svg/1200px-Gojek_logo_2019.svg.png',
  'TIKI': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Tiki_logo.svg/1200px-Tiki_logo.svg.png',
  'SICEPAT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/SiCepat_Ekspres_logo.svg/1200px-SiCepat_Ekspres_logo.svg.png',
  'J&T': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/J%26T_Express_logo.svg/1200px-J%26T_Express_logo.svg.png',
  'J&TCARGO': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/J%26T_Express_logo.svg/1200px-J%26T_Express_logo.svg.png', // Fallback to J&T
  'JNE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/JNE_logo.svg/1200px-JNE_logo.svg.png',
  'LALAMOVE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Lalamove_logo.svg/1200px-Lalamove_logo.svg.png',
  'DOKU': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/DOKU_logo.svg/1200px-DOKU_logo.svg.png'
};

console.log(logos);
