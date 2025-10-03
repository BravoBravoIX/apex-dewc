export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  persistent?: boolean
}

// Global notification state
const notifications: Notification[] = []
let setNotifications: React.Dispatch<React.SetStateAction<Notification[]>> | null = null

export const addNotification = (notification: Omit<Notification, 'id'>) => {
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
  }
  
  if (setNotifications) {
    setNotifications(prev => [...prev, newNotification])
  }
}

export const removeNotification = (id: string) => {
  if (setNotifications) {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }
}

export const getNotifications = () => notifications

export const setNotificationSetter = (setter: React.Dispatch<React.SetStateAction<Notification[]>>) => {
  setNotifications = setter
}

export const clearNotificationSetter = () => {
  setNotifications = null
}