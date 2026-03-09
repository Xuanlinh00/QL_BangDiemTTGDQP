import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, token } = useAuth()
  const navigate = useNavigate()

  // Nếu đã đăng nhập, chuyển hướng đến dashboard
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await login(email, password)
    
    if (result.success) {
      toast.success('Đăng nhập thành công')
      // Delay một chút để localStorage được cập nhật
      setTimeout(() => {
        navigate('/', { replace: true })
      }, 100)
    } else {
      toast.error(result.error || 'Đăng nhập thất bại')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-800 to-accent-800 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-accent-500/10 rounded-full" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">TVU</div>
            <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">QP</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">HỆ THỐNG GDQP-AN</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Trung tâm Giáo dục Quốc phòng - An ninh, ĐH Trà Vinh</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
              placeholder="admin@tvu.edu.vn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-6">
          Demo: admin@tvu.edu.vn / password
        </p>
      </div>
    </div>
  )
}
