// Lưu trong máy (không gửi đi đâu): số người thân để gọi nhanh, và các lần kiểm tra gần đây.
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CheckResult } from './api';

export type FamilyContact = { name: string; phone: string };

export type HistoryItem = {
  id: string;
  at: number;
  source: 'image' | 'text';
  /** Chữ của tin (khi dán chữ, tối đa 600 ký tự) để xem lại và tô đỏ. */
  snippet?: string;
  result: CheckResult;
};

const FAMILY_KEY = 'family-contact';
const HISTORY_KEY = 'check-history';
const MAX_HISTORY = 20;

export async function loadFamily(): Promise<FamilyContact | null> {
  try {
    const raw = await AsyncStorage.getItem(FAMILY_KEY);
    return raw ? (JSON.parse(raw) as FamilyContact) : null;
  } catch {
    return null;
  }
}

export async function saveFamily(contact: FamilyContact | null) {
  try {
    if (contact) await AsyncStorage.setItem(FAMILY_KEY, JSON.stringify(contact));
    else await AsyncStorage.removeItem(FAMILY_KEY);
  } catch (err) {
    console.warn(err);
  }
}

export async function loadHistory(): Promise<HistoryItem[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export async function addHistory(item: Omit<HistoryItem, 'id' | 'at'>): Promise<HistoryItem[]> {
  const list = await loadHistory();
  const next = [{ ...item, id: `${Date.now()}`, at: Date.now() }, ...list].slice(0, MAX_HISTORY);
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn(err);
  }
  return next;
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch (err) {
    console.warn(err);
  }
}

export function timeAgo(at: number): string {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  return d === 1 ? 'hôm qua' : `${d} ngày trước`;
}
