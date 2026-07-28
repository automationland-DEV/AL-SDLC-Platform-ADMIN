export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Navigation & Layout
    'nav.dashboard': 'Dashboard',
    'nav.users': 'Quản lý Users',
    'nav.workspaces': 'Quản lý Workspaces',
    'nav.documents': 'Quản lý Documents',
    'nav.channels': 'Chat Channels',
    'nav.activity': 'Nhật ký hoạt động',
    'nav.settings': 'Cài đặt',
    'nav.logout': 'Đăng xuất',
    'nav.profile': 'Hồ sơ cá nhân',

    // Header & Brand
    'header.systemOnline': 'SYSTEM ONLINE',
    'header.systemSubtitle': 'SDLC ADMIN PLATFORM',
    'header.userRole': 'SUPER_ADMIN',

    // Dashboard Page
    'dashboard.title': 'Bảng Điều Khiển Admin (Dashboard)',
    'dashboard.subtitle': 'Tổng quan chỉ số hiệu năng và hoạt động toàn hệ thống AL-SDLC',
    'dashboard.totalUsers': 'Tổng số User',
    'dashboard.totalWorkspaces': 'Workspace Hoạt động',
    'dashboard.totalDocs': 'Tài liệu Lưu trữ',
    'dashboard.activeChannels': 'Kênh Chat Hoạt động',
    'dashboard.recentWorkspaces': 'Workspaces Mới Tạo',
    'dashboard.recentActivity': 'Nhật Ký Hoạt Động Gần Đây',
    'dashboard.viewAll': 'Xem tất cả',
    'dashboard.noWorkspaces': 'Chưa có workspace nào',
    'dashboard.noActivities': 'Chưa có hoạt động nào',
    'dashboard.telemetryTitle': 'TELEMETRY & MICROSERVICES',
    'dashboard.telemetrySubtitle': 'Trạng thái hạ tầng dịch vụ Backend',

    // Users Page
    'users.title': 'Quản lý Nguồn Nhân lực (Users)',
    'users.subtitle': 'Hệ thống đang lưu trữ {count} tài khoản thành viên',
    'users.addUser': 'Thêm User',
    'users.importCsv': 'Import CSV',
    'users.searchPlaceholder': 'Tìm kiếm theo tên hoặc email tài khoản...',
    'users.roleFilter': 'Tất cả vai trò',
    'users.statusFilter': 'Tất cả trạng thái',

    // Workspaces Page
    'workspaces.title': 'Quản lý Không gian Dự án (Workspaces)',
    'workspaces.subtitle': 'Tổng số {count} workspace trong hệ thống',
    'workspaces.createBtn': 'Tạo Workspace',
    'workspaces.searchPlaceholder': 'Tìm kiếm theo tên, mô tả hoặc workspace key...',
    'workspaces.tabAll': 'Tất cả',
    'workspaces.tabActive': 'Hoạt động',
    'workspaces.tabArchived': 'Lưu trữ',
    'workspaces.tabDeleted': 'Đã xóa',

    // Documents Page
    'documents.title': 'Quản lý Kho Tài liệu (Documents)',
    'documents.subtitle': 'Tổng số {count} tài liệu trực tuyến & file đính kèm',
    'documents.createOnline': 'Tạo Document Online',
    'documents.uploadFile': 'Upload File Dự án',
    'documents.searchPlaceholder': 'Tìm kiếm tài liệu theo tên...',
    'documents.allWorkspaces': 'Tất cả Workspace',
    'documents.tabAll': 'Tất cả',
    'documents.tabOnline': 'Online Document',
    'documents.tabUploaded': 'File đính kèm',

    // Channels Page
    'channels.title': 'Kênh Trao đổi Team Ops (Chat Channels)',
    'channels.subtitle': 'Tổng số {count} channels trò chuyện trực tuyến',
    'channels.searchPlaceholder': 'Tìm kiếm kênh trao đổi...',
    'channels.allTypes': 'Tất cả loại kênh',

    // Activity Page
    'activity.title': 'Nhật ký Hoạt động (Activity Log)',
    'activity.subtitle': 'Theo dõi thời gian thực lịch sử thao tác của các quản trị viên',
    'activity.searchPlaceholder': 'Tìm kiếm theo mô tả hoạt động hoặc người thực hiện...',

    // Settings Page
    'settings.title': 'Cài đặt hệ thống',
    'settings.subtitle': 'Quản lý cấu hình cá nhân, ngôn ngữ và giao diện',
    'settings.appearance': 'Giao diện',
    'settings.appearanceDesc': 'Tùy chỉnh giao diện sáng/tối của ứng dụng.',
    'settings.language': 'Ngôn ngữ hệ thống (Language)',
    'settings.languageDesc': 'Chọn ngôn ngữ hiển thị ưu tiên trên toàn bộ Console.',
    'settings.textSize': 'Kích thước chữ',
    'settings.textSizeDesc': 'Điều chỉnh độ lớn của văn bản trên toàn hệ thống.',
    'settings.light': 'Sáng',
    'settings.dark': 'Tối',
    'settings.system': 'Theo hệ thống',
    'settings.langVi': 'Tiếng Việt (Vietnamese)',
    'settings.langEn': 'Tiếng Anh (English)',

    // Profile Page
    'profile.title': 'Hồ sơ Cá nhân',
    'profile.subtitle': 'Quản lý thông tin tài khoản Admin và bảo mật',
    'profile.fullName': 'Họ và tên',
    'profile.email': 'Địa chỉ Email',
    'profile.role': 'Vai trò quản trị',
    'profile.updateSuccess': 'Cập nhật hồ sơ thành công',

    // Table Headers & Actions
    'table.id': 'ID',
    'table.name': 'Tên',
    'table.email': 'Email',
    'table.role': 'Vai trò',
    'table.status': 'Trạng thái',
    'table.actions': 'Thao tác',
    'table.members': 'Thành viên',
    'table.createdAt': 'Ngày tạo',
    'table.key': 'KEY_ID',
    'table.description': 'Mô tả',
    'table.owner': 'Chủ sở hữu',
    'table.type': 'Loại',
    'table.size': 'Kích thước',
    'table.privacy': 'Riêng tư',

    // Status Labels
    'status.active': 'HOẠT ĐỘNG',
    'status.archived': 'LƯU TRỮ',
    'status.deleted': 'ĐÃ XÓA',
    'status.public': 'CÔNG KHAI',
    'status.private': 'RIÊNG TƯ',

    // Common Buttons
    'common.reset': 'Làm mới',
    'common.save': 'Lưu thay đổi',
    'common.cancel': 'Hủy bỏ',
    'common.confirm': 'Xác nhận',
    'common.delete': 'Xóa',
    'common.edit': 'Sửa',
    'common.view': 'Xem',
  },
  en: {
    // Navigation & Layout
    'nav.dashboard': 'Dashboard',
    'nav.users': 'User Management',
    'nav.workspaces': 'Workspaces',
    'nav.documents': 'Documents',
    'nav.channels': 'Chat Channels',
    'nav.activity': 'Activity Log',
    'nav.settings': 'Settings',
    'nav.logout': 'Logout',
    'nav.profile': 'My Profile',

    // Header & Brand
    'header.systemOnline': 'SYSTEM ONLINE',
    'header.systemSubtitle': 'SDLC ADMIN PLATFORM',
    'header.userRole': 'SUPER_ADMIN',

    // Dashboard Page
    'dashboard.title': 'Admin Dashboard Overview',
    'dashboard.subtitle': 'Real-time performance metrics & platform system overview',
    'dashboard.totalUsers': 'Total Users',
    'dashboard.totalWorkspaces': 'Active Workspaces',
    'dashboard.totalDocs': 'Stored Documents',
    'dashboard.activeChannels': 'Active Chat Channels',
    'dashboard.recentWorkspaces': 'Recently Created Workspaces',
    'dashboard.recentActivity': 'Recent System Activities',
    'dashboard.viewAll': 'View all',
    'dashboard.noWorkspaces': 'No workspaces created yet',
    'dashboard.noActivities': 'No activity logged yet',
    'dashboard.telemetryTitle': 'TELEMETRY & MICROSERVICES',
    'dashboard.telemetrySubtitle': 'Backend infrastructure & service status',

    // Users Page
    'users.title': 'User Resources Management',
    'users.subtitle': 'System currently manages {count} registered member accounts',
    'users.addUser': 'Add User',
    'users.importCsv': 'Import CSV',
    'users.searchPlaceholder': 'Search by member name or email...',
    'users.roleFilter': 'All roles',
    'users.statusFilter': 'All statuses',

    // Workspaces Page
    'workspaces.title': 'Workspace Project Management',
    'workspaces.subtitle': 'Total of {count} workspaces in system',
    'workspaces.createBtn': 'Create Workspace',
    'workspaces.searchPlaceholder': 'Search by name, description or workspace key...',
    'workspaces.tabAll': 'All',
    'workspaces.tabActive': 'Active',
    'workspaces.tabArchived': 'Archived',
    'workspaces.tabDeleted': 'Deleted',

    // Documents Page
    'documents.title': 'Document Repository Management',
    'documents.subtitle': 'Total of {count} online docs & attached project files',
    'documents.createOnline': 'New Online Doc',
    'documents.uploadFile': 'Upload Project File',
    'documents.searchPlaceholder': 'Search documents by title...',
    'documents.allWorkspaces': 'All Workspaces',
    'documents.tabAll': 'All',
    'documents.tabOnline': 'Online Document',
    'documents.tabUploaded': 'Attached Files',

    // Channels Page
    'channels.title': 'Team Ops Chat Channels',
    'channels.subtitle': 'Total of {count} active online chat channels',
    'channels.searchPlaceholder': 'Search chat channels...',
    'channels.allTypes': 'All channel types',

    // Activity Page
    'activity.title': 'System Activity Log',
    'activity.subtitle': 'Track real-time admin operation logs and audit trails',
    'activity.searchPlaceholder': 'Search by activity description or operator...',

    // Settings Page
    'settings.title': 'System Settings',
    'settings.subtitle': 'Manage personal preferences, language and theme appearance',
    'settings.appearance': 'Appearance',
    'settings.appearanceDesc': 'Customize light/dark theme preference for the app.',
    'settings.language': 'System Language',
    'settings.languageDesc': 'Select preferred display language across the entire console.',
    'settings.textSize': 'Font Size',
    'settings.textSizeDesc': 'Adjust system-wide typography scaling.',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.system': 'System Default',
    'settings.langVi': 'Vietnamese (Tiếng Việt)',
    'settings.langEn': 'English (Tiếng Anh)',

    // Profile Page
    'profile.title': 'Admin Profile',
    'profile.subtitle': 'Manage your admin credentials and security details',
    'profile.fullName': 'Full Name',
    'profile.email': 'Email Address',
    'profile.role': 'Administrative Role',
    'profile.updateSuccess': 'Profile updated successfully',

    // Table Headers & Actions
    'table.id': 'ID',
    'table.name': 'Name',
    'table.email': 'Email',
    'table.role': 'Role',
    'table.status': 'Status',
    'table.actions': 'Actions',
    'table.members': 'Members',
    'table.createdAt': 'Created At',
    'table.key': 'KEY_ID',
    'table.description': 'Description',
    'table.owner': 'Owner',
    'table.type': 'Type',
    'table.size': 'Size',
    'table.privacy': 'Privacy',

    // Status Labels
    'status.active': 'ACTIVE',
    'status.archived': 'ARCHIVED',
    'status.deleted': 'DELETED',
    'status.public': 'PUBLIC',
    'status.private': 'PRIVATE',

    // Common Buttons
    'common.reset': 'Reset',
    'common.save': 'Save Changes',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
  },
};
