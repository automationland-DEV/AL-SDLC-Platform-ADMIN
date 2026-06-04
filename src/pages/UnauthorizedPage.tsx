import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../components/ui';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Truy cập bị từ chối</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Bạn không có quyền truy cập trang này. Chỉ tài khoản <span className="font-semibold text-primary-600">Super Admin</span> mới có thể vào.
        </p>
        <Link to="/">
          <Button variant="secondary">Quay về trang chủ</Button>
        </Link>
      </div>
    </div>
  );
}
