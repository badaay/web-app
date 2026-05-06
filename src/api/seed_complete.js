/**
 * seed_complete.js — Unified Seeding Orchestrator
 * ============================================================
 * Runs data seeding (seed_data.js) followed by auth seeding (seed_auth.js).
 * 
 * Usage: node src/api/seed_complete.js
 */

const { main: seedData } = require('./seed_data');
const { main: seedAuth } = require('./seed_auth');

async function run() {
    console.log('================================================');
    console.log('  SIFATIH TOTAL SYSTEM SEED');
    console.log('================================================');
    
    try {
        // Step 1: Seed Master & Transactional Data
        await seedData();
        
        console.log('');
        
        // Step 2: Seed Auth Users & Profiles
        await seedAuth();
        
        console.log('');
        console.log('================================================');
        console.log('  🎉 SYSTEM SEEDING COMPLETE');
        console.log('================================================');
    } catch (err) {
        console.error('Fatal error during seeding orchestrator:', err.message);
        process.exit(1);
    }
}

run();
