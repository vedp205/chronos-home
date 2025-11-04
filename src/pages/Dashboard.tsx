import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { FolderKanban, Lock, StickyNote, CheckSquare } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    passwords: 0,
    notes: 0,
    todos: 0,
    todosPending: 0,
  });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [projects, passwords, notes, todos] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('passwords').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('todos').select('*', { count: 'exact' }),
      ]);

      const todosData = todos.data || [];
      const pendingTodos = todosData.filter((t) => !t.completed).length;

      setStats({
        projects: projects.count || 0,
        passwords: passwords.count || 0,
        notes: notes.count || 0,
        todos: todos.count || 0,
        todosPending: pendingTodos,
      });
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: 'Projects',
      value: stats.projects,
      icon: FolderKanban,
      color: 'text-blue-500',
    },
    {
      title: 'Passwords',
      value: stats.passwords,
      icon: Lock,
      color: 'text-purple-500',
    },
    {
      title: 'Notes',
      value: stats.notes,
      icon: StickyNote,
      color: 'text-yellow-500',
    },
    {
      title: 'Pending Tasks',
      value: stats.todosPending,
      icon: CheckSquare,
      color: 'text-green-500',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">Here's an overview of your personal management hub</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use the sidebar to navigate to different sections of your personal hub.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your recent activities will appear here
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}