// electron-builder'ın extraResources kopyalaması node_modules'ü kendi
// bağımlılık analiziyle "budayıp" içini boşaltıyor. Bunun yerine paketleme
// bittikten sonra standalone klasörünü filtresiz, olduğu gibi kopyalıyoruz.
const fs = require('fs');
const path = require('path');

exports.default = async function (context) {
  const src = path.join(__dirname, 'standalone');
  const dest = path.join(context.appOutDir, 'resources', 'standalone');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[afterPack] standalone kopyalandı -> ${dest}`);
};
