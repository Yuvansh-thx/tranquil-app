'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, User, Settings, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { BrandLogo } from '@/components/shared/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signin') {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          first_name: name.trim() || undefined,
        });
      }
      router.push('/');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : mode === 'signin'
          ? 'Invalid credentials. Please try again.'
          : 'Registration failed. Please check inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login({ email: 'admin@tranquil.app', password: 'AdminPassword123!' });
      router.push('/');
    } catch {
      try {
        await login({ email: 'test@test.com', password: 'AdminPassword123!' });
        router.push('/');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Demo sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-2 sm:p-6 bg-slate-950 font-sans selection:bg-blue-500 selection:text-white">
      {/* Outer Framed Container with Glow Border */}
      <div className="relative w-full max-w-7xl min-h-[92vh] rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] flex flex-col justify-between">
        {/* Background Image with Twilight Landscape */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/images/auth-bg.jpg')` }}
        >
          {/* Subtle vignette gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/50" />
        </div>

        {/* 1. Top Navigation Bar */}
        <header className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-6">
          {/* Left: Glowing Arch Logo Mark with Name on Top Left Corner */}
          <BrandLogo
            size="md"
            showName={true}
            isGlowing={true}
            textColor="text-white drop-shadow-md text-lg sm:text-2xl font-bold"
          />

          {/* Center: Minimalist Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/85">
            <Link
              href="/"
              className="text-white hover:text-white drop-shadow-sm transition font-semibold"
            >
              Home
            </Link>
            <Link
              href="/today"
              className="hover:text-white drop-shadow-sm transition"
            >
              Service
            </Link>
            <Link
              href="/notes"
              className="hover:text-white drop-shadow-sm transition"
            >
              Contact
            </Link>
            <Link
              href="/analytics"
              className="hover:text-white drop-shadow-sm transition"
            >
              About
            </Link>
          </nav>

          {/* Right: Pill Search & Settings Avatar */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-4 py-1.5 backdrop-blur-md shadow-xs">
              <User className="h-3.5 w-3.5 text-white/80" />
              <Search className="h-3.5 w-3.5 text-white/80" />
              <span className="text-xs font-medium text-white/90 select-none">
                Search
              </span>
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              title="1-Click Demo Access"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 backdrop-blur-md text-white/90 hover:bg-white/20 hover:scale-105 transition"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* 2. Center Glassmorphic Auth Card */}
        <main className="relative z-20 flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-[420px] rounded-[32px] border border-white/30 bg-white/[0.08] dark:bg-slate-950/[0.28] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4)] backdrop-blur-2xl">
            {/* Card Header */}
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </h1>
              <p className="mt-2 text-xs text-white/80">
                {mode === 'signin' ? (
                  <>
                    Not a member yet?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="font-semibold text-sky-300 hover:text-sky-200 underline transition ml-1"
                    >
                      Sign Up
                    </button>
                  </>
                ) : (
                  <>
                    Already a member?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setError(null);
                      }}
                      className="font-semibold text-sky-300 hover:text-sky-200 underline transition ml-1"
                    >
                      Log In
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 rounded-xl bg-rose-500/25 border border-rose-400/50 p-2.5 text-center text-xs text-rose-100 backdrop-blur-md">
                {error}
              </div>
            )}

            {/* Form with Underline Inputs */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-6">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-white/90 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-transparent border-0 border-b border-white/60 pb-2 text-sm text-white placeholder-white/35 focus:border-white focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-transparent border-0 border-b border-white/60 pb-2 text-sm text-white placeholder-white/35 focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-0 border-b border-white/60 pb-2 text-sm text-white placeholder-white/35 focus:border-white focus:outline-none transition-colors"
                />
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full mt-2 rounded-2xl bg-[#4880ec] hover:bg-[#3b71db] text-white font-bold py-3 text-sm shadow-lg shadow-blue-500/40 hover:shadow-blue-500/50 active:scale-98 disabled:opacity-50 transition"
              >
                {loading
                  ? mode === 'signin'
                    ? 'Signing In...'
                    : 'Creating Account...'
                  : mode === 'signin'
                  ? 'Sign In'
                  : 'Sign Up'}
              </button>
            </form>

            {/* Social Divider */}
            <div className="flex items-center justify-center my-6 gap-3">
              <div className="flex-1 h-[1px] bg-white/30" />
              <span className="text-[11px] text-white/70 uppercase tracking-wider select-none font-medium">
                {mode === 'signin' ? 'or sign in with' : 'or sign up with'}
              </span>
              <div className="flex-1 h-[1px] bg-white/30" />
            </div>

            {/* Social Icons (Facebook & Google) */}
            <div className="flex items-center justify-center gap-4">
              {/* Facebook Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                title="Sign in with Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-md hover:scale-110 active:scale-95 transition"
              >
                <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                title="Sign in with Google"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md hover:scale-110 active:scale-95 transition"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              </button>
            </div>

            {/* 1-Click Demo Shortcut */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-medium text-white/90 hover:bg-white/20 transition active:scale-95"
              >
                <Sparkles className="h-3 w-3 text-sky-300" />
                <span>1-Click Demo (admin@tranquil.app)</span>
              </button>
            </div>
          </div>
        </main>

        {/* 3. Subtle Footer */}
        <footer className="relative z-20 px-6 sm:px-12 py-4 flex items-center justify-between text-[11px] text-white/50">
          <span>&copy; Tranquil Workspace. All rights reserved.</span>
          <span>Serene productivity for focused minds.</span>
        </footer>
      </div>
    </div>
  );
}
