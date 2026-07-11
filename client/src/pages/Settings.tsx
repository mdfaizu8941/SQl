import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '../components/ThemeProvider';
import { Moon, Sun, Monitor, Globe, DownloadCloud, AlertTriangle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  
  // Export State
  const [exportFormat, setExportFormat] = useState('json');
  const [isExporting, setIsExporting] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await axios.get(`/api/user/export?format=${exportFormat}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateStr = new Date().toISOString().split('T')[0];
      const ext = exportFormat === 'json' ? 'json' : exportFormat === 'csv' ? 'csv' : 'sql';
      link.setAttribute('download', `sql-studio-export-${dateStr}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Data exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return toast.error('Please type DELETE to confirm');
    if (!deletePassword) return toast.error('Password is required');

    try {
      setIsDeleting(true);
      const res = await axios.delete('/api/user/delete-account', {
        data: { password: deletePassword }
      });
      
      if (res.data.success) {
        toast.success('Account deleted successfully');
        setShowDeleteModal(false);
        // Clear all auth data
        localStorage.clear();
        sessionStorage.clear();
        if (logout) {
          logout();
        } else {
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-lg">
          Manage your application preferences and workspace settings.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>
              Customize how SQL Studio looks on your device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant={theme === 'light' ? 'default' : 'outline'} 
                className="flex-1 justify-start h-12"
                onClick={() => setTheme('light')}
              >
                <Sun className="w-4 h-4 mr-3" /> Light Mode
              </Button>
              <Button 
                variant={theme === 'dark' ? 'default' : 'outline'} 
                className="flex-1 justify-start h-12"
                onClick={() => setTheme('dark')}
              >
                <Moon className="w-4 h-4 mr-3" /> Dark Mode
              </Button>
              <Button 
                variant={theme === 'system' ? 'default' : 'outline'} 
                className="flex-1 justify-start h-12"
                onClick={() => setTheme('system')}
              >
                <Monitor className="w-4 h-4 mr-3" /> System
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Language & Region
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Language</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option className="bg-background">English (US)</option>
                <option className="bg-background">Spanish</option>
                <option className="bg-background">French</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-primary" /> Export Data
            </CardTitle>
            <CardDescription>
              Download an archive of all your saved queries and workspace settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <select 
                className="flex h-10 w-full sm:w-[150px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={isExporting}
              >
                <option value="json" className="bg-background">JSON</option>
                <option value="csv" className="bg-background">CSV</option>
                <option value="sql" className="bg-background">SQL</option>
              </select>
              <Button variant="outline" onClick={handleExport} disabled={isExporting} className="flex-1">
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DownloadCloud className="w-4 h-4 mr-2" />}
                Request Data Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Delete Account</Button>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-card border border-border shadow-lg rounded-lg overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-destructive">Delete Account</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    This action is <strong className="text-foreground">permanent and cannot be undone</strong>.
                  </p>
                  <div className="text-sm space-y-2 bg-destructive/10 p-4 rounded-md text-destructive/90">
                    <p className="font-semibold">All of the following will be deleted:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Profile & Uploaded Profile Picture</li>
                      <li>Query History & Saved Queries</li>
                      <li>Database Schemas</li>
                      <li>Settings & Sessions</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">
                      Please type <strong className="text-destructive font-mono">DELETE</strong> to confirm
                    </label>
                    <Input 
                      value={deleteConfirmText} 
                      onChange={(e) => setDeleteConfirmText(e.target.value)} 
                      placeholder="DELETE"
                      disabled={isDeleting}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-sm font-medium">Current Password</label>
                    <Input 
                      type="password" 
                      value={deletePassword} 
                      onChange={(e) => setDeletePassword(e.target.value)}
                      disabled={isDeleting}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
                  <Button 
                    variant="destructive" 
                    disabled={deleteConfirmText !== 'DELETE' || !deletePassword || isDeleting}
                    onClick={handleDeleteAccount}
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Permanently Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
