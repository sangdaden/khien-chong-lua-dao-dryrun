// Luồng lõi: chọn ảnh → gửi proxy → thẻ màu theo mức nguy hiểm → Mark & Bit đọc to → Hỏi con cháu.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, Text, View } from 'react-native';
import { checkImage, type CheckResult } from './api';
import { pickImage, type PickedImage } from './image';
import { BigButton, Card, COLORS, DialogueLine, RISK_STYLE, styles } from './ui';
import { speakLines, stopSpeaking } from './voice';

type State =
  | { step: 'pick' }
  | { step: 'loading'; image: PickedImage }
  | { step: 'result'; image: PickedImage; result: CheckResult }
  | { step: 'error'; image: PickedImage };

export function CheckScreen({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<State>({ step: 'pick' });
  const [speakingIndex, setSpeakingIndex] = useState(-1);

  useEffect(() => stopSpeaking, []);

  async function start(source: 'library' | 'camera') {
    const image = await pickImage(source);
    if (!image) return;
    analyze(image);
  }

  async function analyze(image: PickedImage) {
    setState({ step: 'loading', image });
    try {
      const result = await checkImage(image.base64);
      setState({ step: 'result', image, result });
      speakLines(result.dialogue, setSpeakingIndex);
    } catch (err) {
      console.warn(err);
      setState({ step: 'error', image });
    }
  }

  async function askFamily(image: PickedImage, result: CheckResult) {
    const message = [
      'Bố/mẹ nhận được tin này, con xem giúp có phải lừa đảo không?',
      `App Khiên chống lừa đảo đánh giá: ${RISK_STYLE[result.risk].label}.`,
      result.title,
      ...result.reasons.map((r) => `- ${r}`),
    ].join('\n');
    // iOS gửi được cả ảnh lẫn chữ; Android chỉ gửi chữ (giới hạn của Share API).
    await Share.share({ message, url: image.uri });
  }

  function reset() {
    stopSpeaking();
    setSpeakingIndex(-1);
    setState({ step: 'pick' });
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {state.step === 'pick' && (
        <>
          <Text style={styles.h1}>Kiểm tra tin nhắn</Text>
          <Text style={styles.body}>
            Ông bà chụp màn hình tin nhắn đáng ngờ, rồi chọn ảnh đó ở đây. Mark và Bit sẽ xem giúp.
          </Text>
          <BigButton icon="🖼️" label="Chọn ảnh chụp màn hình" onPress={() => start('library')} />
          <BigButton icon="📷" label="Chụp ảnh màn hình khác" outline onPress={() => start('camera')} />
          <BigButton label="Quay lại" outline color={COLORS.muted} onPress={onBack} />
        </>
      )}

      {state.step !== 'pick' && <Image source={{ uri: state.image.uri }} style={styles.preview} resizeMode="contain" />}

      {state.step === 'loading' && (
        <Card>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={[styles.body, { textAlign: 'center' }]}>Mark và Bit đang đọc tin nhắn...</Text>
        </Card>
      )}

      {state.step === 'error' && (
        <>
          <Card borderColor={COLORS.warn}>
            <Text style={styles.h2}>Chưa kiểm tra được</Text>
            <Text style={styles.body}>Mạng có thể đang chậm. Ông bà thử lại, hoặc gửi cho con cháu xem trước nhé.</Text>
          </Card>
          <BigButton icon="🔁" label="Thử lại" onPress={() => analyze(state.image)} />
          <BigButton label="Chọn ảnh khác" outline onPress={reset} />
        </>
      )}

      {state.step === 'result' && (
        <ResultView
          result={state.result}
          speakingIndex={speakingIndex}
          onReplay={() => speakLines(state.result.dialogue, setSpeakingIndex)}
          onAskFamily={() => askFamily(state.image, state.result)}
          onAgain={reset}
          onHome={() => {
            stopSpeaking();
            onBack();
          }}
        />
      )}
    </ScrollView>
  );
}

function ResultView(props: {
  result: CheckResult;
  speakingIndex: number;
  onReplay: () => void;
  onAskFamily: () => void;
  onAgain: () => void;
  onHome: () => void;
}) {
  const { result } = props;
  const risk = RISK_STYLE[result.risk] ?? RISK_STYLE['trung bình'];
  return (
    <View style={{ gap: 16 }}>
      <View style={{ backgroundColor: risk.color, borderRadius: 18, padding: 18 }}>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900' }}>
          {risk.icon} {risk.label}
        </Text>
        <Text style={{ color: '#fff', fontSize: 22, lineHeight: 30, marginTop: 6 }}>{result.title}</Text>
      </View>

      <Card>
        <Text style={styles.h2}>Vì sao?</Text>
        {result.reasons.map((r, i) => (
          <Text key={i} style={styles.body}>
            • {r}
          </Text>
        ))}
      </Card>

      <Card borderColor={risk.color}>
        <Text style={styles.h2}>Nên làm gì?</Text>
        <Text style={styles.body}>{result.advice}</Text>
      </Card>

      {result.dialogue.map((line, i) => (
        <DialogueLine key={i} line={line} active={props.speakingIndex === i} />
      ))}

      <BigButton icon="👨‍👩‍👧" label="Hỏi con cháu" color={COLORS.safe} onPress={props.onAskFamily} />
      <BigButton icon="🔊" label="Nghe lại" outline onPress={props.onReplay} />
      <BigButton label="Kiểm tra tin khác" outline onPress={props.onAgain} />
      <BigButton label="Về trang đầu" outline color={COLORS.muted} onPress={props.onHome} />
    </View>
  );
}
