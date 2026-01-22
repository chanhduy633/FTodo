// Notification utility functions for browser notifications

// Store for scheduled reminders
const scheduledReminders = new Map();

// LocalStorage key for persisting reminders
const REMINDERS_STORAGE_KEY = 'todox_scheduled_reminders';

/**
 * Request permission for browser notifications
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

/**
 * Show a notification for an urgent task
 * @param {Object} task - The task object
 * @param {string} reminderType - Type of reminder (15min, 30min, 1hour, 1day)
 */
export const showTaskNotification = (task, reminderType = '') => {
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }

  const reminderText = reminderType ? ` (${reminderType})` : '';
  const options = {
    body: `Task due soon${reminderText}: ${task.title}`,
    icon: '/vite.svg', // You can replace with your app icon
    badge: '/vite.svg',
    tag: `task-${task._id}-${reminderType}`, // Prevents duplicate notifications for same task and reminder type
    requireInteraction: false,
    silent: false
  };

  const notification = new Notification('Task Reminder', options);

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);

  // Handle click to focus window
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
};

/**
 * Save scheduled reminders to localStorage
 */
const saveRemindersToStorage = () => {
  const remindersData = Array.from(scheduledReminders.entries()).map(([key, timeoutId]) => {
    const [taskId, reminderType] = key.split('-');
    return { key, taskId, reminderType, timeoutId: null }; // We can't serialize timeoutId
  });
  localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(remindersData));
};

/**
 * Restore scheduled reminders from localStorage (called on app startup)
 */
export const restoreRemindersFromStorage = () => {
  try {
    const stored = localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (stored) {
      const remindersData = JSON.parse(stored);
      // Clear any existing reminders
      scheduledReminders.clear();
      // Note: We can't restore the actual timeouts, but we mark them as "restored"
      remindersData.forEach(({ key }) => {
        scheduledReminders.set(key, null); // null indicates restored but not active
      });
    }
  } catch (error) {
    console.error('Error restoring reminders from storage:', error);
  }
};

/**
 * Schedule reminders for a task at different intervals before due date
 * @param {Object} task - The task object
 */
export const scheduleTaskReminders = (task) => {
  if (!task.dueDate || task.status === 'complete') {
    return;
  }

  // Cancel any existing reminders for this task
  cancelTaskReminders(task._id);

  const now = new Date();
  let dueDateTime = new Date(task.dueDate);

  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':');
    dueDateTime.setHours(parseInt(hours), parseInt(minutes));
  }

  const reminderIntervals = [
    { label: '1day', ms: 24 * 60 * 60 * 1000 }, // 1 day before
    { label: '1hour', ms: 60 * 60 * 1000 }, // 1 hour before
    { label: '30min', ms: 30 * 60 * 1000 }, // 30 minutes before
    { label: '15min', ms: 15 * 60 * 1000 } // 15 minutes before
  ];

  reminderIntervals.forEach(({ label, ms }) => {
    const reminderTime = new Date(dueDateTime.getTime() - ms);

    // Only schedule if reminder time is in the future
    if (reminderTime > now) {
      const timeoutId = setTimeout(() => {
        showTaskNotification(task, label);
        // Remove from scheduled reminders after firing
        scheduledReminders.delete(`${task._id}-${label}`);
        saveRemindersToStorage();
      }, reminderTime - now);

      // Store the timeout ID for cancellation
      scheduledReminders.set(`${task._id}-${label}`, timeoutId);
      saveRemindersToStorage();
    }
  });
};

/**
 * Cancel all scheduled reminders for a specific task
 * @param {string} taskId - The task ID
 */
export const cancelTaskReminders = (taskId) => {
  // Find all reminders for this task
  const taskReminders = Array.from(scheduledReminders.entries())
    .filter(([key]) => key.startsWith(`${taskId}-`));

  // Clear timeouts and remove from map
  taskReminders.forEach(([key, timeoutId]) => {
    clearTimeout(timeoutId);
    scheduledReminders.delete(key);
  });
};

/**
 * Update reminders when task is modified
 * @param {Object} oldTask - The old task object
 * @param {Object} newTask - The new task object
 */
export const updateTaskReminders = (oldTask, newTask) => {
  // Cancel old reminders
  cancelTaskReminders(oldTask._id);

  // Schedule new reminders if task still has due date and is not complete
  if (newTask.dueDate && newTask.status !== 'complete') {
    scheduleTaskReminders(newTask);
  }
};

/**
 * Check if notifications are supported and permitted
 */
export const areNotificationsSupported = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Get the count of scheduled reminders for a task
 * @param {string} taskId - The task ID
 * @returns {number} Number of scheduled reminders
 */
export const getScheduledReminderCount = (taskId) => {
  return Array.from(scheduledReminders.keys())
    .filter(key => key.startsWith(`${taskId}-`)).length;
};
