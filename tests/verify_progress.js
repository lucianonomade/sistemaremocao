const { calculateListProgress, calculateOrganProgress } = require('../utils/progress.ts');

// Mock types for TS compatibility in JS
const OrganStatus = {
    serasa: false,
    boaVista: false,
    spc: false,
    cenprotNacional: false,
    cenprotSP: false
};

// Simulation Helper
function simulate(startDateStr, label) {
    console.log(`\n--- Simulation: ${label} (Start: ${startDateStr}) ---`);

    const organs = { ...OrganStatus };
    const organKeys = ['serasa', 'boaVista', 'spc', 'cenprotNacional', 'cenprotSP'];

    console.log('Organ Progress Breakdown:');
    organKeys.forEach((key, index) => {
        const p = calculateOrganProgress(startDateStr, false, index);
        console.log(`  ${key}: ${p}%`);
    });

    const total = calculateListProgress(startDateStr, false, organs);
    console.log(`> Overall List Progress: ${total}%`);

    if (total > 97) console.error('FAIL: Progress exceeded 97% automatically!');
    if (total < 0) console.error('FAIL: Progress is negative!');
}

// 1. Trivial Case: Started today
simulate(new Date().toISOString(), "Started Today");

// 2. Short Term: Started 5 days ago (verify business days)
const d5 = new Date();
d5.setDate(d5.getDate() - 5);
simulate(d5.toISOString(), "Started 5 Days Ago");

// 3. Medium Term: Started 20 days ago (Should be well underway)
const d20 = new Date();
d20.setDate(d20.getDate() - 20);
simulate(d20.toISOString(), "Started 20 Days Ago");

// 4. Long Term: Started 100 days ago (Should be capped at 97%)
const d100 = new Date();
d100.setDate(d100.getDate() - 100);
simulate(d100.toISOString(), "Started 100 Days Ago");

console.log('\n--- Verification Complete ---');
