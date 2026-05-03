import LegalPageLayout from '../components/LegalPageLayout.jsx'

const SECTIONS = [
    {
        id: 'gioi-thieu',
        title: 'Giới thiệu',
        body: [
            'TicketRush ("chúng tôi") cam kết bảo vệ quyền riêng tư của bạn. Chính sách này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân khi bạn sử dụng nền tảng đặt vé điện tử của chúng tôi.',
            'Bằng việc sử dụng dịch vụ, bạn đồng ý với các điều khoản trong chính sách này. Nếu không đồng ý, vui lòng ngừng sử dụng nền tảng.',
        ],
    },
    {
        id: 'thong-tin-thu-thap',
        title: 'Thông tin chúng tôi thu thập',
        body: [
            'Để cung cấp dịch vụ một cách tốt nhất, chúng tôi thu thập các loại thông tin sau:',
            {
                type: 'list',
                items: [
                    'Thông tin tài khoản: họ tên, email, số điện thoại, ngày sinh, giới tính, mật khẩu (đã mã hóa).',
                    'Thông tin giao dịch: lịch sử mua vé, phương thức thanh toán, hóa đơn điện tử.',
                    'Dữ liệu kỹ thuật: địa chỉ IP, loại trình duyệt, thiết bị, hệ điều hành, thời gian truy cập.',
                    'Cookie và công nghệ tương tự để cá nhân hóa trải nghiệm và phân tích hành vi sử dụng.',
                ],
            },
        ],
    },
    {
        id: 'muc-dich-su-dung',
        title: 'Mục đích sử dụng thông tin',
        body: [
            'Thông tin của bạn được sử dụng cho các mục đích chính đáng sau:',
            {
                type: 'list',
                items: [
                    'Xử lý đặt vé, thanh toán và phát hành vé điện tử.',
                    'Gửi thông báo về sự kiện, mã xác thực và cập nhật quan trọng.',
                    'Cá nhân hóa đề xuất sự kiện dựa trên sở thích.',
                    'Phân tích và cải thiện trải nghiệm sản phẩm.',
                    'Đáp ứng yêu cầu pháp lý hoặc bảo vệ quyền lợi hợp pháp của các bên.',
                ],
            },
        ],
    },
    {
        id: 'chia-se-thong-tin',
        title: 'Chia sẻ thông tin',
        body: [
            'Chúng tôi không bán dữ liệu cá nhân của bạn cho bên thứ ba. Tuy nhiên, thông tin có thể được chia sẻ với:',
            {
                type: 'list',
                items: [
                    'Đối tác tổ chức sự kiện để xác thực vé tại cổng vào.',
                    'Đơn vị cổng thanh toán để xử lý giao dịch.',
                    'Cơ quan nhà nước có thẩm quyền theo yêu cầu pháp luật.',
                ],
            },
            {
                type: 'callout',
                text: 'Mọi đối tác đều phải ký thỏa thuận bảo mật và chỉ được sử dụng dữ liệu cho mục đích cụ thể đã thỏa thuận.',
            },
        ],
    },
    {
        id: 'bao-mat',
        title: 'Bảo mật dữ liệu',
        body: [
            'Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu của bạn, bao gồm mã hóa TLS khi truyền tải, mã hóa mật khẩu bằng thuật toán hash hiện đại và kiểm soát truy cập nội bộ chặt chẽ.',
            'Tuy nhiên, không có hệ thống nào an toàn tuyệt đối. Bạn cũng có trách nhiệm bảo vệ tài khoản của mình bằng mật khẩu mạnh và không chia sẻ thông tin đăng nhập với người khác.',
        ],
    },
    {
        id: 'quyen-cua-ban',
        title: 'Quyền của người dùng',
        body: [
            'Bạn có các quyền sau đối với dữ liệu cá nhân của mình:',
            {
                type: 'list',
                items: [
                    'Truy cập và xem thông tin cá nhân đã được lưu trữ.',
                    'Chỉnh sửa, cập nhật thông tin không chính xác.',
                    'Yêu cầu xóa tài khoản và dữ liệu liên quan.',
                    'Rút lại sự đồng ý xử lý dữ liệu bất kỳ lúc nào.',
                    'Khiếu nại với cơ quan bảo vệ dữ liệu nếu cho rằng quyền của bạn bị xâm phạm.',
                ],
            },
        ],
    },
    {
        id: 'cookie',
        title: 'Cookie và theo dõi',
        body: [
            'Chúng tôi sử dụng cookie để duy trì phiên đăng nhập, ghi nhớ tùy chọn và phân tích lưu lượng truy cập. Bạn có thể tắt cookie qua cài đặt trình duyệt, tuy nhiên một số tính năng có thể không hoạt động đầy đủ.',
        ],
    },
    {
        id: 'thay-doi-chinh-sach',
        title: 'Thay đổi chính sách',
        body: [
            'Chính sách này có thể được cập nhật theo thời gian. Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email hoặc thông báo nổi bật trên nền tảng. Việc tiếp tục sử dụng dịch vụ sau khi cập nhật đồng nghĩa bạn chấp nhận phiên bản mới.',
        ],
    },
]

export default function PrivacyPolicy() {
    return (
        <LegalPageLayout
            eyebrow="Pháp lý · Quyền riêng tư"
            title="Chính sách bảo mật"
            lastUpdated="01/05/2026"
            intro="Tại TicketRush, chúng tôi tôn trọng quyền riêng tư của bạn và cam kết minh bạch về cách dữ liệu cá nhân được thu thập, sử dụng và bảo vệ. Vui lòng đọc kỹ tài liệu này."
            sections={SECTIONS}
            footerNote="Nếu bạn có thắc mắc về cách chúng tôi xử lý dữ liệu cá nhân, hãy liên hệ với đội ngũ hỗ trợ. Chúng tôi sẽ phản hồi trong vòng 48 giờ làm việc."
        />
    )
}