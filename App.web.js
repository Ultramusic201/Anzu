import React from 'react';
import { View, Text } from 'react-native';

export default function AppWeb() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 8 }}>
        SQLite no está soportado en Web
      </Text>
      <Text style={{ color: '#6b7280', textAlign: 'center', marginBottom: 16 }}>
        Abre esta app en Android/iOS (Expo Go o emulador) para usar la base de datos local.
      </Text>
      <Text style={{ textAlign: 'center' }}>
        En la terminal de Expo:
        {"\n"}• Presiona "a" para Android
        {"\n"}• O escanea el QR con Expo Go
      </Text>
    </View>
  );
}
