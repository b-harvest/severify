# Vulnerability Severity Classification Framework (Draft)

This document defines a deterministic framework for classifying vulnerability severity in blockchain networks.

Severity is determined using two primary factors:

- **Impact** — consequence of a successful exploit
- **Likelihood** — probability and difficulty of exploitation

The final **Severity Score** is calculated from both factors.

---

# Impact Classification

Impact represents the **result of a successful exploit on the network, protocol, or user funds**.

## Critical

Any of the following conditions:

- Network cannot confirm new transactions (total network shutdown)
- Permanent chain split or state corruption
- Direct theft of user or protocol funds
- Permanent freezing of funds requiring a hard fork
- Arbitrary code execution on nodes or validators
- Validator privilege takeover
- ≥66% of validators halted or unable to produce blocks
- Fix requires a **hard fork**

---

## High

Any of the following conditions:

- Temporary chain split or network partition
- Consensus failure affecting ≥33% of validators
- Repeated inability to reach consensus
- Severe DoS causing block delay ≥500% of the 24h average block time
- RPC/API crash affecting infrastructure supporting ≥25% of ecosystem usage
- Mempool manipulation forcing nodes to process transactions beyond configured limits

---

## Medium

Any of the following conditions:

- Resource exhaustion increasing node CPU/memory/disk usage ≥30%
- Shutdown of ≥10% of network nodes but the network remains operational
- Protocol or smart contract logic bug with no direct funds at risk
- Moderate DoS causing block delay ≥200% of the 24h average block time

---

## Low

Any of the following conditions:

- Minor performance degradation (block delay ≥50%)
- Transaction fee modification outside design parameters
- Minor protocol misconfiguration with limited network impact

---

# Severity Boundary Rules

These rules minimize ambiguity when determining severity.

## Funds Safety Rule

- Direct theft of funds → **Critical**
- Permanent freezing of funds → **Critical**
- Temporary freezing of funds → **High**

---

## Recovery Rule

- Exploit requires **hard fork** to fix → **Critical**
- Recoverable without hard fork → **High or lower**

---

## Validator Impact Rule

| Validator Impact | Severity |
| --- | --- |
| ≥66% validators affected | Critical |
| ≥33% validators affected | High |
| ≥10% nodes affected | Medium |

---

## Performance Degradation Rule

| Block Delay (vs 24h average) | Severity |
| --- | --- |
| ≥500% | High |
| ≥200% | Medium |
| ≥50% | Low |

---

# Impact Determination Algorithm

Use the following algorithm to determine the **Impact level**.

## Step 1 — Funds Loss

If the vulnerability allows direct theft of funds or permanent freezing of funds:

Impact = Critical

Otherwise continue.

---

## Step 2 — Recovery Requirement

If fixing the vulnerability requires a hard fork:

Impact = Critical

Otherwise continue.

---

## Step 3 — Validator Impact

If validators_affected ≥ 66%

→ Impact = Critical

Else if validators_affected ≥ 33%

→ Impact = High

Otherwise continue.

---

## Step 4 — Node Impact

If nodes_affected ≥ 30%

→ Impact = Medium

Else if nodes_affected ≥ 10%

→ Impact = Low

Otherwise continue.

---

## Step 5 — Performance Degradation

If block_delay ≥ 500%

→ Impact = High

Else if block_delay ≥ 200%

→ Impact = Medium

Else if block_delay ≥ 50%

→ Impact = Low

---

# Likelihood Table

Likelihood represents the **difficulty and prerequisites required to exploit the vulnerability**.

## Critical Likelihood

Characteristics:

- Remote exploit possible
- No privileges required
- Low attack complexity
- Works under default configuration
- Deterministic and reliable exploit
- Works across most nodes or validators

Examples:

- malformed transaction crashes validators
- unauthenticated RPC request halts nodes

---

## High Likelihood

Characteristics:

- Minimal privileges required
- Moderate attack complexity
- Exploit works under common network conditions
- Requires timing or coordination but feasible

Examples:

- mempool manipulation
- validator message ordering exploit

---

## Medium Likelihood

Characteristics:

- Requires specific configuration or environment
- Requires validator privileges or governance interaction
- Requires uncommon network state
- Exploit reliability limited

Examples:

- exploit triggers only under specific parameter ranges
- validator collusion required

---

## Low Likelihood

Characteristics:

- Requires privileged system access
- Requires unrealistic network conditions
- Requires manual node configuration changes
- Requires non-default environment

Examples:

- local node filesystem access required
- manual validator configuration manipulation

---

# Final Model (Severity Formula)

Severity is derived from both **Impact** and **Likelihood**.

Impact is weighted more heavily because the **result of exploitation is the primary risk factor**.

## Severity Score Formula

SeverityScore = (0.6 × Impact) + (0.4 × Likelihood)

Where:

Impact ∈ {1,2,3,4}

Likelihood ∈ {1,2,3,4}

---

## Severity Mapping

| Score Range | Severity |
| --- | --- |
| 3.5 – 4.0 | Critical |
| 2.5 – 3.49 | High |
| 1.5 – 2.49 | Medium |
| 1.0 – 1.49 | Low |

---

혹은 [**판정 매트릭스(기본)**](https://www.notion.so/322c1352439b80f6aeefc0022198056e?pvs=21) 적용 고려
