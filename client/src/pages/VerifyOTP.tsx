import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DatabaseZap, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const type = location.state?.type || 'REGISTER';
  const { login } = useAuth();

  useEffect(() => {
    if (!email) {
      navigate('/register');
      return;
    }
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    
    setIsLoading(true);
    try {
      if (type === 'LOGIN') {
        const { data } = await axios.post('/api/auth/login-verify', { email, otp: code });
        if (data.success) {
          login(data.accessToken, data.user);
          toast.success("Logged in successfully!");
          navigate('/dashboard');
        }
      } else {
        const { data } = await axios.post('/api/auth/verify-otp', { email, otp: code });
        if (data.success) {
          toast.success("Email verified successfully!");
          navigate('/login');
        }
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.error;
      toast.error(typeof errMsg === 'string' ? errMsg : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-border/50 rounded-2xl shadow-xl p-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          
          <h1 className="text-2xl font-bold tracking-tight mb-2">Check your email</h1>
          <p className="text-muted-foreground text-sm mb-8">
            We sent a verification code to <span className="font-semibold text-foreground">your email</span>.
          </p>

          <form onSubmit={handleVerify} className="w-full space-y-8">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg border border-input bg-background text-center text-lg sm:text-xl font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  maxLength={1}
                />
              ))}
            </div>

            <Button type="submit" className="w-full h-11 font-semibold" disabled={isLoading || otp.join('').length < 6}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {timeLeft > 0 ? (
              <p>Resend code in {timeLeft}s</p>
            ) : (
              <button 
                className="text-primary font-medium hover:underline transition-all"
                onClick={() => {
                  setTimeLeft(60);
                  toast.success("A new code was sent to your email.");
                }}
              >
                Resend Code
              </button>
            )}
            <Link to="/login" className="hover:text-foreground transition-colors mt-2">
              Back to Login
            </Link>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-2 text-muted-foreground opacity-50">
          <DatabaseZap className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide">SQL Studio</span>
        </div>
      </motion.div>
    </div>
  );
}
