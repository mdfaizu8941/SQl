import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if(!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
      toast.success("Reset code sent to your email");
    }, 1000);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if(otp.length !== 6) {
      toast.error("Enter a valid 6-digit code");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-background to-background z-0" />
      
      <div className="w-full max-w-md relative z-10">
        <Card step={step} />
        
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border/50 rounded-2xl shadow-xl p-8"
            >
              <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
              <p className="text-muted-foreground text-sm mb-6">Enter your email and we'll send you a link to reset your password.</p>
              
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      className="pl-9" 
                      placeholder="name@company.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border/50 rounded-2xl shadow-xl p-8"
            >
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm mb-6">We sent a 6-digit code to <strong>{email}</strong>.</p>
              
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Code</label>
                  <Input 
                    type="text" 
                    placeholder="123456"
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\\D/g, ''))}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
                  {isLoading ? 'Verifying...' : 'Verify Code'}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-card border border-border/50 rounded-2xl shadow-xl p-8"
            >
              <h1 className="text-2xl font-bold mb-2">Set new password</h1>
              <p className="text-muted-foreground text-sm mb-6">Must be at least 8 characters long.</p>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Reset Password'}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border/50 rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Password reset</h1>
              <p className="text-muted-foreground text-sm mb-8">Your password has been successfully reset. Click below to log in magically.</p>
              <Link to="/login">
                <Button className="w-full">Continue to Login <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        
        {step < 4 && (
          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple step indicator
function Card({ step }: { step: number }) {
  if (step === 4) return null;
  return (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3].map(i => (
        <div 
          key={i} 
          className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-4 bg-primary/50' : 'w-4 bg-primary/20'}`} 
        />
      ))}
    </div>
  );
}
