// Luồng lõi: chọn ảnh hoặc dán chữ → gửi proxy → (đỏ: màn DỪNG LẠI) → kết quả → Mark & Bit đọc to → Hỏi con cháu.
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { checkMessage, type CheckResult } from './api';
import { pickImage, type PickedImage } from './image';
import { ResultView, StopView, type CheckedSource } from './ResultView';
import { addHistory, type FamilyContact } from './storage';
import { BigButton, Card, COLORS, styles, TopBar } from './ui';
import { speakLines, stopSpeaking } from './voice';

export type CheckStart = { kind: 'menu' } | { kind: 'image' } | { kind: 'camera' } | { kind: 'text'; text?: string };

type Pending = { source: CheckedSource; image?: PickedImage };

type State =
  | { step: 'menu' }
  | { step: 'typing'; text: string }
  | { step: 'loading'; pending: Pending }
  | { step: 'stop'; pending: Pending; result: CheckResult }
  | { step: 'result'; pending: Pending; result: CheckResult }
  | { step: 'error'; pending: Pending };

const LOADING_STEPS = ['Đang đọc chữ trong tin nhắn…', 'Đang tìm dấu hiệu lừa đảo…', 'Mark và Bit đang viết lời giải thích…'];

export function CheckScreen(props: {
  start: CheckStart;
  family: FamilyContact | null;
  onBack: () => void;
  onSetupFamily: () => void;
  onChecked: () => void;
}) {
  const [state, setState] = useState<State>(
    props.start.kind === 'text' ? { step: 'typing', text: props.start.text ?? '' } : { step: 'menu' },
  );
  const [speakingIndex, setSpeakingIndex] = useState(-1);
  const [loadingStep, setLoadingStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (props.start.kind === 'image' || props.start.kind === 'camera') startImage(props.start.kind === 'camera' ? 'camera' : 'library');
    // Khay mẫu: có sẵn chữ thì gửi luôn.
    if (props.start.kind === 'text' && props.start.text) analyze({ source: { kind: 'text', text: props.start.text } });
    return () => {
      abortRef.current?.abort();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (state.step !== 'loading') return;
    setLoadingStep(0);
    const t = setInterval(() => setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);
    return () => clearInterval(t);
  }, [state.step]);

  async function startImage(source: 'library' | 'camera') {
    const image = await pickImage(source);
    if (!image) return;
    analyze({ source: { kind: 'image', uri: image.uri }, image });
  }

  async function analyze(pending: Pending) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ step: 'loading', pending });
    try {
      const input = pending.source.kind === 'text' ? { text: pending.source.text } : { imageBase64: pending.image!.base64 };
      const result = await checkMessage(input, controller.signal);
      if (abortRef.current !== controller) return;
      addHistory({
        source: pending.source.kind,
        snippet: pending.source.kind === 'text' ? pending.source.text.slice(0, 600) : undefined,
        result,
      }).then(props.onChecked);
      speakLines(result.dialogue, setSpeakingIndex);
      if (result.risk === 'cao') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Vibration.vibrate([0, 400, 200, 400]);
        setState({ step: 'stop', pending, result });
      } else {
        Haptics.notificationAsync(
          result.risk === 'thấp' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
        ).catch(() => {});
        setState({ step: 'result', pending, result });
      }
    } catch (err) {
      if (abortRef.current !== controller) return; // ông bà đã bấm Huỷ hoặc rời màn
      console.warn(err);
      setState({ step: 'error', pending });
    }
  }

  function cancel() {
    abortRef.current?.abort();
    abortRef.current = null;
    setState({ step: 'menu' });
  }

  function reset() {
    stopSpeaking();
    setSpeakingIndex(-1);
    setState({ step: 'menu' });
  }

  function home() {
    stopSpeaking();
    abortRef.current?.abort();
    abortRef.current = null;
    props.onBack();
  }

  if (state.step === 'stop') {
    return <StopView onContinue={() => setState({ step: 'result', pending: state.pending, result: state.result })} />;
  }

  if (state.step === 'result') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Kết quả" onBack={reset} backLabel="Tin khác" />
        <ResultView
          result={state.result}
          source={state.pending.source}
          family={props.family}
          speakingIndex={speakingIndex}
          onReplay={() => speakLines(state.result.dialogue, setSpeakingIndex)}
          onAgain={reset}
          onHome={home}
          onSetupFamily={props.onSetupFamily}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Kiểm tra tin nhắn" onBack={state.step === 'typing' || state.step === 'error' ? reset : home} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {state.step === 'menu' && (
            <>
              <Text style={styles.body}>Ông bà muốn đưa tin nhắn cho Mark và Bit xem bằng cách nào?</Text>
              <ChoiceCard
                icon="🖼️"
                title="Chọn ảnh chụp màn hình"
                desc="Chụp màn hình tin nhắn trước (bấm cùng lúc nút nguồn và nút tăng âm lượng)."
                onPress={() => startImage('library')}
              />
              <ChoiceCard
                icon="📋"
                title="Dán chữ tin nhắn"
                desc="Nhấn giữ vào tin nhắn, chọn Sao chép, rồi dán vào đây."
                onPress={() => setState({ step: 'typing', text: '' })}
              />
              <ChoiceCard
                icon="📷"
                title="Chụp ảnh màn hình khác"
                desc="Dùng camera chụp tin trên điện thoại, máy tính hoặc tờ giấy."
                onPress={() => startImage('camera')}
              />
            </>
          )}

          {state.step === 'typing' && (
            <>
              <Text style={styles.body}>Dán hoặc gõ tin nhắn vào ô dưới đây:</Text>
              <TextInput
                accessibilityLabel="Ô dán tin nhắn"
                value={state.text}
                onChangeText={(text) => setState({ step: 'typing', text })}
                placeholder="Nhấn giữ vào đây rồi chọn Dán"
                placeholderTextColor={COLORS.muted}
                multiline
                autoFocus
                style={{
                  minHeight: 200,
                  backgroundColor: COLORS.card,
                  borderWidth: 2,
                  borderColor: COLORS.primary,
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 22,
                  lineHeight: 30,
                  color: COLORS.text,
                  textAlignVertical: 'top',
                }}
              />
              <BigButton
                icon="🔍"
                label="Kiểm tra tin này"
                disabled={state.text.trim().length < 5}
                onPress={() => analyze({ source: { kind: 'text', text: state.text.trim() } })}
              />
            </>
          )}

          {state.step === 'loading' && (
            <>
              {state.pending.source.kind === 'image' ? (
                <Image source={{ uri: state.pending.source.uri }} style={styles.preview} resizeMode="contain" />
              ) : (
                <Card>
                  <Text style={styles.body} numberOfLines={6}>
                    {state.pending.source.text}
                  </Text>
                </Card>
              )}
              <Card>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text accessibilityLiveRegion="polite" style={[styles.h2, { textAlign: 'center' }]}>
                  {LOADING_STEPS[loadingStep]}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                  {LOADING_STEPS.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: i <= loadingStep ? COLORS.primary : COLORS.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={[styles.muted, { textAlign: 'center' }]}>Thường mất khoảng 10 giây.</Text>
              </Card>
              <BigButton label="Huỷ" outline color={COLORS.muted} onPress={cancel} />
            </>
          )}

          {state.step === 'error' && (
            <>
              <Card borderColor={COLORS.warn} style={{ backgroundColor: COLORS.warnSoft }}>
                <Text style={styles.h2}>Chưa kiểm tra được</Text>
                <Text style={styles.body}>
                  Mạng có thể đang chậm. Ông bà thử lại, hoặc gửi cho con cháu xem trước nhé. Trong lúc chờ, đừng chuyển tiền.
                </Text>
              </Card>
              <BigButton icon="🔁" label="Thử lại" onPress={() => analyze(state.pending)} />
              <BigButton label="Chọn tin khác" outline onPress={reset} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function ChoiceCard({ icon, title, desc, onPress }: { icon: string; title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={desc}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 2, borderColor: COLORS.primary },
        pressed && { backgroundColor: '#EEF3FF' },
      ]}
    >
      <Text style={{ fontSize: 44 }}>{icon}</Text>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.h2, { color: COLORS.primary, fontSize: 24 }]}>{title}</Text>
        <Text style={[styles.muted, { fontSize: 18, lineHeight: 25 }]}>{desc}</Text>
      </View>
      <Text style={{ fontSize: 32, color: COLORS.primary }}>›</Text>
    </Pressable>
  );
}
