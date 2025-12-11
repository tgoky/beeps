"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@refinedev/core";
import { Lock, User, Music2, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginClient() {
  const router = useRouter();
  const { mutate: login, isLoading } = useLogin();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Username or email is required';
    if (!formData.password) newErrors.password = 'Password is required';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Use Refine's login mutation
      login({
        email: formData.username,
        password: formData.password,
        remember: formData.rememberMe,
      });
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Quick demo fill function (hidden from UI, but you can call it from browser console)
  const fillDemoCredentials = () => {
    setFormData({
      username: 'info@refine.dev',
      password: 'refine-supabase',
      rememberMe: false
    });
  };

  // Expose to window for console access during development
  if (typeof window !== 'undefined') {
    (window as any).fillDemoCredentials = fillDemoCredentials;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left Side - Branding */}
          <div className="space-y-12 lg:pr-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                  <Music2 className="w-5 h-5 text-black" strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-white">
                  Beeps
                </h1>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-5xl font-light tracking-tight text-white leading-tight">
                  Welcome back
                </h2>
                <p className="text-base font-light text-zinc-500 tracking-wide">
                  Sign in to continue to your account
                </p>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-6 pt-8 border-t border-zinc-900">
              {[
                { title: "Beat Marketplace", desc: "Discover and license premium beats from top producers" },
                { title: "Studio Booking", desc: "Reserve professional recording studios worldwide" },
                { title: "Connect & Collaborate", desc: "Network with artists, producers, and industry professionals" },
                { title: "Real-time Updates", desc: "Stay updated with live community feeds and notifications" }
              ].map((feature, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-sm font-medium text-white tracking-wide">
                    {feature.title}
                  </h3>
                  <p className="text-sm font-light text-zinc-600 leading-relaxed tracking-wide">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 pt-8 border-t border-zinc-900">
              {[
                { number: "10K+", label: "Users" },
                { number: "50K+", label: "Beats" },
                { number: "1K+", label: "Studios" },
                { number: "5K+", label: "Projects" }
              ].map((stat, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-xl font-light text-white tracking-tight">
                    {stat.number}
                  </div>
                  <div className="text-xs font-light text-zinc-600 tracking-wider uppercase">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:pl-12">
            <div className="max-w-md mx-auto space-y-8">
              
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Username/Email */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-zinc-400 tracking-wider uppercase">
                    Username or Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" strokeWidth={2} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateField('username', e.target.value)}
                      className={`
                        w-full pl-11 pr-4 py-3.5 text-sm font-light rounded-lg border transition-all duration-200
                        bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 tracking-wide
                        focus:outline-none focus:border-white focus:bg-black
                        ${errors.username ? "border-red-500/50 focus:border-red-500" : ""}
                      `}
                      placeholder="Enter your username or email"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs font-light text-red-400 tracking-wide">{errors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-zinc-400 tracking-wider uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" strokeWidth={2} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={`
                        w-full pl-11 pr-12 py-3.5 text-sm font-light rounded-lg border transition-all duration-200
                        bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600 tracking-wide
                        focus:outline-none focus:border-white focus:bg-black
                        ${errors.password ? "border-red-500/50 focus:border-red-500" : ""}
                      `}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded transition-colors duration-200 text-zinc-600 hover:text-white bg-black border border-black"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" strokeWidth={2} />
                      ) : (
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs font-light text-red-400 tracking-wide">{errors.password}</p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => updateField('rememberMe', e.target.checked)}
                      className="w-4 h-4 rounded border bg-zinc-950 border-zinc-800 text-white focus:ring-1 focus:ring-white focus:ring-offset-0 focus:ring-offset-black cursor-pointer"
                    />
                    <span className="text-xs font-light text-zinc-500 tracking-wide group-hover:text-zinc-400 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-light text-zinc-500 hover:text-white transition-colors tracking-wide bg-black border border-black"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    w-full py-3.5 text-sm font-medium rounded-lg border transition-all duration-200
                    bg-white border-white text-black tracking-wide
                    hover:bg-zinc-100 active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100
                    flex items-center justify-center gap-2.5
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-zinc-900">
                <p className="text-xs font-light text-zinc-600 tracking-wide">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => router.push('/register')}
                    className="font-medium text-white hover:text-zinc-300 transition-colors bg-black border border-black"
                  >
                    Create account
                  </button>
                </p>
              </div>

              {/* Footer Note */}
              <p className="text-xs font-light text-zinc-700 text-center leading-relaxed tracking-wide">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}