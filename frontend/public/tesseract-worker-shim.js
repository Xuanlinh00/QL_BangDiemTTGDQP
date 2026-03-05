/**
 * tesseract-worker-shim.js
 * Patches console.warn to suppress known harmless Tesseract LSTM parameter
 * warnings before loading the real Tesseract worker.
 */
const _origWarn = self.console.warn.bind(self.console)
self.console.warn = function (...args) {
  if (
    typeof args[0] === 'string' &&
    args[0].startsWith('Warning: Parameter not found:')
  ) return
  _origWarn(...args)
}

// Load the real tesseract.js worker using absolute URL
// (root-relative paths fail inside blob workers, so we use origin explicitly)
importScripts(self.location.origin + '/tesseract-worker.min.js')
