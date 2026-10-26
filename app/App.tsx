import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isDemo } from './src/api';
import { CheckScreen } from './src/CheckScreen';
import { PracticeScreen } from './src/PracticeScreen';
import { Avatar, BigButton, COLORS, styles } from './src/ui';

type Screen = 'home' | 'check' | 'practice';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const home = () => setScreen('home');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        {screen === 'home' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.h1}>🛡️ Khiên chống lừa đảo</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Avatar speaker="Mark" />
              <Avatar speaker="Bit" />
              <Text style={[styles.body, { flex: 1 }]}>Mark và Bit giúp ông bà nhận ra tin nhắn lừa đảo.</Text>
            </View>
            <BigButton icon="🔍" label="Kiểm tra tin nhắn" onPress={() => setScreen('check')} />
            <BigButton icon="🎯" label="Luyện tập" outline onPress={() => setScreen('practice')} />
            {isDemo && (
              <Text style={[styles.muted, { color: COLORS.warn }]}>
                Đang chạy chế độ DEMO (chưa nối proxy): kết quả là mẫu cố định.
              </Text>
            )}
          </ScrollView>
        )}
        {screen === 'check' && <CheckScreen onBack={home} />}
        {screen === 'practice' && <PracticeScreen onBack={home} />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
