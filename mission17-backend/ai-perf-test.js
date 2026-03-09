import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function buildAIFormData(imageUri) {
  const imageBuffer = fs.readFileSync('fake_image.jpg');
  const formData = new FormData();
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'proof.jpg');
  return formData;
}

// Mimics the exact fetch call inside your submissions.js
async function callAIServer(imageUri) {
  const formData = await buildAIFormData(imageUri);
  const aiResponse = await fetch(process.env.AI_SERVER_URL || 'http://localhost:5000/predict', {
    method: 'POST',
    body: formData,
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(`AI Server Error (${aiResponse.status}): ${errText}`);
  }
  return aiResponse.json();
}

async function runTest() {
  console.log('🤖 --- AI CONCURRENCY BENCHMARK ---\n');
  const PENDING_COUNT = 5; // Simulate 5 submissions waiting for AI analysis
  
  const dummySubmissions = Array.from({ length: PENDING_COUNT }).map((_, i) => ({
    _id: `submission-${i}`,
    imageUri: 'dummy_test.jpg'
  }));

  // =========================================================================
  // TEST 1: The "Bad" Way (Parallel via Promise.all) - currently in code
  // =========================================================================
  console.log(`[TEST 1: THE BOTTLENECK] Hitting the AI Server with ${PENDING_COUNT} parallel requests using Promise.all...`);
  const startParallel = performance.now();
  let parallelSuccessCount = 0;
  let parallelFailCount = 0;
  
  try {
    await Promise.all(
        dummySubmissions.map(async sub => {
          try {
            await callAIServer(sub.imageUri);
            parallelSuccessCount++;
          } catch (e) {
            parallelFailCount++;
          }
        })
    );
  } catch (e) {
      console.log('Fatal Error in Promise.all loop');
  }

  const endParallel = performance.now();
  const timeParallel = (endParallel - startParallel).toFixed(2);
  
  console.log(`   Time taken: ${timeParallel} ms`);
  console.log(`   Successful analyses: ${parallelSuccessCount}`);
  console.log(`   Failed inferences: ${parallelFailCount}`);
  if (parallelFailCount > 0) {
      console.log('   ⚠️ Look! The AI server dropped requests/crashed under parallel load!');
  }


  // =========================================================================
  // TEST 2: The "Good" Way (Sequential Execution) - proposed fix
  // =========================================================================
  console.log(`\n[TEST 2: THE FIX] Hitting the AI Server with ${PENDING_COUNT} sequential requests...`);
  const startSequential = performance.now();
  let sequentialSuccessCount = 0;
  let sequentialFailCount = 0;

  for (const sub of dummySubmissions) {
      try {
          await callAIServer(sub.imageUri);
          sequentialSuccessCount++;
      } catch (e) {
          console.error(e.message);
          sequentialFailCount++;
      }
  }

  const endSequential = performance.now();
  const timeSequential = (endSequential - startSequential).toFixed(2);
  
  console.log(`   Time taken: ${timeSequential} ms`);
  console.log(`   Successful analyses: ${sequentialSuccessCount}`);
  console.log(`   Failed inferences: ${sequentialFailCount}`);
  
  console.log('\n✅ Benchmark complete.');
}

runTest();
