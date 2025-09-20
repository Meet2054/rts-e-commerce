// src/components/auth/auth-forms.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc";
import { signIn, checkUserApproval, getUserData } from '@/lib/firebase-auth';



export default function AuthForms() {
  const [step, setStep] = useState<'signin' | 'reset' | 'newpass'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const variants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  };

  const handleSignIn  = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await signIn(email, password);
      if (error) {
        setError(error);
      } else if (user) {
        // Check user role and approval status
        const userData = await getUserData(user.uid);
        
        if (userData?.role === 'admin') {
          // Admin users go to admin panel
          router.push('/');
        } else {
          // Check if regular user is approved
          const { approved, status } = await checkUserApproval(user.uid);
          
          if (!approved) {
            if (status === 'requested') {
              setError('Your account is pending admin approval. Please wait for approval before signing in.');
            } else if (status === 'inactive') {
              setError('Your account has been deactivated. Please contact support.');
            } else {
              setError('Your account is not approved for access. Please contact support.');
            }
            // Sign out the user since they're not approved
            const { signOut } = await import('@/lib/firebase-auth');
            await signOut();
          } else {
            // Approved user - redirect to products
            router.push('/products');
          }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: trigger reset email
    setStep('newpass');
  };

  const handleNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPass) {
      // TODO: save new password
      setStep('signin');
    }
  };

  return (
    <div className="min-h-[900px] max-w-[1550px] flex">
      {/* Left side - Forms */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[40%] xl:w-[30%] px-8 sm:px-12 lg:px-16 bg-white">
        
        {/* Top Logo */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <Image src="/logo.svg" alt="RTS Logo" width={240} height={60} />
        </div>

        {/* Animated content */}
        <div className="max-w-md w-full mx-auto">
          <AnimatePresence mode="wait">
            {step === 'signin' && (
              <motion.div
                key="signin"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black">Welcome</h2>
                  <p className="text-sm text-black">Returning customers enjoy exclusive discounts!</p>
                  <p className="text-sm text-black">Log in to see your special pricing.</p>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}
                  
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg"
                      placeholder="Email Address *"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#F1F2F4] rounded-lg"
                      placeholder="Password *"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Forgot Password */}
                  <button
                    type="button"
                    onClick={() => setStep('reset')}
                    className="text-black hover:underline text-base mt-2 hover:text-blue-400"
                  >
                    Forgot Password?
                  </button>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Continue'
                    )}
                  </button>

                  {/* Sign up link */}
                  <div className="text-start">
                    <p className="text-sm text-black">
                      Don’t have an account?{' '}
                      <Link href="/sign-up" className="text-blue-600 hover:text-blue-500 font-medium">
                        Sign up
                      </Link>
                    </p>
                  </div>

                  {/* Or divider */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute inset-x-0 top-1/2 border-t border-black"></span>
                    <span className="bg-white z-10 px-2 text-sm text-black">OR</span>
                  </div>

                  {/* Google Sign in */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 border border-black py-3 px-4 rounded-lg hover:bg-gray-50"
                  >
                    <FcGoogle size={20} />
                    Continue with Google
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'reset' && (
              <motion.div
                key="reset"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black">Reset Password</h2>
                  <p className="text-sm text-black">Get a link to reset your password.</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg"
                      placeholder="Enter registered email *"
                    />
                  </div>

                  {/* RE Send */}
                  <div className="flex justify-between py-2 text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('reset')}
                      className="text-black hover:underline"
                    >
                      Re-send
                    </button>
                  </div>

                  <button className="w-full bg-black text-white py-3 rounded-lg">
                    Send Reset Link
                  </button>
                </form>
              </motion.div>
            )}

            {step === 'newpass' && (
              <motion.div
                key="newpass"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black">New Password</h2>
                  <p className="text-sm text-black">Set a new password for your account.</p>
                </div>

                <form onSubmit={handleNewPassword} className="space-y-4">
                  {/* New Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#F1F2F4] rounded-lg"
                      placeholder="New Password *"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-[#F1F2F4] rounded-lg"
                      placeholder="Confirm Password *"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button className="w-full bg-black text-white py-3 rounded-lg">
                    Edit Password
                  </button>

                  <div className="text-start text-sm text-black">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setStep('signin')}
                      className="text-blue-600 hover:underline"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex relative w-[70%] bg-gray-100">
        <Image src="/login.svg" alt="Background" fill className="object-cover" />
        {/* <div className="absolute bottom-10 right-10">
          <Image src="/bottom-logo.svg" alt="Katun Logo" width={900} height={40} className="opacity-90" />
        </div> */}
      </div>
    </div>
  );
}
