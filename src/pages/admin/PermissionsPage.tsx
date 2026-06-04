import { useState } from 'react';
import { Shield, Check, X } from 'lucide-react';
import { Card, Button } from '../../components/ui';

interface PermissionGroup {
  name: string;
  permissions: string[];
}

const permissionGroups: PermissionGroup[] = [
  {
    name: 'Workspace',
    permissions: ['Tạo Workspace', 'Sửa Workspace', 'Xóa Workspace', 'Quản lý thành viên'],
  },
  {
    name: 'Project',
    permissions: ['Tạo Project', 'Sửa Project', 'Xóa Project', 'Di chuyển Project'],
  },
  {
    name: 'Task',
    permissions: ['Tạo Task', 'Sửa Task', 'Xóa Task', 'Di chuyển Task'],
  },
  {
    name: 'Document',
    permissions: ['Tạo Document', 'Sửa Document', 'Xóa Document', 'Upload File'],
  },
  {
    name: 'User',
    permissions: ['Xem User', 'Tạo User', 'Sửa User', 'Xóa User'],
  },
];

const roles = [
  { name: 'Super Admin', key: 'super_admin', color: 'red', description: 'Toàn quyền hệ thống' },
  { name: 'Admin', key: 'admin', color: 'orange', description: 'Quản lý workspace' },
  { name: 'Member', key: 'member', color: 'blue', description: 'Thành viên thông thường' },
  { name: 'Viewer', key: 'viewer', color: 'gray', description: 'Chỉ có quyền xem' },
];

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState('super_admin');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quản lý Permissions</h2>
          <p className="text-gray-500 mt-1">Phân quyền và quyền truy cập hệ thống</p>
        </div>
        <Button>
          <Shield className="w-4 h-4 mr-2" />
          Thêm Role
        </Button>
      </div>

      {/* Roles List */}
      <Card title="Vai trò hệ thống">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role) => (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`p-4 text-left rounded-lg border-2 transition-colors ${
                selectedRole === role.key
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${role.color}-500`}></div>
                <div>
                  <p className="font-medium text-gray-900">{role.name}</p>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Permission Matrix */}
      <Card title="Ma trận quyền">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-1/4">Quyền</th>
                {roles.map((role) => (
                  <th key={role.key} className="text-center py-3 px-4 font-semibold text-gray-700">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map((group) => (
                <>
                  <tr key={group.name} className="bg-gray-50">
                    <td colSpan={5} className="py-2 px-4 font-semibold text-gray-700">
                      {group.name}
                    </td>
                  </tr>
                  {group.permissions.map((permission) => (
                    <tr key={permission} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{permission}</td>
                      {roles.map((role) => {
                        const hasPermission = role.key === 'super_admin' || role.key === 'admin' ||
                          (role.key === 'member' && (permission.includes('Tạo') || permission.includes('Sửa'))) ||
                          (role.key === 'viewer' && permission.includes('Xem'));
                        return (
                          <td key={role.key} className="py-3 px-4 text-center">
                            {hasPermission ? (
                              <Check className={`w-5 h-5 mx-auto ${
                                role.key === 'super_admin' ? 'text-red-500' : 'text-green-500'
                              }`} />
                            ) : (
                              <X className="w-5 h-5 mx-auto text-gray-300" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
