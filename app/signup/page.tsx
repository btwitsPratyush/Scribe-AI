"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

import useSoundEffect from "@/hooks/use-sound-effect";

/* -------------------------------------------------------------------------- */
/* Constants & Helper Components */
/* -------------------------------------------------------------------------- */

const COLORS = {
  NEON_GREEN: '#4ade80',
  CHARCOAL: '#121212',
};

const CircleElement = () => {
  return (
    /* Top Right Green Circle - Updated Version */
    <div
      className="absolute top-20 right-[-50px] w-32 h-32 rounded-full border-4 z-0"
      style={{
        backgroundColor: COLORS.NEON_GREEN,
        borderColor: COLORS.CHARCOAL,
        opacity: 0.2
      }}
    />
  );
};

const NeoInput = ({ label, id, type = "text", placeholder, value, onChange }: {
  label: string;
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="text-sm font-bold text-black uppercase tracking-wider">
      {label}
    </label>
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full p-3 bg-white border-2 border-black text-black placeholder:text-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
    />
  </div>
);

const NeoButton = ({ children, onClick, type = "button", className = "", disabled = false }: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-3 px-4 bg-[#39FF14] hover:bg-[#32e612] text-black font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

/* -------------------------------------------------------------------------- */
/* Main Page */
/* -------------------------------------------------------------------------- */

export default function NeoAuthPage() {
  const { play: playSound } = useSoundEffect();
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound(); // Play sound on submit
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // LOGIN ------------------------
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Login failed');
          return;
        }

        window.location.href = '/recording';
      } else {
        // SIGNUP ------------------------
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Signup failed');
          return;
        }

        // AUTO-LOGIN AFTER SIGNUP
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const loginData = await loginResponse.json();

        if (!loginResponse.ok) {
          setError(loginData.error || 'Auto-login failed');
          return;
        }

        window.location.href = '/recording';
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full bg-[#f8f7f4] relative overflow-hidden font-sans flex items-center justify-center p-4">
      {/* --- Background Decorative Elements --- */}

      {/* The requested updated circle component */}
      <CircleElement />

      {/* Bottom Left Outline Circle */}
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white rounded-full border-4 border-black z-0 dashed" />

      {/* Floating Geometric Shape */}
      <div className="absolute top-1/4 left-10 w-0 h-0 border-l-[20px] border-l-transparent border-t-[30px] border-t-black border-r-[20px] border-r-transparent rotate-45 z-0 hidden md:block" />

      {/* Squiggly Arrow */}
      <svg className="absolute bottom-1/4 right-1/4 w-24 h-24 text-black z-0 hidden lg:block opacity-80" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M10,50 C30,20 50,80 80,40" />
        <path d="M70,40 L80,40 L75,50" />
      </svg>

      {/* --- Main Card Container --- */}
      <div className="relative z-10 w-full max-w-md">
        {/* The Neo-Brutalist Box */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 relative">
          {/* "Tag" on top of card */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 font-bold text-sm uppercase tracking-widest transform -rotate-2 border-2 border-transparent">
            {isLogin ? 'Welcome Back' : 'Join the Club'}
          </div>

          {/* Header */}
          <div className="text-center mb-8 mt-2">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </h1>
            <p className="text-gray-600 font-medium">
              {isLogin
                ? 'Enter your credentials to access your dashboard.'
                : 'Create an account and start building superpowers.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <NeoInput
                id="name"
                label="Full Name"
                placeholder="JOHN DOE"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              />
            )}

            <NeoInput
              id="email"
              type="email"
              label="Email Address"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            />

            <div className="space-y-2 relative">
              <label htmlFor="password" className="text-sm font-bold text-black uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-black text-black placeholder:text-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label htmlFor="confirm" className="text-sm font-bold text-black uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-black text-black placeholder:text-gray-500 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                />
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 text-sm font-bold">
                {error}
              </div>
            )}

            <NeoButton type="submit" className="mt-6" disabled={isLoading}>
              {isLoading ? 'Processing...' : isLogin ? 'Log In' : 'Get Started'}
              {!isLoading && <ArrowRight size={20} strokeWidth={3} />}
            </NeoButton>

          </form>

          {/* Footer Toggle */}
          <div className="mt-8 pt-6 border-t-2 border-black text-center">
            <p className="font-bold text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-2 text-black hover:text-gray-800 font-black uppercase tracking-wide border-b-4 border-[#39FF14] hover:border-black transition-colors"
            >
              {isLogin ? 'Create Account' : 'Login Here'}
            </button>
          </div>

        </div>
        {/* Decorative "Under-card" for extra depth */}
        <div className="absolute -z-10 top-4 left-4 w-full h-full bg-black border-2 border-black" />

      </div>
    </div>
  );
}