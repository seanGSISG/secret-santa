import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { UserTable } from '@/components/admin/UserTable';
import { UserForm } from '@/components/admin/UserForm';
import { MatchTable } from '@/components/admin/MatchTable';
import { GenerateMatchesButton } from '@/components/admin/GenerateMatchesButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlus, Users, Shuffle, TreePine } from 'lucide-react';
import type { AdminUser, CreateUserRequest, UpdateUserRequest } from '@/types';

export function AdminPage() {
  const { user, wishlistEnabled } = useAuth();
  const {
    users,
    loadingUsers,
    usersError,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    matches,
    loadingMatches,
    matchesError,
    fetchMatches,
    generateMatches,
    updateMatches,
  } = useAdmin();

  const [userFormOpen, setUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchUsers();
    fetchMatches();
  }, [fetchUsers, fetchMatches]);

  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreateUser = () => {
    setSelectedUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (userToEdit: AdminUser) => {
    setSelectedUser(userToEdit);
    setUserFormOpen(true);
  };

  const handleUserFormSubmit = async (
    data: CreateUserRequest | UpdateUserRequest
  ): Promise<{ password?: string }> => {
    if (selectedUser) {
      // Edit mode
      await updateUser(selectedUser.id, data as UpdateUserRequest);
      return {};
    } else {
      // Create mode
      const result = await createUser(data as CreateUserRequest);
      return { password: result.password };
    }
  };

  const handleDeleteUser = async (id: number) => {
    await deleteUser(id);
  };

  const handleResetPassword = async (id: number): Promise<string> => {
    return await resetPassword(id);
  };

  const handleGenerateMatches = async () => {
    await generateMatches();
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">Admin Panel 🛠️</h1>
          <p className="mt-2 text-gray-200">
            Manage users and Secret Santa match assignments
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{users.length}</h3>
              </div>
              <Users className="h-8 w-8 text-[#1a472a]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Match Status</p>
                <h3 className="text-2xl font-bold text-[#1a472a]">
                  {matches?.matches?.length ? 'Generated' : 'Pending'}
                </h3>
              </div>
              <Shuffle className="h-8 w-8 text-[#1a472a]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Year</p>
                <h3 className="text-2xl font-bold text-[#1a472a]">{new Date().getFullYear()}</h3>
              </div>
              <TreePine className="h-8 w-8 text-[#1a472a]" />
            </CardContent>
          </Card>
        </div>

        {/* Users Section */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#1a472a]" />
              <CardTitle>Users</CardTitle>
            </div>
            <Button onClick={handleCreateUser} className="gap-2" size="sm">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : usersError ? (
              <Alert variant="destructive">
                <AlertDescription>{usersError}</AlertDescription>
              </Alert>
            ) : (
              <UserTable
                users={users}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onResetPassword={handleResetPassword}
                currentUserId={user.id}
                wishlistEnabled={wishlistEnabled}
              />
            )}
          </CardContent>
        </Card>

        {/* Matches Section */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-[#1a472a]" />
              <CardTitle>Matches</CardTitle>
            </div>
            <GenerateMatchesButton
              hasExistingMatches={matches?.matches.length ? matches.matches.length > 0 : false}
              onGenerate={handleGenerateMatches}
            />
          </CardHeader>
          <CardContent>
            {loadingMatches ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : matchesError ? (
              <Alert variant="destructive">
                <AlertDescription>{matchesError}</AlertDescription>
              </Alert>
            ) : matches && matches.matches.length > 0 ? (
              <MatchTable
                matchesData={matches}
                users={users}
                onUpdateMatches={async (m) => { await updateMatches(m); }}
              />
            ) : (
              <EmptyState
                icon={Shuffle}
                title="No Matches Yet"
                description="Generate specific matches for this year's Secret Santa exchange."
                className="border-none shadow-none bg-transparent"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Form Dialog */}
      <UserForm
        open={userFormOpen}
        onOpenChange={setUserFormOpen}
        user={selectedUser}
        onSubmit={handleUserFormSubmit}
      />
    </PageContainer>
  );
}
