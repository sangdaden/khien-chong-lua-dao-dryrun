// Luyện tập: AI tạo tin nhắn thật/giả, ông bà đoán, Mark & Bit giải thích.
// Kiểu nào ông bà đoán sai sẽ được gửi lại cho AI để ra thêm bài kiểu đó.
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { getPractice, type PracticeItem } from './api';
import { BigButton, Card, COLORS, DialogueLine, styles } from './ui';
import { speakLines, stopSpeaking } from './voice';

export function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [item, setItem] = useState<PracticeItem | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [score, setScore] = useState({ right: 0, total: 0 });

  async function load() {
    setItem(null);
    setAnswer(null);
    setError(false);
    try {
      const next = await getPractice(weakSpots, recent);
      setItem(next);
      setRecent((r) => [next.kind, ...r].slice(0, 5));
    } catch (err) {
      console.warn(err);
      setError(true);
    }
  }

  useEffect(() => {
    load();
    return stopSpeaking;
  }, []);

  function guess(saysScam: boolean) {
    if (!item) return;
    const correct = saysScam === item.isScam;
    setAnswer(saysScam);
    setScore((s) => ({ right: s.right + (correct ? 1 : 0), total: s.total + 1 }));
    if (!correct) setWeakSpots((w) => [item.kind, ...w.filter((k) => k !== item.kind)].slice(0, 5));
    speakLines([
      { speaker: 'Bit', text: correct ? 'Ông bà đoán đúng rồi!' : 'Ôi, lần này chưa đúng ạ.' },
      { speaker: 'Mark', text: item.explanation },
    ]);
  }

  const correct = item && answer !== null ? answer === item.isScam : null;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Luyện tập</Text>
      <Text style={styles.muted}>
        Đúng {score.right}/{score.total} câu
      </Text>

      {!item && !error && <ActivityIndicator size="large" color={COLORS.primary} />}
      {error && (
        <Card borderColor={COLORS.warn}>
          <Text style={styles.body}>Chưa tải được bài. Ông bà thử lại nhé.</Text>
          <BigButton label="Thử lại" onPress={load} />
        </Card>
      )}

      {item && (
        <>
          <Card>
            <Text style={styles.muted}>Tin nhắn từ: {item.sender}</Text>
            <Text style={styles.body}>{item.message}</Text>
          </Card>

          {answer === null ? (
            <>
              <Text style={styles.h2}>Theo ông bà, tin này là...</Text>
              <BigButton icon="⛔" label="Lừa đảo" color={COLORS.danger} onPress={() => guess(true)} />
              <BigButton icon="✅" label="Tin thật" color={COLORS.safe} onPress={() => guess(false)} />
            </>
          ) : (
            <View style={{ gap: 16 }}>
              <View style={{ backgroundColor: correct ? COLORS.safe : COLORS.danger, borderRadius: 18, padding: 18 }}>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>
                  {correct ? '🎉 Đúng rồi!' : '😮 Chưa đúng'}
                </Text>
                <Text style={{ color: '#fff', fontSize: 22, marginTop: 6 }}>
                  Đây là {item.isScam ? 'tin LỪA ĐẢO' : 'tin THẬT'}.
                </Text>
              </View>
              <DialogueLine line={{ speaker: 'Mark', text: item.explanation }} active={false} />
              <BigButton icon="➡️" label="Câu tiếp theo" onPress={load} />
            </View>
          )}
        </>
      )}

      <BigButton
        label="Về trang đầu"
        outline
        color={COLORS.muted}
        onPress={() => {
          stopSpeaking();
          onBack();
        }}
      />
    </ScrollView>
  );
}
