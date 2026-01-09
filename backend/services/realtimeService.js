// Realtime Service - Supabase Realtime Optimization
const { supabase } = require('../config/database');

class RealtimeService {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
  }

  // Subscribe to live match updates
  subscribeLiveMatches(callback) {
    const channelName = 'live-matches';
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_matches',
          },
          (payload) => {
            console.log('🔴 Live match update:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe((status) => {
          console.log(`📡 Realtime channel ${channelName} status:`, status);
        });
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }
    
    // Add subscriber
    const subscribers = this.subscribers.get(channelName);
    subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers.delete(callback);
      
      // Remove channel if no subscribers
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  // Subscribe to match events (goals, cards, etc.)
  subscribeMatchEvents(matchId, callback) {
    const channelName = `match-events-${matchId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'match_events',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log('⚽ Match event:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }
    
    const subscribers = this.subscribers.get(channelName);
    subscribers.add(callback);
    
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  // Subscribe to user predictions
  subscribeUserPredictions(userId, callback) {
    const channelName = `user-predictions-${userId}`;
    
    if (!this.channels.has(channelName)) {
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'predictions',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('🎯 Prediction update:', payload);
            this.notifySubscribers(channelName, payload);
          }
        )
        .subscribe();
      
      this.channels.set(channelName, channel);
      this.subscribers.set(channelName, new Set());
    }
    
    const subscribers = this.subscribers.get(channelName);
    subscribers.add(callback);
    
    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        this.unsubscribeChannel(channelName);
      }
    };
  }

  notifySubscribers(channelName, payload) {
    const subscribers = this.subscribers.get(channelName);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error notifying subscriber:', error);
        }
      });
    }
  }

  unsubscribeChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscribers.delete(channelName);
      console.log(`🔌 Unsubscribed from channel: ${channelName}`);
    }
  }

  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🔌 Unsubscribed from channel: ${channelName}`);
    });
    
    this.channels.clear();
    this.subscribers.clear();
  }

  getStats() {
    return {
      activeChannels: this.channels.size,
      totalSubscribers: Array.from(this.subscribers.values()).reduce(
        (sum, subs) => sum + subs.size,
        0
      ),
    };
  }
}

// Singleton instance
const realtimeService = new RealtimeService();

module.exports = realtimeService;
