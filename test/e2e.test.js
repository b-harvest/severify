/**
 * Severify E2E Tests
 * Tests the full wizard workflow using jsdom.
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

function loadApp(urlSearch = '') {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  // Strip external script tags (we'll eval them manually)
  const cleanHtml = html.replace(/<script src="js\/[^"]+"><\/script>\s*/g, '');

  const dom = new JSDOM(cleanHtml, {
    url: `http://localhost${urlSearch}`,
    runScripts: 'dangerously',
    pretendToBeVisual: true,
  });

  const { window } = dom;
  const { document } = window;

  // Mock clipboard API
  let clipboardText = '';
  window.navigator.clipboard = {
    writeText: (text) => { clipboardText = text; return Promise.resolve(); },
  };

  // Combine all scripts and eval as one block so const declarations share scope
  const jsFiles = ['framework.js', 'engine.js', 'wizard.js', 'main.js'];
  const combinedCode = jsFiles
    .map(f => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'))
    .join('\n;\n');
  window.eval(combinedCode);

  // Trigger DOMContentLoaded
  const event = new window.Event('DOMContentLoaded');
  document.dispatchEvent(event);

  return { dom, window, document, getClipboard: () => clipboardText };
}

function click(document, selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  el.click();
  return el;
}

function isVisible(document, id) {
  const el = document.getElementById(id);
  return el && el.classList.contains('active');
}

function isHidden(document, id) {
  const el = document.getElementById(id);
  return el && el.classList.contains('hidden');
}

// === Test Runner ===
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
    console.error(`  FAIL: ${message}`);
  }
}

// === TEST 1: Full happy-path workflow ===
console.log('\n--- Test 1: Full happy-path workflow (Step 0 → 5) ---');
{
  const { document, window } = loadApp();

  // Step 0: should start at step 0
  assert(isVisible(document, 'step-0'), 'Step 0 should be visible on load');

  // Impact categories should be rendered
  const categories = document.querySelectorAll('#impactCategories .option-card');
  assert(categories.length === 6, `Should render 6 impact categories, got ${categories.length}`);

  // Click "Funds Loss / Freeze" category
  click(document, '#impactCategories .option-card[data-category="funds"]');
  assert(isVisible(document, 'step-1'), 'Step 1 should be visible after selecting category');
  assert(!isVisible(document, 'step-0'), 'Step 0 should not be visible');

  // Step 1: Impact detail options should be rendered
  const details = document.querySelectorAll('#impactDetails .option-item');
  assert(details.length === 3, `Funds category should have 3 detail options, got ${details.length}`);

  // Click first detail "Direct theft of user or protocol funds"
  click(document, '#impactDetails .option-item[data-index="0"]');
  assert(isVisible(document, 'step-2'), 'Step 2 should be visible after selecting detail');

  // Step 2: Likelihood Q1 options should be rendered
  const q1Options = document.querySelectorAll('#likelihoodQ1 .option-item');
  assert(q1Options.length === 4, `Q1 should have 4 options, got ${q1Options.length}`);

  // Click Q1: "Remote, no privileges required" (score=4)
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  assert(isVisible(document, 'step-3'), 'Step 3 should be visible after Q1');

  // Step 3: Likelihood Q2
  const q2Options = document.querySelectorAll('#likelihoodQ2 .option-item');
  assert(q2Options.length === 4, `Q2 should have 4 options, got ${q2Options.length}`);

  // Click Q2: "Simple, default configuration..." (score=4)
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  assert(isVisible(document, 'step-4'), 'Step 4 should be visible after Q2');

  // Step 4: Likelihood Q3
  const q3Options = document.querySelectorAll('#likelihoodQ3 .option-item');
  assert(q3Options.length === 4, `Q3 should have 4 options, got ${q3Options.length}`);

  // Click Q3: "Affects most/all nodes" (score=4)
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');
  assert(isVisible(document, 'step-5'), 'Step 5 (result) should be visible after Q3');

  // Verify result
  const severityLabel = document.getElementById('severityLabel').textContent;
  assert(severityLabel === 'Critical', `Severity should be Critical, got "${severityLabel}"`);

  const severityScore = document.getElementById('severityScore').textContent;
  // Impact=4(Critical), Likelihood=4(Critical), Score = 0.4*4 + 0.6*4 = 4.0
  assert(severityScore === 'Score: 4', `Score should be "Score: 4", got "${severityScore}"`);

  // Score breakdown badges
  const impactBadge = document.getElementById('impactScoreBadge').textContent;
  assert(impactBadge.includes('4') && impactBadge.includes('Critical'), `Impact badge: "${impactBadge}"`);

  const lhBadge = document.getElementById('likelihoodScoreBadge').textContent;
  assert(lhBadge.includes('4') && lhBadge.includes('Critical'), `Likelihood badge: "${lhBadge}"`);

  // Detail summary
  assert(document.getElementById('resultImpactCategory').textContent !== '', 'Impact category should be filled');
  assert(document.getElementById('resultImpactDetail').textContent !== '', 'Impact detail should be filled');
  assert(document.getElementById('resultL1').textContent === '4/4', 'L1 should show 4/4');
  assert(document.getElementById('resultL2').textContent === '4/4', 'L2 should show 4/4');
  assert(document.getElementById('resultL3').textContent === '4/4', 'L3 should show 4/4');

  // Matrix highlight
  const highlighted = document.querySelector('.severity-matrix td.highlight');
  assert(highlighted !== null, 'A matrix cell should be highlighted');
  assert(highlighted.dataset.i === '3' && highlighted.dataset.l === '3', 'Highlighted cell should be i=3 l=3');
}

// === TEST 2: Medium severity path ===
console.log('\n--- Test 2: Medium severity path ---');
{
  const { document, window } = loadApp();

  // Category: other
  click(document, '#impactCategories .option-card[data-category="other"]');
  assert(isVisible(document, 'step-1'), 'Step 1 visible after other category');

  // Detail: "Minor protocol misconfiguration" (Low = 1)
  click(document, '#impactDetails .option-item[data-index="2"]');
  assert(isVisible(document, 'step-2'), 'Step 2 visible');

  // Q1: score=2
  click(document, '#likelihoodQ1 .option-item[data-score="2"]');
  // Q2: score=3
  click(document, '#likelihoodQ2 .option-item[data-score="3"]');
  // Q3: score=1
  click(document, '#likelihoodQ3 .option-item[data-score="1"]');
  assert(isVisible(document, 'step-5'), 'Step 5 visible');

  // Impact=1, Likelihood=round((2+3+1)/3)=round(2)=2
  // Score = 0.4*1 + 0.6*2 = 1.6 → Medium
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'Medium', `Should be Medium, got "${label}"`);
  const score = document.getElementById('severityScore').textContent;
  assert(score === 'Score: 1.6', `Should be "Score: 1.6", got "${score}"`);
}

// === TEST 3: Back navigation ===
console.log('\n--- Test 3: Back navigation ---');
{
  const { document } = loadApp();

  click(document, '#impactCategories .option-card[data-category="network"]');
  assert(isVisible(document, 'step-1'), 'At step 1');

  click(document, '#backToCategory');
  assert(isVisible(document, 'step-0'), 'Back to step 0');

  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  assert(isVisible(document, 'step-2'), 'At step 2');

  click(document, '#backToDetail');
  assert(isVisible(document, 'step-1'), 'Back to step 1');

  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="3"]');
  assert(isVisible(document, 'step-3'), 'At step 3');

  click(document, '#backToL1');
  assert(isVisible(document, 'step-2'), 'Back to step 2');

  click(document, '#likelihoodQ1 .option-item[data-score="3"]');
  click(document, '#likelihoodQ2 .option-item[data-score="3"]');
  assert(isVisible(document, 'step-4'), 'At step 4');

  click(document, '#backToL2');
  assert(isVisible(document, 'step-3'), 'Back to step 3');

  click(document, '#likelihoodQ2 .option-item[data-score="3"]');
  click(document, '#likelihoodQ3 .option-item[data-score="3"]');
  assert(isVisible(document, 'step-5'), 'At step 5');

  click(document, '#backToL3');
  assert(isVisible(document, 'step-4'), 'Back to step 4 from result');
}

// === TEST 4: Override Impact ===
console.log('\n--- Test 4: Override Impact ---');
{
  const { document, window } = loadApp();

  // Run through to result: funds/theft, all likelihood=4 → Critical 4.0
  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');
  assert(isVisible(document, 'step-5'), 'At result');

  // Enable Impact Override
  const impactToggle = document.getElementById('impactOverrideToggle');
  impactToggle.checked = true;
  impactToggle.dispatchEvent(new window.Event('change'));
  assert(!isHidden(document, 'impactOverrideControls'), 'Impact override controls should be visible');

  // Override Impact to Low (1)
  document.getElementById('impactOverrideSelect').value = '1';
  click(document, '#applyOverride');

  // New score: 0.4*1 + 0.6*4 = 2.8 → High
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'High', `After impact override to 1, severity should be High, got "${label}"`);
  const score = document.getElementById('severityScore').textContent;
  assert(score === 'Score: 2.8', `Score should be 2.8, got "${score}"`);

  // Impact badge should reflect override
  const impactBadge = document.getElementById('impactScoreBadge').textContent;
  assert(impactBadge.includes('1') && impactBadge.includes('Low'), `Impact badge should show Low(1), got "${impactBadge}"`);

  // Override info should be visible
  assert(!isHidden(document, 'impactOverrideInfo'), 'Impact override info should be visible');
}

// === TEST 5: Override Likelihood ===
console.log('\n--- Test 5: Override Likelihood ---');
{
  const { document, window } = loadApp();

  // Run through: funds/theft (Critical=4), all likelihood=4
  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');

  // Override likelihood to Low (1)
  const lhToggle = document.getElementById('likelihoodOverrideToggle');
  lhToggle.checked = true;
  lhToggle.dispatchEvent(new window.Event('change'));

  document.getElementById('likelihoodOverrideSelect').value = '1';
  click(document, '#applyOverride');

  // Score: 0.4*4 + 0.6*1 = 2.2 → Medium
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'Medium', `After likelihood override to 1, severity should be Medium, got "${label}"`);
  const score = document.getElementById('severityScore').textContent;
  assert(score === 'Score: 2.2', `Score should be 2.2, got "${score}"`);
}

// === TEST 6: Both overrides ===
console.log('\n--- Test 6: Both Impact and Likelihood override ---');
{
  const { document, window } = loadApp();

  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');

  // Override both to Low (1)
  const iToggle = document.getElementById('impactOverrideToggle');
  iToggle.checked = true;
  iToggle.dispatchEvent(new window.Event('change'));
  document.getElementById('impactOverrideSelect').value = '1';

  const lToggle = document.getElementById('likelihoodOverrideToggle');
  lToggle.checked = true;
  lToggle.dispatchEvent(new window.Event('change'));
  document.getElementById('likelihoodOverrideSelect').value = '1';

  click(document, '#applyOverride');

  // Score: 0.4*1 + 0.6*1 = 1.0 → Low
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'Low', `Both override to 1: should be Low, got "${label}"`);
  const score = document.getElementById('severityScore').textContent;
  assert(score === 'Score: 1', `Score should be 1, got "${score}"`);
}

// === TEST 7: URL restore with overrides ===
console.log('\n--- Test 7: URL restore with overrides ---');
{
  const { document, window } = loadApp('?ic=funds&id=0&l1=4&l2=4&l3=4&io=2&ior=test+reason&lo=1&lor=lh+reason');

  // Should jump straight to step 5
  assert(isVisible(document, 'step-5'), 'Should restore to step 5');

  // Impact override: 2, Likelihood override: 1
  // Score: 0.4*2 + 0.6*1 = 1.4 → Low
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'Low', `URL restore severity should be Low, got "${label}"`);

  // Override UI should be populated
  assert(document.getElementById('impactOverrideToggle').checked, 'Impact override toggle should be checked');
  assert(document.getElementById('likelihoodOverrideToggle').checked, 'Likelihood override toggle should be checked');
  assert(document.getElementById('impactOverrideSelect').value === '2', 'Impact override select should be 2');
  assert(document.getElementById('likelihoodOverrideSelect').value === '1', 'Likelihood override select should be 1');
  assert(document.getElementById('impactOverrideReason').value === 'test reason', 'Impact reason should be restored');
  assert(document.getElementById('likelihoodOverrideReason').value === 'lh reason', 'Likelihood reason should be restored');

  // Override info display should be visible
  assert(!isHidden(document, 'impactOverrideInfo'), 'Impact override info visible');
  assert(!isHidden(document, 'likelihoodOverrideInfo'), 'Likelihood override info visible');
  const iInfoVal = document.getElementById('impactOverrideInfoValue').textContent;
  assert(iInfoVal.includes('Medium') && iInfoVal.includes('2'), `Impact info should show Medium(2), got "${iInfoVal}"`);
}

// === TEST 8: Restart resets everything ===
console.log('\n--- Test 8: Restart ---');
{
  const { document, window } = loadApp();

  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');
  assert(isVisible(document, 'step-5'), 'At result');

  click(document, '#restartBtn');
  assert(isVisible(document, 'step-0'), 'After restart, should be at step 0');

  // Verify UI is reset
  assert(!document.getElementById('impactOverrideToggle').checked, 'Impact override toggle should be unchecked');
  assert(!document.getElementById('likelihoodOverrideToggle').checked, 'Likelihood override toggle should be unchecked');
  assert(document.getElementById('impactOverrideReason').value === '', 'Impact reason should be empty');
  assert(document.getElementById('likelihoodOverrideReason').value === '', 'Likelihood reason should be empty');
}

// === TEST 9: All impact categories traversable ===
console.log('\n--- Test 9: All 6 impact categories traversable ---');
{
  const cats = ['funds', 'network', 'validator', 'node', 'performance', 'other'];
  for (const cat of cats) {
    const { document } = loadApp();

    click(document, `#impactCategories .option-card[data-category="${cat}"]`);
    assert(isVisible(document, 'step-1'), `Category "${cat}": step 1 visible`);

    const details = document.querySelectorAll('#impactDetails .option-item');
    assert(details.length > 0, `Category "${cat}": has detail options (${details.length})`);

    // Click first detail
    click(document, '#impactDetails .option-item[data-index="0"]');
    assert(isVisible(document, 'step-2'), `Category "${cat}": step 2 visible`);

    // Complete likelihood
    click(document, '#likelihoodQ1 .option-item[data-score="3"]');
    click(document, '#likelihoodQ2 .option-item[data-score="3"]');
    click(document, '#likelihoodQ3 .option-item[data-score="3"]');
    assert(isVisible(document, 'step-5'), `Category "${cat}": result visible`);

    const label = document.getElementById('severityLabel').textContent;
    assert(['Critical', 'High', 'Medium', 'Low'].includes(label),
      `Category "${cat}": severity label should be valid, got "${label}"`);
  }
}

// === TEST 10: Score formula verification via matrix values ===
console.log('\n--- Test 10: Score formula verification (matrix values) ---');
{
  const { document } = loadApp();
  // Verify all 16 matrix cells match the formula: 0.4 * impact + 0.6 * likelihood
  for (let i = 0; i < 4; i++) {
    for (let l = 0; l < 4; l++) {
      const cell = document.querySelector(`.severity-matrix td[data-i="${i}"][data-l="${l}"]`);
      assert(cell !== null, `Matrix cell [${i}][${l}] should exist`);
      const cellScore = parseFloat(cell.textContent);
      const expected = Math.round((0.4 * (i + 1) + 0.6 * (l + 1)) * 100) / 100;
      assert(cellScore === expected,
        `Matrix[${i}][${l}]: expected ${expected}, got ${cellScore}`);
    }
  }
}

// === TEST 11: Justification is optional ===
console.log('\n--- Test 11: Override without justification ---');
{
  const { document, window } = loadApp();

  click(document, '#impactCategories .option-card[data-category="funds"]');
  click(document, '#impactDetails .option-item[data-index="0"]');
  click(document, '#likelihoodQ1 .option-item[data-score="4"]');
  click(document, '#likelihoodQ2 .option-item[data-score="4"]');
  click(document, '#likelihoodQ3 .option-item[data-score="4"]');

  // Override without justification
  const iToggle = document.getElementById('impactOverrideToggle');
  iToggle.checked = true;
  iToggle.dispatchEvent(new window.Event('change'));
  document.getElementById('impactOverrideSelect').value = '2';
  // Leave justification empty

  click(document, '#applyOverride');

  // Should still work - 0.4*2 + 0.6*4 = 3.2 → High
  const label = document.getElementById('severityLabel').textContent;
  assert(label === 'High', `Override without justification should work, got "${label}"`);
}

// === SUMMARY ===
console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log(`========================================`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
