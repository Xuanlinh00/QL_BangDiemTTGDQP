import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'

// Suppress harmless Tesseract LSTM parameter warnings.
// Tesseract.js v5+ forwards these from the WASM worker as both console.warn
// AND console.error depending on the platform — patch both.
const _TESS_NOISE = [
  'Warning: Parameter not found',
  'language_model_ngram_on',
  'classify_misfit_junk_penalty',
]
const _DEV_NOISE = [
  'Download the React DevTools for a better development experience',
  'A listener indicated an asynchronous response by returning true',
]
const _isTessNoise = (...args: unknown[]) =>
  args.some(a => typeof a === 'string' && _TESS_NOISE.some(n => (a as string).includes(n)))
const _isDevNoise = (...args: unknown[]) =>
  args.some(a => typeof a === 'string' && _DEV_NOISE.some(n => (a as string).includes(n)))

const _cw = console.warn.bind(console)
console.warn = (...args: unknown[]) => { if (!_isTessNoise(...args) && !_isDevNoise(...args)) _cw(...args) }

const _ce = console.error.bind(console)
console.error = (...args: unknown[]) => { if (!_isTessNoise(...args) && !_isDevNoise(...args)) _ce(...args) }

const _ci = console.info.bind(console)
console.info = (...args: unknown[]) => { if (!_isDevNoise(...args)) _ci(...args) }

const _cl = console.log.bind(console)
console.log = (...args: unknown[]) => { if (!_isDevNoise(...args)) _cl(...args) }

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
