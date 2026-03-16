# Vulnerability Severity Classification Framework v2

This document defines a deterministic framework for classifying vulnerability severity in blockchain networks.
It resolves ambiguities identified in v1 and introduces a structured scoring system for both Impact and Likelihood.

Severity is determined using two primary factors:

- **Impact** (weight: 0.6) — consequence of a successful exploit
- **Likelihood** (weight: 0.4) — probability and difficulty of exploitation

The final **Severity Score** is calculated from both factors.

---

# Impact Classification

Impact represents the **result of a successful exploit on the network, protocol, or user funds**.

## Critical (Score: 4)

Any of the following conditions:

- Network cannot confirm new transactions (total network shutdown)
- Permanent chain split or state corruption
- Direct theft of user or protocol funds
- Permanent freezing of funds requiring a hard fork
- Arbitrary code execution on nodes or validators
- Validator privilege takeover
- ≥66% of validators halted or unable to produce blocks
- Fix requires a **hard fork**

## High (Score: 3)

Any of the following conditions:

- Temporary freezing of funds (recoverable without hard fork)
- Temporary chain split or network partition
- Consensus failure affecting ≥33% of validators
- Repeated inability to reach consensus
- Severe DoS causing block delay ≥500% of the 24h average block time
- RPC/API crash affecting infrastructure supporting ≥25% of ecosystem usage
- Mempool manipulation forcing nodes to process transactions beyond configured limits

## Medium (Score: 2)

Any of the following conditions:

- Resource exhaustion increasing node CPU/memory/disk usage ≥30%
- Shutdown of ≥10% of network nodes but the network remains operational
- Protocol or smart contract logic bug with no direct funds at risk
- Moderate DoS causing block delay ≥200% of the 24h average block time

## Low (Score: 1)

Any of the following conditions:

- Minor performance degradation (block delay ≥50% but <200%)
- Transaction fee modification outside design parameters
- Minor protocol misconfiguration with limited network impact
- Information disclosure with no direct operational impact

---

# Impact Determination Algorithm

The Impact is determined through an adaptive two-step process: first selecting the impact category, then selecting the specific impact within that category.

## Step 1 — Impact Category Selection

Select the most severe impact category:

| Category | Description | Proceeds to |
|----------|-------------|-------------|
| Funds Loss/Freeze | Vulnerability affects user or protocol funds | Step 2A |
| Network/Chain Integrity | Vulnerability destroys network or chain integrity | Step 2B |
| Validator/Consensus | Vulnerability affects validators or consensus | Step 2C |
| Node/Infrastructure | Vulnerability affects nodes or infrastructure | Step 2D |
| Performance Degradation | Vulnerability causes block production delays | Step 2E |
| Other/Minor | Other or minor impact | Step 2F |

## Step 2A — Funds Impact Detail

| Option | Impact |
|--------|--------|
| Direct theft of user or protocol funds | Critical (4) |
| Permanent freezing of funds (requires hard fork) | Critical (4) |
| Temporary freezing of funds (recoverable without hard fork) | High (3) |

## Step 2B — Network/Chain Integrity Detail

| Option | Impact |
|--------|--------|
| Network cannot confirm new transactions (total shutdown) | Critical (4) |
| Permanent chain split or state corruption | Critical (4) |
| Arbitrary code execution on nodes or validators | Critical (4) |
| Validator privilege takeover | Critical (4) |
| Fix requires a hard fork | Critical (4) |
| Temporary chain split or network partition | High (3) |

## Step 2C — Validator/Consensus Impact Detail

| Option | Impact |
|--------|--------|
| ≥66% of validators affected | Critical (4) |
| 33–65% of validators affected | High (3) |
| <33% validators, repeated consensus failure | High (3) |
| <33% validators, minor impact | Medium (2) |

## Step 2D — Node/Infrastructure Impact Detail

| Option | Impact |
|--------|--------|
| RPC/API crash affecting ≥25% of ecosystem infrastructure | High (3) |
| Mempool manipulation forcing nodes beyond configured limits | High (3) |
| ≥10% of nodes forced to shut down (network operational) | Medium (2) |
| Resource exhaustion (CPU/memory/disk ≥30% increase) | Medium (2) |
| Minor node impact (<10% affected) | Low (1) |

## Step 2E — Performance Degradation Detail

| Option | Impact |
|--------|--------|
| Block delay ≥500% of 24h average | High (3) |
| Block delay 200–499% of 24h average | Medium (2) |
| Block delay 50–199% of 24h average | Low (1) |

## Step 2F — Other Impact Detail

| Option | Impact |
|--------|--------|
| Protocol/smart contract logic bug with no funds at risk | Medium (2) |
| Transaction fee modification outside design parameters | Low (1) |
| Minor protocol misconfiguration | Low (1) |
| Information disclosure / other | Low (1) |

---

# Likelihood Determination

Likelihood is determined through three scored questions. Each answer maps to a value of 1–4.

## L1 — Attacker Profile (Attack Vector + Privileges)

| Option | Score |
|--------|-------|
| Remote, no privileges required (anyone can exploit) | 4 |
| Remote, basic participant privileges required (e.g., submit transactions) | 3 |
| Network/infrastructure access + operator/validator privileges required | 2 |
| Physical/local access + system root privileges required | 1 |

## L2 — Exploit Feasibility (Complexity + Configuration + Reliability)

| Option | Score |
|--------|-------|
| Simple, works on default configuration, succeeds every time | 4 |
| Some coordination needed, common configuration, usually succeeds | 3 |
| Special conditions/configuration required, conditional success | 2 |
| Unrealistic conditions, rare configuration, rarely succeeds | 1 |

## L3 — Blast Radius (Scope)

| Option | Score |
|--------|-------|
| Affects most/all nodes or validators | 4 |
| Affects a substantial portion (>33%) | 3 |
| Affects a small subset of nodes | 2 |
| Affects only the directly targeted node | 1 |

## Likelihood Calculation

```
Likelihood Score = round((L1 + L2 + L3) / 3)
```

Mapping:
- 4 → Critical
- 3 → High
- 2 → Medium
- 1 → Low

---

# Final Severity Calculation

## Severity Score Formula

```
SeverityScore = (0.6 × Impact) + (0.4 × Likelihood)
```

Where Impact ∈ {1, 2, 3, 4} and Likelihood ∈ {1, 2, 3, 4}

## Severity Mapping

| Score Range | Severity |
|-------------|----------|
| 3.50 – 4.00 | Critical |
| 2.50 – 3.49 | High |
| 1.50 – 2.49 | Medium |
| 1.00 – 1.49 | Low |

## Severity Matrix (All Possible Outcomes)

| Impact \ Likelihood | Low (1) | Medium (2) | High (3) | Critical (4) |
|---------------------|---------|------------|----------|---------------|
| **Critical (4)** | 2.8 High | 3.2 High | 3.6 Critical | 4.0 Critical |
| **High (3)** | 2.2 Medium | 2.6 High | 3.0 High | 3.4 High |
| **Medium (2)** | 1.6 Medium | 2.0 Medium | 2.4 Medium | 2.8 High |
| **Low (1)** | 1.0 Low | 1.4 Low | 1.8 Medium | 2.2 Medium |

---

# Override Mechanism

Both Likelihood and final Severity can be manually overridden with a required justification.
When overridden, both the calculated value and the override value (with justification) are recorded.

---

# Changes from v1

1. **Added Step 2A option**: "Temporary freezing of funds → High" (was in Boundary Rules but missing from algorithm)
2. **Fixed Node Impact threshold**: ≥10% node shutdown → Medium (was Low in algorithm, Medium in classification table)
3. **Added catch-all Step 2F**: Covers items in classification table but missing from algorithm (RPC/API crash, mempool manipulation, logic bugs, etc.)
4. **Added all Critical items to Step 2B**: Network shutdown, chain split, arbitrary code execution, validator takeover (were in classification but not in algorithm)
5. **Structured Likelihood scoring**: Converted subjective characteristics into 3 scored questions with deterministic calculation
6. **Added Override mechanism**: Both Likelihood and final Severity can be manually overridden with justification
7. **Adopted adaptive two-step Impact determination**: Category selection → Detail selection (always exactly 2 questions)
