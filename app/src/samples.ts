// Khay tin mẫu ẩn cho lúc demo (nhấn giữ logo 2 giây ở trang đầu): gửi chữ thẳng tới AI,
// không phải lục thư viện ảnh trước giám khảo. Tin tự viết, số và link đều giả (xem samples/tin-nhan-mau.md).
export const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'Giả công an',
    text: 'Đây là Công an quận Thanh Xuân. Ông/bà có liên quan đến vụ án rửa tiền. Yêu cầu chuyển 50.000.000đ vào tài khoản tạm giữ 0000 1111 2222 trong hôm nay để xác minh, nếu không sẽ bị khởi tố. Không được nói với ai.',
  },
  {
    label: 'Giả ngân hàng',
    text: '[NGAN HANG] Tai khoan cua quy khach se bi khoa trong 24h. Vui long xac thuc tai: http://vietcornbank-xacthuc.example',
  },
  {
    label: 'Trúng thưởng',
    text: 'Chúc mừng số thuê bao 0900 000 123 trúng thưởng xe SH. Chuyển 2.000.000đ phí trước bạ vào STK 0000 0000 để nhận xe.',
  },
  {
    label: 'Cháu gặp nạn',
    text: 'Bà ơi cháu Minh đây, cháu đánh nhau bị giữ ở đồn, bà chuyển gấp 10 triệu cho chú công an số 0900 000 456 để cháu được về, đừng nói với bố mẹ cháu nhé.',
  },
  {
    label: 'Giả điện lực',
    text: 'Điện lực thông báo: hộ gia đình nợ tiền điện, sẽ cắt điện lúc 17h hôm nay. Cài ứng dụng tại link-gia.example để thanh toán.',
  },
  {
    label: 'Nick quen mượn tiền',
    text: 'Chị ơi em Hoa đây, em đang kẹt chút việc, chị cho em mượn tạm 3 triệu tối em trả nhé, chuyển giúp em vào số này nha.',
  },
  { label: 'Tin thật: con nhắn', text: 'Mẹ ơi tối nay con với cháu về ăn cơm nhé, mẹ không phải nấu nhiều đâu.' },
  {
    label: 'Tin thật: số dư',
    text: 'TK 0000xxxx +500,000VND luc 10:15 26/10. ND: con gui me tien cho. SD: 3,200,000VND',
  },
];

// Mẹo ngắn thay nhau hiện ở trang đầu: học một chút mỗi lần mở app.
export const TIPS = [
  'Công an, toà án thật không bao giờ gọi điện hay nhắn tin bắt chuyển tiền.',
  'Không bao giờ đọc mã OTP cho bất kỳ ai, kể cả người xưng là nhân viên ngân hàng.',
  'Người quen nhắn mượn tiền gấp? Gọi lại bằng số cũ để nghe đúng giọng.',
  'Trúng thưởng mà phải nộp tiền trước là lừa đảo.',
  'Link lạ, tên ngân hàng viết sai chữ: đừng bấm vào.',
  'Kẻ lừa hay dặn "đừng nói với ai". Càng dặn vậy, càng phải hỏi con cháu.',
];
