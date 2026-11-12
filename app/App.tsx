import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CheckScreen, type CheckStart } from './src/CheckScreen';
import { FamilyScreen } from './src/FamilyScreen';
import { HistoryRow, HomeScreen } from './src/HomeScreen';
import { PracticeScreen } from './src/PracticeScreen';
import { ResultView } from './src/ResultView';
import { clearHistory, loadFamily, loadHistory, type FamilyContact, type HistoryItem } from './src/storage';
import { BigButton, COLORS, styles, TopBar } from './src/ui';
import { speakLines, stopSpeaking } from './src/voice';

type Screen =
  | { name: 'home' }
  | { name: 'check'; start: CheckStart }
  | { name: 'practice' }
  | { name: 'family'; returnTo: Screen }
  | { name: 'history' }
  | { name: 'historyItem'; item: HistoryItem };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [family, setFamily] = useState<FamilyContact | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [speakingIndex, setSpeakingIndex] = useState(-1);

  const refreshHistory = () => loadHistory().then(setHistory);
  useEffect(() => {
    loadFamily().then(setFamily);
    refreshHistory();
  }, []);

  const home = () => {
    stopSpeaking();
    setScreen({ name: 'home' });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar style={screen.name === 'check' ? 'auto' : 'dark'} />
        {screen.name === 'home' && (
          <HomeScreen
            family={family}
            history={history}
            onCheck={() => setScreen({ name: 'check', start: { kind: 'menu' } })}
            onPaste={() => setScreen({ name: 'check', start: { kind: 'text' } })}
            onSample={(text) => setScreen({ name: 'check', start: { kind: 'text', text } })}
            onPractice={() => setScreen({ name: 'practice' })}
            onFamily={() => setScreen({ name: 'family', returnTo: { name: 'home' } })}
            onHistory={() => setScreen({ name: 'history' })}
            onOpenHistory={(item) => setScreen({ name: 'historyItem', item })}
          />
        )}
        {screen.name === 'check' && (
          <CheckScreen
            start={screen.start}
            family={family}
            onBack={home}
            onSetupFamily={() => setScreen({ name: 'family', returnTo: { name: 'home' } })}
            onChecked={refreshHistory}
          />
        )}
        {screen.name === 'practice' && <PracticeScreen onBack={home} />}
        {screen.name === 'family' && (
          <FamilyScreen
            family={family}
            onDone={(f) => {
              setFamily(f);
              setScreen(screen.returnTo);
            }}
          />
        )}
        {screen.name === 'history' && (
          <>
            <TopBar title="Đã kiểm tra" onBack={home} />
            <ScrollView contentContainerStyle={styles.content}>
              {history.length === 0 && <Text style={styles.body}>Chưa có tin nào.</Text>}
              {history.map((h) => (
                <HistoryRow key={h.id} item={h} onPress={() => setScreen({ name: 'historyItem', item: h })} />
              ))}
              {history.length > 0 && (
                <BigButton
                  label="Xoá lịch sử"
                  outline
                  color={COLORS.muted}
                  onPress={() => clearHistory().then(refreshHistory)}
                />
              )}
            </ScrollView>
          </>
        )}
        {screen.name === 'historyItem' && (
          <>
            <TopBar
              title="Kết quả cũ"
              onBack={() => {
                stopSpeaking();
                setScreen({ name: 'history' });
              }}
            />
            <ResultView
              result={screen.item.result}
              source={
                screen.item.source === 'text'
                  ? { kind: 'text', text: screen.item.snippet ?? '' }
                  : { kind: 'text', text: '(Ảnh chụp màn hình, ảnh không lưu lại trong app)' }
              }
              family={family}
              speakingIndex={speakingIndex}
              onReplay={() => speakLines(screen.item.result.dialogue, setSpeakingIndex)}
              onHome={home}
              onSetupFamily={() => setScreen({ name: 'family', returnTo: screen })}
            />
          </>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
