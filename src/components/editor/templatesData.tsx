import React from "react";
import {
  Layers,
  Briefcase,
  Users,
  Mail,
  Plus,
} from "lucide-react";

export interface DocumentTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  bgGradient: string;
  content: string;
}

export const ADMIN_DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: "blank",
    title: "Tài liệu trống",
    category: "Cơ bản",
    description: "Bắt đầu soạn thảo văn bản từ trang trắng",
    icon: <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
    bgGradient: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800/40",
    content: "",
  },
  {
    id: "software-spec",
    title: "Đặc tả yêu cầu phần mềm (SRS)",
    category: "Kỹ thuật / SDLC",
    description: "Khung chuẩn tài liệu yêu cầu tính năng, kiến trúc và API",
    icon: <Layers className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
    bgGradient: "from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800/40",
    content: `
      <h1>Tài Liệu Đặc Tả Yêu Cầu Phần Mềm (SRS)</h1>
      <p><strong>Dự án:</strong> [Tên dự án] | <strong>Phiên bản:</strong> 1.0 | <strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
      <hr />
      
      <h2>1. Tổng Quan & Mục Tiêu Hệ Thống</h2>
      <p>Mô tả ngắn gọn bối cảnh phát triển, mục đích của hệ thống và nhóm người dùng mục tiêu.</p>
      
      <h2>2. Yêu Cầu Chức Năng (Functional Requirements)</h2>
      <ul data-type="taskList">
        <li data-checked="true" data-type="taskItem"><label><input type="checkbox" checked="checked"><span></span></label><div>Xác thực người dùng (Đăng nhập / Phân quyền RBAC)</div></li>
        <li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div>Quản lý tài liệu và phân chia Workspace</div></li>
        <li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div>Cộng tác thời gian thực (Realtime Collaboration)</div></li>
      </ul>
      
      <h2>3. Kiến Trúc & Luồng Dữ Liệu</h2>
      <p>Hệ thống chia làm 3 tầng: Presentation Layer (Vite + React), Application API Layer (NestJS), và Realtime WebSocket Service.</p>
      
      <h2>4. Yêu Cầu Phi Chức Năng</h2>
      <ul>
        <li><strong>Hiệu năng:</strong> Thời gian phản hồi API &lt; 200ms; độ trễ gõ phím realtime &lt; 50ms.</li>
        <li><strong>Bảo mật:</strong> Mã hóa dữ liệu lưu trữ, kiểm soát phiên đăng nhập bằng JWT.</li>
        <li><strong>Khả dụng:</strong> Đảm bảo 99.9% uptime.</li>
      </ul>
    `,
  },
  {
    id: "project-proposal",
    title: "Đề xuất dự án (Project Proposal)",
    category: "Quản lý",
    description: "Kế hoạch phát triển, mục tiêu, lộ trình và ngân sách",
    icon: <Briefcase className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
    bgGradient: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 dark:border-amber-800/40",
    content: `
      <h1>Bản Đề Xuất Kế Hoạch Dự Án</h1>
      <p><strong>Người đề xuất:</strong> [Tên người phụ trách] | <strong>Phòng ban:</strong> Ban Công Nghệ</p>
      <hr />
      
      <h2>1. Tóm Tắt Dự Án (Executive Summary)</h2>
      <p>Trình bày ngắn gọn lý do vì sao dự án cần được triển khai và giá trị đem lại cho tổ chức.</p>
      
      <h2>2. Mục Tiêu Dự Án</h2>
      <ul>
        <li>Tối ưu hóa quy trình quản lý văn bản nội bộ.</li>
        <li>Giảm 40% thời gian trao đổi tài liệu giữa các bộ phận.</li>
      </ul>
      
      <h2>3. Lộ Trình Triển Khai (Roadmap)</h2>
      <table style="width: 100%">
        <thead>
          <tr>
            <th>Giai đoạn</th>
            <th>Nội dung công việc</th>
            <th>Thời gian dự kiến</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Giai đoạn 1</td>
            <td>Nghiên cứu & Thiết kế kiến trúc</td>
            <td>Tuần 1 - 2</td>
          </tr>
          <tr>
            <td>Giai đoạn 2</td>
            <td>Xây dựng tính năng cốt lõi</td>
            <td>Tuần 3 - 6</td>
          </tr>
          <tr>
            <td>Giai đoạn 3</td>
            <td>Kiểm thử & Bàn giao hệ thống</td>
            <td>Tuần 7 - 8</td>
          </tr>
        </tbody>
      </table>
    `,
  },
  {
    id: "meeting-minutes",
    title: "Biên bản cuộc họp (Meeting Minutes)",
    category: "Văn phòng",
    description: "Ghi chép nội dung họp, quyết định quan trọng và action items",
    icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
    bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800/40",
    content: `
      <h1>Biên Bản Cuộc Họp Nội Bộ</h1>
      <p><strong>Chủ đề cuộc họp:</strong> [Nhập chủ đề] | <strong>Thời gian:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
      <p><strong>Địa điểm / Hình thức:</strong> Phòng họp 1 / Trực tuyến</p>
      <hr />
      
      <h2>1. Thành Phần Tham Dự</h2>
      <ul>
        <li>Chủ trì: [Họ tên]</li>
        <li>Thư ký ghi chép: [Họ tên]</li>
        <li>Thành viên tham gia: [Danh sách thành viên]</li>
      </ul>
      
      <h2>2. Nội Dung Thảo Luận</h2>
      <p>Tóm tắt các vấn đề trọng tâm được trao đổi trong cuộc họp...</p>
      
      <h2>3. Kế Hoạch Hành Động (Action Items)</h2>
      <ul data-type="taskList">
        <li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div>Hoàn thiện bản nháp tài liệu thiết kế (Phụ trách: NamNV)</div></li>
        <li data-checked="false" data-type="taskItem"><label><input type="checkbox"><span></span></label><div>Review và phê duyệt kiến trúc hệ thống (Phụ trách: TechLead)</div></li>
      </ul>
    `,
  },
  {
    id: "announcement",
    title: "Thông báo nội bộ (Announcement)",
    category: "Hành chính",
    description: "Văn bản thông báo các quy định, sự kiện và quyết định quan trọng",
    icon: <Mail className="w-6 h-6 text-sky-600 dark:text-sky-400" />,
    bgGradient: "from-sky-50 to-blue-50 dark:from-sky-950/30 dark:to-blue-950/30 border-sky-200 dark:border-sky-800/40",
    content: `
      <p style="text-align: center"><strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br /><strong>Độc lập - Tự do - Hạnh phúc</strong></p>
      <br />
      
      <h1 style="text-align: center">THÔNG BÁO NỘI BỘ</h1>
      <p style="text-align: center"><em>V/v: [Trích yếu nội dung thông báo]</em></p>
      <hr />
      
      <p><strong>Kính gửi:</strong> Toàn thể cán bộ nhân viên / Các trưởng bộ phận,</p>
      
      <p>Căn cứ vào quy chế hoạt động của đơn vị và kế hoạch công tác quý...</p>
      <p>Ban Giám đốc xin thông báo tới toàn thể cán bộ nhân viên nội dung như sau:</p>
      
      <p><strong>1. Nội dung thông báo:</strong></p>
      <p>[Trình bày chi tiết nội dung thông báo tại đây...]</p>
      
      <p><strong>2. Thời gian và đối tượng áp dụng:</strong></p>
      <p>Thông báo có hiệu lực kể từ ngày ký.</p>
      
      <br />
      <p style="text-align: right"><strong>TM. BAN GIÁM ĐỐC</strong><br />(Ký và ghi rõ họ tên)</p>
    `,
  },
];
