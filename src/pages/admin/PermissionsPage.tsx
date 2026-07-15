import { useState, Fragment } from 'react';
import { Shield, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button } from '../../components/ui';
import { AddRoleModal, type RoleItem } from './components/permissions/AddRoleModal';

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

const initialRoles: RoleItem[] = [
  { name: 'Super Admin', key: 'super_admin', color: 'red', description: 'Toàn quyền hệ thống' },
  { name: 'Admin', key: 'admin', color: 'orange', description: 'Quản lý workspace' },
  { name: 'Member', key: 'member', color: 'blue', description: 'Thành viên thông thường' },
  { name: 'Viewer', key: 'viewer', color: 'gray', description: 'Chỉ có quyền xem' },
];

export default function PermissionsPage() {
  const [selectedRole, setSelectedRole] = useState('super_admin');
  const [roles, setRoles] = useState<RoleItem[]>(initialRoles);
  const [showModal, setShowModal] = useState(false);

  const handleAddRole = (newRole: RoleItem) => {
    setRoles([...roles, newRole]);
    setShowModal(false);
    toast.success('Thêm vai trò thành công');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Quản lý Permissions</h2>
          <p className="text-[var(--text-secondary)] mt-1">Phân quyền và quyền truy cập hệ thống</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
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
                  ? 'border-primary-500 bg-[var(--bg-active)]'
                  : 'border-[var(--border-color)] hover:border-[var(--border-hover)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full bg-${role.color}-500`}></div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{role.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{role.description}</p>
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
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 font-semibold text-[var(--text-secondary)] w-1/4">Quyền</th>
                {roles.map((role) => (
                  <th key={role.key} className="text-center py-3 px-4 font-semibold text-[var(--text-secondary)]">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map((group) => (
                <Fragment key={group.name}>
                  <tr className="bg-[var(--bg-secondary)]">
                    <td colSpan={roles.length + 1} className="py-2 px-4 font-semibold text-[var(--text-primary)]">
                      {group.name}
                    </td>
                  </tr>
                  {group.permissions.map((permission) => (
                    <tr key={permission} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{permission}</td>
                      {roles.map((role) => {
                        const hasPermission = role.key === 'super_admin' || role.key === 'admin' ||
                          (role.key === 'member' && (permission.includes('Tạo') || permission.includes('Sửa') || permission.includes('Upload'))) ||
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
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Role Modal */}
      <AddRoleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onAddRole={handleAddRole}
        existingRoles={roles}
      />
    </div>
  );
}
