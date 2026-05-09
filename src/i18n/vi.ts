export const vi = {
  common: {
    language: {
      switch: "Chuyển ngôn ngữ",
      vietnamese: "Tiếng Việt",
      english: "Tiếng Anh",
    },
    theme: {
      light: "Chế độ sáng",
      dark: "Chế độ tối",
      system: "Theo hệ thống",
    },
    footer: {
      infrastructure: "© 2026 hotsnew.click hạ tầng vận hành",
    },
    installApp: {
      installedTitle: "Ứng dụng đã được cài",
      installedDescription:
        "Bạn có thể mở HotsNew như một ứng dụng riêng ngay trên thiết bị này.",
      menuTitle: "Cài từ menu trình duyệt",
      menuDescription:
        "Nếu chưa hiện gợi ý cài đặt, hãy mở menu trình duyệt rồi chọn cài ứng dụng.",
      installing: "Đang cài ứng dụng...",
      installNow: "Cài ứng dụng HotsNew",
      installHint:
        "Đưa không gian làm việc lên desktop hoặc màn hình chính chỉ với một bước.",
    },
  },
  notificationBell: {
    ariaOpen: "Mở thông báo",
    title: "Thông báo",
    unreadCount: "{count} thông báo chưa đọc",
    emptyNew: "Không có thông báo mới",
    markAll: "Đọc hết",
    loading: "Đang tải thông báo...",
    empty: "Chưa có thông báo nào.",
    groups: {
      team: "Nhóm",
      links: "Liên kết",
      system: "Hệ thống",
    },
    relative: {
      minutes: "{count} phút trước",
      hours: "{count} giờ trước",
      days: "{count} ngày trước",
    },
    role: {
      owner: "chủ sở hữu",
      editor: "biên tập",
      viewer: "chỉ xem",
    },
    quotas: {
      linkDaily: "lượt tạo liên kết hôm nay",
      videoDaily: "lượt tải video hôm nay",
      teamWorkspace: "suất không gian nhóm",
    },
    items: {
      workspaceInvitation: {
        title: "Bạn có lời mời vào không gian làm việc",
        message:
          "{inviter} mời bạn vào không gian làm việc {workspace} với vai trò {role}.",
      },
      workspaceInvitationAccepted: {
        title: "Lời mời vào không gian làm việc đã được chấp nhận",
        message:
          "{member} đã chấp nhận lời mời vào không gian làm việc {workspace} ({role}).",
      },
      workspaceInvitationDeclined: {
        title: "Lời mời vào không gian làm việc đã bị từ chối",
        message:
          "{member} đã từ chối lời mời vào không gian làm việc {workspace} ({role}).",
      },
      workspaceMembershipUpdated: {
        title: "Vai trò trong không gian làm việc đã thay đổi",
        message:
          "Vai trò của bạn trong không gian làm việc {workspace} đã được đổi thành {role}.",
      },
      workspaceMembershipRemoved: {
        title: "Bạn đã bị xóa khỏi không gian làm việc",
        message:
          "Bạn không còn là thành viên của không gian làm việc {workspace}.",
      },
      linkClickThreshold: {
        title: "Liên kết đạt {count} lượt nhấp",
        message: "{label} vừa đạt mốc {count} lượt nhấp.",
      },
      linkExpiringSoon: {
        title: "Liên kết sắp hết hạn",
        message: "{label} sẽ hết hạn trong khoảng {hours} giờ nữa.",
      },
      quotaWarning: {
        title: "Cảnh báo quota",
        message: "Bạn còn {remaining} {quotaLabel}.",
      },
      subscriptionExpiring: {
        title: "Gói cước sắp hết hạn",
        message: "Gói {plan} của bạn sẽ hết hạn sau khoảng {days} ngày.",
      },
    },
  },
  pendingApproval: {
    title: "Đang chờ duyệt",
    description:
      "Tài khoản của bạn đang chờ quản trị viên phê duyệt để đảm bảo an toàn cho hệ thống.",
    signOut: "Đăng xuất tài khoản",
  },
  twoFactor: {
    title: "Xác thực hai lớp",
    subtitle: "{account} cần mã TOTP để truy cập hệ thống.",
    accountFallback: "Tài khoản của bạn",
    codeLabel: "Mã xác thực 6 số",
    verifying: "Đang xác minh...",
    submit: "Xác minh và vào ứng dụng",
    signOut: "Đăng xuất",
  },
  sidebar: {
    logoAlt: "Biểu tượng HotsNew Click",
    close: "Đóng thanh điều hướng",
    currentWorkspace: "Không gian hiện tại",
    mainMenu: "Menu chính",
    dashboard: "Bảng điều khiển",
    createLinks: "Tạo liên kết",
    linkList: "Danh sách liên kết",
    analytics: "Phân tích dữ liệu",
    team: "Nhóm làm việc",
    installApp: "Cài ứng dụng",
    admin: "Quản trị viên",
    userManagement: "Quản lý người dùng",
    contactAdmin: "Liên hệ Zalo quản trị",
    plans: "Gói dịch vụ",
    profile: "Hồ sơ cá nhân",
    signOut: "Đăng xuất",
    accountMenu: "Mở menu tài khoản",
    accountAvatar: "Ảnh tài khoản",
    roleAdmin: "Quản trị viên",
    rolePaid: "Thành viên trả phí",
    roleFree: "Thành viên miễn phí",
  },
  app: {
    loading: "Đang khởi tạo hệ thống...",
    createLocked: {
      titleViewer: "Không gian này chỉ cho xem",
      titleUpgrade: "Nâng cấp tài khoản",
      descriptionViewer:
        "Không gian hiện tại của bạn đang ở quyền chỉ xem nên chưa thể tạo hoặc chỉnh sửa liên kết. Hãy chuyển sang không gian khác hoặc nhờ chủ sở hữu nâng quyền biên tập.",
      descriptionUpgrade:
        "Tính năng chuyển đổi link Shopee và TikTok dành cho tài khoản trả phí. Vui lòng liên hệ quản trị viên để nâng cấp gói.",
      actionViewer: "Mở khu vực nhóm",
      actionUpgrade: "Quay lại bảng điều khiển",
    },
  },
  auth: {
    hero: {
      badge: "Trải nghiệm xác thực cao cấp",
      eyebrow: "Nền tảng HotsNew Click",
      title: "Quản lý liên kết Shopee",
      accent: "nhanh, gọn và chuyên nghiệp.",
      description:
        "Tạo link rút gọn, dựng trang xem trước thu hút và theo dõi hiệu quả chiến dịch trong một không gian làm việc đồng bộ, dễ dùng.",
      features: [
        {
          title: "Trang xem trước đẹp mắt",
          detail:
            "Trang đích, thống kê và xác thực dùng chung một ngôn ngữ thiết kế gọn gàng.",
        },
        {
          title: "Số liệu theo thời gian thực",
          detail:
            "Theo dõi lượt nhấp, chuyển đổi và hiệu quả của từng chiến dịch ngay trong một nơi.",
        },
        {
          title: "Bảo mật luôn sẵn sàng",
          detail:
            "Ghi nhớ đăng nhập, khôi phục mật khẩu và xác thực hai lớp cho vận hành thực tế.",
        },
      ],
      preview: {
        eyebrow: "Hệ sinh thái xem trước",
        title: "Bảng điều khiển, trang đích và xác thực cùng một nhịp.",
        statLabel: "Chuyển đổi trực tiếp",
        imageAlt: "Xem trước giao diện HotsNew",
        demoLabel: "Trình diễn",
        demoTitle: "Rút gọn liên kết, trang đích và thống kê trong một luồng",
      },
    },
    topbar: {
      tagline: "Không gian làm việc cho liên kết bán hàng",
      security: "Bảo mật an toàn",
    },
    footer: "HotsNew Click © 2026 • Dành cho người bán và đội vận hành",
    panel: {
      badges: {
        default: "Không gian xác thực",
        recovery: "Khôi phục tài khoản",
      },
      titles: {
        login: "Đăng nhập hệ thống",
        register: "Tạo tài khoản mới",
        recovery: "Đặt lại mật khẩu",
      },
      subtitles: {
        login: "Truy cập bảng điều khiển chỉ trong một bước",
        register: "Bắt đầu thiết lập không gian làm việc",
        recovery: "Cập nhật thông tin truy cập",
      },
      chips: {
        login: "Sẵn sàng",
        register: "Mới",
        recovery: "Đặt lại",
      },
      tabs: {
        login: "Đăng nhập",
        register: "Đăng ký",
      },
      fields: {
        email: "Địa chỉ email",
        password: "Mật khẩu",
        newPassword: "Mật khẩu mới",
        confirmPassword: "Xác nhận mật khẩu",
        confirmPasswordRegister: "Nhập lại mật khẩu",
      },
      placeholders: {
        email: "tenban@example.com",
      },
      misc: {
        forgotPassword: "Quên mật khẩu?",
        rememberMe: "Ghi nhớ đăng nhập trên thiết bị này",
      },
      actions: {
        login: "Truy cập hệ thống",
        register: "Tạo tài khoản",
        recovery: "Lưu mật khẩu mới",
        cancelLoading: "Hủy và thử lại nếu bị treo",
      },
      errors: {
        confirmPasswordMismatch: "Mật khẩu nhập lại không khớp.",
      },
      feedback: {
        sessionExpired: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        registerPasswordMismatch: "Mật khẩu nhập lại không khớp.",
        emailInUse:
          "Email này đã được sử dụng. Hãy đăng nhập hoặc đổi email khác.",
        registerSuccess:
          "Đăng ký thành công. Supabase đã gửi email xác nhận. Vui lòng mở hộp thư và bấm vào liên kết xác nhận trước khi đăng nhập.",
        loginFailed: "Đăng nhập thất bại. Vui lòng thử lại.",
        invalidCredentials:
          "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.",
        emailRateLimit:
          "Supabase đang chậm giới hạn gửi email xác nhận. Email này chưa chắc đã tồn tại. Hãy đợi vài phút rồi thử đăng ký lại.",
        userNotFound: "Không tìm thấy tài khoản với email này.",
        invalidEmail: "Email không hợp lệ. Vui lòng kiểm tra lại.",
        resetEmailSent:
          "Đã gửi email đặt lại mật khẩu. Hãy mở hộp thư và bấm vào liên kết để nhập mật khẩu mới.",
        resetEmailFailed: "Không gửi được email đặt lại mật khẩu.",
        tooManyRequests:
          "Bạn vừa yêu cầu quá nhiều lần. Vui lòng chờ vài phút rồi thử lại.",
        newPasswordMin: "Mật khẩu mới cần tối thiểu 6 ký tự.",
        recoveryPasswordMismatch: "Mật khẩu xác nhận không khớp.",
        passwordUpdated:
          "Mật khẩu đã được cập nhật thành công. Bạn có thể tiếp tục sử dụng tài khoản.",
        updatePasswordFailed: "Không thể cập nhật mật khẩu mới.",
        validRecoveryLink:
          "Liên kết hợp lệ. Hãy nhập mật khẩu mới cho tài khoản.",
      },
    },
  },
  installCenter: {
    badge: "Cài ứng dụng",
    title:
      "Cài ứng dụng một lần để vào không gian làm việc nhanh và gọn hơn mỗi ngày.",
    description:
      "Trang này chỉ giữ lại đúng một việc cần thiết: giúp người dùng cài HotsNew như một ứng dụng riêng để thao tác vận hành mượt hơn.",
    highlights: [
      {
        label: "Thời gian cài",
        value: "1 phút",
        hint: "Chỉ cần cài một lần trên thiết bị bạn đang dùng.",
      },
      {
        label: "Truy cập nhanh",
        value: "1 chạm mở",
        hint: "Mở không gian làm việc như một ứng dụng riêng thay vì đi tìm lại tab trình duyệt.",
      },
      {
        label: "Phù hợp nhất",
        value: "Đội vận hành",
        hint: "Dành cho người mở dashboard thường xuyên mỗi ngày.",
      },
    ],
    status: {
      eyebrow: "Trạng thái cài đặt",
      title: "Ứng dụng riêng cho HotsNew",
      labels: {
        installed: "Ứng dụng đã sẵn sàng trên thiết bị này",
        ready: "Có thể cài trực tiếp ngay bây giờ",
        menu: "Cần mở menu trình duyệt để cài ứng dụng",
      },
      descriptions: {
        installed:
          "Thiết bị này đã có ứng dụng. Bạn có thể mở HotsNew như một công cụ riêng mà không cần quay lại tab trình duyệt.",
        ready:
          "Trình duyệt hiện tại hỗ trợ cài trực tiếp. Bấm nút bên dưới để đưa HotsNew lên desktop hoặc màn hình chính.",
        menu: "Nếu chưa thấy gợi ý cài đặt, hãy mở menu trình duyệt rồi chọn cài ứng dụng từ đó.",
      },
    },
    platforms: {
      eyebrow: "Tải xuống theo nền tảng",
      title: "Phát hành bản PC ngay trên cùng một màn hình cài đặt",
      description:
        "Khi đã có link bộ cài Windows, bạn chỉ cần gắn vào đây. Trước mắt, trình duyệt desktop được hỗ trợ vẫn có thể fallback sang cài web app.",
      actions: {
        installHere: "Cài trên thiết bị này",
        desktopDownload: "Tải bản PC",
        unavailable: "Chưa cấu hình bản phát hành",
      },
      hints: {
        direct: "Liên kết phát hành trực tiếp",
        fallback:
          "Vẫn có thể dùng luồng cài từ trình duyệt trên thiết bị được hỗ trợ.",
        configure:
          "Thêm link thật bằng VITE_DESKTOP_APP_URL.",
      },
      desktop: {
        badge: "Windows",
        title: "PC",
        description:
          "Có thể phát hành bộ cài Windows trực tiếp, hoặc cho người dùng cài web app ngay từ trình duyệt hôm nay.",
        help:
          "Khi chưa có link desktop, trình duyệt desktop được hỗ trợ vẫn có thể fallback sang luồng cài hiện tại.",
      },
    },
    convert: {
      eyebrow: "Phát hành desktop",
      title: "Web app giờ tập trung vào luồng phát hành bản PC",
      description:
        "Luồng phát hành giờ tập trung vào bản Windows và luồng cài từ trình duyệt, không còn duy trì wrapper native riêng cho Android và iOS.",
      steps: [
        "Build gói Windows bằng npm run desktop:build.",
        "Upload bộ cài hoặc bản portable từ thư mục release.",
        "Gắn VITE_DESKTOP_APP_URL tới link tải công khai.",
        "Giữ luồng cài từ trình duyệt làm phương án dự phòng khi cần.",
      ],
      notes: [
        "Desktop shell chỉ mở URL production của web app thay vì nhúng secret server vào máy người dùng.",
        "Thư mục release chứa bộ cài, bản portable và bản zip fallback.",
        "VITE_DESKTOP_APP_URL điều khiển nút tải bản PC trên màn hình này.",
      ],
    },
    flow: {
      eyebrow: "Luồng sử dụng",
      title: "Ứng dụng giúp quy trình làm việc gọn hơn ở đâu",
      description:
        "Khi đã cài xong, HotsNew có thể đứng riêng như một công cụ làm việc thật sự thay vì chỉ là một tab web dễ bị chìm giữa nhiều tab khác.",
      useCases: [
        "Mở HotsNew như một ứng dụng riêng, tách khỏi trình duyệt.",
        "Giảm thời gian tìm lại đúng tab làm việc khi xử lý nhiều liên kết.",
        "Phù hợp cho người vận hành cần vào dashboard liên tục trong ngày.",
      ],
      preview: {
        eyebrow: "Chế độ ứng dụng",
        title: "Không gian làm việc HotsNew",
        currentWorkspace: "Không gian hiện tại",
        currentWorkspaceValue: "Nhà LG · chủ sở hữu",
        actionLabel: "Thao tác",
        actionValue: "Tạo liên kết",
        accessLabel: "Truy cập",
        accessValue: "Một chạm mở",
      },
    },
    surfaces: {
      title: "Cài ứng dụng HotsNew",
      description:
        "Dùng khi bạn muốn không gian làm việc xuất hiện như một công cụ thật sự, dễ truy cập hơn và ít phụ thuộc vào tab trình duyệt.",
      items: [
        {
          title: "Máy tính",
          body: "Tạo một cửa sổ làm việc riêng cho HotsNew để thao tác tập trung hơn.",
        },
        {
          title: "Điện thoại",
          body: "Ghim ra màn hình chính để mở không gian làm việc nhanh như một ứng dụng thật.",
        },
      ],
    },
    workflow: {
      title: "Quy trình đề xuất",
      description:
        "Giữ lại đúng phần cần thiết để hướng dẫn người dùng mới nhanh hơn và đỡ nhiễu hơn.",
      checklist: [
        "Cài ứng dụng trên thiết bị bạn dùng thường xuyên nhất.",
        "Ghim ứng dụng ra desktop hoặc màn hình chính để vào nhanh hơn.",
        "Dùng trang này làm bước hướng dẫn nhanh cho thành viên mới.",
      ],
    },
    troubleshooting: {
      eyebrow: "Xử lý lỗi",
      title: "Một vài tình huống thường gặp",
      items: [
        {
          title: "Không thấy nút cài ứng dụng",
          body: "Hãy mở site bằng Chrome hoặc Cốc Cốc bản mới, rồi thử lại từ menu trình duyệt.",
        },
        {
          title: "Đã cài nhưng chưa quen cách mở",
          body: "Tìm HotsNew trong danh sách ứng dụng hoặc biểu tượng vừa được ghim trên thiết bị.",
        },
        {
          title: "Muốn cài lại trên thiết bị khác",
          body: "Mỗi thiết bị cần cài riêng một lần. Chỉ cần đăng nhập lại HotsNew trên thiết bị đó.",
        },
      ],
    },
    cta: {
      eyebrow: "Bắt đầu nhanh",
      title:
        "Trang này giờ chỉ còn đúng phần ứng dụng, gọn hơn và dễ dùng hơn.",
      description:
        "Khi cần hướng dẫn thành viên mới, chỉ cần cho họ cài ứng dụng và ghim lại nơi truy cập. Luồng này giờ chỉ tập trung vào app để ngắn gọn và dễ hiểu hơn.",
      button: "Mở HotsNew ở tab mới",
    },
  },
  pricing: {
    header: {
      title: "Bảng giá dịch vụ",
      description:
        "ZaloPay đã được gỡ khỏi luồng thanh toán. Hiện tại app dùng hình thức liên hệ admin hoặc nhận QR chuyển khoản để kích hoạt gói.",
    },
    status: {
      eyebrow: "Trạng thái hiện tại",
      free: "Gói miễn phí",
      monthly: "Gói tháng",
      yearly: "Gói năm",
      activeUntil: "Gói đang hoạt động đến {date}.",
      badgeFree: "Miễn phí",
      badgeActive: "Đang hoạt động",
      remaining: "Còn lại: {duration}",
      noExpiry: "Chưa có ngày hết hạn để hiển thị đếm ngược.",
      linksUnlimited: "Liên kết: Không giới hạn",
      linksDaily: "Liên kết: {used}/{limit}",
      videosUnlimited: "Không giới hạn upload video mỗi ngày.",
      videosDaily: "Video hôm nay: {used}/{limit}",
    },
    countdown: {
      day: "ngày",
      hour: "giờ",
      minute: "phút",
      second: "giây",
    },
    actions: {
      activate: "Liên hệ kích hoạt",
      renew: "Liên hệ gia hạn",
      disabledYearly:
        "Gói năm đang hoạt động nên tạm khóa việc mở gói thấp hơn.",
      disabledRenew: "Gia hạn chỉ mở khi gói còn 7 ngày hoặc ít hơn.",
    },
    metrics: {
      linksPerDay: "{value} link / ngày",
      videosPerDay: "{value} video / ngày",
      workspaces: "{value} không gian",
      members: "{value} thành viên",
    },
    plans: {
      monthly: {
        name: "Gói tháng",
        price: "79.000đ",
        period: "/ THÁNG",
        description: "Phù hợp để chạy thử hoặc vận hành ngắn hạn.",
        badge: "Linh hoạt",
        features: [
          "Tạo trang đích không giới hạn",
          "Tải video và ảnh đại diện",
          "Quản lý liên kết và theo dõi thống kê",
          "Kích hoạt thủ công qua QR ngân hàng hoặc quản trị viên",
        ],
      },
      yearly: {
        name: "Gói năm",
        price: "749.000đ",
        period: "/ NĂM",
        description:
          "Tối ưu chi phí và phù hợp cho tài khoản vận hành lâu dài.",
        badge: "Tiết kiệm hơn",
        features: [
          "Tạo trang đích không giới hạn",
          "Tải video và ảnh đại diện",
          "Quản lý liên kết và theo dõi thống kê",
          "Kích hoạt thủ công qua QR ngân hàng hoặc quản trị viên",
        ],
      },
    },
  },
  analytics: {
    stats: {
      redirects: "Lượt chuyển hướng",
      shopee: "Lượt sang Shopee",
      tiktok: "Lượt sang TikTok",
      activeLinks: "Liên kết đang hoạt động",
      growth: "Tăng trưởng 30 ngày",
    },
    views: {
      basic: "Thống kê cơ bản",
      advanced: "Phân tích nâng cao",
    },
    chart: {
      title: "Biểu đồ lượt chuyển hướng",
      description:
        "Thống kê lượt chuyển sang Shopee và TikTok trong 30 ngày gần nhất.",
      liveData: "Dữ liệu trực tiếp",
      shopee: "Shopee: {count}",
      tiktok: "TikTok: {count}",
      empty: "Không có dữ liệu chuyển hướng trong 30 ngày qua.",
    },
    topLinks: {
      title: "Liên kết hiệu quả nhất",
      empty: "Chưa có dữ liệu thống kê liên kết.",
      itemMeta: "{count} lượt chuyển hướng · /s/{code}",
    },
    traffic: {
      title: "Nguồn lưu lượng",
      empty: "Chưa có dữ liệu nguồn lưu lượng.",
    },
    overview: {
      greeting: {
        morning: "Chào buổi sáng",
        afternoon: "Chào buổi chiều",
        evening: "Chào buổi tối",
      },
      hero: {
        badge: "Bảng điều khiển hiệu suất",
        title: "{greeting}, đây là nhịp tăng trưởng chiến dịch của bạn.",
      },
      summary: {
        growth: "Tăng trưởng 30 ngày",
        efficiency: "Hiệu quả",
        recent: "7 ngày gần đây",
        recentBest: "{count} lượt nhấp ở ngày tốt nhất",
        recentEmpty: "Chưa có dữ liệu lịch sử",
      },
      efficiency: {
        veryHigh: {
          label: "Rất cao",
          note: "Mỗi liên kết đang tạo lực kéo rất tốt.",
        },
        high: {
          label: "Cao",
          note: "Chỉ số outbound đang vượt mức an toàn.",
        },
        medium: {
          label: "Trung bình",
          note: "Đã có nền ổn định, vẫn còn dư địa để tối ưu.",
        },
        rising: {
          label: "Đang tăng",
          note: "Đã có tín hiệu, nên đẩy thêm CTA và phân phối.",
        },
        empty: {
          label: "Chưa có",
          note: "Cần tạo thêm liên kết hoặc đẩy traffic đầu vào.",
        },
      },
      growthLabels: {
        sprinting: "Bứt tốc",
        stable: "Ổn định",
        optimize: "Cần tối ưu",
      },
      metrics: {
        totalLinks: "Tổng liên kết",
        outboundClicks: "Lượt nhấp chuyển hướng",
        toShopee: "Ra Shopee",
        toTiktok: "Ra TikTok",
        totalLinksDetail: "{avg} lượt nhấp trung bình mỗi liên kết",
        totalLinksEmpty: "Bắt đầu tạo liên kết đầu tiên để mở dữ liệu",
        outboundDetail: "Tổng lượt nhấp điều hướng ra đích",
        outboundEmpty: "Chưa có phiên outbound nào được ghi nhận",
        marketplaceShare: "{share}% tổng outbound",
        shopeeEmpty: "Chưa ghi nhận traffic đi Shopee",
        tiktokEmpty: "Chưa ghi nhận traffic đi TikTok",
      },
      recent: {
        eyebrow: "Nhịp nhấp gần đây",
        title: "Diễn biến outbound theo ngày",
        emptyTitle: "Dữ liệu sẽ xuất hiện khi có lượt nhấp mới",
        action: "Mở phân tích",
        chartEmpty:
          "Hệ thống chưa có dữ liệu lượt nhấp gần đây để dựng xu hướng.",
      },
      trafficDistribution: {
        eyebrow: "Phân bổ traffic",
        shopee: "Shopee",
        tiktok: "TikTok",
        other: "Khác",
      },
      suggestions: {
        eyebrow: "Đề xuất nhanh",
        noClicks:
          "Tạo thêm trang đích liên kết và đẩy traffic đầu vào để hệ thống bắt đầu học hành vi nhấp.",
        missingChannel:
          "Một kênh đang chưa có dữ liệu. Nên bổ sung phân phối chéo để so sánh hiệu quả rõ hơn.",
        ready:
          "Bạn đã có dữ liệu đa kênh. Tập trung tối ưu tiêu đề và thumbnail cho top liên kết để đẩy CTR.",
      },
      actionPanel: {
        eyebrow: "Hành động ưu tiên",
        title: "Tạo thêm liên kết có chủ đích để đẩy hiệu suất rõ ràng hơn.",
        description:
          "Khi dữ liệu đã được sắp lớp tốt, bước tiếp theo là tạo liên kết theo từng chiến dịch hoặc từng kênh để đo chính xác chất lượng traffic.",
        clicksPerLink: "Lượt nhấp / liên kết",
        channelsWithData: "Kênh có dữ liệu",
        createNow: "Tạo liên kết ngay",
        upgrade: "Nâng cấp gói",
        viewAdvanced: "Xem phân tích sâu",
      },
      topLinks: {
        eyebrow: "Liên kết nổi bật",
        title: "Top liên kết hiệu quả nhất",
        action: "Xem danh sách",
        outbound: "Outbound",
        empty: "Chưa có dữ liệu liên kết nổi bật để hiển thị.",
      },
    },
    advanced: {
      tabs: {
        geo: "Địa lý",
        device: "Thiết bị",
        time: "Thời gian",
        notifications: "Thông báo",
      },
      actions: {
        exportClicks: "Xuất chi tiết (CSV)",
        exportSummary: "Xuất tổng quan",
        save: "Lưu cài đặt",
        saving: "Đang lưu...",
      },
      toasts: {
        settingsSaved: "Đã lưu cài đặt thông báo.",
        settingsFailed: "Không thể lưu cài đặt. Vui lòng thử lại.",
        exportSuccess: "Đã tải xuống file CSV.",
        exportFailed: "Không thể xuất dữ liệu. Vui lòng thử lại.",
      },
      common: {
        clicks: "{count} lượt nhấp",
        noData: "Chưa có dữ liệu",
        peakHour: "Cao điểm: {hour}:00",
        peakDay: "Cao điểm: {day}",
        tooltipLabel: "Lượt nhấp",
      },
      geo: {
        countries: "Quốc gia",
        countriesCount: "{count} quốc gia",
        countriesEmpty: "Chưa có dữ liệu địa lý",
        cities: "Thành phố",
        citiesCount: "{count} thành phố",
        citiesEmpty: "Chưa có dữ liệu thành phố",
      },
      device: {
        types: "Loại thiết bị",
        browsers: "Trình duyệt",
        operatingSystems: "Hệ điều hành",
      },
      time: {
        byHour: "Phân bổ theo giờ",
        byDay: "Phân bổ theo ngày",
      },
      notifications: {
        title: "Cài đặt thông báo",
        toggleTitle: "Thông báo khi có lượt nhấp mới",
        toggleDescription: "Nhận thông báo qua Webhook hoặc Telegram",
        thresholdLabel: "Ngưỡng thông báo (0 = mọi lượt nhấp)",
        thresholdPlaceholder: "Ví dụ: 10 (thông báo mỗi 10 lượt nhấp)",
        thresholdHint:
          "Đặt 0 để nhận thông báo cho mọi lượt nhấp, hoặc đặt N để nhận thông báo mỗi N lượt nhấp.",
        webhookLabel: "Đường dẫn webhook",
        webhookPlaceholder: "https://your-webhook-endpoint.com/webhook",
        webhookHint: "Đường dẫn này sẽ nhận yêu cầu POST khi có lượt nhấp mới.",
        telegramTitle: "Cài đặt bot Telegram",
        botToken: "Mã bot",
        chatId: "Mã chat",
        chatIdPlaceholder: "123456789 hoặc @channelusername",
      },
    },
  },
  admin: {
    deleteModal: {
      title: "Xác nhận xóa?",
      description:
        "Bạn có chắc chắn muốn xóa người dùng này? Mọi liên kết và dữ liệu liên quan sẽ bị xóa vĩnh viễn.",
      cancel: "Hủy",
      confirm: "Xóa ngay",
    },
    stats: {
      totalUsers: "Tổng người dùng",
      premiumUsers: "Trả phí",
      pendingUsers: "Chờ duyệt",
      revenue: "Doanh thu",
    },
    header: {
      title: "Quản lý người dùng",
      description: "Quản lý, phê duyệt và theo dõi hoạt động thành viên.",
    },
    domains: {
      title: "Domain đầu ra",
      description:
        "Chọn trước 2-3 domain đầu ra để người dùng gói năm chọn khi tạo link.",
      add: "Thêm domain",
      save: "Lưu danh sách",
      saving: "Đang lưu...",
    },
    accessLogs: {
      title: "Nhật ký truy cập",
      description: "Lịch sử truy cập gần đây trên toàn hệ thống.",
      loading: "Đang tải nhật ký truy cập...",
      empty: "Chưa có nhật ký truy cập nào.",
      guest: "Khách",
      unknownIp: "IP không rõ",
      blocked: "Bị chặn",
    },
    ipBlock: {
      title: "Chặn IP",
      description: "Chặn IP độc hại hoặc truy cập bất thường.",
      ipPlaceholder: "Ví dụ: 203.113.10.5",
      reasonPlaceholder: "Lý do chặn IP...",
      submit: "Chặn IP",
      submitting: "Đang chặn...",
      empty: "Chưa có IP nào bị chặn.",
      noReason: "Không có ghi chú",
      active: "Đang chặn",
      inactive: "Đã gỡ",
      unblock: "Gỡ chặn",
    },
    filters: {
      searchPlaceholder: "Tìm theo tiêu đề, mã, nguồn, tag...",
      allPlans: "Tất cả gói",
      allStatuses: "Tất cả trạng thái",
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
      showing: "Hiển thị {shown} / {total} người dùng",
    },
    table: {
      title: "Thành viên hệ thống",
      count: "{count} người dùng",
      loading: "Đang tải người dùng...",
      empty: "Không tìm thấy người dùng nào.",
      unnamed: "Chưa đặt tên",
      online: "Trực tuyến",
      viewDetails: "Xem chi tiết",
    },
    actions: {
      approveNow: "Duyệt ngay",
      approveUser: "Duyệt người dùng",
      deleteUser: "Xóa người dùng",
    },
    detail: {
      title: "Chi tiết người dùng",
      linksTitle: "Link của người dùng ({count})",
      linksLoading: "Đang tải...",
      linksEmpty: "Chưa có link nào",
      clicks: "{count} lượt nhấp",
    },
    plans: {
      free: "Miễn phí",
      monthly: "Gói tháng",
      yearly: "Gói năm",
    },
    statuses: {
      approved: "Đã duyệt",
      pending: "Chờ duyệt",
    },
  },
  profile: {
    toasts: {
      copiedSecret: "Đã sao chép secret 2FA.",
      copiedUri: "Đã sao chép URI thiết lập 2FA.",
    },
    header: {
      title: "Hồ sơ cá nhân",
      description: "Quản lý danh tính và các thiết lập tài khoản của bạn.",
      premium: "Thành viên trả phí",
    },
    avatar: {
      alt: "Ảnh đại diện",
      uploadTitle: "Tải ảnh đại diện",
      emptyHint: "Chọn JPG, PNG hoặc WebP để thay avatar.",
      helper:
        "Hệ thống sẽ tự resize về tối đa 512px và nén WebP trước khi tải lên.",
    },
    statusCard: {
      label: "Trạng thái",
      approved: "Hoạt động",
      pending: "Chờ duyệt",
    },
    fields: {
      email: "Địa chỉ email",
      emailHelp: "Định danh tài khoản không thể thay đổi.",
      fullName: "Họ và tên đầy đủ",
      fullNamePlaceholder: "Họ tên hiển thị của bạn...",
    },
    infoBanner: {
      title: "Dữ liệu cá nhân an toàn",
      description:
        "Thông tin của bạn được mã hóa và chỉ dùng cho mục đích xác thực, quản lý quyền hạn trong hệ thống HotsNew Click.",
    },
    meta: {
      joined: "Gia nhập",
      verified: "Xác minh",
      verifiedValue: "Đã kiểm định",
      unknown: "---",
    },
    actions: {
      save: "Lưu các thay đổi",
      verifiedNote: "Mọi thông tin đã được kiểm định",
    },
    security: {
      title: "Bảo mật tài khoản",
      description: "Bật 2FA/TOTP và theo dõi lịch sử truy cập gần đây.",
      enabled: "2FA đang bật",
      disabled: "2FA chưa bật",
      totpTitle: "Xác thực 2 lớp (TOTP)",
      totpDescription:
        "Dùng Google Authenticator, 1Password hoặc Authy để tạo mã 6 số.",
      qrSetup: "Thiết lập QR",
      qrHint: "Quét mã này bằng Google Authenticator.",
      secretTitle: "Secret thiết lập",
      secretHint:
        "Nếu không quét QR, bạn có thể nhập secret thủ công vào Google Authenticator.",
      copy: "Sao chép",
      copyUri: "Sao chép URI",
      howToTitle: "Cách bật 2FA",
      howToSteps: [
        "1. Bấm tạo secret 2FA.",
        "2. Quét QR hoặc nhập secret vào Google Authenticator.",
        "3. Lấy mã 6 số đang hiển thị trong Google Authenticator rồi nhập vào ô bên dưới.",
        "4. Bấm xác minh để bật 2FA.",
      ],
      createFirst:
        "Bấm Tạo secret 2FA trước. Sau đó Google Authenticator mới sinh ra mã 6 số để bạn nhập.",
      codeLabel: "Mã xác thực 6 số",
      codeRefresh: "Đổi sau {seconds}s",
      codePlaceholderDisable: "Nhập mã hiện tại để tắt 2FA",
      codePlaceholderEnable: "Nhập mã đang hiện trên Google Authenticator",
      codePlaceholderCreate: "Tạo secret 2FA trước",
      codeHelpEnabled:
        "Đây là mã 6 số hiện tại trong Google Authenticator để xác nhận thao tác tắt 2FA hoặc để vượt qua bước xác minh khi đăng nhập.",
      codeHelpSetup:
        "Không nhập số bạn tự nghĩ ra. Phải nhập đúng mã 6 số đang chạy trong Google Authenticator sau khi đã quét QR hoặc nhập secret.",
      codeHelpCreate:
        "Sau khi tạo secret, Google Authenticator mới tạo ra mã 6 số để nhập ở đây.",
      codeIncomplete: "Cần nhập đủ 6 số OTP từ Google Authenticator.",
      createSecret: "Tạo secret 2FA",
      enable: "Xác minh và bật 2FA",
      disable: "Tắt 2FA",
      lastVerified: "Xác minh gần nhất: {date}",
      noVerification: "Chưa có lần xác minh 2FA nào.",
    },
    accessLogs: {
      title: "Hoạt động bảo mật gần đây",
      description: "Truy cập gần đây của chính bạn.",
      loading: "Đang tải lịch sử truy cập...",
      empty: "Chưa có nhật ký truy cập nào.",
      unknownIp: "IP không rõ",
      devices: {
        unknown: "Thiết bị không rõ",
        ios: "iPhone / iPad",
        android: "Điện thoại Android",
        windows: "Máy tính Windows",
        mac: "Máy tính Mac",
        other: "Trình duyệt khác",
      },
      statuses: {
        review: "Cần kiểm tra",
        normal: "Bình thường",
      },
      summaries: {
        setup: {
          title: "Bạn đã tạo secret 2FA",
          description:
            "Hệ thống đã chuẩn bị mã bí mật để bạn bật xác thực 2 lớp.",
        },
        enable: {
          title: "Bạn đã bật xác thực 2 lớp",
          description: "Tài khoản đã được tăng thêm một lớp bảo mật.",
        },
        disable: {
          title: "Bạn đã tắt xác thực 2 lớp",
          description: "Tài khoản hiện không còn yêu cầu mã 2FA khi đăng nhập.",
        },
        challenge: {
          title: "Bạn đã xác minh 2FA",
          description: "Mã xác thực 2 lớp đã được kiểm tra cho phiên hiện tại.",
        },
        workspaceInvites: {
          title: "Bạn đã xem lời mời vào không gian",
          description: "Hệ thống đã tải danh sách lời mời nhóm đang chờ xử lý.",
        },
        workspaceMembers: {
          title: "Bạn đã xem danh sách thành viên",
          description: "Danh sách thành viên trong không gian đã được mở.",
        },
        workspaces: {
          title: "Bạn đã mở khu vực nhóm",
          description:
            "Hệ thống đã tải danh sách không gian làm việc và quyền hiện tại của bạn.",
        },
        stats: {
          title: "Bạn đã xem thống kê",
          description: "Dữ liệu thống kê của không gian đã được tải.",
        },
        quota: {
          title: "Bạn đã xem quota tạo link",
          description:
            "Hệ thống đã kiểm tra số lượt tạo link còn lại trong ngày.",
        },
        limits: {
          title: "Bạn đã xem giới hạn tài khoản",
          description: "Hệ thống đã kiểm tra giới hạn gói hiện tại của bạn.",
        },
        linksRead: {
          title: "Bạn đã mở danh sách link",
          description: "Danh sách link của bạn đã được tải.",
        },
        linksWrite: {
          title: "Bạn đã thao tác với link",
          description: "Hệ thống đã ghi nhận một thao tác liên quan đến link.",
        },
        notifications: {
          title: "Bạn đã mở thông báo",
          description: "Hộp thông báo trong ứng dụng đã được tải.",
        },
        profile: {
          title: "Bạn đã mở hồ sơ tài khoản",
          description: "Thông tin hồ sơ cá nhân đã được tải.",
        },
        security: {
          title: "Bạn đã mở cài đặt bảo mật",
          description: "Hệ thống đã tải thông tin bảo mật tài khoản gần đây.",
        },
        generic: {
          title: "Bạn đã truy cập một tính năng trong hệ thống",
          description:
            "Hệ thống đã ghi nhận một hoạt động gần đây của tài khoản này.",
        },
      },
    },
    common: {
      unnamed: "Chưa đặt tên",
    },
  },
  linkList: {
    filters: {
      usagePlaceholder: "Chọn vị trí sử dụng",
      usageFacebookPost: "Bài viết Facebook",
      usageFacebookReel: "Video ngắn Facebook",
      usageTikTokBio: "Tiểu sử TikTok",
      usageTikTokVideo: "Video TikTok",
      usageZalo: "Zalo chính thức",
      usageSeeding: "Nhóm seeding",
      usageLivestream: "Phát trực tiếp",
      all: "Toàn bộ",
      choice: "Chế độ 2 bước",
      video: "Có video",
      tiktok: "Có TikTok",
      expiring: "Sắp hết hạn",
      top: "Lượt nhấp cao",
      quick: "Bộ lọc nhanh",
    },
    hero: {
      badge: "Bản gọn nâng cao",
      title: "Quản lý liên kết",
      searchPlaceholder: "Tìm theo tiêu đề, mã, nguồn, nhãn...",
      description:
        "Hiển thị {shown}/{total} tài nguyên. Bản này ưu tiên tốc độ quét danh sách, thao tác nhanh và mật độ hiển thị gọn hơn.",
    },
    stats: {
      total: "Tổng liên kết",
      totalNote: "{shown} đang hiển thị",
      shopee: "Lượt nhấp Shopee",
      shopeeNote: "Chuyển hướng chính",
      tiktok: "Lượt nhấp TikTok",
      tiktokNote: "Luồng phụ",
      choice: "Chế độ 2 bước",
      choiceNote: "Link có bước 2",
      expiring: "Sắp hết hạn",
      expiringNote: "TB {count} lượt nhấp/liên kết",
    },
    bulk: {
      deselectVisible: "Bỏ chọn đang xem",
      selectVisible: "Chọn tất cả đang xem",
      selected: "Đã chọn {count} liên kết",
      current: "Hiện tại: {selected}/{total}",
      delete: "Xóa {count} liên kết",
      hint: "Chọn nhiều liên kết để thao tác nhanh.",
      confirmTitle: "Xác nhận xóa {count} liên kết?",
      confirmDescription:
        "Hành động này sẽ xóa vĩnh viễn {count} liên kết và mọi dữ liệu thống kê. Không thể khôi phục sau khi xóa.",
      confirmAction: "Xóa vĩnh viễn {count} liên kết",
      cancel: "Hủy bỏ",
    },
    empty: {
      noLinks: "Chưa có liên kết nào được tạo.",
      noResults: "Không có liên kết nào khớp bộ lọc hiện tại.",
      hint: "Thử đổi từ khóa tìm kiếm hoặc đổi bộ lọc.",
    },
    card: {
      untitled: "Liên kết chưa có tiêu đề",
      createdAgo: "{time} trước",
      totalClicks: "Tổng {count} lượt nhấp",
      protected: "Bảo vệ",
      secondaryTikTok: "Shopee sang TikTok",
      secondaryShopee: "Shopee sang Shopee",
      stepTwo: "Bước 2",
      unknown: "Không rõ",
      edit: "Chỉnh sửa",
      delete: "Xóa link",
      editShort: "Sửa",
      deleteShort: "Xóa",
      copy: "Sao chép",
      copied: "Đã chép",
      qr: "Mã QR",
      choiceLanding: "Mở trang đích cho chế độ 2 bước",
    },
    editModal: {
      title: "Chỉnh sửa link",
      originalUrl: "Liên kết gốc",
      originalHelp: "Liên kết thực tế mà người dùng sẽ được chuyển tới.",
      titleField: "Tiêu đề",
      titlePlaceholder: "Tiêu đề hiển thị...",
      descriptionField: "Mô tả",
      descriptionPlaceholder: "Mô tả nội dung...",
      usageField: "Dùng ở đâu",
      folderField: "Thư mục chiến dịch",
      folderPlaceholder: "sale-6-6, remarketing...",
      tagsField: "Nhãn",
      tagsPlaceholder: "facebook, retarget, campaign-a",
      tagsHelp: "Phân tách nhiều nhãn bằng dấu phẩy.",
      thumbnailField: "Đường dẫn ảnh đại diện",
      expiresField: "Thời hạn liên kết",
      expiresNone: "Không hết hạn",
      expiresDay: "{count} ngày",
      expiresHelp: "Liên kết sẽ tự động vô hiệu sau thời gian đã chọn.",
      secondaryField: "Liên kết bước 2",
      cancel: "Hủy bỏ",
      save: "Lưu thay đổi",
    },
    deleteModal: {
      title: "Xác nhận xóa link?",
      description:
        "Hành động này sẽ xóa vĩnh viễn link {code} và mọi dữ liệu thống kê. Không thể khôi phục sau khi xóa.",
      confirm: "Xóa vĩnh viễn",
      cancel: "Hủy bỏ",
    },
    qrModal: {
      title: "Mã QR của bạn",
      hint: "Quét để truy cập liên kết",
      download: "Tải mã QR (.png)",
    },
  },
  createLink: {
    validation: {
      primaryRequired: "Vui lòng nhập liên kết gốc Shopee hoặc TikTok.",
      primaryInvalid: "Liên kết gốc phải là domain Shopee hoặc TikTok hợp lệ.",
      titleRequired: "Vui lòng nhập tiêu đề hiển thị.",
      descriptionRequired: "Vui lòng nhập mô tả bài viết.",
      imageOrVideoRequired:
        "Vui lòng nhập đường dẫn ảnh đại diện hoặc tải lên video.",
      videoOrImageRequired:
        "Vui lòng tải lên video hoặc nhập đường dẫn ảnh đại diện.",
      shortCodeMin: "Mã rút gọn phải có ít nhất 3 ký tự.",
      shortCodeMax: "Mã rút gọn không được vượt quá {max} ký tự.",
      secondaryNeedsVideo:
        "Liên kết bước 2 chỉ dùng được khi bạn đã tải video lên.",
      secondaryShopeeInvalid: "Liên kết bước 2 phải là domain Shopee hợp lệ.",
      secondaryTiktokInvalid: "Liên kết bước 2 phải là domain TikTok hợp lệ.",
      secondarySameShopee:
        "Liên kết bước 2 phải cùng domain Shopee với link Shopee gốc khi chọn mode Shopee.",
      redirectDelayRange: "Độ trễ phải nằm trong khoảng 1 đến 10 giây.",
      dropVideo: "Vui lòng thả đúng file video hợp lệ.",
      dropImage: "Vui lòng thả đúng file ảnh đại diện.",
    },
    page: {
      title: "Tạo trang đích mới",
      description:
        "Hệ thống sẽ tự động lấy dữ liệu và tối ưu hiển thị trên Facebook.",
      closeError: "Đóng thông báo",
      sectionEyebrow: "Thiết lập liên kết",
      formTitle: "Rút gọn liên kết",
      quotaExhausted: "Hết lượt hôm nay",
      submit: "Rút gọn liên kết",
      originalLabel: "Liên kết gốc Shopee / TikTok",
      originalPlaceholder: "Dán liên kết sản phẩm Shopee hoặc TikTok...",
      originalHelp:
        "Hỗ trợ link domain Shopee và TikTok để giữ flow chuyển đổi ổn định.",
      titleLabel: "Tiêu đề tùy chỉnh",
      titlePlaceholder: "Tiêu đề hiển thị...",
      descriptionLabel: "Mô tả bài viết",
      descriptionPlaceholder: "Mô tả thu hút lượt nhấp...",
      shortCodeLabel: "Mã rút gọn tùy chỉnh",
      shortCodePlaceholder: "Ví dụ: toi-yeu-em",
      previewPrefix: "Liên kết sẽ thành:",
      previewFallback: "ma-rut-gon-cua-ban",
      shortCodeMax: "Tối đa {max} ký tự.",
      advancedTitle: "Cài đặt nâng cao",
      advancedDescription:
        "Domain đầu ra, UTM, affiliate, thử nghiệm A/B, thời hạn và luồng bước 2.",
      marketingTitle: "Tiếp thị và tăng trưởng",
      marketingDescription:
        "Gắn UTM tự động, xuất liên kết theo domain riêng và chuẩn bị sẵn dữ liệu tăng trưởng ngay từ lúc tạo.",
      customDomainLocked:
        "Chọn domain đầu ra chỉ mở cho gói năm hoặc quản trị viên.",
      defaultDomain: "Domain mặc định: hotsnew.click",
      contactUpgrade: "Liên hệ Zalo mở gói",
      adminPlan: "Quản trị viên",
      yearlyPlan: "Gói năm",
      monthlyPlan: "Gói tháng",
      freePlan: "Gói miễn phí",
      unlimitedLinks: "Liên kết: Không giới hạn",
      linksQuota: "Liên kết: {used}/{limit}",
      unlimitedVideos: "Video: Không giới hạn",
      videosQuota: "Video: {used}/{limit}",
      campaignToggleTitle: "Theo dấu chiến dịch (UTM)",
      campaignToggleDescription:
        "Gắn UTM để biết lượt nhấp đến từ Facebook, TikTok hay Zalo.",
      campaignEnabled: "Đang bật",
      campaignDisabled: "Đang tắt",
      utmSourceLabel: "Nguồn traffic",
      utmSourcePlaceholder: "Ví dụ: facebook",
      utmSourceHelp: "Hệ thống tự gắn thêm utm_medium=social.",
      utmCampaignLabel: "Tên chiến dịch",
      utmCampaignPlaceholder: "Ví dụ: sale-6-6 hoặc me-bim-thang-5",
      utmCampaignHelp:
        "Chỉ cần nhập khi bạn muốn xem hiệu quả theo từng chiến dịch cụ thể.",
      affiliateTitle: "Tích hợp affiliate",
      affiliateDescription:
        "Nhập query params affiliate để hệ thống tự gắn vào mọi liên kết Shopee hoặc TikTok tương ứng.",
      shopeeAffiliatePlaceholder: "Shopee: af_id=123&sub_id=campaign-a",
      tiktokAffiliatePlaceholder: "TikTok: aff_id=456&sub_id=creator-b",
      usageLabel: "Dùng ở đâu",
      usageFacebookPost: "Bài viết Facebook",
      usageFacebookReel: "Video ngắn Facebook",
      usageTikTokBio: "Tiểu sử TikTok",
      usageTikTokVideo: "Video TikTok",
      usageZalo: "Zalo chính thức",
      usageSeeding: "Nhóm seeding",
      usageLivestream: "Phát trực tiếp",
      folderLabel: "Thư mục chiến dịch",
      folderPlaceholder: "sale-6-6, remarketing, koc...",
      folderHelp: "Nhóm liên kết theo chiến dịch, nhóm hoặc mùa bán hàng.",
      tagsLabel: "Nhãn",
      tagsPlaceholder: "facebook, retarget, campaign-a",
      tagsHelp: "Nhiều nhãn cách nhau bằng dấu phẩy để tìm hoặc lọc sau này.",
      expiryLabel: "Thời hạn liên kết",
      expiryNever: "Không hết hạn",
      expiry1d: "1 ngày",
      expiry3d: "3 ngày",
      expiry7d: "7 ngày",
      expiry15d: "15 ngày",
      expiry30d: "30 ngày",
      expiryHelp: "Liên kết sẽ tự động vô hiệu sau thời gian đã chọn.",
      secondaryTitle: "Bọc bảo vệ 2 bước",
      secondaryDescription:
        "Mở liên kết chính trước. Sau đó người dùng bấm thêm một lần nữa trên trang đích để mở liên kết bước 2 trong cùng luồng bảo vệ.",
      secondaryWarning:
        "Chỉ dùng chế độ Shopee khi liên kết gốc và liên kết bước 2 cùng một nguồn affiliate. Nếu chọn TikTok thì bước 2 sẽ mở sang nền tảng TikTok ở lần bấm tiếp theo.",
      secondaryTargetLabel: "Bước 2 mở gì",
      secondaryTargetShopee: "Shopee",
      secondaryTargetTikTok: "TikTok",
      secondaryUrlLabel: "Liên kết bước 2",
      secondaryUrlPlaceholderShopee: "https://shopee.vn/...",
      secondaryUrlPlaceholderTikTok: "https://www.tiktok.com/...",
      secondaryUrlHelpDisabled:
        "Tải video lên trước thì mới bật được liên kết bước 2.",
      secondaryUrlHelpEmpty:
        "Bỏ trống nếu chỉ muốn đi 1 liên kết như bình thường.",
      secondaryUrlHelpShopeeOnly: "Chỉ hỗ trợ domain Shopee.",
      secondaryUrlHelpTikTokOnly: "Chỉ hỗ trợ domain TikTok.",
      abTitle: "Thử nghiệm A/B",
      abDescription:
        "Chia traffic 50/50 giữa biến thể A hiện tại và biến thể B để thử nghiệm trang đích hoặc đích chuyển đổi.",
      abToggleOn: "A/B bật",
      abToggleOff: "A/B tắt",
      abLocked: "Thử nghiệm A/B hiện chỉ mở cho gói năm hoặc quản trị viên.",
      abVariantBTitlePlaceholder: "Tiêu đề biến thể B",
      abVariantBUrlPlaceholder: "Đường dẫn chính của biến thể B",
      abVariantBDescriptionPlaceholder: "Mô tả biến thể B",
      abVariantBImagePlaceholder: "Đường dẫn ảnh biến thể B",
      abVariantBVideoPlaceholder: "Đường dẫn video biến thể B",
      abVariantBSecondaryPlaceholder: "Đường dẫn bước 2 của biến thể B",
      videoLabel: "Đính kèm video (tùy chọn)",
      videoUploading: "Đang tải video lên...",
      videoPreparing: "Đang chuẩn bị video...",
      videoReplace: "Thay đổi video",
      videoUpload: "Tải video lên Cloudinary",
      videoDropHelp: "Kéo thả video vào đây, hoặc bấm để chọn file.",
      videoQuotaUnlimited:
        "Gói hiện tại được upload video không giới hạn mỗi ngày.",
      videoQuotaRemaining:
        "Hôm nay còn {remaining} / {limit} lượt upload video.",
      videoQuotaUnsupported: "Gói hiện tại chưa hỗ trợ upload video.",
      videoQuotaExhausted: "Bạn đã dùng hết quota upload video hôm nay.",
      videoUploadSuccess: "Tải dữ liệu lên đám mây thành công!",
      thumbnailLabel: "Ảnh đại diện",
      thumbnailUploading: "Đang tải ảnh đại diện...",
      thumbnailSelect: "Chọn ảnh đại diện từ máy",
      thumbnailDropHelp:
        "Có thể kéo thả ảnh vào đây, hoặc bấm để chọn ảnh từ thư mục trên máy.",
      thumbnailUploadSuccess: "Tải ảnh đại diện thành công",
      thumbnailUrlPlaceholder: "Đường dẫn ảnh bìa...",
      thumbnailPreviewAlt: "Xem trước ảnh đại diện",
    },
    result: {
      review: "Chế độ xem trước",
      previewImageAlt: "Ảnh xem trước",
      previewEmpty: "Chưa có ảnh xem trước",
      previewTitleFallback: "Tiêu đề của bạn sẽ xuất hiện tại đây...",
      previewDescriptionFallback:
        "Hệ thống sẽ tự động tạo trang đích chứa video và tiêu đề chuyên nghiệp như một trang tin tức thực thụ.",
      codeLabel: "Mã liên kết: {code}",
      copyLink: "Sao chép liên kết",
      qr: "Mã QR",
    },
    qrModal: {
      title: "Mã QR",
      description: "Quét để truy cập liên kết",
      close: "Đóng",
      download: "Tải xuống",
    },
    feedback: {
      upgradeRequired:
        "Vui lòng nâng cấp tài khoản để sử dụng tính năng tạo liên kết.",
      shortCodeMax: "Mã rút gọn không được vượt quá {max} ký tự.",
      conversionFailed: "Tạo liên kết thất bại.",
      success: "Rút gọn liên kết thành công: {url}",
    },
  },
  workspace: {
    roles: {
      owner: "Chủ sở hữu",
      editor: "Biên tập",
      viewer: "Chỉ xem",
    },
    hero: {
      badge: "Nhóm làm việc",
      title: "Nhóm gọn, quyền rõ, thao tác nhanh.",
      description:
        "Giữ lại đúng phần cần dùng để quản lý không gian, lời mời và thành viên trong một màn hình ngắn gọn.",
      stats: {
        teamWorkspaces: "Không gian nhóm",
        members: "Thành viên",
        pendingInvites: "Lời mời chờ",
      },
      currentWorkspace: {
        eyebrow: "Không gian đang dùng",
        emptyTitle: "Chưa chọn không gian",
        emptyDescription: "Chọn không gian để bắt đầu quản lý nhóm.",
        personal: "Cá nhân",
        team: "Nhóm",
        membersSuffix: "thành viên",
        pendingInvitesSuffix: "lời mời chờ",
      },
    },
    sections: {
      list: {
        eyebrow: "Không gian",
        title: "Danh sách không gian",
        loading: "Đang tải không gian làm việc...",
        active: "Đang dùng",
        personal: "Cá nhân",
        team: "Nhóm",
        noDescription: "Chưa có mô tả.",
      },
      create: {
        eyebrow: "Tạo không gian",
        description: "Tách team hoặc campaign mới.",
        namePlaceholder: "Tên không gian",
        descriptionPlaceholder: "Mô tả ngắn",
        submit: "Tạo không gian",
      },
      incomingInvites: {
        eyebrow: "Lời mời",
        title: "Lời mời vào team",
        loading: "Đang tải lời mời...",
        invitedBy: "Mời bởi {name}",
        ownerFallback: "Chủ sở hữu",
        accept: "Chấp nhận",
        decline: "Từ chối",
      },
      manageInvites: {
        eyebrow: "Quản lý lời mời",
        title: "Mời thành viên",
        emailPlaceholder: "Email thành viên",
        invite: "Mời",
        sentTitle: "Lời mời đã gửi",
        loading: "Đang tải lời mời đã gửi...",
        pendingConfirmation: "{role} · chờ xác nhận",
        cancel: "Hủy",
        none: "Chưa có lời mời nào đã gửi.",
      },
      members: {
        eyebrow: "Thành viên",
        title: "Danh sách thành viên",
        loading: "Đang tải thành viên...",
        ownerBadge: "Chủ sở hữu",
        noEmail: "Không có email",
        remove: "Xóa",
        none: "Chưa có thành viên nào trong không gian này.",
        avatarAlt: "Ảnh đại diện thành viên",
      },
      roles: {
        editor: "Biên tập",
        viewer: "Chỉ xem",
      },
      warnings: {
        noWorkspaceSupport: "Gói hiện tại chưa hỗ trợ không gian nhóm.",
        workspaceLimit: "Bạn đã dùng hết {limit} không gian nhóm.",
        noMemberSupport: "Gói hiện tại chưa hỗ trợ mời thành viên.",
        memberLimit: "Không gian này đã dùng hết {limit} chỗ thành viên.",
        ownerOnly:
          "Chỉ chủ sở hữu mới có thể thêm hoặc đổi quyền thành viên. Bạn hiện là {role}.",
      },
    },
  },
} as const;
