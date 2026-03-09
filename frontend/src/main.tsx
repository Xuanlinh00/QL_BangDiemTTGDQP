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
const _isTessNoise = (...args: unknown[]) =>
  args.some(a => typeof a === 'string' && _TESS_NOISE.some(n => (a as string).includes(n)))

const _cw = console.warn.bind(console)
console.warn = (...args: unknown[]) => { if (!_isTessNoise(...args)) _cw(...args) }

const _ce = console.error.bind(console)
console.error = (...args: unknown[]) => { if (!_isTessNoise(...args)) _ce(...args) }

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
