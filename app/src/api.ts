// Gọi proxy. Địa chỉ proxy lấy từ file .env (EXPO_PUBLIC_PROXY_URL).
// Nếu chưa có proxy, app chạy chế độ DEMO với kết quả mẫu để vẫn thử được giao diện.

export type Risk = 'thấp' | 'trung bình' | 'cao';

export type Line = { speaker: 'Mark' | 'Bit'; text: string };

export type CheckResult = {
  risk: Risk;
  title: string;
  reasons: string[];
  advice: string;
  dialogue: Line[];
};

export type PracticeItem = {
  sender: string;
  message: string;
  isScam: boolean;
  kind: string;
  explanation: string;
};

const PROXY_URL = process.env.EXPO_PUBLIC_PROXY_URL ?? '';
const APP_TOKEN = process.env.EXPO_PUBLIC_APP_TOKEN ?? '';

export const isDemo = PROXY_URL === '';

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    const res = await fetch(`${PROXY_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-App-Token': APP_TOKEN },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`proxy_${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function checkImage(imageBase64: string): Promise<CheckResult> {
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 1200));
    return DEMO_CHECK;
  }
  return post<CheckResult>('/check', { imageBase64, mediaType: 'image/jpeg' });
}

export async function getPractice(weakSpots: string[], recent: string[]): Promise<PracticeItem> {
  if (isDemo) {
    await new Promise((r) => setTimeout(r, 800));
    return DEMO_PRACTICE[recent.length % DEMO_PRACTICE.length];
  }
  return post<PracticeItem>('/practice', { weakSpots, recent });
}

const DEMO_CHECK: CheckResult = {
  risk: 'cao',
  title: 'Đây gần như chắc chắn là lừa đảo.',
  reasons: [
    'Tin nhắn tự xưng là công an nhưng gửi từ số điện thoại cá nhân.',
    'Đòi chuyển tiền gấp trong ngày để "xác minh".',
    'Công an thật không bao giờ yêu cầu chuyển tiền qua điện thoại.',
  ],
  advice: 'Ông bà đừng chuyển tiền, đừng bấm link. Gọi ngay cho con cháu để hỏi.',
  dialogue: [
    { speaker: 'Bit', text: 'Ông bà ơi, dừng lại đã! Tin này đáng ngờ lắm ạ.' },
    { speaker: 'Mark', text: 'Công an thật không bao giờ bắt chuyển tiền qua tin nhắn.' },
    { speaker: 'Bit', text: 'Ông bà bấm nút Hỏi con cháu để cả nhà cùng xem nhé!' },
  ],
};

const DEMO_PRACTICE: PracticeItem[] = [
  {
    sender: '0900 000 123',
    message:
      'Chúc mừng quý khách đã trúng thưởng xe máy SH. Vui lòng chuyển 2.000.000đ phí trước bạ vào STK 0000 0000 để nhận xe trong hôm nay.',
    isScam: true,
    kind: 'trúng thưởng',
    explanation:
      'Đây là lừa đảo ạ. Trúng thưởng thật không bao giờ bắt ông bà nộp tiền trước. Lại còn giục nhận trong hôm nay nữa.',
  },
  {
    sender: 'Con gái Lan',
    message: 'Bố ơi chiều nay con về muộn, bố ăn cơm trước nhé, không phải đợi con.',
    isScam: false,
    kind: 'tin thật',
    explanation: 'Tin này bình thường ạ. Không đòi tiền, không có link, không giục gì cả.',
  },
];
