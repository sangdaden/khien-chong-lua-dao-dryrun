// Thành phần giao diện dùng chung: chữ to, nút to, tương phản cao cho người lớn tuổi.
// Màu mức nguy hiểm luôn đi kèm HÌNH (bát giác / tam giác / tròn) và CHỮ, để người mù màu vẫn phân biệt được.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Line, Risk } from './api';

export const COLORS = {
  bg: '#FFFDF7',
  text: '#1B1B1B',
  muted: '#4A4A4A',
  primary: '#1F5FD6',
  primaryDark: '#1747A6',
  danger: '#C62828',
  dangerSoft: '#FDECEA',
  warn: '#FFB300', // vàng: luôn dùng chữ đen (cam #B26A00 chỉ đạt 4.2:1)
  warnSoft: '#FFF6DB',
  warnText: '#7A4F00',
  safe: '#2E7D32',
  safeSoft: '#E8F5E9',
  card: '#FFFFFF',
  border: '#D9D4C7',
  highlight: '#FFE0E0',
};

export type RiskStyle = {
  color: string;
  soft: string;
  textColor: string;
  label: string;
  action: string;
  shape: 'octagon' | 'triangle' | 'circle';
  glyph: string;
};

// Mức thấp KHÔNG BAO GIỜ ghi "an toàn": AI có thể sót, chỉ nói là chưa thấy dấu hiệu.
export const RISK_STYLE: Record<Risk, RiskStyle> = {
  cao: {
    color: COLORS.danger,
    soft: COLORS.dangerSoft,
    textColor: '#FFFFFF',
    label: 'NGUY HIỂM',
    action: 'Đừng chuyển tiền. Đừng bấm link.',
    shape: 'octagon',
    glyph: '✋',
  },
  'trung bình': {
    color: COLORS.warn,
    soft: COLORS.warnSoft,
    textColor: '#000000',
    label: 'CẦN CẨN THẬN',
    action: 'Khoan làm theo. Hỏi con cháu trước.',
    shape: 'triangle',
    glyph: '!',
  },
  thấp: {
    color: COLORS.safe,
    soft: COLORS.safeSoft,
    textColor: '#FFFFFF',
    label: 'CHƯA THẤY DẤU HIỆU LỪA',
    action: 'Vẫn không đưa mã OTP cho ai.',
    shape: 'circle',
    glyph: '✓',
  },
};

export function riskStyle(risk: Risk | undefined): RiskStyle {
  return (risk && RISK_STYLE[risk]) || RISK_STYLE['trung bình'];
}

// Hình mức nguy hiểm vẽ bằng View, không cần thư viện SVG.
export function RiskShape({ risk, size = 64, inverted }: { risk: Risk; size?: number; inverted?: boolean }) {
  const s = riskStyle(risk);
  const fill = inverted ? '#FFFFFF' : s.color;
  const glyphColor = inverted ? (risk === 'trung bình' ? '#000' : s.color) : s.textColor;
  const glyph = (
    <Text style={{ color: glyphColor, fontSize: size * 0.5, fontWeight: '900', textAlign: 'center' }}>{s.glyph}</Text>
  );
  if (s.shape === 'triangle') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: 0,
            height: 0,
            borderLeftWidth: size / 2,
            borderRightWidth: size / 2,
            borderBottomWidth: size * 0.9,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: '#000',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: size * 0.06,
            width: 0,
            height: 0,
            borderLeftWidth: size / 2 - size * 0.1,
            borderRightWidth: size / 2 - size * 0.1,
            borderBottomWidth: size * 0.75,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: inverted ? '#FFFFFF' : s.color,
          }}
        />
        <Text style={{ color: '#000', fontSize: size * 0.42, fontWeight: '900', marginBottom: size * 0.08 }}>!</Text>
      </View>
    );
  }
  if (s.shape === 'octagon') {
    // Bát giác đều = phần giao của một hình vuông và chính nó xoay 45° (khung ngoài cắt bằng overflow hidden).
    return (
      <View style={{ width: size, height: size, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{ position: 'absolute', width: size, height: size, backgroundColor: fill, transform: [{ rotate: '45deg' }] }}
        />
        {glyph}
      </View>
    );
  }
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fill, alignItems: 'center', justifyContent: 'center' }}
    >
      {glyph}
    </View>
  );
}

export function BigButton(props: {
  label: string;
  icon?: string;
  hint?: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  outline?: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const color = props.color ?? COLORS.primary;
  const textColor = props.outline ? color : (props.textColor ?? '#fff');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      accessibilityHint={props.hint}
      accessibilityState={{ disabled: !!props.disabled }}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        props.compact && { minHeight: 60, paddingHorizontal: 12 },
        props.outline
          ? { backgroundColor: COLORS.card, borderColor: color, borderWidth: 3 }
          : { backgroundColor: color },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 },
        props.disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.buttonText, props.compact && { fontSize: 21 }, { color: textColor }]}>
        {props.icon ? `${props.icon}  ` : ''}
        {props.label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, borderColor, style }: { children: ReactNode; borderColor?: string; style?: object }) {
  return <View style={[styles.card, borderColor ? { borderColor, borderWidth: 3 } : null, style]}>{children}</View>;
}

// Thanh trên cùng: nút Quay lại to (≥ 56pt) + tiêu đề. Ông bà luôn biết mình đang ở đâu và đường về.
export function TopBar({ title, onBack, backLabel = 'Quay lại' }: { title: string; onBack: () => void; backLabel?: string }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        onPress={onBack}
        hitSlop={12}
        style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
      >
        <Text style={styles.backText}>‹ {backLabel}</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.topTitle} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

// Mark & Bit tạm dùng hình tròn có chữ. Thay bằng ảnh nhân vật thật khi có (assets/mark.png, assets/bit.png).
// Bit nền vàng phải dùng chữ đen (chữ trắng trên vàng chỉ đạt 2:1).
export function Avatar({ speaker, active, size = 56 }: { speaker: Line['speaker']; active?: boolean; size?: number }) {
  const isMark = speaker === 'Mark';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: isMark ? '#1F5FD6' : '#F2A900' },
        active && styles.avatarActive,
      ]}
    >
      <Text style={[styles.avatarText, { color: isMark ? '#fff' : '#000', fontSize: size * 0.46 }]}>{isMark ? 'M' : 'B'}</Text>
    </View>
  );
}

export function DialogueLine({ line, active }: { line: Line; active: boolean }) {
  return (
    <View style={styles.lineRow} accessible accessibilityLabel={`${line.speaker} nói: ${line.text}`}>
      <Avatar speaker={line.speaker} active={active} />
      <View style={[styles.bubble, active && { borderColor: COLORS.primary, backgroundColor: '#EEF3FF' }]}>
        <Text style={styles.speaker}>{line.speaker === 'Mark' ? 'Mark' : 'Bit'}</Text>
        <Text style={styles.body}>{line.text}</Text>
      </View>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  h1: { fontSize: 32, fontWeight: '800', color: COLORS.text },
  h2: { fontSize: 26, fontWeight: '700', color: COLORS.text },
  body: { fontSize: 22, lineHeight: 32, color: COLORS.text },
  muted: { fontSize: 20, lineHeight: 28, color: COLORS.muted },
  button: { minHeight: 72, borderRadius: 18, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  buttonText: { fontSize: 24, fontWeight: '700', textAlign: 'center' },
  card: { backgroundColor: COLORS.card, borderRadius: 18, padding: 18, gap: 10, borderWidth: 1, borderColor: COLORS.border },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarActive: { transform: [{ scale: 1.15 }], borderWidth: 3, borderColor: '#000' },
  avatarText: { fontWeight: '800' },
  lineRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 12, borderWidth: 2, borderColor: COLORS.border },
  speaker: { fontSize: 18, fontWeight: '700', color: COLORS.muted },
  preview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#eee' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  backButton: { minHeight: 56, minWidth: 56, justifyContent: 'center', paddingHorizontal: 8 },
  backText: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  topTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: COLORS.text, textAlign: 'right', paddingRight: 8 },
  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
});
