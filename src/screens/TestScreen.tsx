import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TestScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ UYGULAMA ÇALIŞIYOR!</Text>
      <Text style={styles.subtitle}>Navigation başarılı</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => console.log('Button çalışıyor')}
      >
        <Text style={styles.buttonText}>Test Butonu</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#00D563',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#8B92A7',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#00D563',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
