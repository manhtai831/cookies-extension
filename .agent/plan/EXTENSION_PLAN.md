Đây là extension sẽ hoạt động trên chorme và firefox, extension sẽ có chức năng sau:
- Extension cần phải lưu lại api key của user, api key sẽ lấy từ 1 cms khác.
- extension có thể có nhiều api-key khác nhau
- Màn hình hiển thị mỗi khi mở extension sẽ là màn hình hiển thị danh sách cookie. Mỗi item sẽ có icon của web đã lấy được cookie, tên cookie, thời gian hết hạn, nếu gần hết hạn thời gian sẽ màu vàng, đã hết hạn thì màu đỏ, có nút delete, use, export, duplicate.
- User có thể nhấn nút New để mở 1 form mới để lưu cookie. 
- Form lưu cookie sẽ có các trường sau: tên cookie, giá trị cookie, thời gian hết hạn, domain, path, secure, httpOnly. Khi user nhấn nút save thì cookie sẽ được lưu lại và hiển thị trong danh sách.
- Khi user nhấn nút delete, cookie sẽ bị xóa khỏi danh sách và không còn lưu trữ nữa.
- Khi user nhấn nút use, cookie sẽ được áp dụng cho trình duyệt hiện tại, giúp user có thể sử dụng cookie đó để truy cập vào các trang web mà cookie đó đã được thiết lập.
- Khi user nhấn nút export, cookie sẽ được xuất ra dưới dạng file JSON, giúp user có thể lưu trữ hoặc chia sẻ cookie đó với người khác.