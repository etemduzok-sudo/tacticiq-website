// useFormState Hook
// TacticIQ - Centralized Form State Management

import { useState, useCallback, useMemo } from 'react';

/**
 * Generic Form State Hook
 * Replaces 20+ useState calls with a single object
 */
export function useFormState<T extends Record<string, any>>(
  initialState: T
) {
  const [formData, setFormData] = useState<T>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isDirty, setIsDirty] = useState(false);

  /**
   * Update a single field
   * Optimized to prevent unnecessary re-renders
   */
  const setField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setFormData(prev => {
      // Prevent update if value hasn't changed
      if (prev[field] === value) return prev;
      
      setIsDirty(true);
      return { ...prev, [field]: value };
    });
  }, []);

  /**
   * Update multiple fields at once
   */
  const setFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialState]);

  /**
   * Reset to specific values
   */
  const resetTo = useCallback((newState: T) => {
    setFormData(newState);
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, []);

  /**
   * Mark field as touched
   */
  const touchField = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  /**
   * Set field error
   */
  const setFieldError = useCallback(<K extends keyof T>(
    field: K,
    error: string | undefined
  ) => {
    setErrors(prev => {
      if (!error) {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Validate form with custom validator
   */
  const validate = useCallback((
    validator: (data: T) => Partial<Record<keyof T, string>>
  ) => {
    const newErrors = validator(formData);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Check if form is valid
   */
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  /**
   * Get field props (for easy binding to inputs)
   */
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: formData[field],
    onChange: (value: T[K]) => setField(field, value),
    onBlur: () => touchField(field),
    error: errors[field],
    touched: touched[field],
  }), [formData, errors, touched, setField, touchField]);

  return {
    // State
    formData,
    errors,
    touched,
    isDirty,
    isValid,
    
    // Actions
    setField,
    setFields,
    reset,
    resetTo,
    touchField,
    setFieldError,
    clearErrors,
    validate,
    getFieldProps,
  };
}

/**
 * Example Usage:
 * 
 * const { formData, setField, reset, isValid } = useFormState({
 *   firstHalfHomeScore: null,
 *   firstHalfAwayScore: null,
 *   yellowCards: null,
 *   // ... 20+ more fields
 * });
 * 
 * // Instead of:
 * // const [firstHalfHomeScore, setFirstHalfHomeScore] = useState(null);
 * // const [firstHalfAwayScore, setFirstHalfAwayScore] = useState(null);
 * // ... 20+ more useState calls
 * 
 * // Update a field:
 * setField('firstHalfHomeScore', 2);
 * 
 * // Access value:
 * console.log(formData.firstHalfHomeScore);
 * 
 * // Reset:
 * reset();
 */
