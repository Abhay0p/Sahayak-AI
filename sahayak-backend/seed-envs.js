const fs = require('fs');
const path = require('path');

const dbAbsPath = 'C:/Users/HP/Desktop/SAHAYAK AI/sahayak-backend/packages/database/prisma/dev.db';
const envContent = `DATABASE_URL="file:${dbAbsPath}"\n`;

const servicesDir = path.join(__dirname, 'services');
const services = fs.readdirSync(servicesDir);
for (const s of services) {
  const p = path.join(servicesDir, s);
  if (fs.statSync(p).isDirectory()) {
    fs.writeFileSync(path.join(p, '.env'), envContent);
    console.log('Written .env for ' + s);
  }
}
fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log('Written root .env');
