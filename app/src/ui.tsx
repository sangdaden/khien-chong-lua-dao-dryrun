// Thành phần giao diện dùng chung: chữ to, nút to, tương phản cao cho người lớn tuổi.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Line, Risk } from './api';

export const COLORS = {
  bg: '#FFFDF7',
  text: '#1B1B1B',
  muted: '#4A4A4A',
  primary: '#1F5FD6',
  danger: '#C62828',
  warn: '#B26A00',
  safe: '#2E7D32',
  card: '#FFFFFF',
  border: '#D9D4C7',
};

export const RISK_STYLE: Record<Risk, { color: string; label: string; icon: string }> = {
  cao: { color: COLORS.danger, label: 'NGUY HIỂM CAO', icon: '⛔' },
  'trung bình': { color: COLORS.warn, label: 'CẦN CẨN THẬN', icon: '⚠️' },
  thấp: { color: COLORS.safe, label: 'CÓ VẺ AN TOÀN', icon: '✅' },
};

export function BigButton(props: {
  label: string;
  icon?: string;
  onPress: () => void;
  color?: string;
  outline?: boolean;
  disabled?: boolean;
}) {
  const color = props.color ?? COLORS.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.label}
      disabled={props.disabled}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.button,
        props.outline
          ? { backgroundColor: COLORS.card, borderColor: color, borderWidth: 3 }
          : { backgroundColor: color },
        (pressed || props.disabled) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonText, { color: props.outline ? color : '#fff' }]}>
        {props.icon ? `${props.icon}  ` : ''}
        {props.label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, borderColor }: { children: ReactNode; borderColor?: string }) {
  return <View style={[styles.card, borderColor ? { borderColor, borderWidth: 4 } : null]}>{children}</View>;
}

// Mark & Bit tạm dùng hình tròn có chữ. Thay bằng ảnh nhân vật thật khi có (assets/mark.png, assets/bit.png).
export function Avatar({ speaker, active }: { speaker: Line['speaker']; active?: boolean }) {
  const bg = speaker === 'Mark' ? '#1F5FD6' : '#F2A900';
  return (
    <View style={[styles.avatar, { backgroundColor: bg }, active && styles.avatarActive]}>
      <Text style={styles.avatarText}>{speaker === 'Mark' ? 'M' : 'B'}</Text>
    </View>
  );
}

export function DialogueLine({ line, active }: { line: Line; active: boolean }) {
  return (
    <View style={styles.lineRow}>
      <Avatar speaker={line.speaker} active={active} />
      <View style={[styles.bubble, active && { borderColor: COLORS.primary }]}>
        <Text style={styles.speaker}>{line.speaker}</Text>
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
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarActive: { transform: [{ scale: 1.15 }], borderWidth: 3, borderColor: '#000' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  lineRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bubble: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 12, borderWidth: 2, borderColor: COLORS.border },
  speaker: { fontSize: 18, fontWeight: '700', color: COLORS.muted },
  preview: { width: '100%', height: 260, borderRadius: 14, backgroundColor: '#eee' },
});
