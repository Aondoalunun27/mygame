import { Capacitor } from '@capacitor/core';

let reminderTimer;

function scheduleWebReminder() {
  clearTimeout(reminderTimer);
  const now = new Date();
  const reminderTime = new Date(now);
  reminderTime.setHours(9, 0, 0, 0);
  if (reminderTime <= now) reminderTime.setDate(reminderTime.getDate() + 1);

  reminderTimer = setTimeout(async () => {
    try {
      const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : null;
      if (registration) {
        await registration.showNotification('A new Baller Grid is ready', {
          body: 'Your daily puzzle is waiting.',
          icon: '/assets/icons/football.svg',
          data: { route: 'daily' },
        });
      } else {
        new Notification('A new Baller Grid is ready', {
          body: 'Your daily puzzle is waiting.',
          icon: '/assets/icons/football.svg',
        });
      }
    } catch (error) {
      console.error('Could not show the daily reminder notification.', error);
    }
    scheduleWebReminder();
  }, reminderTime.getTime() - now.getTime());
}

export async function setDailyReminder(enabled, { requestPermission = true } = {}) {
  if (!Capacitor.isNativePlatform()) {
    if (!enabled) {
      clearTimeout(reminderTimer);
      return true;
    }
    if (!('Notification' in globalThis)) return false;
    if (Notification.permission !== 'granted') {
      if (!requestPermission || Notification.permission !== 'default') return false;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return false;
    }
    scheduleWebReminder();
    return true;
  }

  const { LocalNotifications } = await import('@capacitor/local-notifications');
  if (!enabled) {
    await LocalNotifications.cancel({ notifications: [{ id: 101 }] });
    return true;
  }

  let permission = await LocalNotifications.checkPermissions();
  if (permission.display !== 'granted') {
    if (!requestPermission) return false;
    permission = await LocalNotifications.requestPermissions();
  }
  if (permission.display !== 'granted') return false;

  const reminderTime = new Date();
  reminderTime.setHours(9, 0, 0, 0);
  if (reminderTime <= new Date()) reminderTime.setDate(reminderTime.getDate() + 1);
  await LocalNotifications.schedule({
    notifications: [{
      id: 101,
      title: 'A new Baller Grid is ready',
      body: 'Your daily puzzle is waiting.',
      schedule: { at: reminderTime, repeats: true, every: 'day' },
      extra: { route: 'daily' },
    }],
  });
  return true;
}