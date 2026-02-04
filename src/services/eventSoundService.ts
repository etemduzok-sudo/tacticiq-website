/**
 * Canlı Maç Event Bildirim Sesleri
 * MP3 dosyalarını assets/sounds/ klasörüne ekleyin
 */

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Ses dosyaları - MP3'leri assets/sounds/ içine koyun
// Minimum: whistle_start, whistle_end, goal, yellow_card, red_card
const SOUND_ASSETS: Record<string, number> = {
  whistle_start: require('../../assets/sounds/whistle_start.mp3'),
  whistle_end: require('../../assets/sounds/whistle_end.mp3'),
  whistle_halftime: require('../../assets/sounds/whistle_halftime.mp3'),
  goal: require('../../assets/sounds/goal.mp3'),
  yellow_card: require('../../assets/sounds/yellow_card.mp3'),
  red_card: require('../../assets/sounds/red_card.mp3'),
  var_review: require('../../assets/sounds/var_review.mp3'),
  substitution: require('../../assets/sounds/substitution.mp3'),
  penalty: require('../../assets/sounds/penalty.mp3'),
};
SOUND_ASSETS['default'] = SOUND_ASSETS['goal'];

// Event tipi -> ses asset adı
const EVENT_TO_SOUND: Record<string, string> = {
  kickoff: 'whistle_start',
  halftime: 'whistle_halftime',
  fulltime: 'whistle_end',
  goal: 'goal',
  penalty: 'penalty',
  'own-goal': 'goal',
  yellow: 'yellow_card',
  red: 'red_card',
  'second-yellow': 'red_card',
  var: 'var_review',
  'var-check': 'var_review',
  substitution: 'substitution',
  subst: 'substitution',
};

let soundObject: Audio.Sound | null = null;

function getSoundAsset(eventType: string, detail?: string): number | null {
  const type = (eventType || '').toLowerCase();
  const detailLower = (detail || '').toLowerCase();

  let assetName = EVENT_TO_SOUND[type] || 'default';
  if (type === 'card') {
    assetName = detailLower.includes('red') || detailLower.includes('second yellow')
      ? 'red_card'
      : 'yellow_card';
  }

  return SOUND_ASSETS[assetName] ?? null;
}

/**
 * Haptic feedback (ses yoksa)
 */
async function fallbackHaptic(eventType: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    const important = ['goal', 'red', 'fulltime', 'kickoff'].some((k) =>
      eventType.toLowerCase().includes(k)
    );
    if (important) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Event için bildirim sesi veya haptic çal
 */
export async function playEventSound(eventType: string, detail?: string): Promise<void> {
  try {
    if (Platform.OS === 'web') return;

    const soundModule = getSoundAsset(eventType, detail);

    if (soundModule) {
      if (soundObject) {
        try {
          await soundObject.unloadAsync();
        } catch {
          /* ignore */
        }
        soundObject = null;
      }

      const { sound } = await Audio.Sound.createAsync(soundModule, {
        shouldPlay: true,
        volume: 0.8,
      });
      soundObject = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinishAndNotPlaying) {
          sound.unloadAsync().catch(() => {});
          soundObject = null;
        }
      });
    } else {
      await fallbackHaptic(eventType);
    }
  } catch {
    await fallbackHaptic(eventType);
  }
}

export async function releaseEventSounds(): Promise<void> {
  if (soundObject) {
    try {
      await soundObject.unloadAsync();
    } catch {
      /* ignore */
    }
    soundObject = null;
  }
}
