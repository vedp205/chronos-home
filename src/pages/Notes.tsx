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
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
}

export default function Notes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: null as string | null,
  });

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive',
      });
    } else {
      setNotes(data || []);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    } else {
      const { data } = supabase.storage.from('uploads').getPublicUrl(fileName);
      setFormData({ ...formData, image_url: data.publicUrl });
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNote) {
      const { error } = await supabase
        .from('notes')
        .update(formData)
        .eq('id', editingNote.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update note',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Note updated successfully' });
        fetchNotes();
        setOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('notes')
        .insert([{ ...formData, user_id: user?.id }]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create note',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Note created successfully' });
        fetchNotes();
        setOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Note deleted successfully' });
      fetchNotes();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', image_url: null });
    setEditingNote(null);
  };

  const openEditDialog = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      image_url: note.image_url,
    });
    setOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="text-2xl">{editingNote ? 'Edit Note' : 'New Note'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title..."
                  className="text-3xl font-bold border-0 px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  required
                />
                {formData.image_url && (
                  <div className="relative group my-4">
                    <img
                      src={formData.image_url}
                      alt="Note attachment"
                      className="w-full rounded-lg border shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setFormData({ ...formData, image_url: null })}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Image
                    </Button>
                  </div>
                )}
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Start writing..."
                  className="min-h-[300px] border-0 px-0 text-base leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                />
              </div>
              <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading}
                    className="gap-2"
                  >
                    <ImageIcon className="h-4 w-4" />
                    {uploading ? 'Uploading...' : formData.image_url ? 'Change Image' : 'Add Image'}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={uploading} className="min-w-[100px]">
                    {editingNote ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {notes.map((note) => (
          <Card key={note.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{note.title}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(note)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {note.image_url && (
                <img
                  src={note.image_url}
                  alt={note.title}
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
              <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No notes yet. Create your first note!</p>
        </div>
      )}
    </div>
  );
}