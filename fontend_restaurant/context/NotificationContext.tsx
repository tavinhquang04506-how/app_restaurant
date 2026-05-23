import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextValue {
  notify: (message: string, type?: NotificationType) => void;
  notifySuccess: (message: string) => void;
  notifyError: (message: string) => void;
  notifyInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const TYPE_STYLES: Record<NotificationType, string> = {
  success: 'border-green-500 bg-green-50 text-green-800',
  error: 'border-red-500 bg-red-50 text-red-800',
  info: 'border-blue-500 bg-blue-50 text-blue-800',
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: NotificationType = 'info') => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, type, message }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      notifySuccess: (msg: string) => notify(msg, 'success'),
      notifyError: (msg: string) => notify(msg, 'error'),
      notifyInfo: (msg: string) => notify(msg, 'info'),
    }),
    [notify]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-3 max-w-xs w-full">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-lg border-l-4 px-4 py-3 shadow-lg transition-all ${TYPE_STYLES[item.type]}`}
          >
            <p className="text-sm font-medium">{item.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

