const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG Base64 payload
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(base64Png, 'base64');

const assetsDir = path.join(__dirname, 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
  console.log("📁 Pasta 'assets/' criada com sucesso.");
}

const assets = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'favicon.png'
];

assets.forEach((file) => {
  const filePath = path.join(assetsDir, file);
  fs.writeFileSync(filePath, buffer);
  console.log(`✅ Asset criado: assets/${file}`);
});

console.log("\n✨ Todos os placeholders de imagens foram gerados. Pronto para compilar!");
