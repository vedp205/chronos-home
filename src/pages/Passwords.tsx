import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Copy } from 'lucide-react';

interface Password {
  id: string;
  title: string;
  username: string;
  encrypted_password: string;
  website_url: string;
  notes: string;
}

export default function Passwords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [open, setOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    encrypted_password: '',
    website_url: '',
    notes: '',
  });

  useEffect(() => {
    if (user) fetchPasswords();
  }, [user]);

  const fetchPasswords = async () => {
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch passwords',
        variant: 'destructive',
      });
    } else {
      setPasswords(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPassword) {
      const { error } = await supabase
        .from('passwords')
        .update(formData)
        .eq('id', editingPassword.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update password',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Password updated successfully' });
        fetchPasswords();
        setOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('passwords')
        .insert([{ ...formData, user_id: user?.id }]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to save password',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Password saved successfully' });
        fetchPasswords();
        setOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('passwords').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete password',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Password deleted successfully' });
      fetchPasswords();
    }
  };

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Password copied to clipboard' });
  };

  const resetForm = () => {
    setFormData({ title: '', username: '', encrypted_password: '', website_url: '', notes: '' });
    setEditingPassword(null);
  };

  const openEditDialog = (password: Password) => {
    setEditingPassword(password);
    setFormData({
      title: password.title,
      username: password.username,
      encrypted_password: password.encrypted_password,
      website_url: password.website_url,
      notes: password.notes,
    });
    setOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Password Manager</h1>
          <p className="text-muted-foreground">Securely store and manage your passwords</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPassword ? 'Edit Password' : 'Add New Password'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username/Email</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.encrypted_password}
                  onChange={(e) => setFormData({ ...formData, encrypted_password: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingPassword ? 'Update Password' : 'Save Password'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {passwords.map((password) => (
          <Card key={password.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{password.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(password)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(password.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {password.username && (
                <div>
                  <p className="text-sm text-muted-foreground">Username</p>
                  <p className="text-sm font-medium">{password.username}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-muted p-2 rounded">
                    {visiblePasswords.has(password.id)
                      ? password.encrypted_password
                      : '••••••••'}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePasswordVisibility(password.id)}
                  >
                    {visiblePasswords.has(password.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(password.encrypted_password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {password.website_url && (
                <a
                  href={password.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  Visit Website
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {passwords.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No passwords saved yet. Add your first password!</p>
        </div>
      )}
    </div>
  );
}