import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [formValues, setFormValues] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formValues);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Đăng nhập thất bại, vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden font-sans select-none">
      {/* Background ambient decorative glows */}
      <div className="absolute top-[-25%] left-[-15%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[8000ms]"></div>
      <div className="absolute bottom-[-25%] right-[-15%] w-[60%] h-[60%] bg-fuchsia-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse duration-[10000ms]"></div>
      <div className="absolute top-[35%] left-[45%] w-[30%] h-[30%] bg-violet-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Subtle grid overlay for tech/premium feel */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40"></div>

      <div className="w-full max-w-md z-10 transition-all duration-500 transform hover:scale-[1.005]">
        {/* Logo / Brand Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-500 via-violet-500 to-fuchsia-500 rounded-2xl shadow-[0_8px_30px_rgba(99,102,241,0.35)] mb-2 relative group overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg className="w-8 h-8 text-white transition-transform duration-500 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v7.5a9 9 0 001.341 4.797m11.07 0A9 9 0 0018 14.5V7a2 2 0 00-2-2h-1a2 2 0 00-2 2v4c0 1.38-.266 2.7-.753 3.929M9 15.5h1.5a1.5 1.5 0 001.5-1.5v-1.5M9 15.5h-.01" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-wider">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 drop-shadow-[0_2px_10px_rgba(168,85,247,0.15)]">
              3SHIP RESTAURANT
            </span>
          </h1>
          <p className="text-slate-400/90 text-sm max-w-sm mx-auto font-medium tracking-wide">
            Hệ thống quản trị thông minh dành cho Quản lý & Nhân viên
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] transition-all duration-300 hover:border-indigo-500/20">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1.5">Chào mừng quay trở lại</h2>
            <p className="text-sm text-slate-400 font-medium">Vui lòng nhập tài khoản hệ thống của bạn</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Email Đăng Nhập</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="username"
                  value={formValues.username}
                  onChange={handleChange}
                  placeholder="name@gmail.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-700 transition-all duration-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Mật Khẩu</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formValues.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-700 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 animate-shake">
                <svg className="w-5 h-5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-rose-300 font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold rounded-xl shadow-[0_4px_25px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_35px_rgba(99,102,241,0.55)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 flex items-center justify-center gap-2 relative group overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="tracking-wide">Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span className="tracking-wide">Đăng Nhập</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-[11px] text-slate-500/80 text-center border-t border-slate-800/50 pt-5 flex items-center justify-center gap-1.5 font-medium">
            <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Hệ thống quản trị nội bộ bảo mật • 3SHIP Restaurant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;


