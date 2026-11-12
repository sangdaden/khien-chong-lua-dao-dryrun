// Màn Kết quả (S5) và màn DỪNG LẠI (S4).
// Thứ tự đọc từ trên xuống theo đúng câu hỏi trong đầu ông bà: Có nguy hiểm không? → Làm gì ngay? → Vì sao?
import { Fragment, type ReactNode } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import type { CheckResult } from './api';
import type { FamilyContact } from './storage';
import { BigButton, Card, COLORS, DialogueLine, RiskShape, riskStyle, styles } from './ui';

export type CheckedSource = { kind: 'image'; uri: string } | { kind: 'text'; text: string };

export function StopView({ onContinue }: { onContinue: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dừng lại! Tin này rất đáng ngờ. Đừng chuyển tiền, đừng bấm link. Chạm để xem vì sao."
      onPress={onContinue}
      style={{ flex: 1, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 24 }}
    >
      <RiskShape risk="cao" size={150} inverted />
      <Text style={{ color: '#fff', fontSize: 56, fontWeight: '900', textAlign: 'center' }}>DỪNG LẠI!</Text>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', lineHeight: 38 }}>
        Đừng chuyển tiền.{'\n'}Đừng bấm link.{'\n'}Đừng đọc mã OTP.
      </Text>
      <View style={{ backgroundColor: '#fff', borderRadius: 18, paddingVertical: 18, paddingHorizontal: 28, marginTop: 12 }}>
        <Text style={{ color: COLORS.danger, fontSize: 24, fontWeight: '800' }}>Chạm để xem vì sao ›</Text>
      </View>
    </Pressable>
  );
}

export function buildShareMessage(result: CheckResult, source: CheckedSource) {
  const s = riskStyle(result.risk);
  const signs = result.evidence?.length
    ? result.evidence.map((e) => `- "${e.quote}": ${e.why}`)
    : result.reasons.map((r) => `- ${r}`);
  return [
    'Bố/mẹ nhận được tin này, con xem giúp có phải lừa đảo không?',
    source.kind === 'text' ? `\nTin nhắn: "${source.text}"\n` : '',
    `App Khiên chống lừa đảo đánh giá: ${s.label}.`,
    result.title,
    ...signs,
  ]
    .filter(Boolean)
    .join('\n');
}

export async function shareWithFamily(result: CheckResult, source: CheckedSource) {
  const message = buildShareMessage(result, source);
  // Chỉ iOS gửi kèm ảnh được; Android và web chỉ gửi chữ (web còn báo lỗi nếu url là ảnh trong máy).
  try {
    await Share.share(Platform.OS === 'ios' && source.kind === 'image' ? { message, url: source.uri } : { message });
  } catch (err) {
    console.warn(err);
  }
}

export function callFamily(contact: FamilyContact) {
  Linking.openURL(`tel:${contact.phone.replace(/[^\d+]/g, '')}`).catch((err) => console.warn(err));
}

// Tô đỏ những câu AI trích ra ngay trong tin nhắn gốc.
function Highlighted({ text, quotes }: { text: string; quotes: string[] }) {
  const parts: ReactNode[] = [];
  const lower = text.toLowerCase();
  let i = 0;
  while (i < text.length) {
    let best: { start: number; end: number } | null = null;
    for (const q of quotes) {
      if (!q) continue;
      const start = lower.indexOf(q.toLowerCase(), i);
      if (start >= 0 && (!best || start < best.start)) best = { start, end: start + q.length };
    }
    if (!best) {
      parts.push(text.slice(i));
      break;
    }
    if (best.start > i) parts.push(text.slice(i, best.start));
    parts.push(
      <Text key={best.start} style={{ backgroundColor: COLORS.highlight, color: COLORS.danger, fontWeight: '800' }}>
        {text.slice(best.start, best.end)}
      </Text>,
    );
    i = best.end;
  }
  return <Text style={styles.body}>{parts.map((p, k) => (typeof p === 'string' ? <Fragment key={`t${k}`}>{p}</Fragment> : p))}</Text>;
}

export function ResultView(props: {
  result: CheckResult;
  source: CheckedSource;
  family: FamilyContact | null;
  speakingIndex: number;
  onReplay: () => void;
  onAgain?: () => void;
  onHome: () => void;
  onSetupFamily: () => void;
}) {
  const { result, source, family } = props;
  const s = riskStyle(result.risk);
  const actions = result.actions?.length ? result.actions : [result.advice];
  const evidence = result.evidence ?? [];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 0, paddingHorizontal: 0 }]}>
        {/* Dải màu mức nguy hiểm: màu + hình + chữ */}
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`Kết quả: ${s.label}. ${result.headline ?? ''} ${result.title}`}
          style={{ backgroundColor: s.color, paddingHorizontal: 20, paddingVertical: 24, gap: 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <RiskShape risk={result.risk} size={72} inverted />
            <Text style={{ flex: 1, color: s.textColor, fontSize: result.risk === 'thấp' ? 26 : 34, fontWeight: '900' }}>
              {s.label}
            </Text>
          </View>
          {!!result.headline && (
            <Text style={{ color: s.textColor, fontSize: 30, fontWeight: '800', lineHeight: 38 }}>{result.headline}</Text>
          )}
          <Text style={{ color: s.textColor, fontSize: 22, lineHeight: 30 }}>{result.title}</Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* Việc nên làm ngay */}
          <Card borderColor={s.color} style={{ backgroundColor: s.soft }}>
            <Text accessibilityRole="header" style={styles.h2}>
              Ông bà nên làm ngay
            </Text>
            {actions.map((a, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: s.color,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                  }}
                >
                  <Text style={{ color: s.textColor, fontSize: 20, fontWeight: '900' }}>{i + 1}</Text>
                </View>
                <Text style={[styles.body, { flex: 1 }]}>{a}</Text>
              </View>
            ))}
            <BigButton
              icon="👨‍👩‍👧"
              label="Gửi cho con cháu xem"
              hint="Mở Zalo, Messenger hoặc tin nhắn để gửi kết quả"
              color={COLORS.safe}
              onPress={() => shareWithFamily(result, source)}
            />
          </Card>

          {/* Dấu hiệu: câu trích nguyên văn được tô đỏ */}
          <Card>
            <Text accessibilityRole="header" style={styles.h2}>
              {result.risk === 'thấp' ? 'Mark & Bit đã xem' : 'Dấu hiệu đáng ngờ'}
            </Text>
            {evidence.length > 0
              ? evidence.map((e, i) => (
                  <View key={i} style={{ gap: 6, paddingVertical: 4 }}>
                    <View style={{ backgroundColor: COLORS.highlight, borderLeftWidth: 6, borderLeftColor: COLORS.danger, borderRadius: 8, padding: 10 }}>
                      <Text style={[styles.body, { color: COLORS.danger, fontWeight: '800' }]}>“{e.quote}”</Text>
                    </View>
                    <Text style={styles.body}>→ {e.why}</Text>
                  </View>
                ))
              : result.reasons.map((r, i) => (
                  <Text key={i} style={styles.body}>
                    • {r}
                  </Text>
                ))}
          </Card>

          {/* Tin gốc */}
          <Card>
            <Text style={styles.muted}>Tin ông bà đã gửi</Text>
            {source.kind === 'image' ? (
              <Image
                source={{ uri: source.uri }}
                style={styles.preview}
                resizeMode="contain"
                accessibilityLabel="Ảnh chụp tin nhắn ông bà đã gửi"
              />
            ) : (
              <Highlighted text={source.text} quotes={evidence.map((e) => e.quote)} />
            )}
          </Card>

          {/* Mark & Bit nói chuyện */}
          <Text accessibilityRole="header" style={styles.h2}>
            Mark & Bit giải thích
          </Text>
          {result.dialogue.map((line, i) => (
            <DialogueLine key={i} line={line} active={props.speakingIndex === i} />
          ))}

          {!family && (
            <Pressable
              accessibilityRole="button"
              onPress={props.onSetupFamily}
              style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: 16, padding: 16 }}
            >
              <Text style={[styles.body, { color: COLORS.primary, fontWeight: '700' }]}>
                ＋ Lưu số con cháu để lần sau gọi ngay bằng một nút
              </Text>
            </Pressable>
          )}

          {props.onAgain && <BigButton label="Kiểm tra tin khác" outline onPress={props.onAgain} />}
          <BigButton label="Về trang đầu" outline color={COLORS.muted} onPress={props.onHome} />
        </View>
      </ScrollView>

      {/* Thanh nút cố định ở đáy: luôn trong tầm ngón cái */}
      <View style={styles.bottomBar}>
        <View style={{ flex: 1 }}>
          <BigButton compact icon="🔊" label="Nghe lại" outline onPress={props.onReplay} />
        </View>
        <View style={{ flex: 1.3 }}>
          {family ? (
            <BigButton
              compact
              icon="📞"
              label={`Gọi ${family.name}`}
              color={COLORS.safe}
              onPress={() => callFamily(family)}
            />
          ) : (
            <BigButton compact icon="👨‍👩‍👧" label="Hỏi con cháu" color={COLORS.safe} onPress={() => shareWithFamily(result, source)} />
          )}
        </View>
      </View>
    </View>
  );
}
