# Severify

Blockchain vulnerability severity classifier. A deterministic, wizard-based tool that calculates vulnerability severity from **Impact** and **Likelihood** scores.

## How It Works

```
SeverityScore = (0.4 x Impact) + (0.6 x Likelihood)
```

1. **Impact** (2 steps) — Select impact category, then specific impact detail (score 1-4)
2. **Likelihood** (3 questions) — Attacker profile, exploit feasibility, blast radius (averaged, score 1-4)
3. **Result** — Final severity: Critical / High / Medium / Low

Both Impact and Likelihood can be manually overridden with an optional justification.

## Usage

Open `index.html` in a browser. No build step required.

Results can be exported as Markdown, JSON, or a shareable URL that preserves all selections and overrides.

## Project Structure

```
index.html          — Single-page app
js/
  framework.js      — Scoring data, thresholds, questions
  engine.js         — Pure calculation logic (no DOM)
  wizard.js         — UI controller, step navigation, overrides
  main.js           — Entry point
css/
  styles.css        — Styles
test/
  e2e.test.js       — E2E tests (jsdom)
```

## Framework

See [framework-2.md](framework-2.md) for the full severity classification framework, scoring methodology, severity matrix, and override mechanism.

## Tests

```sh
npm install
node test/e2e.test.js
```
