import mongoose from 'mongoose';
import 'dotenv/config'; // Make sure this is in your backend folder
import Submission from './models/Submission.js';
import User from './models/User.js';

// Base64 image payload (approx 1MB of text for simulation)
const dummyBase64 = 'data:image/jpeg;base64,' + 'A'.repeat(1000000); 

async function measureQueryTime(description, queryFn) {
  const startMemory = process.memoryUsage().heapUsed;
  const start = performance.now();
  
  await queryFn();
  
  const end = performance.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const timeMs = (end - start).toFixed(2);
  const memUsedMB = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);
  
  console.log(`[PERFORMANCE] ${description}`);
  console.log(`   Time: ${timeMs} ms`);
  console.log(`   Mem : ${memUsedMB} MB\n`);
}

async function runTest() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Setup Test Data
    const dummyUser = await User.findOne() || await User.create({ username: 'testuser', email: 'test@test.com', password: 'password' });
    const count = await Submission.countDocuments({ missionTitle: 'PerfTest' });

    if (count < 200) { // Keep it small just for safety and speed of the test script, 200 1MB docs = 200MB RAM
        console.log(`Seeding database with 200 large fake submissions... (Currently at ${count})`);
        const submissions = [];
        for (let i = count; i < 200; i++) {
        submissions.push({
            userId: dummyUser._id,
            username: dummyUser.username,
            missionId: 'perf-mission',
            missionTitle: 'PerfTest',
            imageUri: dummyBase64,
            status: 'Pending',
        });
        }
        await Submission.insertMany(submissions);
        console.log('✅ Seeding complete.');
    } else {
        console.log('✅ Test data already exists.');
    }

    console.log('\n--- 🏃 RUNNING BENCHMARKS ---\n');

    // Benchmark 1: The bad query (Fetching everything blindly with heavy payloads)
    await measureQueryTime('Query: Find ALL Pending Submissions (Mimics bad dashboard logic)', async () => {
        // Force evaluation of the cursor to pull data into memory like Express does before JSON.stringify
        const data = await Submission.find({ status: 'Pending' }).lean();
        console.log(`   (Fetched ${data.length} docs)`);
    });

    // Benchmark 2: Just counting by status
    await measureQueryTime('Query: Dashboard Count Pending', async () => {
         await Submission.countDocuments({ status: 'Pending' });
    });

     // Benchmark 3: Just counting by status (Approved)
    await measureQueryTime('Query: Dashboard Count Approved', async () => {
        await Submission.countDocuments({ status: 'Approved' });
   });


  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Test finished.');
  }
}

runTest();
