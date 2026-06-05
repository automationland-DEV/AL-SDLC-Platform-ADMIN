# Yêu cầu chức năng - Super Admin Dashboard

## 1. Tổng quan

Hệ thống Super Admin Dashboard cho phép quản trị viên cao cấp quản lý toàn bộ hệ thống AL-SDLC Platform.

## 2. Các trang chức năng

### 2.1 Dashboard (Trang chủ)

- [ ] **Thống kê tổng quan**: Hiển thị số lượng Users, Workspaces, Documents, Permissions
- [ ] **Users gần đây**: Danh sách 5 user mới nhất với avatar, tên, email, vai trò
- [ ] **Workspaces gần đây**: Danh sách 5 workspace mới nhất với icon, tên, số thành viên, trạng thái
- [ ] **Thao tác nhanh**: Các shortcut đến Thêm User, Tạo Workspace, Upload Document, Phân quyền

### 2.2 Quản lý Users (`/users`)

- [ ] **Danh sách Users**: Bảng hiển thị với phân trang
  - ID (6 ký tự cuối)
  - Avatar/Tên
  - Email
  - Vai trò (Super Admin / User)
  - Trạng thái (Hoạt động / Không hoạt động / Chờ xác thực / Đình chỉ)
  - Ngày tạo
  - Thao tác (Xem, Sửa, Xóa)

- [ ] **Tìm kiếm**: Theo tên hoặc email

- [ ] **Thêm User mới** (Modal)
  - Email
  - Họ tên
  - Vai trò (User / Super Admin)
  - Trạng thái (Hoạt động / Không hoạt động / Chờ xác thực / Đình chỉ)

- [ ] **Sửa User** (Modal)
  - Thay đổi vai trò
  - Thay đổi trạng thái

- [ ] **Xóa User**: Xác nhận trước khi xóa

### 2.3 Quản lý Workspaces (`/workspaces`)

- [ ] **Danh sách Workspaces**: Bảng hiển thị với phân trang
  - ID (6 ký tự cuối)
  - Tên Workspace
  - Mô tả
  - Chủ sở hữu (avatar + tên)
  - Số thành viên
  - Trạng thái (Hoạt động / Đã lưu trữ)
  - Thao tác (Xem, Sửa, Lưu trữ/Khôi phục, Xóa)

- [ ] **Bộ lọc trạng thái**: Tất cả / Hoạt động / Đã lưu trữ

- [ ] **Tạo Workspace mới** (Modal)
  - Tên workspace
  - Key (slug)
  - Mô tả

- [ ] **Sửa Workspace** (Modal)
  - Chỉnh sửa thông tin cơ bản

- [ ] **Lưu trữ Workspace**: Chuyển sang trạng thái archived

- [ ] **Khôi phục Workspace**: Khôi phục từ trạng thái archived

- [ ] **Xóa Workspace**: Xác nhận trước khi xóa

### 2.4 Quản lý Documents (`/documents`)

- [ ] **Danh sách Documents**: Bảng hiển thị với phân trang
  - ID (6 ký tự cuối)
  - Tên tài liệu (icon + tên + tên gốc)
  - Loại (Upload / Online)
  - Kích thước file
  - Workspace liên kết
  - Người tạo
  - Ngày tạo
  - Thao tác (Xem, Tải xuống, Sửa, Xóa)

- [ ] **Bộ lọc loại**: Tất cả / Upload / Online

- [ ] **Tìm kiếm**: Theo tên tài liệu

- [ ] **Tạo Document Online** (Modal)
  - Tên tài liệu
  - Nội dung

- [ ] **Upload Document** (Modal)
  - Chọn file
  - Tên tài liệu
  - Workspace liên kết

- [ ] **Tải xuống**: Chỉ áp dụng với document loại Upload

- [ ] **Xóa Document**: Xác nhận trước khi xóa

### 2.5 Quản lý Permissions (`/permissions`)

- [ ] **Vai trò hệ thống**
  - Super Admin: Toàn quyền hệ thống
  - Admin: Quản lý workspace
  - Member: Thành viên thông thường
  - Viewer: Chỉ có quyền xem

- [ ] **Ma trận quyền**: Bảng hiển thị các quyền theo từng vai trò

- [ ] **Nhóm quyền**:
  - Workspace: Tạo, Sửa, Xóa, Quản lý thành viên
  - Project: Tạo, Sửa, Xóa, Di chuyển
  - Task: Tạo, Sửa, Xóa, Di chuyển
  - Document: Tạo, Sửa, Xóa, Upload
  - User: Xem, Tạo, Sửa, Xóa

- [ ] **Thêm Role mới**

### 2.6 Nhật ký hoạt động (`/activity`)

- [ ] **Thống kê tổng quan**: Hiển thị số lượng sự kiện, cảnh báo, sự kiện trong 24h
- [ ] **Bộ lọc nâng cao**:
  - Theo User ID
  - Theo loại sự kiện (Đăng nhập, Đăng xuất, Xem task, Tạo task, etc.)
  - Theo mức độ nghiêm trọng (INFO, WARN, CRITICAL)
  - Theo IP Address
  - Theo khoảng thời gian (Từ ngày - Đến ngày)
- [ ] **Danh sách sự kiện**: Bảng hiển thị với phân trang
  - Icon theo mức độ nghiêm trọng
  - Tên sự kiện (đã dịch sang tiếng Việt)
  - Email người dùng
  - User ID
  - IP Address
  - Thời gian (định dạng Việt Nam)
  - Metadata bổ sung (JSON)
- [ ] **Phân trang**: Hỗ trợ phân trang với số trang hiển thị

## 3. Phân quyền

### 3.1 Super Admin
- Toàn quyền trên hệ thống
- Quản lý tất cả users
- Quản lý tất cả workspaces
- Quản lý documents
- Phân quyền hệ thống

### 3.2 Admin (Workspace-level)
- Quản lý workspace được assign
- Quản lý thành viên trong workspace
- Quản lý documents trong workspace

### 3.3 Member
- Tạo và sửa task, document trong workspace
- Xem thông tin workspace

### 3.4 Viewer
- Chỉ xem thông tin được chia sẻ

## 4. API Endpoints

### 4.1 Users
```
GET    /api/users              - Danh sách users (phân trang)
GET    /api/users/:id          - Chi tiết user
POST   /api/users              - Tạo user mới
PATCH  /api/users/:id          - Cập nhật user
DELETE /api/users/:id          - Xóa user
```

### 4.2 Workspaces
```
GET    /api/workspaces              - Danh sách workspaces (phân trang)
GET    /api/workspaces/:id          - Chi tiết workspace
POST   /api/workspaces              - Tạo workspace mới
PATCH  /api/workspaces/:id          - Cập nhật workspace
DELETE /api/workspaces/:id          - Xóa workspace
POST   /api/workspaces/:id/archive  - Lưu trữ workspace
POST   /api/workspaces/:id/restore  - Khôi phục workspace
```

### 4.3 Documents
```
GET    /api/documents              - Danh sách documents (phân trang)
GET    /api/documents/:id          - Chi tiết document
POST   /api/documents              - Tạo document mới
PATCH  /api/documents/:id          - Cập nhật document
DELETE /api/documents/:id          - Xóa document
GET    /api/documents/:id/download - Tải xuống file
```

### 4.4 Permissions
```
GET    /api/permissions            - Danh sách permissions
GET    /api/roles                   - Danh sách roles
POST   /api/roles                   - Tạo role mới
PATCH  /api/roles/:id               - Cập nhật role
DELETE /api/roles/:id              - Xóa role
```

### 4.5 Audit Logs
```
GET    /api/audit/logs              - Danh sách audit logs (phân trang, có bộ lọc)
GET    /api/audit/stats             - Thống kê audit logs
GET    /api/audit/logs/:id          - Chi tiết audit log
```

**Query params cho /api/audit/logs:**
- `page`, `limit` - Phân trang
- `userId` - Lọc theo user
- `type` - Lọc theo loại sự kiện (LOGIN_SUCCESS, TASK_VIEWED, etc.)
- `severity` - Lọc theo mức độ (INFO, WARN, CRITICAL)
- `ip` - Lọc theo IP
- `startDate`, `endDate` - Lọc theo khoảng thời gian

## 5. User Status

| Status | Mô tả |
|--------|-------|
| active | Hoạt động bình thường |
| inactive | Không hoạt động |
| pending_verification | Chờ xác thực email |
| suspended | Bị đình chỉ |

## 6. User Roles

| Role | Mô tả |
|------|-------|
| super_admin | Quản trị viên cao cấp - toàn quyền |
| admin | Quản trị viên workspace |
| member | Thành viên thông thường |
| viewer | Người chỉ xem |

## 7. Document Types

| Type | Mô tả |
|------|-------|
| upload | Upload từ máy tính |
| online | Tạo online trên hệ thống |

## 8. Workspace Status

| Status | Mô tả |
|--------|-------|
| active | Đang hoạt động |
| archived | Đã được lưu trữ |
