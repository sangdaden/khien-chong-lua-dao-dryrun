// Gọi proxy. Địa chỉ proxy lấy từ file .env (EXPO_PUBLIC_PROXY_URL).
// Nếu chưa có proxy, app chạy chế độ DEMO với kết quả mẫu để vẫn thử được giao diện.
// Ngày thi KHÔNG dùng DEMO: giám khảo chấm AI chạy trực tiếp.

export type Risk = 'thấp' | 'trung bình' | 'cao';

export type Line = { speaker: 'Mark' | 'Bit'; text: string };

export type Evidence = { quote: string; why: string };

export type CheckResult = {
  risk: Risk;
  title: string;
  /** Câu hành động ngắn đặt trên thẻ màu, ví dụ "Đừng chuyển tiền!" (proxy cũ có thể chưa gửi). */
  headline?: string;
  /** Câu trích nguyên văn trong tin nhắn + lý do, để tô đỏ cho ông bà thấy. */
  evidence?: Evidence[];
  reasons: string[];
  advice: string;
  /** 2-3 việc nên làm ngay, theo thứ tự. */
  actions?: string[];
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

async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  signal?.addEventListener('abort', () => controller.abort());
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

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('aborted'));
    });
  });
}

export type CheckInput = { imageBase64: string } | { text: string };

export async function checkMessage(input: CheckInput, signal?: AbortSignal): Promise<CheckResult> {
  if (isDemo) {
    await wait(2500, signal);
    return demoCheck('text' in input ? input.text : '');
  }
  const body = 'text' in input ? { text: input.text } : { imageBase64: input.imageBase64, mediaType: 'image/jpeg' };
  return post<CheckResult>('/check', body, signal);
}

export async function getPractice(weakSpots: string[], recent: string[]): Promise<PracticeItem> {
  if (isDemo) {
    await wait(800);
    return DEMO_PRACTICE[recent.length % DEMO_PRACTICE.length];
  }
  return post<PracticeItem>('/practice', { weakSpots, recent });
}

// ---------- DEMO (chỉ để thử giao diện khi chưa có proxy) ----------

function demoCheck(text: string): CheckResult {
  const t = text.toLowerCase();
  if (!t || /chuyển|stk|otp|link|khoá|khóa|công an|trúng|\.example|http/.test(t)) return DEMO_RED;
  if (/tiền|tài khoản|mượn|gấp/.test(t)) return DEMO_YELLOW;
  return DEMO_GREEN;
}

const DEMO_RED: CheckResult = {
  risk: 'cao',
  title: 'Đây gần như chắc chắn là lừa đảo.',
  headline: 'Đừng chuyển tiền!',
  evidence: [
    { quote: 'Công an quận Thanh Xuân', why: 'Công an thật không nhắn tin đòi tiền.' },
    { quote: 'chuyển 50.000.000đ vào tài khoản tạm giữ', why: 'Không có "tài khoản tạm giữ" nào cả.' },
    { quote: 'trong hôm nay', why: 'Giục gấp để ông bà không kịp hỏi ai.' },
    { quote: 'Không được nói với ai', why: 'Kẻ lừa sợ ông bà hỏi con cháu.' },
  ],
  reasons: [
    'Tự xưng là công an nhưng nhắn tin đòi tiền.',
    'Đòi chuyển tiền gấp trong ngày để "xác minh".',
    'Dặn không được nói với ai.',
  ],
  advice: 'Ông bà đừng chuyển tiền, đừng bấm link. Gọi ngay cho con cháu để hỏi.',
  actions: ['Không chuyển tiền, không trả lời tin này.', 'Gọi cho con cháu ngay.', 'Nếu lo, gọi công an phường bằng số ông bà biết.'],
  dialogue: [
    { speaker: 'Bit', text: 'Ông bà ơi, dừng lại đã! Tin này đáng ngờ lắm ạ.' },
    { speaker: 'Mark', text: 'Công an thật không bao giờ bắt chuyển tiền qua tin nhắn.' },
    { speaker: 'Bit', text: 'Ông bà bấm nút Hỏi con cháu để cả nhà cùng xem nhé!' },
  ],
};

const DEMO_YELLOW: CheckResult = {
  risk: 'trung bình',
  title: 'Tin này có điểm đáng ngờ, chưa chắc chắn.',
  headline: 'Khoan đã, hỏi lại cho chắc',
  evidence: [{ quote: 'cho con mượn tạm', why: 'Nick quen có thể bị chiếm để mượn tiền.' }],
  reasons: ['Người nhắn hỏi chuyện tiền bạc qua tin nhắn.', 'Chưa rõ có đúng người quen hay không.'],
  advice: 'Ông bà gọi điện thẳng cho người đó bằng số cũ để hỏi lại.',
  actions: ['Gọi điện bằng số ông bà đã lưu từ trước.', 'Chưa chuyển tiền cho đến khi nghe được giọng người đó.'],
  dialogue: [
    { speaker: 'Bit', text: 'Khoan đã ông bà ơi, tin này hơi lạ ạ.' },
    { speaker: 'Mark', text: 'Ông bà gọi lại cho người đó bằng số cũ là chắc nhất.' },
  ],
};

const DEMO_GREEN: CheckResult = {
  risk: 'thấp',
  title: 'Chưa thấy dấu hiệu lừa đảo trong tin này.',
  headline: 'Tin trông bình thường',
  evidence: [],
  reasons: ['Không đòi tiền, không có link, không giục gấp.'],
  advice: 'Ông bà vẫn nhớ: không bao giờ đọc mã OTP cho ai.',
  actions: ['Không đưa mã OTP hay mật khẩu cho bất kỳ ai.'],
  dialogue: [
    { speaker: 'Bit', text: 'Tin này trông bình thường ạ!' },
    { speaker: 'Mark', text: 'Nhưng ông bà vẫn nhớ, không đọc mã OTP cho ai nhé.' },
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
  {
    sender: 'NGAN HANG',
    message: 'Tai khoan cua quy khach se bi khoa trong 24h. Vui long xac thuc tai: http://vietcornbank-xacthuc.example',
    isScam: true,
    kind: 'giả ngân hàng',
    explanation: 'Lừa đảo ạ. Tên ngân hàng trong link bị viết sai, lại dọa khoá tài khoản để ông bà vội bấm.',
  },
];
