import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuthStore } from '../stores';
import type { AuthUser } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    try {
      setIsLoading(true);
      const res = await authService.login({ email, password });

      const resAny = res as unknown as Record<string, unknown>;
      let userObj = (res?.user || (resAny?.data as Record<string, unknown>)?.user || resAny?.data || resAny?.user) as AuthUser | null;

      if (!userObj || !userObj.role) {
        try {
          userObj = await authService.getCurrentUser();
        } catch {
          // Ignore
        }
      }

      const roleStr = userObj?.role ? String(userObj.role).toLowerCase() : '';
      const isAllowed = roleStr === 'super_admin' || roleStr === 'admin';

      if (!userObj || !isAllowed) {
        toast.error('Tài khoản của bạn không có quyền truy cập trang Admin Console');
        await authService.logout();
        return;
      }

      setUser(userObj);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      console.error('Login error:', error);
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email & mật khẩu.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4 relative font-sans">
      {/* Subtle Background Console Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      {/* Main Login Panel */}
      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl p-6 md:p-8 relative z-10">

        {/* Official Brand & Logo */}
        <div className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="flex items-center justify-center gap-3">
            <img src="/logo.png" alt="SDLC Logo" className="h-11 w-11 rounded-xl object-contain shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-mono-code text-2xl font-black tracking-tight text-[var(--text-primary)] leading-none">
                SDLC<span className="text-sky-500"> ADMIN</span>
              </span>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-mono-code whitespace-nowrap">
            <ShieldCheck size={14} />
            Hệ thống Quản trị
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="email"
                placeholder="admin@sdlc.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 font-mono-code transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-sm transition-all duration-180 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
