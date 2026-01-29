import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { User, Activity, LogEntry } from './AdminDataTypes';

// Context Type
interface AdminUsersContextType {
  users: User[];
  activities: Activity[];
  logs: LogEntry[];
  addUser: (user: Omit<User, 'id' | 'joinDate'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  filterLogs: (type: 'all' | 'info' | 'success' | 'warning' | 'error') => LogEntry[];
  // Internal: Allow other contexts to add logs
  _addLog: (log: Omit<LogEntry, 'id' | 'time'>) => void;
  _addActivity: (activity: Omit<Activity, 'id' | 'time'>) => void;
}

// Create Context
const AdminUsersContext = createContext<AdminUsersContextType | undefined>(undefined);

// Provider Component
export function AdminUsersProvider({ children }: { children: ReactNode }) {
  // Users - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('admin_users');
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  // Activities - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('admin_activities');
    return savedActivities ? JSON.parse(savedActivities) : [];
  });

  // Logs - Gerçek veriler localStorage'dan yüklenecek veya API'den gelecek
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const savedLogs = localStorage.getItem('admin_logs');
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  // User CRUD
  const addUser = (user: Omit<User, 'id' | 'joinDate'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      joinDate: new Date().toISOString().split('T')[0],
    };
    setUsers([newUser, ...users]);
    
    // Add activity
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: 'user',
      title: 'Yeni Kullanıcı Eklendi',
      description: `${user.email} sisteme eklendi`,
      time: 'Az önce',
    };
    setActivities([newActivity, ...activities]);

    // Add log
    _addLog({
      type: 'info',
      message: 'Yeni kullanıcı eklendi',
      user: user.email,
    });
  };

  const updateUser = (id: string, updatedUser: Partial<User>) => {
    setUsers(users.map(user => user.id === id ? { ...user, ...updatedUser } : user));
    
    const user = users.find(u => u.id === id);
    if (user) {
      _addLog({
        type: 'info',
        message: 'Kullanıcı bilgileri güncellendi',
        user: user.email,
      });
    }
  };

  const deleteUser = (id: string) => {
    const user = users.find(u => u.id === id);
    setUsers(users.filter(user => user.id !== id));
    
    if (user) {
      _addLog({
        type: 'warning',
        message: 'Kullanıcı silindi',
        user: user.email,
      });
    }
  };

  // Filter logs
  const filterLogs = (type: 'all' | 'info' | 'success' | 'warning' | 'error') => {
    if (type === 'all') return logs;
    return logs.filter(log => log.type === type);
  };

  // Internal: Add log (for use by other contexts)
  const _addLog = (log: Omit<LogEntry, 'id' | 'time'>) => {
    const newLog: LogEntry = {
      ...log,
      id: Date.now().toString(),
      time: log.time || new Date().toLocaleString('tr-TR'),
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  // Internal: Add activity (for use by other contexts)
  const _addActivity = (activity: Omit<Activity, 'id' | 'time'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      time: activity.time || 'Az önce',
    };
    setActivities([newActivity, ...activities]);
  };

  // Save users to localStorage
  useEffect(() => {
    localStorage.setItem('admin_users', JSON.stringify(users));
  }, [users]);

  // Save activities to localStorage
  useEffect(() => {
    localStorage.setItem('admin_activities', JSON.stringify(activities));
  }, [activities]);

  // Save logs to localStorage
  useEffect(() => {
    localStorage.setItem('admin_logs', JSON.stringify(logs));
  }, [logs]);

  // Context value
  const value = useMemo(() => ({
    users,
    activities,
    logs,
    addUser,
    updateUser,
    deleteUser,
    filterLogs,
    _addLog,
    _addActivity,
  }), [users, activities, logs]);

  return <AdminUsersContext.Provider value={value}>{children}</AdminUsersContext.Provider>;
}

// Hook
export function useAdminUsers() {
  const context = useContext(AdminUsersContext);
  if (!context) {
    throw new Error('useAdminUsers must be used within AdminUsersProvider');
  }
  return context;
}

// Safe hook that doesn't throw
export function useAdminUsersSafe() {
  return useContext(AdminUsersContext);
}
