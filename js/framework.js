/**
 * Severify Framework Data v2
 * All questions, options, score mappings, and thresholds.
 */

const SEVERITY_LEVELS = {
  CRITICAL: { value: 4, label: 'Critical', color: '#DC2626' },
  HIGH:     { value: 3, label: 'High',     color: '#EA580C' },
  MEDIUM:   { value: 2, label: 'Medium',   color: '#CA8A04' },
  LOW:      { value: 1, label: 'Low',      color: '#2563EB' },
};

const SEVERITY_RANGES = [
  { min: 3.50, max: 4.00, level: SEVERITY_LEVELS.CRITICAL },
  { min: 2.50, max: 3.49, level: SEVERITY_LEVELS.HIGH },
  { min: 1.50, max: 2.49, level: SEVERITY_LEVELS.MEDIUM },
  { min: 1.00, max: 1.49, level: SEVERITY_LEVELS.LOW },
];

const IMPACT_WEIGHT = 0.6;
const LIKELIHOOD_WEIGHT = 0.4;

// Impact Step 1: Category selection
const IMPACT_CATEGORIES = [
  { id: 'funds',       label: 'Funds Loss / Freeze',          icon: '💰', description: 'Vulnerability affects user or protocol funds' },
  { id: 'network',     label: 'Network / Chain Integrity',    icon: '🔗', description: 'Vulnerability destroys network or chain integrity' },
  { id: 'validator',   label: 'Validator / Consensus',        icon: '⚡', description: 'Vulnerability affects validators or consensus mechanism' },
  { id: 'node',        label: 'Node / Infrastructure',        icon: '🖥️', description: 'Vulnerability affects nodes or infrastructure services' },
  { id: 'performance', label: 'Performance Degradation',      icon: '📉', description: 'Vulnerability causes block production delays' },
  { id: 'other',       label: 'Other / Minor',                icon: '📋', description: 'Other or minor impact not covered above' },
];

// Impact Step 2: Detail options per category
const IMPACT_DETAILS = {
  funds: {
    question: 'What is the impact on funds?',
    options: [
      { label: 'Direct theft of user or protocol funds',                    impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Permanent freezing of funds (requires hard fork)',          impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Temporary freezing of funds (recoverable without hard fork)', impact: SEVERITY_LEVELS.HIGH },
    ],
  },
  network: {
    question: 'What level of network impact?',
    options: [
      { label: 'Network cannot confirm new transactions (total shutdown)',  impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Permanent chain split or state corruption',                impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Arbitrary code execution on nodes or validators',          impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Validator privilege takeover',                             impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Fix requires a hard fork',                                 impact: SEVERITY_LEVELS.CRITICAL },
      { label: 'Temporary chain split or network partition',               impact: SEVERITY_LEVELS.HIGH },
    ],
  },
  validator: {
    question: 'What percentage of validators are affected?',
    options: [
      { label: '≥66% of validators affected',                     impact: SEVERITY_LEVELS.CRITICAL },
      { label: '33–65% of validators affected',                    impact: SEVERITY_LEVELS.HIGH },
      { label: '<33% validators, repeated consensus failure',      impact: SEVERITY_LEVELS.HIGH },
      { label: '<33% validators, minor impact',                    impact: SEVERITY_LEVELS.MEDIUM },
    ],
  },
  node: {
    question: 'What level of node/infrastructure impact?',
    options: [
      { label: 'RPC/API crash affecting ≥25% of ecosystem infrastructure',     impact: SEVERITY_LEVELS.HIGH },
      { label: 'Mempool manipulation forcing nodes beyond configured limits',   impact: SEVERITY_LEVELS.HIGH },
      { label: '≥10% of nodes forced to shut down (network operational)',       impact: SEVERITY_LEVELS.MEDIUM },
      { label: 'Resource exhaustion (CPU/memory/disk ≥30% increase)',           impact: SEVERITY_LEVELS.MEDIUM },
      { label: 'Minor node impact (<10% affected)',                             impact: SEVERITY_LEVELS.LOW },
    ],
  },
  performance: {
    question: 'What is the block production delay relative to the 24h average?',
    options: [
      { label: '≥500% (blocks take 5x+ longer)',    impact: SEVERITY_LEVELS.HIGH },
      { label: '200–499% (blocks take 2–5x longer)', impact: SEVERITY_LEVELS.MEDIUM },
      { label: '50–199% (blocks take 1.5–2x longer)', impact: SEVERITY_LEVELS.LOW },
    ],
  },
  other: {
    question: 'Select the applicable impact:',
    options: [
      { label: 'Protocol/smart contract logic bug with no funds at risk', impact: SEVERITY_LEVELS.MEDIUM },
      { label: 'Transaction fee modification outside design parameters',  impact: SEVERITY_LEVELS.LOW },
      { label: 'Minor protocol misconfiguration',                         impact: SEVERITY_LEVELS.LOW },
      { label: 'Information disclosure / other',                          impact: SEVERITY_LEVELS.LOW },
    ],
  },
};

// Likelihood questions
const LIKELIHOOD_QUESTIONS = [
  {
    id: 'attacker_profile',
    title: 'Attacker Profile',
    question: 'What level of access does the attacker need?',
    description: 'Attack vector + required privileges',
    options: [
      { label: 'Remote, no privileges required (anyone can exploit)',                    score: 4 },
      { label: 'Remote, basic participant privileges (e.g., submit transactions)',        score: 3 },
      { label: 'Network/infrastructure access + operator/validator privileges required',  score: 2 },
      { label: 'Physical/local access + system root privileges required',                 score: 1 },
    ],
  },
  {
    id: 'exploit_feasibility',
    title: 'Exploit Feasibility',
    question: 'How easy is the exploit to execute?',
    description: 'Complexity + configuration + reliability',
    options: [
      { label: 'Simple, default configuration, succeeds every time',                score: 4 },
      { label: 'Some coordination needed, common configuration, usually succeeds',   score: 3 },
      { label: 'Special conditions/configuration required, conditional success',      score: 2 },
      { label: 'Unrealistic conditions, rare configuration, rarely succeeds',         score: 1 },
    ],
  },
  {
    id: 'blast_radius',
    title: 'Blast Radius',
    question: 'How many nodes or validators are affected by a single exploit?',
    description: 'Scope of impact from one attack attempt',
    options: [
      { label: 'Affects most/all nodes or validators',       score: 4 },
      { label: 'Affects a substantial portion (>33%)',        score: 3 },
      { label: 'Affects a small subset of nodes',             score: 2 },
      { label: 'Affects only the directly targeted node',     score: 1 },
    ],
  },
];

// 4x4 severity matrix (precomputed)
const SEVERITY_MATRIX = [
  // Impact Low(1), Medium(2), High(3), Critical(4) — rows
  // Likelihood Low(1), Medium(2), High(3), Critical(4) — columns
  [1.0, 1.4, 1.8, 2.2],  // Impact Low
  [1.6, 2.0, 2.4, 2.8],  // Impact Medium
  [2.2, 2.6, 3.0, 3.4],  // Impact High
  [2.8, 3.2, 3.6, 4.0],  // Impact Critical
];
