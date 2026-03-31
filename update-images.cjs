const fs = require('fs');

const BASE = 'https://www.smartprintciotta.it/wp-content/uploads/';

const imageMap = {
  1: BASE + '2020/11/tazza-love.jpg',
  2: BASE + '2020/11/ChatGPT-Image-29-gen-2026-18_22_22.png',
  3: BASE + '2020/11/mug-i-love-new-york-personnalisable.jpg',
  4: BASE + '2020/11/tazza-love.jpg',
  5: BASE + '2020/11/mug-i-love-new-york-personnalisable.jpg',
  6: BASE + '2020/11/tazza-love.jpg',
  7: BASE + '2020/11/tazza-love.jpg',
  8: BASE + '2020/11/tazza-love.jpg',
  9: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  10: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  11: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  12: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  13: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  14: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  15: BASE + '2020/11/cuscino-cuore-personalizzato.jpg',
  16: BASE + '2020/11/puzzle-20x29-cm-180-tasselli-.jpg',
  17: BASE + '2020/11/puzzle-20x29-cm-180-tasselli-.jpg',
  18: BASE + '2020/11/puzzle-20x29-cm-180-tasselli-.jpg',
  19: BASE + '2020/11/puzzle-20x29-cm-180-tasselli-.jpg',
  20: BASE + '2020/11/s-l1600-5.jpg',
  21: BASE + '2020/11/s-l1600-5.jpg',
  22: BASE + '2020/11/s-l1600-5.jpg',
  23: BASE + '2020/11/s-l1600-5.jpg',
  24: BASE + '2020/11/s-l1600-5.jpg',
  25: BASE + '2020/11/s-l1600-5.jpg',
  26: BASE + '2021/01/quadretto-spotify.jpg',
  27: BASE + '2021/01/quadretto-spotify.jpg',
  28: BASE + '2021/01/quadretto-spotify.jpg',
  29: BASE + '2021/01/quadretto-spotify.jpg',
  30: BASE + '2021/01/quadretto-spotify.jpg',
  31: BASE + '2021/01/quadretto-spotify.jpg',
  32: BASE + '2021/01/quadretto-spotify.jpg',
  33: BASE + '2021/01/quadretto-spotify.jpg',
  34: BASE + '2021/10/IMG_1191.jpg',
  35: BASE + '2021/10/IMG_1191.jpg',
  36: BASE + '2021/10/IMG_1191.jpg',
  37: BASE + '2021/10/IMG_1191.jpg',
  38: BASE + '2021/10/IMG_1191.jpg',
  39: BASE + '2021/10/IMG_1191.jpg',
  40: BASE + '2020/11/bolle-di-sapone.jpg',
  41: BASE + '2020/11/patatine.jpg',
  42: BASE + '2020/11/bolle-di-sapone.jpg',
  43: BASE + '2020/11/bolle-di-sapone.jpg',
  44: BASE + '2020/11/bolle-di-sapone.jpg',
  45: BASE + '2020/11/bolle-di-sapone.jpg',
  46: BASE + '2021/09/13.jpg',
  47: BASE + '2021/09/13.jpg',
  48: BASE + '2021/09/13.jpg',
  49: BASE + '2021/09/13.jpg',
  50: BASE + '2021/09/13.jpg',
  51: BASE + '2021/09/13.jpg',
  52: BASE + '2021/09/13.jpg',
  53: BASE + '2021/01/plaid-love.jpg',
  54: BASE + '2021/01/plaid-love.jpg',
  55: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  56: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  57: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  58: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  59: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  60: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  61: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  62: BASE + '2020/11/T-SHIRT-personalizza.jpg',
  63: BASE + '2020/11/forex.jpg',
  64: BASE + '2026/01/quadretto-netflix.jpg',
  65: BASE + '2025/11/31.jpg',
  66: BASE + '2026/01/quadretto-netflix.jpg',
};

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content.replace(
    /(\s+id:\s+(\d+),[\s\S]*?image:\s*)"[^"]*"/g,
    (match, before, id) => {
      const url = imageMap[parseInt(id)];
      return url ? `${before}"${url}"` : match;
    }
  );
  fs.writeFileSync(filePath, updated);
  const remaining = (updated.match(/placehold\.co/g) || []).length;
  console.log(`${filePath} updated. Remaining placeholders: ${remaining}`);
}

updateFile('src/data/products.js');
updateFile('netlify/functions/_mockData.js');

// Cleanup
fs.unlinkSync('update-images.js');
console.log('Done.');
