/**
 * Canlı Maç Event Bildirimleri
 * Yeni event geldiğinde push notification + ses
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { playEventSound } from './eventSoundService';

// Bildirim ayarları
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let hasPermission = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (hasPermission) return true;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      hasPermission = true;
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    hasPermission = status === 'granted';
    return hasPermission;
  } catch {
    return false;
  }
}

function getEventNotificationTitle(eventType: string): string {
  const t: Record<string, string> = {
    goal: '⚽ GOL!',
    penalty: '⚽ Penaltı golü!',
    'own-goal': '⚽ Kendi kalesine gol',
    kickoff: 'Maç başladı',
    halftime: 'İlk yarı bitti',
    fulltime: 'Maç bitti',
    yellow: '🟨 Sarı kart',
    red: '🟥 Kırmızı kart',
    'second-yellow': '🟥 İkinci sarı kart',
    var: '📺 VAR incelemesi',
    'var-check': '📺 VAR incelemesi',
    substitution: '🔄 Oyuncu değişikliği',
    subst: '🔄 Oyuncu değişikliği',
  };
  return t[eventType] || 'Maç olayı';
}

export async function notifyNewEvent(
  event: { type: string; detail?: string; player?: string; score?: string },
  matchInfo?: { homeTeam?: string; awayTeam?: string }
): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const title = getEventNotificationTitle(event.type);
    let body = '';
    if (event.player) body += event.player;
    if (event.score) body += (body ? ' • ' : '') + event.score;

    await playEventSound(event.type, event.detail);

    const granted = await ensureNotificationPermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: body || (matchInfo ? `${matchInfo.homeTeam} - ${matchInfo.awayTeam}` : ''),
        sound: true,
      },
      trigger: null, // Hemen göster
    });
  } catch {
    // Sessizce geç
  }
}
