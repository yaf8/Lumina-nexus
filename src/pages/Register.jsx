import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Calendar, User, Phone } from 'lucide-react';
import { useAuth, useLanguage } from '../context';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    const result = await register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      password: formData.password,
    });
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-950 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
            {t('auth.register')}
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Create your account to get started.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('auth.firstName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 ${
                      errors.firstName ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('auth.lastName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 ${
                      errors.lastName ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder="Doe"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 ${
                    errors.email ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.phoneNumber')} <span className="text-slate-400">({t('common.optional')})</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full pl-12 pr-12 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 ${
                    errors.password ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 ${
                    errors.confirmPassword ? 'ring-2 ring-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3">
              <input 
                type="checkbox" 
                required
                className="mt-1 rounded border-slate-300 text-sky-500 focus:ring-sky-500" 
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                I agree to the{' '}
                <Link to="/terms" className="text-sky-600 hover:text-sky-700">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-sky-600 hover:text-sky-700">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.register')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-8 text-center text-slate-600 dark:text-slate-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-sky-600 hover:text-sky-700 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
