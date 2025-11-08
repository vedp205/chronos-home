import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Upload, X } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  const handleImageUpload = async (file: File) => {
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

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
      toast({ title: 'Image added', description: 'Drag to reposition or continue writing' });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Notes</h1>
          <p className="text-muted-foreground">Capture your thoughts and ideas</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
            <DialogHeader className="px-8 pt-8 pb-0">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {editingNote ? 'Edit Note' : 'New Note'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Untitled"
                  className="text-4xl font-bold border-0 px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/30"
                  required
                />
                
                <div 
                  className={`relative transition-colors rounded-lg ${
                    isDragging ? 'bg-primary/5 border-2 border-dashed border-primary p-4' : ''
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10 pointer-events-none rounded-lg">
                      <div className="text-center">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-primary animate-bounce" />
                        <p className="text-lg font-semibold text-primary">Drop image here</p>
                      </div>
                    </div>
                  )}
                  
                  {formData.image_url && (
                    <div className="relative group my-4 rounded-xl overflow-hidden border-2 border-border/50 shadow-md">
                      <img
                        src={formData.image_url}
                        alt="Note attachment"
                        className="w-full max-h-96 object-contain bg-muted/20"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg gap-2"
                        onClick={() => setFormData({ ...formData, image_url: null })}
                      >
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  )}
                  
                  <Textarea
                    ref={textareaRef}
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Start writing... or drag and drop an image anywhere"
                    className="min-h-[400px] border-0 px-0 text-lg leading-relaxed resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
              
              <div className="px-8 py-5 border-t bg-muted/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading}
                    className="gap-2 h-10"
                  >
                    <Upload className="h-4 w-4" />
                    {uploading ? 'Uploading...' : formData.image_url ? 'Change Image' : 'Add Image'}
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">or drag & drop</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                    className="h-10"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={uploading} 
                    className="min-w-[100px] h-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md"
                  >
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
          <Card key={note.id} className="group shadow-sm hover:shadow-xl transition-all overflow-hidden border-border/50 hover:border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-xl font-bold line-clamp-2">{note.title}</CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => openEditDialog(note)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {note.image_url && (
                <img
                  src={note.image_url}
                  alt={note.title}
                  className="w-full h-48 object-cover rounded-lg border border-border/50"
                />
              )}
              <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-border/50">
          <Plus className="h-16 w-16 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No notes yet</p>
          <p className="text-sm text-muted-foreground/60">Create your first note to get started</p>
        </div>
      )}
    </div>
  );
}