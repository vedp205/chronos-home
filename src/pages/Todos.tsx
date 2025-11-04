import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Todo {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  completed: boolean;
  priority: string;
}

export default function Todos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [open, setOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
  });

  useEffect(() => {
    if (user) {
      fetchTodos();
      requestNotificationPermission();
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const checkDueNotifications = (todos: Todo[]) => {
    const now = new Date();
    todos.forEach((todo) => {
      if (!todo.completed && todo.due_date) {
        const dueDate = new Date(todo.due_date);
        const diff = dueDate.getTime() - now.getTime();
        const hoursUntilDue = diff / (1000 * 60 * 60);

        if (hoursUntilDue <= 1 && hoursUntilDue > 0) {
          if (Notification.permission === 'granted') {
            new Notification('Task Due Soon!', {
              body: `"${todo.title}" is due in less than an hour`,
              icon: '/favicon.ico',
            });
          }
        }
      }
    });
  };

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('due_date', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch todos',
        variant: 'destructive',
      });
    } else {
      setTodos(data || []);
      checkDueNotifications(data || []);
    }
  };

  const handleToggleComplete = async (todo: Todo) => {
    const { error } = await supabase
      .from('todos')
      .update({
        completed: !todo.completed,
        completed_at: !todo.completed ? new Date().toISOString() : null,
      })
      .eq('id', todo.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update todo',
        variant: 'destructive',
      });
    } else {
      fetchTodos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...formData,
      due_date: formData.due_date || null,
    };

    if (editingTodo) {
      const { error } = await supabase
        .from('todos')
        .update(data)
        .eq('id', editingTodo.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update todo',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Todo updated successfully' });
        fetchTodos();
        setOpen(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from('todos')
        .insert([{ ...data, user_id: user?.id }]);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create todo',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Success', description: 'Todo created successfully' });
        fetchTodos();
        setOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete todo',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Success', description: 'Todo deleted successfully' });
      fetchTodos();
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', due_date: '', priority: 'medium' });
    setEditingTodo(null);
  };

  const openEditDialog = (todo: Todo) => {
    setEditingTodo(todo);
    setFormData({
      title: todo.title,
      description: todo.description,
      due_date: todo.due_date ? format(new Date(todo.due_date), "yyyy-MM-dd'T'HH:mm") : '',
      priority: todo.priority,
    });
    setOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">To-Do List</h1>
          <p className="text-muted-foreground">Stay organized and productive</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => {
          setOpen(val);
          if (!val) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTodo ? 'Edit Task' : 'Create New Task'}</DialogTitle>
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date & Time</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingTodo ? 'Update Task' : 'Create Task'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {todos.map((todo) => (
          <Card key={todo.id} className={`shadow-card hover:shadow-elevated transition-shadow ${todo.completed ? 'opacity-60' : ''}`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through' : ''}`}>
                    {todo.title}
                  </h3>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground mt-1">{todo.description}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    {todo.due_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(todo.due_date), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                    <span className={`capitalize font-medium ${getPriorityColor(todo.priority)}`}>
                      {todo.priority} priority
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(todo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(todo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {todos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tasks yet. Create your first task!</p>
        </div>
      )}
    </div>
  );
}