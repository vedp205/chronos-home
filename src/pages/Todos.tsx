import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Edit, Trash2, Calendar, Filter, ArrowUpDown } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created'>('due_date');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        const firstIncompleteTodo = filteredAndSortedTodos.find(t => !t.completed);
        if (firstIncompleteTodo) {
          handleToggleComplete(firstIncompleteTodo);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [todos, filterStatus, filterPriority, sortBy]);

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
      case 'high': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const filteredAndSortedTodos = todos
    .filter((todo) => {
      if (filterStatus === 'active') return !todo.completed;
      if (filterStatus === 'completed') return todo.completed;
      return true;
    })
    .filter((todo) => {
      if (filterPriority === 'all') return true;
      return todo.priority === filterPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'due_date') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      }
      return 0;
    });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">To-Do List</h1>
            <p className="text-muted-foreground">Stay organized and productive • Press <kbd className="px-2 py-0.5 text-xs bg-muted border border-border rounded">Ctrl+N</kbd> for new task</p>
          </div>
          <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingTodo ? 'Edit Task' : 'Create New Task'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title" className="font-semibold">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title..."
                    className="h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date" className="font-semibold">Due Date & Time</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="font-semibold">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔴 High</SelectItem>
                      <SelectItem value="medium">🟡 Medium</SelectItem>
                      <SelectItem value="low">🟢 Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md">
                  {editingTodo ? 'Update Task' : 'Create Task'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-3 items-center p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          </div>
          <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="high">🔴 High</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="low">🟢 Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="h-4 w-px bg-border mx-1" />
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created">Created</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredAndSortedTodos.map((todo) => (
          <Card key={todo.id} className={`group shadow-sm hover:shadow-lg transition-all border-l-4 ${
            todo.priority === 'high' ? 'border-l-red-500 hover:border-l-red-600' : 
            todo.priority === 'medium' ? 'border-l-yellow-500 hover:border-l-yellow-600' : 
            'border-l-green-500 hover:border-l-green-600'
          } ${todo.completed ? 'opacity-60 bg-muted/30' : 'bg-card'}`}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggleComplete(todo)}
                  className="mt-1.5 h-5 w-5 data-[state=checked]:bg-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className={`text-lg font-semibold ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {todo.title}
                    </h3>
                    <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => openEditDialog(todo)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(todo.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {todo.description && (
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{todo.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    {todo.due_date && (
                      <div className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-primary">{format(new Date(todo.due_date), 'MMM dd, yyyy • h:mm a')}</span>
                      </div>
                    )}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border capitalize ${getPriorityColor(todo.priority)}`}>
                      {todo.priority === 'high' ? '🔴' : todo.priority === 'medium' ? '🟡' : '🟢'} {todo.priority}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAndSortedTodos.length === 0 && todos.length > 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border/50">
          <p className="text-muted-foreground">No tasks match your filters</p>
        </div>
      )}

      {todos.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-border/50">
          <p className="text-muted-foreground mb-2">No tasks yet. Create your first task!</p>
          <p className="text-sm text-muted-foreground/60">Press <kbd className="px-2 py-0.5 text-xs bg-muted border border-border rounded">Ctrl+N</kbd> to get started</p>
        </div>
      )}
    </div>
  );
}