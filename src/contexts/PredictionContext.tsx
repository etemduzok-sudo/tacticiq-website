// ============================================
// PREDICTION CONTEXT
// ============================================
// Tahmin state management
// ============================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// TYPES
// ============================================

export interface Prediction {
  id?: string;
  userId: string;
  matchId: number;
  homeScore: number;
  awayScore: number;
  firstGoal?: 'home' | 'away' | 'none';
  totalGoals?: '0-1' | '2-3' | '4+';
  yellowCards?: number;
  redCards?: number;
  corners?: number;
  focusedPredictions?: string[];
  trainingType?: 'attack' | 'defense' | 'balanced';
  createdAt?: string;
  updatedAt?: string;
}

export interface PredictionScore {
  id: string;
  predictionId: string;
  totalScore: number;
  tempoScore: number;
  disiplinScore: number;
  fizikselScore: number;
  bireyselScore: number;
  focusBonus: number;
  accuracyPercentage: number;
  calculatedAt: string;
}

interface PredictionContextType {
  predictions: Prediction[];
  currentPrediction: Prediction | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  savePrediction: (prediction: Prediction) => Promise<void>;
  updatePrediction: (id: string, data: Partial<Prediction>) => Promise<void>;
  deletePrediction: (id: string) => Promise<void>;
  getUserPredictions: (userId: string) => Promise<void>;
  getPredictionById: (id: string) => Promise<void>;
  getMatchPredictions: (matchId: number) => Promise<Prediction[]>;
  clearError: () => void;
  setCurrentPrediction: (prediction: Prediction | null) => void;
}

// ============================================
// CONTEXT
// ============================================

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

interface PredictionProviderProps {
  children: ReactNode;
}

export function PredictionProvider({ children }: PredictionProviderProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // API Base URL - Backend port 3001
  const API_URL = __DEV__ 
    ? 'http://localhost:3001/api'
    : 'https://api.tacticiq.com/api';

  // ============================================
  // ACTIONS
  // ============================================

  // Save new prediction
  const savePrediction = useCallback(async (prediction: Prediction) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prediction),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save prediction');
      }

      // Add to local state
      setPredictions(prev => [result.data, ...prev]);
      setCurrentPrediction(result.data);

      // Cache locally
      await AsyncStorage.setItem(
        `prediction-${result.data.id}`,
        JSON.stringify(result.data)
      );

      console.log('✅ Prediction saved successfully');
    } catch (err: any) {
      console.error('❌ Error saving prediction:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Update existing prediction
  const updatePrediction = useCallback(async (id: string, data: Partial<Prediction>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/predictions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update prediction');
      }

      // Update local state
      setPredictions(prev =>
        prev.map(p => (p.id === id ? result.data : p))
      );

      if (currentPrediction?.id === id) {
        setCurrentPrediction(result.data);
      }

      // Update cache
      await AsyncStorage.setItem(
        `prediction-${id}`,
        JSON.stringify(result.data)
      );

      console.log('✅ Prediction updated successfully');
    } catch (err: any) {
      console.error('❌ Error updating prediction:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentPrediction]);

  // Delete prediction
  const deletePrediction = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/predictions/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete prediction');
      }

      // Remove from local state
      setPredictions(prev => prev.filter(p => p.id !== id));

      if (currentPrediction?.id === id) {
        setCurrentPrediction(null);
      }

      // Remove from cache
      await AsyncStorage.removeItem(`prediction-${id}`);

      console.log('✅ Prediction deleted successfully');
    } catch (err: any) {
      console.error('❌ Error deleting prediction:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [API_URL, currentPrediction]);

  // Get user predictions
  const getUserPredictions = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/predictions/user/${userId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch predictions');
      }

      setPredictions(result.data);
      console.log(`✅ Fetched ${result.data.length} predictions`);
    } catch (err: any) {
      console.error('❌ Error fetching predictions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Get prediction by ID
  const getPredictionById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/predictions/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch prediction');
      }

      setCurrentPrediction(result.data);
      console.log('✅ Prediction fetched successfully');
    } catch (err: any) {
      console.error('❌ Error fetching prediction:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Get match predictions (for comparison)
  const getMatchPredictions = useCallback(async (matchId: number): Promise<Prediction[]> => {
    try {
      const response = await fetch(`${API_URL}/predictions/match/${matchId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch match predictions');
      }

      return result.data;
    } catch (err: any) {
      console.error('❌ Error fetching match predictions:', err);
      return [];
    }
  }, [API_URL]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: PredictionContextType = {
    predictions,
    currentPrediction,
    loading,
    error,
    savePrediction,
    updatePrediction,
    deletePrediction,
    getUserPredictions,
    getPredictionById,
    getMatchPredictions,
    clearError,
    setCurrentPrediction,
  };

  return (
    <PredictionContext.Provider value={value}>
      {children}
    </PredictionContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePrediction must be used within PredictionProvider');
  }
  return context;
}
