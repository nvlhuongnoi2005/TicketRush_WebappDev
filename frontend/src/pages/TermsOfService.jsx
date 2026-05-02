import LegalPageLayout from '../components/LegalPageLayout.jsx'

const SECTIONS = [
    {
        id: 'chap-nhan-dieu-khoan',
        title: 'Chấp nhận điều khoản',
        body: [
            'Bằng việc tạo tài khoản hoặc sử dụng TicketRush, bạn đồng ý tuân thủ các điều khoản trong tài liệu này cùng với Chính sách bảo mật. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.',
            'Bạn xác nhận rằng mình đủ 16 tuổi trở lên hoặc có sự đồng ý của người giám hộ hợp pháp khi sử dụng nền tảng.',
        ],
    },
    {
        id: 'tai-khoan',
        title: 'Tài khoản người dùng',
        body: [
            'Để sử dụng đầy đủ tính năng, bạn cần đăng ký tài khoản với thông tin chính xác và cập nhật. Bạn chịu trách nhiệm:',
            {
                type: 'list',
                items: [
                    'Bảo mật mật khẩu và mọi hoạt động phát sinh từ tài khoản của mình.',
                    'Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép.',
                    'Không tạo nhiều tài khoản với mục đích gian lận hoặc lách giới hạn.',
                    'Không chuyển nhượng, cho thuê hoặc bán lại tài khoản cho người khác.',
                ],
            },
        ],
    },
    {
        id: 'mua-ve',
        title: 'Đặt vé và thanh toán',
        body: [
            'Mọi giao dịch đặt vé thông qua TicketRush được xử lý theo nguyên tắc: vé chỉ được phát hành sau khi thanh toán thành công. Giá vé hiển thị bao gồm thuế và phí dịch vụ (trừ khi có ghi chú khác).',
            'TicketRush hành động với vai trò trung gian giữa người mua và đơn vị tổ chức sự kiện. Mọi tranh chấp về nội dung sự kiện thuộc trách nhiệm của đơn vị tổ chức.',
            {
                type: 'callout',
                text: 'Vé đã thanh toán không thể hoàn tiền hoặc chuyển nhượng, trừ khi sự kiện bị hủy bởi đơn vị tổ chức hoặc theo chính sách hoàn tiền cụ thể của từng sự kiện.',
            },
        ],
    },
    {
        id: 've-dien-tu',
        title: 'Vé điện tử và xác thực',
        body: [
            'Vé điện tử được phát hành dưới dạng mã QR duy nhất. Mỗi mã chỉ được sử dụng một lần tại cổng kiểm soát.',
            {
                type: 'list',
                items: [
                    'Không chia sẻ mã QR cho bất kỳ ai. Mã đã bị quét sẽ không thể quét lại.',
                    'Người mang vé chính chủ phải xuất trình giấy tờ tùy thân khi được yêu cầu.',
                    'TicketRush không chịu trách nhiệm với vé đã chia sẻ và bị người khác sử dụng trước.',
                ],
            },
        ],
    },
    {
        id: 'hanh-vi-cam',
        title: 'Hành vi bị cấm',
        body: [
            'Khi sử dụng nền tảng, bạn không được:',
            {
                type: 'list',
                items: [
                    'Sử dụng bot, script tự động hoặc kỹ thuật scraping để mua vé hàng loạt.',
                    'Bán lại vé với giá cao hơn giá niêm yết (chợ đen).',
                    'Cố tình can thiệp, tấn công hoặc gây gián đoạn hoạt động hệ thống.',
                    'Đăng tải nội dung vi phạm pháp luật, xúc phạm hoặc xâm phạm quyền của người khác.',
                    'Sử dụng dịch vụ để rửa tiền hoặc tài trợ cho hoạt động bất hợp pháp.',
                ],
            },
        ],
    },
    {
        id: 'huy-tai-khoan',
        title: 'Đình chỉ và hủy tài khoản',
        body: [
            'Chúng tôi có quyền đình chỉ hoặc hủy tài khoản của bạn nếu phát hiện vi phạm điều khoản, có dấu hiệu gian lận hoặc theo yêu cầu của cơ quan có thẩm quyền. Trong trường hợp này, vé chưa sử dụng có thể bị vô hiệu hóa.',
            'Bạn cũng có quyền tự xóa tài khoản bất kỳ lúc nào trong phần Cài đặt. Lịch sử giao dịch sẽ được lưu trữ theo quy định pháp luật.',
        ],
    },
    {
        id: 'so-huu-tri-tue',
        title: 'Sở hữu trí tuệ',
        body: [
            'Toàn bộ nội dung trên TicketRush bao gồm logo, thiết kế, mã nguồn, văn bản và dữ liệu thuộc quyền sở hữu của chúng tôi hoặc đối tác cấp phép. Bạn không được sao chép, phân phối hoặc sử dụng cho mục đích thương mại nếu chưa được cho phép bằng văn bản.',
        ],
    },
    {
        id: 'gioi-han-trach-nhiem',
        title: 'Giới hạn trách nhiệm',
        body: [
            'TicketRush cung cấp dịch vụ "nguyên trạng" và không bảo đảm rằng nền tảng sẽ luôn hoạt động không gián đoạn hoặc không có lỗi. Trong phạm vi luật pháp cho phép, chúng tôi không chịu trách nhiệm với:',
            {
                type: 'list',
                items: [
                    'Thiệt hại gián tiếp, mất doanh thu, mất dữ liệu hoặc mất cơ hội kinh doanh.',
                    'Lỗi do bên thứ ba (cổng thanh toán, nhà mạng, hạ tầng đám mây) gây ra.',
                    'Hành vi của đơn vị tổ chức sự kiện hoặc người dùng khác.',
                ],
            },
        ],
    },
    {
        id: 'luat-ap-dung',
        title: 'Luật áp dụng và giải quyết tranh chấp',
        body: [
            'Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được ưu tiên giải quyết qua thương lượng. Nếu không đạt được thỏa thuận, vụ việc sẽ được đưa ra Tòa án có thẩm quyền tại nơi đặt trụ sở của TicketRush.',
        ],
    },
]

export default function TermsOfService() {
    return (
        <LegalPageLayout
            eyebrow="Pháp lý · Điều khoản"
            title="Điều khoản dịch vụ"
            lastUpdated="01/05/2026"
            intro="Tài liệu này quy định các điều khoản và điều kiện khi bạn sử dụng nền tảng TicketRush. Vui lòng đọc kỹ trước khi tạo tài khoản hoặc thực hiện giao dịch."
            sections={SECTIONS}
            footerNote="Có thắc mắc về điều khoản dịch vụ? Đội ngũ pháp lý của chúng tôi luôn sẵn sàng hỗ trợ qua kênh liên hệ chính thức."
        />
    )
}