// Luyện tập: AI tạo tin nhắn thật/giả, ông bà đoán, Mark & Bit giải thích.
// Mỗi lượt 5 câu, cuối lượt có màn tổng kết "kiểu hay nhầm". Kiểu nào đoán sai được gửi lại cho AI để ra thêm bài kiểu đó.
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { getPractice, type PracticeItem } from './api';
import { Avatar, BigButton, Card, COLORS, DialogueLine, RiskShape, styles, TopBar } from './ui';
import { speakLines, stopSpeaking } from './voice';

const ROUND = 5;

type Answer = { kind: string; correct: boolean };

export function PracticeScreen({ onBack }: { onBack: () => void }) {
  const [item, setItem] = useState<PracticeItem | null>(null);
  const [answer, setAnswer] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [weakSpots, setWeakSpots] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState(-1);

  async function load() {
    stopSpeaking();
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
    setAnswers((a) => [...a, { kind: item.kind, correct }]);
    if (!correct) setWeakSpots((w) => [item.kind, ...w.filter((k) => k !== item.kind)].slice(0, 5));
    Haptics.notificationAsync(correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(
      () => {},
    );
    speakLines(
      [
        { speaker: 'Bit', text: correct ? 'Ông bà đoán đúng rồi!' : 'Ôi, lần này chưa đúng ạ.' },
        { speaker: 'Mark', text: item.explanation },
      ],
      setSpeakingIndex,
    );
  }

  function next() {
    if (answers.length > 0 && answers.length % ROUND === 0) {
      stopSpeaking();
      setDone(true);
      return;
    }
    load();
  }

  function newRound() {
    setDone(false);
    setAnswers([]);
    load();
  }

  // Số câu đã trả lời trong lượt hiện tại (sau câu thứ 5 vẫn tính là 5 cho tới khi sang lượt mới).
  const answeredInRound = answer === null || answers.length === 0 ? answers.length % ROUND : ((answers.length - 1) % ROUND) + 1;
  const roundAnswers = answers.slice(answers.length - answeredInRound);
  const position = answer === null ? answeredInRound + 1 : answeredInRound;
  const correct = item && answer !== null ? answer === item.isScam : null;

  if (done) {
    const right = roundAnswers.filter((a) => a.correct).length;
    const missed = [...new Set(roundAnswers.filter((a) => !a.correct).map((a) => a.kind))];
    return (
      <>
        <TopBar title="Tổng kết" onBack={onBack} backLabel="Trang đầu" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 72 }}>{right === ROUND ? '🏆' : right >= 3 ? '👏' : '💪'}</Text>
            <Text style={[styles.h1, { textAlign: 'center' }]}>
              Đúng {right}/{ROUND} câu
            </Text>
            <Stars value={right} />
          </View>
          {missed.length > 0 ? (
            <Card borderColor={COLORS.warn} style={{ backgroundColor: COLORS.warnSoft }}>
              <Text style={styles.h2}>Kiểu ông bà hay nhầm</Text>
              {missed.map((k) => (
                <Text key={k} style={styles.body}>
                  • {k}
                </Text>
              ))}
              <Text style={styles.muted}>Lượt sau Mark và Bit sẽ ra thêm bài kiểu này để ông bà quen mặt.</Text>
            </Card>
          ) : (
            <Card borderColor={COLORS.safe} style={{ backgroundColor: COLORS.safeSoft }}>
              <Text style={styles.body}>Ông bà không nhầm câu nào. Kẻ lừa đảo khó qua mặt ông bà lắm!</Text>
            </Card>
          )}
          <BigButton icon="🔁" label="Chơi lượt mới" onPress={newRound} />
          <BigButton label="Về trang đầu" outline color={COLORS.muted} onPress={onBack} />
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <TopBar title={`Luyện tập · Câu ${position}/${ROUND}`} onBack={onBack} backLabel="Trang đầu" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityLabel={`Câu ${position} trên ${ROUND}`}>
          {Array.from({ length: ROUND }).map((_, i) => {
            const a = i < answeredInRound ? roundAnswers[i] : undefined;
            const bg = a ? (a.correct ? COLORS.safe : COLORS.danger) : i === position - 1 ? COLORS.primary : COLORS.border;
            return <View key={i} style={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: bg }} />;
          })}
        </View>

        {!item && !error && (
          <Card>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.body, { textAlign: 'center' }]}>Mark và Bit đang soạn câu đố…</Text>
          </Card>
        )}
        {error && (
          <Card borderColor={COLORS.warn}>
            <Text style={styles.body}>Chưa tải được bài. Ông bà thử lại nhé.</Text>
            <BigButton label="Thử lại" onPress={load} />
          </Card>
        )}

        {item && (
          <>
            {/* Tin nhắn dạng bong bóng như trên điện thoại */}
            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#9E9E9E', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{item.sender.trim().charAt(0).toUpperCase() || '?'}</Text>
                </View>
                <Text style={[styles.muted, { fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                  {item.sender}
                </Text>
              </View>
              <View style={{ backgroundColor: '#E9E9EB', borderRadius: 20, borderTopLeftRadius: 4, padding: 16, marginRight: 24 }}>
                <Text style={styles.body}>{item.message}</Text>
              </View>
            </View>

            {answer === null ? (
              <>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Avatar speaker="Bit" size={44} />
                  <Text style={[styles.h2, { flex: 1, fontSize: 24 }]}>Theo ông bà, tin này là…</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <BigButton icon="🦊" label="Lừa đảo" color={COLORS.danger} onPress={() => guess(true)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <BigButton icon="🙂" label="Tin thật" color={COLORS.safe} onPress={() => guess(false)} />
                  </View>
                </View>
              </>
            ) : (
              <View style={{ gap: 16 }}>
                <View
                  accessible
                  accessibilityLiveRegion="polite"
                  style={{
                    backgroundColor: correct ? COLORS.safe : COLORS.danger,
                    borderRadius: 18,
                    padding: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <RiskShape risk={item.isScam ? 'cao' : 'thấp'} size={56} inverted />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>{correct ? 'Đúng rồi!' : 'Chưa đúng'}</Text>
                    <Text style={{ color: '#fff', fontSize: 22, marginTop: 4 }}>
                      Đây là {item.isScam ? 'tin LỪA ĐẢO' : 'tin THẬT'}.
                    </Text>
                  </View>
                </View>
                <DialogueLine line={{ speaker: 'Mark', text: item.explanation }} active={speakingIndex === 1} />
                <BigButton
                  icon="➡️"
                  label={answers.length % ROUND === 0 ? 'Xem tổng kết' : 'Câu tiếp theo'}
                  onPress={next}
                />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <Text accessibilityLabel={`${value} trên ${ROUND} sao`} style={{ fontSize: 36, letterSpacing: 4 }}>
      {'★'.repeat(value)}
      <Text style={{ color: COLORS.border }}>{'★'.repeat(ROUND - value)}</Text>
    </Text>
  );
}
