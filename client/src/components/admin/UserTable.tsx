import { useState } from 'react';
import type { AdminUser } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Pencil, Trash2, KeyRound, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserTableProps {
  users: AdminUser[];
  onEdit: (user: AdminUser) => void;
  onDelete: (id: number) => Promise<void>;
  onResetPassword: (id: number) => Promise<string>;
  currentUserId?: number;
  wishlistEnabled: boolean;
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  onResetPassword,
  currentUserId,
  wishlistEnabled,
}: UserTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const handleDeleteClick = (user: AdminUser) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleting(true);
    try {
      await onDelete(userToDelete.id);
      toast.success(`${userToDelete.name} has been deleted`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch {
      toast.error('Failed to delete user. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    setResettingPassword(true);
    try {
      const password = await onResetPassword(id);
      setNewPassword(password);
      setPasswordDialogOpen(true);
    } catch {
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setResettingPassword(false);
    }
  };

  const copyPasswordToClipboard = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      toast.success('Password copied to clipboard');
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isAdmin && (
                    <Badge variant="default" className="text-xs">
                      Admin
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      title="Edit user"
                      aria-label="Edit user"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResetPassword(user.id)}
                      disabled={resettingPassword}
                      title="Reset password"
                      aria-label="Reset password"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      disabled={user.id === currentUserId}
                      title={
                        user.id === currentUserId
                          ? 'Cannot delete your own account'
                          : 'Delete user'
                      }
                      aria-label="Delete user"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {userToDelete?.name}? This action cannot be
              undone and will also delete:
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                {wishlistEnabled && <li>All wishlist items</li>}
                <li>All match assignments involving this user</li>
                <li>All active sessions</li>
              </ul>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Success Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
            <DialogDescription>
              The new password has been generated. Please save it securely and share it with
              the user.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>New Password</AlertTitle>
            <AlertDescription>
              <div className="mt-2 font-mono text-lg font-bold bg-gray-100 p-3 rounded border">
                {newPassword}
              </div>
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={copyPasswordToClipboard}>
              Copy to Clipboard
            </Button>
            <Button onClick={() => setPasswordDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
