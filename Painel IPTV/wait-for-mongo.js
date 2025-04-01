const { exec } = require('child_process');
const { setTimeout } = require('timers/promises');

const MAX_ATTEMPTS = 30; // Aumentar para 30 tentativas
const RETRY_DELAY = 10000; // Aumentar o delay para 10 segundos

async function checkMongo() {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        exec(
          'mongosh --host mongo -u admin -p senha123 --authenticationDatabase admin --eval "db.adminCommand({ ping: 1 })"',
          (error, stdout, stderr) => {
            if (error) {
              console.error(`❌ Tentativa ${attempt}:`, error.message);
              return reject(error);
            }
            console.log(`✅ MongoDB respondendo (Tentativa ${attempt})`);
            resolve();
          }
        );
      });
      return true;
    } catch (error) {
      if (attempt < MAX_ATTEMPTS) {
        console.log(`⌛ Aguardando ${RETRY_DELAY/1000}s para próxima tentativa...`);
        await setTimeout(RETRY_DELAY);
      }
    }
  }
  throw new Error(`Timeout após ${MAX_ATTEMPTS} tentativas`);
}

checkMongo()
  .then(() => {
    console.log('🚀 Iniciando API...');
    require('./api.js');
  })
  .catch((err) => {
    console.error('💥 Falha crítica:', err.message);
    process.exit(1);
  });