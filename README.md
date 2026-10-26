# Khiên chống lừa đảo (bản dry run)

App di động giúp người lớn tuổi nhận ra tin nhắn lừa đảo. Ông bà chụp màn hình tin nhắn đáng ngờ, AI đọc ảnh và chấm mức nguy hiểm, Mark & Bit đọc to lý do bằng tiếng Việt đơn giản, và một nút gửi kết quả cho con cháu.

> **Đây là bản tập (dry run) trước Codex Hackathon Hà Nội 14/11/2026.** Luật thi yêu cầu build luồng mobile và tính năng AI *trong ngày* bằng Codex. Ngày thi, build lại từ template sạch; chỉ mang theo proxy, prompt và tin nhắn mẫu. Mark & Bit là phần có từ trước, phải khai báo.

## Cấu trúc

```
app/      App Expo (React Native), chạy bằng Expo Go trên điện thoại thật
proxy/    Cloudflare Worker giữ API key và gọi AI
samples/  Tin nhắn lừa đảo mẫu tự viết để demo
```

## Giải thích từng bước

### Bước 1. Khung app (Expo SDK 58)

- Tạo bằng `create-expo-app` mẫu `blank-typescript`. Không dùng Expo Router để giữ đơn giản: `App.tsx` chỉ đổi giữa 3 màn hình (trang đầu, Kiểm tra, Luyện tập) bằng một biến `screen`.
- `src/ui.tsx`: chữ tối thiểu 20-32px, nút cao 72px, màu tương phản cao. Thẻ kết quả có 3 màu: đỏ (nguy hiểm cao), cam (cần cẩn thận), xanh (có vẻ an toàn).
- Chỉ dùng các thư viện có sẵn trong Expo Go (image-picker, image-manipulator, speech, safe-area-context), nên **không cần build app riêng**, quét QR là chạy.

### Bước 2. Proxy giữ API key (`proxy/`)

- Vì sao cần proxy: nếu để API key trong app, ai tải app về cũng lấy được key. Proxy chạy trên Cloudflare Worker, key nằm trong *secret* của Worker.
- `proxy/src/prompts.ts` là "bộ não": prompt tiếng Việt liệt kê các kiểu lừa đảo phổ biến ở Việt Nam (giả công an, ngân hàng, trúng thưởng, người thân nhờ chuyển tiền...) và quy tắc "không chắc thì chọn mức cao hơn".
- AI bị ép trả đúng dạng JSON (structured outputs), nên app không bao giờ phải đoán định dạng:
  ```json
  { "risk": "cao", "title": "...", "reasons": ["..."], "advice": "...",
    "dialogue": [{ "speaker": "Bit", "text": "..." }, { "speaker": "Mark", "text": "..." }] }
  ```
  `dialogue` là lời thoại để Mark & Bit đọc to (2-4 câu ngắn, xưng "ông bà").
- Hai đường dẫn: `POST /check` (gửi ảnh base64) và `POST /practice` (tạo bài luyện tập).
- Header `X-App-Token` chỉ để người lạ không dùng ké proxy. Đây **không phải** bảo mật thật vì mã này nằm trong app.
- Bản tập dùng Claude (`claude-opus-5-5`, effort `low` để trả lời nhanh). Đổi model bằng biến `MODEL` trong `wrangler.toml`. Ngày thi đổi sang OpenAI vision theo kế hoạch.

### Bước 3. Luồng Kiểm tra (`src/CheckScreen.tsx`)

1. Ông bà bấm "Chọn ảnh chụp màn hình" (hoặc chụp ảnh).
2. `src/image.ts` thu nhỏ ảnh về rộng 1080px, nén JPEG 70% rồi chuyển sang base64. Ảnh nhỏ hơn thì gửi nhanh hơn trên mạng yếu mà chữ vẫn đọc rõ.
3. `src/api.ts` gửi ảnh lên proxy, chờ tối đa 45 giây.
4. Hiện thẻ màu, lý do, lời khuyên, rồi `src/voice.ts` cho Mark & Bit đọc lần lượt từng câu. Hai nhân vật dùng chung giọng tiếng Việt của máy, phân biệt bằng cao độ: Mark trầm và chậm, Bit cao và nhanh. Câu đang đọc được làm nổi bật.
5. Lỗi mạng: hiện "Chưa kiểm tra được" và nút Thử lại, không bao giờ để màn hình trống.

### Bước 4. Hỏi con cháu

Nút xanh "Hỏi con cháu" mở bảng chia sẻ của điện thoại (chọn Zalo, Messenger...) với lời nhắn soạn sẵn kèm kết quả. **iPhone gửi được cả ảnh lẫn chữ; Android chỉ gửi chữ** (giới hạn của Share API trong React Native).

### Bước 5. Luyện tập (`src/PracticeScreen.tsx`)

AI tạo một tin nhắn (khoảng một nửa là tin thật để không đoán bừa), ông bà chọn "Lừa đảo" hoặc "Tin thật", Mark & Bit giải thích. Kiểu nào ông bà đoán sai được gửi lại cho AI (`weakSpots`) để ra thêm bài kiểu đó: đây là phần "cá nhân hoá" khi pitch.

### Chế độ DEMO

Chưa có proxy thì app tự chạy chế độ DEMO với kết quả mẫu cố định, để thử giao diện ngay. Trang đầu có dòng chữ cam báo đang DEMO.

## Chạy thử

### A. Chỉ xem giao diện (không cần API key)

```bash
cd app
npm install
npx expo start
```

Mở app **Expo Go** trên điện thoại, quét mã QR. Điện thoại và laptop phải cùng Wi-Fi; nếu mạng chặn thì chạy `npx expo start --tunnel`.

### B. Nối AI thật

1. Tạo tài khoản Cloudflare (miễn phí), rồi:
   ```bash
   cd proxy
   npm install
   npx wrangler login
   npx wrangler secret put ANTHROPIC_API_KEY   # dán key, không lưu vào file nào
   npx wrangler secret put APP_TOKEN           # tự đặt một chuỗi bất kỳ
   npm run deploy                              # in ra địa chỉ https://khien-proxy.<tên>.workers.dev
   ```
2. Thử proxy (thay URL và token):
   ```bash
   curl -X POST https://khien-proxy.<tên>.workers.dev/practice -H "X-App-Token: <token>"
   ```
3. Trong `app/`, copy `.env.example` thành `.env`, điền URL và token, rồi `npx expo start` lại.

## Lưu ý

- Không bao giờ commit API key. `.env` và `proxy/.dev.vars` đã nằm trong `.gitignore`.
- Chỉ dùng tin nhắn mẫu tự viết (`samples/`), không dùng ảnh hay số điện thoại người thật.
- Giọng đọc: máy phải có giọng tiếng Việt. iPhone: Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Việt. Android: cài gói tiếng Việt cho Google Text-to-Speech. Thử trên máy thật trước ngày thi.
- Mark & Bit đang là hình tròn có chữ M/B. Thay bằng ảnh nhân vật thật trong `src/ui.tsx` (hàm `Avatar`).
- Gọi AI thật chưa được thử trong buổi dựng này (chưa có key); đã thử proxy chạy local tới bước xác thực với API.
