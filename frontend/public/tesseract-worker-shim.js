/**
 * tesseract-worker-shim.js
 * Patches console.warn/error to suppress known harmless Tesseract LSTM parameter
 * warnings, then loads the real Tesseract worker.
 *
 * Used with: createWorker({ workerPath: '/tesseract-worker-shim.js', workerBlobURL: false })
 * This creates a regular Worker (not a blob worker), so self.location is the
 * actual script URL and we can derive sibling paths correctly.
 */
const _SUPPRESS = [
  'Warning: Parameter not found',
  'language_model_ngram_on',
  'classify_misfit_junk_penalty',
]
function _shouldSuppress(args) {
  return args.some(a => typeof a === 'string' && _SUPPRESS.some(s => a.includes(s)))
}
const _origWarn = self.console.warn.bind(self.console)
self.console.warn = function (...args) {
  if (_shouldSuppress(args)) return
  _origWarn(...args)
}
const _origError = self.console.error.bind(self.console)
self.console.error = function (...args) {
  if (_shouldSuppress(args)) return
  _origError(...args)
}

// Derive the base URL from this script's own location (works for regular Workers)
// e.g. http://localhost:5173/tesseract-worker-shim.js → http://localhost:5173
const _base = self.location.href.replace(/\/[^\/]*$/, '')
importScripts(_base + '/tesseract-worker.min.js')
