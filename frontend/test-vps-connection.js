#!/usr/bin/env node
// Script de test de connexion au backend VPS

const VPS_URL = 'http://72.61.166.22';

async function testConnection() {
  console.log('🔍 Test de connexion au backend VPS...\n');

  try {
    // Test 1: Health check
    console.log('1. Health check...');
    const healthResponse = await fetch(`${VPS_URL}/health`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Health: ${healthData.status}\n`);

    // Test 2: Get routines
    console.log('2. Récupération des routines...');
    const routinesResponse = await fetch(`${VPS_URL}/api/routines/`);
    const routines = await routinesResponse.json();
    console.log(`   ✅ Routines trouvées: ${routines.length}`);
    if (routines.length > 0) {
      console.log(`   📋 Exemple: "${routines[0].nom}"\n`);
    } else {
      console.log(`   ℹ️  Aucune routine dans la base\n`);
    }

    // Test 3: API info
    console.log('3. Informations API...');
    const apiResponse = await fetch(`${VPS_URL}/`);
    const apiData = await apiResponse.json();
    console.log(`   ✅ Message: ${apiData.message}`);
    console.log(`   📚 Version: ${apiData.version}\n`);

    console.log('✅ Tous les tests ont réussi !');
    console.log(`\n🌐 L'app Tauri peut maintenant utiliser: ${VPS_URL}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testConnection();
