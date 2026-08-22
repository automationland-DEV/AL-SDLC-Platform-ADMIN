import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const checkSsoRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || urlParams.get('accessToken');

      if (token) {
        localStorage.setItem('accessToken', token);
      }

      // Check if callback code or token exists or if SSO cookie was set
      if (token || urlParams.has('code') || document.cookie.includes('connect.sid') || document.cookie.includes('jwt')) {
        try {
          setIsLoading(true);
          let ssoUser = await authService.handleSsoCallback();
          if (!ssoUser) {
            ssoUser = await authService.getCurrentUser();
          }

          if (ssoUser) {
            const roleStr = ssoUser.role ? String(ssoUser.role).toLowerCase() : '';
            if (roleStr === 'super_admin' || roleStr === 'admin') {
              setUser(ssoUser);
              toast.success('Đăng nhập Google SSO thành công!');
              navigate('/', { replace: true });
              return;
            } else {
              toast.error('Tài khoản của bạn không có quyền truy cập trang Admin Console');
              await authService.logout();
            }
          }
        } catch {
          // Ignore error if not returning from SSO
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkSsoRedirect();
  }, [navigate, setUser]);

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

  const handleGoogleLogin = () => {
    authService.initiateGoogleLogin();
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

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border-color)]" />
          </div>
          <span className="relative px-3 bg-[var(--bg-card)] text-[10px] font-mono-code uppercase text-[var(--text-muted)]">
            hoặc đăng nhập bằng SSO
          </span>
        </div>

        {/* Google SSO Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 px-4 border border-[var(--border-color)] hover:bg-[var(--bg-hover)] active:scale-[0.98] rounded-xl text-xs font-semibold text-[var(--text-primary)] transition-all duration-180 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Google SSO Workspace
        </button>
      </div>
    </div>
  );
}
