// Trang đầu (S1): một nút tròn thật to cho việc chính, mọi thứ khác nhỏ hơn và nằm dưới.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { isDemo } from './api';
import { callFamily } from './ResultView';
import { SAMPLES, TIPS } from './samples';
import { timeAgo, type FamilyContact, type HistoryItem } from './storage';
import { Avatar, BigButton, Card, COLORS, RiskShape, riskStyle, styles } from './ui';

export function HomeScreen(props: {
  family: FamilyContact | null;
  history: HistoryItem[];
  onCheck: () => void;
  onPaste: () => void;
  onSample: (text: string) => void;
  onPractice: () => void;
  onFamily: () => void;
  onHistory: () => void;
  onOpenHistory: (item: HistoryItem) => void;
}) {
  const [trayOpen, setTrayOpen] = useState(false);
  const tip = TIPS[new Date().getDate() % TIPS.length];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Nhấn giữ logo 2 giây: mở khay tin mẫu cho lúc demo */}
        <Pressable delayLongPress={2000} onLongPress={() => setTrayOpen(true)} accessibilityRole="header">
          <Text style={[styles.h1, { fontSize: 28 }]}>🛡️ Khiên chống lừa đảo</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Avatar speaker="Bit" size={48} />
        <Avatar speaker="Mark" size={48} />
        <Text style={[styles.body, { flex: 1 }]}>Nhận được tin lạ? Đưa Mark và Bit xem trước khi làm theo.</Text>
      </View>

      <View style={{ alignItems: 'center', paddingVertical: 8 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Kiểm tra tin nhắn"
          accessibilityHint="Chọn ảnh chụp màn hình hoặc dán chữ để Mark và Bit xem"
          onPress={props.onCheck}
          style={({ pressed }) => ({
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: pressed ? COLORS.primaryDark : COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 10,
            borderColor: '#D6E2FA',
            transform: [{ scale: pressed ? 0.97 : 1 }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          })}
        >
          <Text style={{ fontSize: 64 }}>🔍</Text>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', textAlign: 'center', lineHeight: 34 }}>
            Kiểm tra{'\n'}tin nhắn
          </Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Tile icon="📋" label="Dán chữ" onPress={props.onPaste} />
        <Tile icon="🎯" label="Luyện tập" onPress={props.onPractice} />
      </View>

      {props.family ? (
        <BigButton icon="📞" label={`Gọi ${props.family.name}`} color={COLORS.safe} onPress={() => callFamily(props.family!)} />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={props.onFamily}
          style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: COLORS.primary, borderRadius: 16, padding: 16 }}
        >
          <Text style={[styles.body, { color: COLORS.primary, fontWeight: '700' }]}>＋ Lưu số con cháu để gọi nhanh</Text>
        </Pressable>
      )}

      <Card style={{ backgroundColor: COLORS.warnSoft, borderColor: COLORS.warn }}>
        <Text style={[styles.muted, { fontWeight: '800', color: COLORS.warnText }]}>💡 Mẹo hôm nay</Text>
        <Text style={styles.body}>{tip}</Text>
      </Card>

      {props.history.length > 0 && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text accessibilityRole="header" style={styles.h2}>
              Đã kiểm tra
            </Text>
            {props.history.length > 3 && (
              <Pressable accessibilityRole="button" onPress={props.onHistory} hitSlop={12}>
                <Text style={{ fontSize: 20, color: COLORS.primary, fontWeight: '700' }}>Xem tất cả ›</Text>
              </Pressable>
            )}
          </View>
          {props.history.slice(0, 3).map((h) => (
            <HistoryRow key={h.id} item={h} onPress={() => props.onOpenHistory(h)} />
          ))}
        </View>
      )}

      {props.family && (
        <Pressable accessibilityRole="button" onPress={props.onFamily} hitSlop={8}>
          <Text style={[styles.muted, { textAlign: 'center', textDecorationLine: 'underline' }]}>Đổi người thân</Text>
        </Pressable>
      )}

      {isDemo && (
        <Text style={[styles.muted, { color: COLORS.warnText }]}>
          Đang chạy chế độ DEMO (chưa nối proxy): kết quả là mẫu cố định.
        </Text>
      )}

      <Modal visible={trayOpen} animationType="slide" onRequestClose={() => setTrayOpen(false)}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: 60 }]} style={styles.screen}>
          <Text style={styles.h1}>Tin mẫu</Text>
          <Text style={styles.muted}>Gửi thẳng chữ của tin mẫu tới AI (dùng khi demo).</Text>
          {SAMPLES.map((s) => (
            <BigButton
              key={s.label}
              compact
              label={s.label}
              outline
              onPress={() => {
                setTrayOpen(false);
                props.onSample(s.text);
              }}
            />
          ))}
          <BigButton label="Đóng" color={COLORS.muted} onPress={() => setTrayOpen(false)} />
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

function Tile({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { flex: 1, alignItems: 'center', borderWidth: 2, borderColor: COLORS.primary, minHeight: 110, justifyContent: 'center' },
        pressed && { backgroundColor: '#EEF3FF' },
      ]}
    >
      <Text style={{ fontSize: 40 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.primary }}>{label}</Text>
    </Pressable>
  );
}

export function HistoryRow({ item, onPress }: { item: HistoryItem; onPress: () => void }) {
  const s = riskStyle(item.result.risk);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${s.label}, ${item.result.headline ?? item.result.title}, ${timeAgo(item.at)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderLeftWidth: 8, borderLeftColor: s.color },
        pressed && { opacity: 0.8 },
      ]}
    >
      <RiskShape risk={item.result.risk} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.text }} numberOfLines={1}>
          {item.result.headline ?? s.label}
        </Text>
        <Text style={{ fontSize: 17, color: COLORS.muted }} numberOfLines={1}>
          {item.source === 'image' ? '🖼️ Ảnh chụp' : `📋 ${item.snippet ?? ''}`} · {timeAgo(item.at)}
        </Text>
      </View>
      <Text style={{ fontSize: 28, color: COLORS.muted }}>›</Text>
    </Pressable>
  );
}
