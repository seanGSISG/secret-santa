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
import { toast } from 'sonner';
import type { AdminUser, CreateUserRequest, UpdateUserRequest } from '@/types';
import { translate } from '@/lib/i18n';

export function AdminPage() {
  const { user, wishlistEnabled, language, setDrawParticipation } = useAuth();
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
  const [updatingDrawParticipation, setUpdatingDrawParticipation] = useState(false);
  const participants = users.filter((participant) => participant.participatesInDraw);
  const secondhandParticipants = participants.filter((participant) => participant.secondhandPreference).length;
  const newGiftParticipants = participants.length - secondhandParticipants;
  const preferenceRate = (count: number) => participants.length
    ? Math.round((count / participants.length) * 100)
    : 0;

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

  const handleDrawParticipationChange = async (participatesInDraw: boolean) => {
    setUpdatingDrawParticipation(true);
    try {
      await setDrawParticipation(participatesInDraw);
      toast.success(translate(language, 'Draw participation updated'));
      await Promise.all([fetchUsers(), fetchMatches()]);
    } catch (error) {
      console.error('Failed to update draw participation:', error);
      toast.error(translate(language, 'Failed to update draw participation'));
    } finally {
      setUpdatingDrawParticipation(false);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-serif text-white">{translate(language, 'Admin Panel')} 🛠️</h1>
          <p className="mt-2 text-gray-200">
            {translate(language, 'Manage users and Secret Santa match assignments')}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{translate(language, 'Participants')}</p>
                  <h3 className="text-2xl font-bold">{participants.length}</h3>
                </div>
                <Users className="h-8 w-8 text-[#1a472a]" />
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-emerald-800">
                  {translate(language, 'Second-hand / handmade')}: {secondhandParticipants} ({preferenceRate(secondhandParticipants)}%)
                </p>
                <p className="text-red-700">
                  {translate(language, 'New gift')}: {newGiftParticipants} ({preferenceRate(newGiftParticipants)}%)
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{translate(language, 'Match Status')}</p>
                <h3 className="text-2xl font-bold text-[#1a472a]">
                  {translate(language, matches?.matches?.length ? 'Generated' : 'Pending')}
                </h3>
              </div>
              <Shuffle className="h-8 w-8 text-[#1a472a]" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{translate(language, 'Year')}</p>
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
              <CardTitle>{translate(language, 'Users')}</CardTitle>
            </div>
            <Button onClick={handleCreateUser} className="gap-2" size="sm">
              <UserPlus className="h-4 w-4" />
              {translate(language, 'Add User')}
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
              <CardTitle>{translate(language, 'Matches')}</CardTitle>
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
                title={translate(language, 'No Matches Yet')}
                description={translate(language, "Generate specific matches for this year's Secret Santa exchange.")}
                className="border-none shadow-none bg-transparent"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{translate(language, 'Your draw participation')}</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={user?.participatesInDraw ?? true}
                disabled={updatingDrawParticipation}
                onChange={(event) => void handleDrawParticipationChange(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#1a472a]"
              />
              <span>
                <span className="block font-medium">{translate(language, 'Include me in the draw')}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {translate(language, 'When excluded, you will neither draw a recipient nor be assigned as one. Changing this setting clears this year’s matches; generate them again afterward.')}
                </span>
              </span>
            </label>
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
