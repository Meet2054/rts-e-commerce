'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, updateUserProfile } from '@/lib/firebase-auth';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff, Phone } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';

export default function SignUpForm() {
  const [step, setStep] = useState<'userinfo' | 'company' | 'preferences' | 'agreements' | 'created'>('userinfo');
  const [currentUser, setCurrentUser] = useState<any>(null); // Store created user
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    companyName: '',
    businessType: '',
    industry: '',
    website: '',
    gst: '',
    address: '',
    roleInCompany: '', // Updated field name
    currency: '',
    language: '',
    agreedToTerms: false, // Updated field name
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const variants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.displayName) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  // Step 1: User Info - Create the user account
  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      // Create user with basic info only initially
      const { user, error } = await signUp(formData.email, formData.password, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: 'client',
      });
      if (error) {
        setError(error);
      } else if (user) {
        setCurrentUser(user); // Store user for later updates
        setStep('company');
        console.log('✅ [SignUp] User created, moving to company info');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Company Info - Update user profile with company data
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('User session lost. Please try again.');
      setStep('userinfo');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      // Only include fields that have values
      const companyData: any = {};
      
      if (formData.companyName.trim()) companyData.companyName = formData.companyName.trim();
      if (formData.businessType) companyData.businessType = formData.businessType;
      if (formData.industry) companyData.industry = formData.industry;
      if (formData.website.trim()) companyData.website = formData.website.trim();
      if (formData.gst.trim()) companyData.gst = formData.gst.trim();
      if (formData.address.trim()) companyData.address = formData.address.trim();
      
      const { error } = await updateUserProfile(currentUser.uid, companyData);
      
      if (error) {
        setError(error);
      } else {
        setStep('preferences');
        console.log('✅ [SignUp] Company info updated');
      }
    } catch (err) {
      setError('Failed to save company information');
      console.error('Company info error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Preferences - Update user profile with preference data
  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('User session lost. Please try again.');
      setStep('userinfo');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      // Only include fields that have values
      const preferencesData: any = {};
      
      if (formData.roleInCompany) preferencesData.roleInCompany = formData.roleInCompany;
      if (formData.currency) preferencesData.currency = formData.currency;
      if (formData.language) preferencesData.language = formData.language;
      
      const { error } = await updateUserProfile(currentUser.uid, preferencesData);
      
      if (error) {
        setError(error);
      } else {
        setStep('agreements');
        console.log('✅ [SignUp] Preferences updated');
      }
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Preferences error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Agreements - Final profile completion
  const handleAgreementsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms) {
      setError('You must agree to all Terms & Conditions');
      return;
    }
    
    if (!currentUser) {
      setError('User session lost. Please try again.');
      setStep('userinfo');
      return;
    }
    
    setLoading(true);
    setError(''); // Clear any previous errors
    try {
      const { error } = await updateUserProfile(currentUser.uid, {
        agreedToTerms: true,
        // agreementDate will be set automatically in the updateUserProfile function
      });
      
      if (error) {
        setError(error);
      } else {
        setStep('created');
        console.log('✅ [SignUp] Profile completed successfully');
      }
    } catch (err) {
      setError('Failed to complete registration');
      console.error('Agreements error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Account Created
  const handleGoHome = () => {
    router.push('/products');
  };

  return (
    <div className="min-h-[900px] max-w-[1550px] flex">
      {/* Left side - Form */}
      <div className="flex flex-col justify-center items-center w-full md:w-[30%] px-8 sm:px-12 lg:px-16 bg-white">
        {/* Top Logo */}
        <div className="mb-6 flex justify-center lg:justify-start">
          <Image src="/logo.svg" alt="RTS Logo" width={240} height={60} />
        </div>
        <div className="max-w-md w-full mx-auto">
          <AnimatePresence mode="wait">
            {step === 'userinfo' && (
              <motion.div
                key="userinfo"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center lg:text-left">Create your account</h2>
                  <p className="mt-1 text-center lg:text-left text-sm text-black">Start with your basic information.</p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleUserInfoSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="User Name"
                      />
                    </div>
                    {/* Phone Number */}
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone Number"
                      />
                    </div>
                    {/* Email */}
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Email Address"
                      />
                    </div>
                    {/* Password */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-12 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {/* Confirm Password */}
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-12 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Sign In Link */}
                  <div className="text-start">
                    <p className="text-sm text-black">
                      Already have an account?{' '}
                      <Link href="/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full border-b-2 border-white"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              </motion.div>
            )}


            {step === 'company' && (
              <motion.div
                key="company"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center">Company Information</h2>
                  <p className="text-sm text-black text-center">Add your business details for verification.</p>
                </div>

                <form className="space-y-4" onSubmit={handleCompanySubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                    placeholder="Company Name"
                  />

                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                  >
                    <option value="">Business Type</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="distributor">Distributor</option>
                    <option value="retailer">Retailer</option>
                  </select>

                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                  >
                    <option value="">Industry</option>
                    <option value="office">Office Equipment</option>
                    <option value="it">IT Services</option>
                    <option value="other">Other</option>
                  </select>

                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                    placeholder="Website"
                  />

                  <input
                    type="text"
                    name="gst"
                    value={formData.gst}
                    onChange={handleChange}
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                    placeholder="GST No."
                  />

                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                    placeholder="Company Address"
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg"
                  >
                    {loading ? 'Saving...' : 'Continue to Preferences'}
                  </button>
                </form>
              </motion.div>
            )}


            {step === 'preferences' && (
              <motion.div
                key="preferences"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center">Business Preferences</h2>
                  <p className="text-sm text-black text-center">Personalize your account settings.</p>
                </div>
                
                <form className="space-y-4" onSubmit={handlePreferencesSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}

                  <select
                    name="roleInCompany"
                    value={formData.roleInCompany}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                  >
                    <option value="">Role in Company</option>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>

                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                  >
                    <option value="">Preferred Currency</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>

                  <select
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    required
                    className="w-full py-3 px-4 bg-[#F1F2F4] rounded-lg"
                  >
                    <option value="">Preferred Language</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                  </select>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg"
                  >
                    {loading ? 'Saving...' : 'Continue to Agreements'}
                  </button>

                </form>
              </motion.div>
            )}


            {step === 'agreements' && (
              <motion.div
                key="agreements"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center">Agreements & Security</h2>
                  <p className="text-sm text-black text-center">Accept terms and secure your account.</p>
                </div>
                <form className="space-y-4" onSubmit={handleAgreementsSubmit}>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="agreedToTerms" className="ml-2 text-sm text-gray-600">Agree all Terms & Conditions</label>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>

                </form>
              </motion.div>
            )}
            {step === 'created' && (
              <motion.div
                key="created"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-black text-center">Registration Submitted!</h2>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Your account has been created successfully and is now pending admin approval.
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold text-yellow-800">Approval Required</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Your account will be reviewed by our admin team. You'll receive access once approved, typically within 24-48 hours.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Go to Website
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Right side - Image */}
      <div className="hidden lg:flex relative w-[70%] bg-gray-100">
        <Image src="/login.svg" alt="Background" fill className="object-cover" />
        {/* <div className="absolute bottom-10 right-10">
          <Image src="/katun.svg" alt="Katun Logo" width={200} height={40} className="opacity-90" />
        </div> */}
      </div>
    </div>
  );
}
