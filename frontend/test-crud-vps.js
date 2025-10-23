#!/usr/bin/env node
// Test complet CRUD avec le backend VPS

const VPS_URL = 'http://72.61.166.22';

async function testCRUD() {
  console.log('🧪 Test CRUD complet avec backend VPS\n');
  console.log(`Backend: ${VPS_URL}\n`);

  try {
    // CREATE - Créer une nouvelle routine
    console.log('1️⃣ CREATE - Création d\'une routine...');
    const createResponse = await fetch(`${VPS_URL}/api/routines/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Test Frontend → VPS',
        sound_type: 'bell',
        volume: 75,
        image_url: '/test-frontend.jpg',
        steps: [
          {
            nom: 'Edit Course',
            code_map: '1111-2222-3333',
            duree: 180,
            tips: 'Triple edits'
          },
          {
            nom: 'Box Fights',
            code_map: '4444-5555-6666',
            duree: 420,
            tips: 'Win fights'
          }
        ]
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status}`);
    }

    const createdRoutine = await createResponse.json();
    console.log(`   ✅ Routine créée avec ID: ${createdRoutine.id}`);
    console.log(`   📝 Nom: "${createdRoutine.nom}"`);
    console.log(`   🔊 Son: ${createdRoutine.sound_type}, Volume: ${createdRoutine.volume}`);
    console.log(`   📊 ${createdRoutine.steps.length} steps\n`);

    const routineId = createdRoutine.id;

    // READ - Lire la routine créée
    console.log('2️⃣ READ - Lecture de la routine...');
    const readResponse = await fetch(`${VPS_URL}/api/routines/${routineId}`);
    if (!readResponse.ok) {
      throw new Error(`Read failed: ${readResponse.status}`);
    }

    const readRoutine = await readResponse.json();
    console.log(`   ✅ Routine ${routineId} récupérée`);
    console.log(`   📋 Steps:`);
    readRoutine.steps.forEach((step, i) => {
      console.log(`      ${i + 1}. ${step.nom} (${step.duree}s) - ${step.code_map}`);
    });
    console.log();

    // UPDATE - Modifier la routine
    console.log('3️⃣ UPDATE - Modification de la routine...');
    const updateResponse = await fetch(`${VPS_URL}/api/routines/${routineId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: 'Test Frontend → VPS (Modifié)',
        volume: 100,
        steps: [
          {
            nom: 'Warm-up',
            code_map: '0000-0000-0000',
            duree: 60,
            tips: 'Start slow'
          }
        ]
      })
    });

    if (!updateResponse.ok) {
      throw new Error(`Update failed: ${updateResponse.status}`);
    }

    const updatedRoutine = await updateResponse.json();
    console.log(`   ✅ Routine modifiée`);
    console.log(`   📝 Nouveau nom: "${updatedRoutine.nom}"`);
    console.log(`   🔊 Nouveau volume: ${updatedRoutine.volume}`);
    console.log(`   📊 Maintenant ${updatedRoutine.steps.length} step(s)\n`);

    // LIST - Lister toutes les routines
    console.log('4️⃣ LIST - Liste de toutes les routines...');
    const listResponse = await fetch(`${VPS_URL}/api/routines/`);
    if (!listResponse.ok) {
      throw new Error(`List failed: ${listResponse.status}`);
    }

    const allRoutines = await listResponse.json();
    console.log(`   ✅ ${allRoutines.length} routine(s) trouvée(s):`);
    allRoutines.forEach(r => {
      console.log(`      - ID ${r.id}: "${r.nom}" (${r.steps.length} steps)`);
    });
    console.log();

    // PREVIEW - Tester le timer preview
    console.log('5️⃣ PREVIEW - Prévisualisation du timer...');
    const previewResponse = await fetch(`${VPS_URL}/api/timer/routine-preview/${routineId}`);
    if (!previewResponse.ok) {
      throw new Error(`Preview failed: ${previewResponse.status}`);
    }

    const preview = await previewResponse.json();
    console.log(`   ✅ Durée totale: ${preview.total_duration_formatted}`);
    console.log(`   ⏱️  ${preview.total_duration_seconds} secondes\n`);

    // DELETE - Supprimer la routine de test
    console.log('6️⃣ DELETE - Suppression de la routine de test...');
    const deleteResponse = await fetch(`${VPS_URL}/api/routines/${routineId}`, {
      method: 'DELETE'
    });

    if (!deleteResponse.ok) {
      throw new Error(`Delete failed: ${deleteResponse.status}`);
    }

    console.log(`   ✅ Routine ${routineId} supprimée\n`);

    // Vérifier la suppression
    console.log('7️⃣ VERIFY - Vérification de la suppression...');
    const verifyResponse = await fetch(`${VPS_URL}/api/routines/${routineId}`);
    if (verifyResponse.status === 404) {
      console.log(`   ✅ Routine correctement supprimée (404)\n`);
    } else {
      throw new Error('La routine devrait être supprimée');
    }

    console.log('🎉 Tous les tests CRUD ont réussi !');
    console.log('\n✅ Le frontend peut communiquer avec le backend VPS');
    console.log('✅ Toutes les opérations CRUD fonctionnent');
    console.log('✅ L\'app Tauri est prête à être buildée en production');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

testCRUD();
