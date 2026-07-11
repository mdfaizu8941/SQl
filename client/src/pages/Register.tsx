import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { DatabaseZap, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      if (data.success) {
        toast.success(data.message || 'OTP sent to email');
        // Passing email to verify-otp page state
        navigate('/verify-otp', { state: { email } });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full mx-auto space-y-8"
        >
          <div className="flex items-center gap-2 mb-8">
            <DatabaseZap className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">SQL Studio</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground">Sign up to start generating AI SQL queries.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  className="pl-9 h-10" 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  className="pl-9 h-10" 
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    className="pl-9 h-10" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    className="pl-9 h-10" 
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 font-semibold mt-2" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-foreground hover:text-primary transition-colors">
              Login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Illustration Section */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-background to-background" />
        <div className="relative z-10 max-w-lg p-12 glass-panel rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md shadow-2xl text-left space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold leading-tight">Join thousands of developers.</h2>
            <p className="text-muted-foreground">
              "SQL Studio changed how our entire data team operates. What used to take hours of documentation reading now takes seconds."
            </p>
            <div className="pt-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">S</div>
              <div>
                <p className="font-semibold text-sm">Sarah Jenkins</p>
                <p className="text-xs text-muted-foreground">Lead Data Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
