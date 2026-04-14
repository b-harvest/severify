/**
 * Severify Wizard UI Controller
 * Handles step navigation, rendering, result display, and export.
 */

const Wizard = {
  currentStep: 0,
  totalSteps: 6,

  // State
  state: {
    impactCategoryId: null,
    impactDetailIndex: null,
    impactResult: null,
    likelihoodScores: [null, null, null],
    likelihoodResult: null,
    severityResult: null,
    impactOverride: null,
    likelihoodOverride: null,
  },

  init() {
    this.renderImpactCategories();
    this.renderLikelihoodQuestions();
    this.bindEvents();
    this.updateProgress();
  },

  // === Rendering ===

  renderImpactCategories() {
    const container = document.getElementById('impactCategories');
    container.innerHTML = IMPACT_CATEGORIES.map((cat, i) => `
      <div class="option-card" data-category="${cat.id}">
        <div class="icon">${cat.icon}</div>
        <div class="label">${cat.label}</div>
        <div class="desc">${cat.description}</div>
      </div>
    `).join('');
  },

  renderImpactDetails(categoryId) {
    const data = IMPACT_DETAILS[categoryId];
    document.getElementById('impactDetailQuestion').textContent = data.question;
    const container = document.getElementById('impactDetails');
    container.innerHTML = data.options.map((opt, i) => `
      <div class="option-item" data-index="${i}">
        <div class="option-indicator"></div>
        <span class="option-text">${opt.label}</span>
        <span class="option-score bg-${opt.impact.label.toLowerCase()}">${opt.impact.label}</span>
      </div>
    `).join('');
  },

  renderLikelihoodQuestions() {
    LIKELIHOOD_QUESTIONS.forEach((q, qi) => {
      const container = document.getElementById(`likelihoodQ${qi + 1}`);
      container.innerHTML = q.options.map((opt, oi) => `
        <div class="option-item" data-question="${qi}" data-score="${opt.score}">
          <div class="option-indicator"></div>
          <span class="option-text">${opt.label}</span>
          <span class="option-score" style="background: var(--accent-bg); color: var(--accent);">${opt.score}/4</span>
        </div>
      `).join('');
    });
  },

  renderResult() {
    const { impactResult, likelihoodResult, severityResult } = this.state;

    // Determine effective values (with overrides)
    const effectiveImpact = this.state.impactOverride || impactResult;
    const effectiveLikelihood = this.state.likelihoodOverride || likelihoodResult;
    const effectiveSeverity = SeverifyEngine.calculateSeverity(effectiveImpact.score, effectiveLikelihood.score);

    // Severity badge
    const badge = document.getElementById('severityBadge');
    const levelClass = `bg-${effectiveSeverity.level.label.toLowerCase()}`;
    badge.className = `severity-badge ${levelClass}`;
    document.getElementById('severityLabel').textContent = effectiveSeverity.level.label;

    const displayScore = effectiveSeverity.score;
    document.getElementById('severityScore').textContent = `Score: ${displayScore}`;

    // Score breakdown
    this.renderScoreBadge('impactScoreBadge', effectiveImpact.score, effectiveImpact.level);
    this.renderScoreBadge('likelihoodScoreBadge', effectiveLikelihood.score, effectiveLikelihood.level);
    this.renderScoreBadge('finalScoreBadge', displayScore, effectiveSeverity.level);

    // Detail summary
    document.getElementById('resultImpactCategory').textContent = impactResult.category.label;
    document.getElementById('resultImpactDetail').textContent = impactResult.detail.label;

    const lqLabels = LIKELIHOOD_QUESTIONS.map((q, i) => {
      const score = this.state.likelihoodScores[i];
      const opt = q.options.find(o => o.score === score);
      return `${score}/4`;
    });
    document.getElementById('resultL1').textContent = lqLabels[0];
    document.getElementById('resultL2').textContent = lqLabels[1];
    document.getElementById('resultL3').textContent = lqLabels[2];
    document.getElementById('resultLAvg').textContent = `${likelihoodResult.rawAverage} → ${likelihoodResult.level.label} (${likelihoodResult.score})`;

    // Matrix highlight
    this.highlightMatrix(effectiveImpact.score, effectiveLikelihood.score);

    // Override selects - set to current values
    document.getElementById('impactOverrideSelect').value = effectiveImpact.score;
    document.getElementById('likelihoodOverrideSelect').value = effectiveLikelihood.score;

    // Override info display
    const iOverrideInfo = document.getElementById('impactOverrideInfo');
    if (this.state.impactOverride) {
      iOverrideInfo.classList.remove('hidden');
      document.getElementById('impactOverrideInfoValue').textContent =
        `${this.state.impactOverride.level.label} (${this.state.impactOverride.score})`;
      const iJustEl = document.getElementById('impactOverrideInfoJustification');
      iJustEl.textContent = this.state.impactOverride.justification || '';
      iJustEl.classList.toggle('hidden', !this.state.impactOverride.justification);
    } else {
      iOverrideInfo.classList.add('hidden');
    }

    const lOverrideInfo = document.getElementById('likelihoodOverrideInfo');
    if (this.state.likelihoodOverride) {
      lOverrideInfo.classList.remove('hidden');
      document.getElementById('likelihoodOverrideInfoValue').textContent =
        `${this.state.likelihoodOverride.level.label} (${this.state.likelihoodOverride.score})`;
      const lJustEl = document.getElementById('likelihoodOverrideInfoJustification');
      lJustEl.textContent = this.state.likelihoodOverride.justification || '';
      lJustEl.classList.toggle('hidden', !this.state.likelihoodOverride.justification);
    } else {
      lOverrideInfo.classList.add('hidden');
    }
  },

  renderScoreBadge(elementId, score, level) {
    const el = document.getElementById(elementId);
    el.textContent = `${score} ${level.label}`;
    el.className = `score-badge bg-${level.label.toLowerCase()}`;
  },

  highlightMatrix(impactScore, likelihoodScore) {
    // Clear previous highlights
    document.querySelectorAll('.severity-matrix td').forEach(td => {
      td.classList.remove('highlight');
    });

    // impactScore 1-4 maps to data-i 0-3, likelihoodScore 1-4 maps to data-l 0-3
    const cell = document.querySelector(
      `.severity-matrix td[data-i="${impactScore - 1}"][data-l="${likelihoodScore - 1}"]`
    );
    if (cell) cell.classList.add('highlight');
  },

  // Impact badges shown during likelihood steps
  updateImpactBadges() {
    const { impactResult } = this.state;
    if (!impactResult) return;
    const html = `Impact: ${impactResult.level.label} (${impactResult.score})`;
    const cls = `impact-badge bg-${impactResult.level.label.toLowerCase()}`;
    ['impactBadge', 'impactBadge2', 'impactBadge3'].forEach(id => {
      const el = document.getElementById(id);
      el.textContent = html;
      el.className = cls;
    });
  },

  // === Navigation ===

  goToStep(step) {
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    this.currentStep = step;
    this.updateProgress();
  },

  updateProgress() {
    const pct = (this.currentStep / (this.totalSteps - 1)) * 100;
    document.getElementById('progressFill').style.width = `${pct}%`;

    document.querySelectorAll('.progress-step').forEach(el => {
      const step = parseInt(el.dataset.step);
      el.classList.remove('active', 'completed');
      if (step === this.currentStep) el.classList.add('active');
      else if (step < this.currentStep) el.classList.add('completed');
    });
  },

  // === Event Binding ===

  bindEvents() {
    // Impact category selection
    document.getElementById('impactCategories').addEventListener('click', (e) => {
      const card = e.target.closest('.option-card');
      if (!card) return;
      const categoryId = card.dataset.category;
      this.state.impactCategoryId = categoryId;
      this.renderImpactDetails(categoryId);
      this.goToStep(1);
    });

    // Impact detail selection
    document.getElementById('impactDetails').addEventListener('click', (e) => {
      const item = e.target.closest('.option-item');
      if (!item) return;
      const index = parseInt(item.dataset.index);
      this.state.impactDetailIndex = index;
      this.state.impactResult = SeverifyEngine.calculateImpact(
        this.state.impactCategoryId, index
      );
      this.updateImpactBadges();
      this.goToStep(2);
    });

    // Likelihood questions (Q1, Q2, Q3)
    for (let qi = 0; qi < 3; qi++) {
      document.getElementById(`likelihoodQ${qi + 1}`).addEventListener('click', (e) => {
        const item = e.target.closest('.option-item');
        if (!item) return;
        const score = parseInt(item.dataset.score);
        this.state.likelihoodScores[qi] = score;

        if (qi < 2) {
          this.goToStep(qi + 3);
        } else {
          // All likelihood answered — calculate and show result
          this.state.likelihoodResult = SeverifyEngine.calculateLikelihood(
            this.state.likelihoodScores
          );
          this.state.severityResult = SeverifyEngine.calculateSeverity(
            this.state.impactResult.score,
            this.state.likelihoodResult.score
          );
          this.renderResult();
          this.goToStep(5);
        }
      });
    }

    // Back buttons
    document.getElementById('backToCategory').addEventListener('click', () => this.goToStep(0));
    document.getElementById('backToDetail').addEventListener('click', () => this.goToStep(1));
    document.getElementById('backToL1').addEventListener('click', () => this.goToStep(2));
    document.getElementById('backToL2').addEventListener('click', () => this.goToStep(3));
    document.getElementById('backToL3').addEventListener('click', () => this.goToStep(4));

    // Override toggles
    document.getElementById('impactOverrideToggle').addEventListener('change', (e) => {
      document.getElementById('impactOverrideControls').classList.toggle('hidden', !e.target.checked);
      this.updateOverrideButton();
    });

    document.getElementById('likelihoodOverrideToggle').addEventListener('change', (e) => {
      document.getElementById('likelihoodOverrideControls').classList.toggle('hidden', !e.target.checked);
      this.updateOverrideButton();
    });

    // Apply override
    document.getElementById('applyOverride').addEventListener('click', () => this.applyOverride());

    // Export buttons
    document.getElementById('exportMarkdown').addEventListener('click', () => this.exportMarkdown());
    document.getElementById('exportJSON').addEventListener('click', () => this.exportJSON());
    document.getElementById('copyURL').addEventListener('click', () => this.copyURL());

    // Restart
    document.getElementById('restartBtn').addEventListener('click', () => this.restart());
  },

  updateOverrideButton() {
    const iToggle = document.getElementById('impactOverrideToggle').checked;
    const lToggle = document.getElementById('likelihoodOverrideToggle').checked;
    document.getElementById('applyOverride').classList.toggle('hidden', !iToggle && !lToggle);
  },

  applyOverride() {
    const iToggle = document.getElementById('impactOverrideToggle').checked;
    const lToggle = document.getElementById('likelihoodOverrideToggle').checked;

    if (iToggle) {
      const reason = document.getElementById('impactOverrideReason').value.trim();
      const score = parseInt(document.getElementById('impactOverrideSelect').value);
      this.state.impactOverride = {
        score,
        level: SeverifyEngine.scoreToLevel(score),
        justification: reason,
      };
    } else {
      this.state.impactOverride = null;
    }

    if (lToggle) {
      const reason = document.getElementById('likelihoodOverrideReason').value.trim();
      const score = parseInt(document.getElementById('likelihoodOverrideSelect').value);
      this.state.likelihoodOverride = {
        score,
        level: SeverifyEngine.scoreToLevel(score),
        justification: reason,
      };
    } else {
      this.state.likelihoodOverride = null;
    }

    // Recalculate severity with overrides
    const effectiveImpact = this.state.impactOverride || this.state.impactResult;
    const effectiveLikelihood = this.state.likelihoodOverride || this.state.likelihoodResult;
    this.state.severityResult = SeverifyEngine.calculateSeverity(
      effectiveImpact.score,
      effectiveLikelihood.score
    );

    this.renderResult();
    this.showToast('Override applied');
  },

  // === Export ===

  getExportData() {
    return SeverifyEngine.generateExport({
      impactCategory: this.state.impactResult.category.label,
      impactDetail: this.state.impactResult.detail.label,
      impactResult: this.state.impactResult,
      likelihoodScores: this.state.likelihoodScores,
      likelihoodResult: this.state.likelihoodResult,
      severityResult: this.state.severityResult,
      impactOverride: this.state.impactOverride,
      likelihoodOverride: this.state.likelihoodOverride,
    });
  },

  exportMarkdown() {
    const data = this.getExportData();
    const md = SeverifyEngine.toMarkdown(data);
    navigator.clipboard.writeText(md).then(() => {
      this.showToast('Markdown copied to clipboard');
    }).catch(() => {
      this.showToast('Failed to copy');
    });
  },

  exportJSON() {
    const data = this.getExportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `severify-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('JSON downloaded');
  },

  copyURL() {
    const params = new URLSearchParams();
    params.set('ic', this.state.impactCategoryId);
    params.set('id', this.state.impactDetailIndex);
    params.set('l1', this.state.likelihoodScores[0]);
    params.set('l2', this.state.likelihoodScores[1]);
    params.set('l3', this.state.likelihoodScores[2]);

    if (this.state.impactOverride) {
      params.set('io', this.state.impactOverride.score);
      params.set('ior', this.state.impactOverride.justification);
    }
    if (this.state.likelihoodOverride) {
      params.set('lo', this.state.likelihoodOverride.score);
      params.set('lor', this.state.likelihoodOverride.justification);
    }

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => {
      this.showToast('URL copied to clipboard');
    }).catch(() => {
      this.showToast('Failed to copy URL');
    });
  },

  // === URL State Restore ===

  restoreFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('ic') || !params.has('id')) return false;

    const categoryId = params.get('ic');
    const detailIndex = parseInt(params.get('id'));
    const l1 = parseInt(params.get('l1'));
    const l2 = parseInt(params.get('l2'));
    const l3 = parseInt(params.get('l3'));

    if (!IMPACT_DETAILS[categoryId] || isNaN(detailIndex) || isNaN(l1) || isNaN(l2) || isNaN(l3)) {
      return false;
    }

    this.state.impactCategoryId = categoryId;
    this.state.impactDetailIndex = detailIndex;
    this.state.impactResult = SeverifyEngine.calculateImpact(categoryId, detailIndex);
    this.state.likelihoodScores = [l1, l2, l3];
    this.state.likelihoodResult = SeverifyEngine.calculateLikelihood([l1, l2, l3]);
    this.state.severityResult = SeverifyEngine.calculateSeverity(
      this.state.impactResult.score,
      this.state.likelihoodResult.score
    );

    // Restore overrides
    if (params.has('io')) {
      const ioScore = parseInt(params.get('io'));
      this.state.impactOverride = {
        score: ioScore,
        level: SeverifyEngine.scoreToLevel(ioScore),
        justification: params.get('ior') || '',
      };
      // Populate override UI
      document.getElementById('impactOverrideToggle').checked = true;
      document.getElementById('impactOverrideControls').classList.remove('hidden');
      document.getElementById('impactOverrideSelect').value = ioScore;
      document.getElementById('impactOverrideReason').value = params.get('ior') || '';
    }

    if (params.has('lo')) {
      const loScore = parseInt(params.get('lo'));
      this.state.likelihoodOverride = {
        score: loScore,
        level: SeverifyEngine.scoreToLevel(loScore),
        justification: params.get('lor') || '',
      };
      // Populate override UI
      document.getElementById('likelihoodOverrideToggle').checked = true;
      document.getElementById('likelihoodOverrideControls').classList.remove('hidden');
      document.getElementById('likelihoodOverrideSelect').value = loScore;
      document.getElementById('likelihoodOverrideReason').value = params.get('lor') || '';
    }

    if (params.has('io') || params.has('lo')) {
      document.getElementById('applyOverride').classList.remove('hidden');
      // Recalculate with overrides
      const effectiveImpact = this.state.impactOverride || this.state.impactResult;
      const effectiveLikelihood = this.state.likelihoodOverride || this.state.likelihoodResult;
      this.state.severityResult = SeverifyEngine.calculateSeverity(
        effectiveImpact.score,
        effectiveLikelihood.score
      );
    }

    this.updateImpactBadges();
    this.renderResult();
    this.goToStep(5);
    return true;
  },

  // === Utilities ===

  restart() {
    this.state = {
      impactCategoryId: null,
      impactDetailIndex: null,
      impactResult: null,
      likelihoodScores: [null, null, null],
      likelihoodResult: null,
      severityResult: null,
      impactOverride: null,
      likelihoodOverride: null,
    };

    // Reset overrides UI
    document.getElementById('impactOverrideToggle').checked = false;
    document.getElementById('likelihoodOverrideToggle').checked = false;
    document.getElementById('impactOverrideControls').classList.add('hidden');
    document.getElementById('likelihoodOverrideControls').classList.add('hidden');
    document.getElementById('applyOverride').classList.add('hidden');
    document.getElementById('impactOverrideReason').value = '';
    document.getElementById('likelihoodOverrideReason').value = '';

    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);

    this.goToStep(0);
  },

  showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2500);
  },
};
