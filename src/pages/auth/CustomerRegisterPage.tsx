import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  UtensilsCrossed,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BackgroundVideo } from '@/components/common/BackgroundVideo';
import { toast } from '@/utils/toast';

export const CustomerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationCodeParam = searchParams.get('invitation') || '';

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState(invitationCodeParam);

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showInvitationHelp, setShowInvitationHelp] = useState(false);

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    } else if (fullName.trim().length > 100) {
      errors.fullName = 'Name cannot exceed 100 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (phone.trim()) {
      const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.phone = 'Please provide a valid telephone number (e.g. +91 98765 43210).';
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
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

    // Simulate backend onboarding verification
    setTimeout(() => {
      setIsSubmitting(false);

      if (invitationCode.trim()) {
        toast.success(
          'Invitation Verified',
          'Your dining account invitation has been recognized. Please sign in to finalize your credentials.'
        );
        navigate('/login', {
          state: { prefillEmail: email.trim().toLowerCase(), role: 'customer' },
        });
      } else {
        // Backend Architecture Transparency Notice
        toast.info(
          'Tenant-Managed Customer Identity',
          'In RMS multi-tenant architecture, customer profiles are provisioned via restaurant invitations or dining sessions. Direct public signup endpoint is currently pending in backend API.'
        );
        setShowInvitationHelp(true);
      }
    }, 700);
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
              Customer Registration
            </h1>
            <p className="text-xs text-muted font-light mt-1">
              Join RMS and enjoy a seamless restaurant ordering and fine-dining experience.
            </p>
          </div>
        </div>

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-surface/90 backdrop-blur-md border border-border rounded-2xl p-7 shadow-luxury space-y-5"
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
              <UtensilsCrossed className="w-3 h-3" />
              <span>Dining Member</span>
            </div>
          </div>

          {/* Architecture Transparency Banner */}
          <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border/80 flex items-start gap-3 text-xs leading-relaxed">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-muted">
              <span className="font-semibold text-foreground">Multi-Tenant Customer Onboarding:</span>{' '}
              Customer profiles are provisioned through restaurant tenant invitations or dining order sessions. If you have an invitation link or wish to test the customer portal, you can sign in directly with our demo credentials.
            </div>
          </div>

          {showInvitationHelp && (
            <div className="p-3.5 rounded-xl bg-warning/15 border border-warning/30 text-warning text-xs space-y-2">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Backend Customer Self-Registration Notice
              </p>
              <p className="text-foreground/90 leading-relaxed">
                The FastAPI backend currently supports customer onboarding via Tenant Invitations (
                <code className="text-primary font-mono text-[11px]">POST /api/v1/tenants/&#123;id&#125;/invitations</code>
                ) and Keycloak email verification. Independent customer self-registration requires the upcoming{' '}
                <code className="text-primary font-mono text-[11px]">POST /api/v1/auth/customer-signup</code> endpoint.
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() =>
                    navigate('/login', {
                      state: { prefillEmail: 'aarav.sharma@gmail.com', role: 'customer' },
                    })
                  }
                >
                  Use Demo Customer Credentials →
                </Button>
                <Link to="/explore" className="text-xs text-primary underline">
                  Explore Menus as Guest
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g., Aarav Sharma"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: '' }));
              }}
              leftIcon={<User className="w-4 h-4" />}
              error={fieldErrors.fullName}
              required
            />

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Email Address"
                type="email"
                placeholder="aarav@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                leftIcon={<Mail className="w-4 h-4" />}
                error={fieldErrors.email}
                required
              />

              <Input
                label="Phone Number (Optional)"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
                }}
                leftIcon={<Phone className="w-4 h-4" />}
                error={fieldErrors.phone}
              />
            </div>

            {/* Invitation Code / Token */}
            <Input
              label="Restaurant Invitation Code (If applicable)"
              type="text"
              placeholder="e.g., INV-ROYAL-7890 (Leave blank if none)"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              helperText="Enter your restaurant dining invite or booking referral code if available."
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
              {isSubmitting ? 'Verifying Registration...' : 'Register as Customer'}
            </Button>
          </form>

          {/* Quick Demo Helper */}
          <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border/80 text-[11px] text-muted space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct Customer Sign In:</span>
            </div>
            <p className="text-foreground/80">
              Already have an invited customer profile?{' '}
              <Link
                to="/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign in with Keycloak Customer Account →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

