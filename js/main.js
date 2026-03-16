/**
 * Severify — Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
  Wizard.init();

  // Try to restore state from URL parameters
  if (!Wizard.restoreFromURL()) {
    Wizard.goToStep(0);
  }
});
