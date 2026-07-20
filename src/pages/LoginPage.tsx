import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores';
import { API_BASE_URL } from '../services/apiRoutes';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading } = useAuthStore();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'google_auth_failed') {
      toast.error('Đăng nhập Google thất bại. Vui lòng thử lại.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch {
      setError('Email hoặc mật khẩu không đúng');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      <video autoPlay loop muted playsInline className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/videos/mixkit-clouds-and-blue-sky-background-2408-full-hd.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute top-0 left-0 w-full h-full bg-slate-900/10 z-10" />

      <div className="w-full max-w-md relative z-20">
        <div className="bg-white/30 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 p-8 md:p-10 transition-all duration-300 hover:shadow-indigo-500/10 hover:border-white/55">
          <div className="text-center mb-8">
            <div className="inline-flex items-center flex-shrink-0 mb-6">
              <span className="grid h-12 w-12 flex-shrink-0 place-items-center p-1">
                <img src="/logo.png" alt="SDLC Logo" className="h-11 w-11 rounded-[8px] object-contain" />
              </span>
              <span className="flex flex-col text-[1.125rem] font-bold leading-[0.95] tracking-tight text-[#2563EB] text-left whitespace-nowrap ml-1">
                <span className="text-3xl font-black">SDLC</span>
                <span>ADMIN</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Chào mừng trở lại</h1>
            <p className="text-gray-600 text-sm mt-1.5 font-semibold">Đăng nhập vào hệ thống quản trị SDLC</p>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={isLoading}
            className="w-full mb-6 py-3 px-4 flex items-center justify-center gap-3 bg-white/50 hover:bg-white/80 border border-white/30 rounded-xl hover:border-white transition-all font-medium text-gray-800 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập với Google
          </button>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300/40" />
            <span className="flex-shrink mx-4 text-gray-500 text-xs font-semibold">hoặc đăng nhập với email</span>
            <div className="flex-grow border-t border-gray-300/40" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                disabled={isLoading}
                className="w-full px-4 py-2.5 bg-white/45 border border-gray-200/35 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-800">Mật khẩu</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Nhập mật khẩu"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pr-11 bg-white/45 border border-gray-200/35 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:bg-white/95 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-inner disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-md hover:shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6 font-medium">
            Chỉ tài khoản <span className="font-bold text-indigo-600">Super Admin</span> mới có thể truy cập
          </p>
        </div>
      </div>
    </div>
  );
}
