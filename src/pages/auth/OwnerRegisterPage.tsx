import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BackgroundVideo } from '@/components/common/BackgroundVideo';
import { toast } from '@/utils/toast';
import { extractErrorMessage } from '@/utils/apiError';
import { TenantSignupResponse } from '@/types/auth';

export const OwnerRegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [tenantName, setTenantName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [registrationSuccess, setRegistrationSuccess] = useState<TenantSignupResponse | null>(null);

  // Validate form inputs
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!tenantName.trim()) {
      errors.tenantName = 'Restaurant or business name is required.';
    } else if (tenantName.trim().length < 2) {
      errors.tenantName = 'Restaurant name must be at least 2 characters.';
    } else if (tenantName.trim().length > 100) {
      errors.tenantName = 'Restaurant name cannot exceed 100 characters.';
    }

    if (!firstName.trim()) {
      errors.firstName = 'First name is required.';
    } else if (firstName.trim().length > 50) {
      errors.firstName = 'First name cannot exceed 50 characters.';
    }

    if (!lastName.trim()) {
      errors.lastName = 'Last name is required.';
    } else if (lastName.trim().length > 50) {
      errors.lastName = 'Last name cannot exceed 50 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Owner email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (password.length > 128) {
      errors.password = 'Password cannot exceed 128 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setFieldErrors({});

    try {
      const payload = {
        tenant_name: tenantName.trim(),
        owner: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          password,
        },
      };

      const result = await authService.signupTenant(payload);
      setRegistrationSuccess(result);
      toast.success(
        'Restaurant Registration Successful',
        `Tenant "${tenantName.trim()}" and your owner credentials have been established.`
      );
    } catch (err: any) {
      const msg = extractErrorMessage(err);
      toast.error('Registration Failed', msg);
      setFieldErrors({ general: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-foreground flex flex-col justify-center py-12 px-6 relative overflow-hidden transition-colors duration-300">
      {/* Cinematic Background Video */}
      <BackgroundVideo
        videoSrc="/videos/restaurant-ambience.mp4"
        posterSrc="/videos/restaurant-poster.jpg"
      />

      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle size="sm" showLabel />
      </div>

      <div className="max-w-xl mx-auto w-full relative z-10 space-y-6">
        {/* Header / Brand */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <span className="text-sm font-bold text-primary font-serif tracking-wider flex items-center justify-center w-8 h-8 rounded-full border border-primary/40 group-hover:border-primary transition-all">
              RMS
            </span>
            <span className="font-serif text-2xl tracking-[0.2em] uppercase font-medium text-foreground group-hover:text-primary transition-colors">
              RMS
            </span>
          </Link>

          <div>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-foreground">
              Register Your Restaurant
            </h1>
            <p className="text-xs text-muted font-light mt-1">
              Establish your multi-tenant culinary enterprise and management account.
            </p>
          </div>
        </div>

        {/* Form Container or Success Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-7 shadow-luxury space-y-5"
        >
          <AnimatePresence mode="wait">
            {!registrationSuccess ? (
              <motion.div
                key="register-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                {/* Navigation Back */}
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <Link
                    to="/register"
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Role Selection</span>
                  </Link>

                  <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/30 text-[10px] text-primary uppercase tracking-wider font-medium">
                    <Store className="w-3 h-3" />
                    <span>Tenant Signup API</span>
                  </div>
                </div>

                {/* General Form Error Alert */}
                {fieldErrors.general && (
                  <div className="p-3.5 rounded-xl bg-danger/15 border border-danger/30 text-danger text-xs leading-relaxed">
                    <p className="font-semibold">Unable to Complete Registration</p>
                    <p className="mt-0.5 opacity-90">{fieldErrors.general}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Business / Restaurant Name */}
                  <Input
                    label="Restaurant or Business Name"
                    type="text"
                    placeholder="e.g., Royal Thali House"
                    value={tenantName}
                    onChange={(e) => {
                      setTenantName(e.target.value);
                      if (fieldErrors.tenantName) setFieldErrors((prev) => ({ ...prev, tenantName: '' }));
                    }}
                    leftIcon={<Store className="w-4 h-4" />}
                    error={fieldErrors.tenantName}
                    required
                  />

                  {/* Owner Full Name - First & Last */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Owner First Name"
                      type="text"
                      placeholder="e.g., Rajesh"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (fieldErrors.firstName) setFieldErrors((prev) => ({ ...prev, firstName: '' }));
                      }}
                      leftIcon={<User className="w-4 h-4" />}
                      error={fieldErrors.firstName}
                      required
                    />
                    <Input
                      label="Owner Last Name"
                      type="text"
                      placeholder="e.g., Sharma"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (fieldErrors.lastName) setFieldErrors((prev) => ({ ...prev, lastName: '' }));
                      }}
                      leftIcon={<User className="w-4 h-4" />}
                      error={fieldErrors.lastName}
                      required
                    />
                  </div>

                  {/* Owner Email */}
                  <Input
                    label="Executive / Owner Email"
                    type="email"
                    placeholder="owner@yourrestaurant.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={fieldErrors.email}
                    helperText="This email will be registered as the root OWNER in Keycloak Identity Provider."
                    required
                  />

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }}
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted hover:text-foreground transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={fieldErrors.password}
                      required
                    />

                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword)
                          setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-muted hover:text-foreground transition-colors"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={fieldErrors.confirmPassword}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full mt-2 font-medium tracking-wide"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering Restaurant Tenant...' : 'Create Restaurant Account'}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="text-center text-xs text-muted pt-2 border-t border-border/60">
                  Already registered?{' '}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign in with Tenant Owner Credentials →
                  </Link>
                </div>
              </motion.div>
            ) : (
              /* REGISTRATION SUCCESS VIEW */
              <motion.div
                key="register-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5 py-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/15 border border-success/30 text-success flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-2xl font-normal text-foreground">
                    Tenant Account Established
                  </h3>
                  <p className="text-xs text-muted max-w-md mx-auto leading-relaxed">
                    Your restaurant enterprise <strong className="text-foreground">{tenantName}</strong> has been
                    registered on the RMS platform.
                  </p>
                </div>

                {/* Tenant & Owner Credentials Metadata */}
                <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border/80 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-muted border-b border-border/60 pb-2">
                    <span className="font-medium text-foreground">Registered Tenant Organization</span>
                    <span className="font-mono text-primary">{registrationSuccess.tenant_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted border-b border-border/60 pb-2">
                    <span>Owner Account Email</span>
                    <span className="font-mono text-foreground">{email}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted">
                    <span>Keycloak User ID</span>
                    <span className="font-mono text-xs">{registrationSuccess.user_id}</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => navigate('/login', { state: { prefillEmail: email, role: 'admin' } })}
                  >
                    Proceed to Owner Sign-In <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>

                  <Link
                    to="/"
                    className="block text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Return to RMS Homepage
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

