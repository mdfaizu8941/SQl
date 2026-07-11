import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { UserCircle, Mail, Key, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function Profile() {
  const { user, login } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error('Name is required');
    
    try {
      setIsSavingProfile(true);
      const res = await axios.put('/api/user/profile', {
        name,
        avatarBase64
      });
      
      if (res.data.success) {
        toast.success('Profile updated successfully');
        const token = localStorage.getItem('token');
        if (token) {
          login(token, res.data.user);
        }
        setAvatarBase64(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) return toast.error('Current password is required');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
    if (newPassword.length < 6) return toast.error('New password must be at least 6 characters');

    try {
      setIsSavingPassword(true);
      const res = await axios.put('/api/user/password', {
        currentPassword,
        newPassword
      });
      
      if (res.data.success) {
        toast.success('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-lg">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 overflow-hidden relative group">
                {avatarBase64 || user?.avatar ? (
                  <img src={avatarBase64 || user?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-12 h-12 text-primary" />
                )}
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-medium text-lg">Avatar</h3>
                <p className="text-sm text-muted-foreground mb-3">JPG, GIF or PNG. Max size of 2MB.</p>
                <div className="flex gap-3">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    Upload new
                  </Button>
                  {(avatarBase64 || user?.avatar) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive"
                      onClick={() => setAvatarBase64('')}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-muted-foreground" /> Full Name
                </label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" /> Email Address
                </label>
                <Input value={email} disabled type="email" />
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-muted-foreground" /> Current Password
                </label>
                <Input 
                  type="password" 
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="pt-2">
              <Button variant="secondary" onClick={handleSavePassword} disabled={isSavingPassword}>
                {isSavingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
