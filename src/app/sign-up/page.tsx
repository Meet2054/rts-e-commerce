'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signUp } from '@/lib/firebase-auth';
import { AlertCircle, Building2, MapPin, Briefcase, User, Phone, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { getAllCountries, getStatesByCountry, lookupPostalCode, type Country, type State } from '@/lib/location-utils';

export default function SignUpForm() {
  const [step, setStep] = useState<'account' | 'address' | 'credentials' | 'created'>('account');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    companyName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    roleInCompany: '',
    agreedToTerms: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [isLookingUpPostal, setIsLookingUpPostal] = useState(false);

  // Load countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      const countryList = getAllCountries();
      setCountries(countryList);
    };
    loadCountries();
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (formData.country) {
      const stateList = getStatesByCountry(formData.country);
      setStates(stateList);
      // Reset state if country changed
      if (formData.state && !stateList.find(s => s.code === formData.state)) {
        setFormData(prev => ({ ...prev, state: '' }));
      }
    } else {
      setStates([]);
    }
  }, [formData.country, formData.state]);

  // Handle postal code lookup
  const handlePostalCodeLookup = async (postalCode: string) => {
    if (postalCode.length >= 3) {
      setIsLookingUpPostal(true);
      try {
        const result = await lookupPostalCode(postalCode);
        if (result.valid && result.countryCode) {
          const updates: Partial<typeof formData> = {};
          
          if (result.countryCode && result.countryCode !== formData.country) {
            updates.country = result.countryCode;
          }
          
          if (result.stateCode && result.stateCode !== formData.state) {
            updates.state = result.stateCode;
          }
          
          if (result.city && result.city !== formData.city) {
            updates.city = result.city;
          }
          
          if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
          }
        }
      } catch (error) {
        console.error('Postal code lookup failed:', error);
      } finally {
        setIsLookingUpPostal(false);
      }
    }
  };

  const variants = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 },
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value, type } = target;
    
    // Handle postal code with lookup
    if (name === 'zipCode') {
      const newFormData = {
        ...formData,
        [name]: value
      };
      setFormData(newFormData);
      
      // Trigger postal code lookup after a delay
      if (value.length >= 3) {
        setTimeout(() => handlePostalCodeLookup(value), 500);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (target as HTMLInputElement).checked : value
      }));
    }
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

  // Step 1: Account - Basic account information (User Name, Phone, Company, Job Title)
  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setStep('address');
      console.log('✅ [SignUp] Account info collected, moving to address');
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Account step error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Address - Address information
  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setStep('credentials');
      console.log('✅ [SignUp] Address info collected, moving to credentials');
    } catch (err) {
      setError('Failed to save address information');
      console.error('Address step error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Credentials - Email and password setup with account creation
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    if (!formData.agreedToTerms) {
      setError('You must agree to all Terms & Conditions');
      return;
    }
    setLoading(true);
    try {
      // Create user with all collected info
      const { user, error } = await signUp(formData.email, formData.password, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        companyName: formData.companyName,
        roleInCompany: formData.roleInCompany as 'owner' | 'manager' | 'employee',
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        role: 'client',
        agreedToTerms: true,
      });
      if (error) {
        setError(error);
      } else if (user) {
        setStep('created');
        console.log('✅ [SignUp] User created successfully');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Sign-up error:', err);
    } finally {
      setLoading(false);
    }
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
            {step === 'account' && (
              <motion.div
                key="account"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center lg:text-left">Create Account</h2>
                  <p className="mt-1 text-center lg:text-left text-sm text-black">Enter your name, company, and contact number</p>
                </div>
                <form className="mt-6 space-y-6" onSubmit={handleAccountSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {/* User Name */}
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
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone No."
                      />
                    </div>
                    {/* Company */}
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Company*"
                      />
                    </div>
                    {/* Job Title */}
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                      <input
                        type="text"
                        name="roleInCompany"
                        value={formData.roleInCompany}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Job Title"
                      />
                    </div>
                  </div>
                  {/* Sign In Link */}
                  <div className="text-start">
                    <p className="text-sm text-black">
                      Already have an account?{' '}
                      <Link href="/sign-in" className="text-blue-600 hover:text-blue-500 font-medium">
                        Sign in
                      </Link>
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2E318E] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </div>
                    ) : (
                      'Next'
                    )}
                  </button>
                </form>
              </motion.div>
            )}


            {step === 'address' && (
              <motion.div
                key="address"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center">Address Details</h2>
                  <p className="text-sm text-black text-center">Provide your full address and location</p>
                </div>

                <form className="space-y-4" onSubmit={handleAddressSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}

                  {/* Address */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street Address"
                    />
                  </div>

                  {/* City */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  </div>

                  {/* Country */}
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 z-10" />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* State/Province */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800 z-10" />
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required={states.length > 0}
                      disabled={states.length === 0}
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:opacity-50"
                    >
                      <option value="">
                        {states.length === 0 ? 'Select Country First' : 'Select State/Province'}
                      </option>
                      {states.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Zip/Postal Code with Auto-lookup */}
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Zip/Postal Code (auto-fills location)"
                    />
                    {isLookingUpPostal && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 text-center">
                    💡 Enter your postal code first for automatic location detection
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2E318E] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg"
                  >
                    {loading ? 'Processing...' : 'Continue to Credentials'}
                  </button>
                </form>
              </motion.div>
            )}


            {step === 'credentials' && (
              <motion.div
                key="credentials"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl font-bold text-black text-center">Account Credentials</h2>
                  <p className="text-sm text-black text-center">Set your email, username, and password</p>
                </div>
                
                <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="text-red-600 text-sm">{error}</span>
                    </div>
                  )}

                  {/* Email Address */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="E-mail Address"
                    />
                  </div>

                  {/* Username */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-800" />
                    <input
                      type="text"
                      name="username"
                      value={formData.displayName} // Using displayName as username
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#F1F2F4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Username (already entered)"
                      readOnly
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
                      placeholder="Password *"
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
                      placeholder="Confirm Password *"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleChange}
                      required
                      className="mt-1 accent-blue-600"
                    />
                    <label className="text-sm text-black">
                      Agree all Terms & Conditions
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2E318E] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg"
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
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-black text-center">Account Created Successfully!</h2>
                  <p className="text-sm text-black text-center max-w-md">
                    Your account will be reviewed by our admin team. You&apos;ll receive access once approved, typically within 24-48 hours.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => window.location.href = '/sign-in'}
                    className="w-full bg-[#2E318E] hover:bg-blue-700 text-white py-3 rounded-lg"
                  >
                    Go to Sign In
                  </button>

                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-black py-3 rounded-lg"
                  >
                    Return to Home
                  </button>
                </div>
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
