// Lưu một người thân tin cậy. Màn Kết quả có nút "Gọi <tên>" để ông bà gọi ngay bằng một chạm.
// Con cháu nên cài sẵn phần này khi cài app cho bố mẹ.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput } from 'react-native';
import { saveFamily, type FamilyContact } from './storage';
import { BigButton, Card, COLORS, styles, TopBar } from './ui';

const inputStyle = {
  minHeight: 64,
  backgroundColor: COLORS.card,
  borderWidth: 2,
  borderColor: COLORS.primary,
  borderRadius: 14,
  paddingHorizontal: 16,
  fontSize: 24,
  color: COLORS.text,
} as const;

export function FamilyScreen(props: { family: FamilyContact | null; onDone: (f: FamilyContact | null) => void }) {
  const [name, setName] = useState(props.family?.name ?? '');
  const [phone, setPhone] = useState(props.family?.phone ?? '');
  const valid = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 8;

  async function save() {
    const f = { name: name.trim(), phone: phone.trim() };
    await saveFamily(f);
    props.onDone(f);
  }

  async function remove() {
    await saveFamily(null);
    props.onDone(null);
  }

  return (
    <>
      <TopBar title="Người thân" onBack={() => props.onDone(props.family)} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.body}>
            Khi gặp tin đáng ngờ, ông bà chỉ cần bấm một nút là gọi được cho người này.
          </Text>
          <Card>
            <Text style={styles.muted}>Gọi là gì? (ví dụ: con Lan, cháu Minh)</Text>
            <TextInput accessibilityLabel="Tên người thân" value={name} onChangeText={setName} style={inputStyle} placeholder="con Lan" placeholderTextColor="#888" />
            <Text style={styles.muted}>Số điện thoại</Text>
            <TextInput
              accessibilityLabel="Số điện thoại người thân"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={inputStyle}
              placeholder="09xx xxx xxx"
              placeholderTextColor="#888"
            />
          </Card>
          <BigButton icon="💾" label="Lưu" disabled={!valid} onPress={save} />
          {props.family && <BigButton label="Xoá người thân này" outline color={COLORS.danger} onPress={remove} />}
          <Text style={styles.muted}>Số chỉ lưu trong điện thoại này, không gửi đi đâu.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
