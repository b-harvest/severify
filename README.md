# Severify

Deterministic severity classifier for blockchain vulnerabilities.

**Demo/Use: https://b-harvest.github.io/severify**

## How It Works

```
SeverityScore = (0.4 x Impact) + (0.6 x Likelihood)
```

1. **Impact** — Select impact category and specific detail (score 1-4)
2. **Likelihood** — Answer 3 questions: attacker profile, exploit feasibility, blast radius (score 1-4)
3. **Result** — Final severity: Critical / High / Medium / Low

Both Impact and Likelihood can be manually overridden with an optional justification.

Assessment results can be shared via **Shareable URL** 
The link encodes all selections, overrides, and justifications so anyone opening it sees the full assessment.
e.g., [link](https://b-harvest.github.io/severify/?ic=network&id=1&l1=2&l2=1&l3=2&lo=1&lor=Gov%2FPermission+Required)

## Framework

For the complete scoring methodology, severity matrix, impact/likelihood classification tables, and override mechanism, see **[framework-2.md](framework-2.md)**.

---

<details>
<summary>Development</summary>

```
index.html, css/, js/ — Static single-page app (no build step)
test/e2e.test.js      — E2E tests (jsdom)
```

```sh
npm install && node test/e2e.test.js
```

</details>
