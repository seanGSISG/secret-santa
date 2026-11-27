import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  AdminUser,
  AdminUsersResponse,
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  ResetPasswordResponse,
  DeleteUserResponse,
  AdminMatchesResponse,
} from '@/types';

interface UseAdminReturn {
  // Users
  users: AdminUser[];
  loadingUsers: boolean;
  usersError: string | null;
  fetchUsers: () => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<CreateUserResponse>;
  updateUser: (id: number, data: UpdateUserRequest) => Promise<AdminUser>;
  deleteUser: (id: number) => Promise<DeleteUserResponse>;
  resetPassword: (id: number) => Promise<string>;

  // Matches
  matches: AdminMatchesResponse | null;
  loadingMatches: boolean;
  matchesError: string | null;
  fetchMatches: () => Promise<void>;
  generateMatches: () => Promise<AdminMatchesResponse>;
  updateMatches: (matches: { giver_id: number; receiver_id: number }[]) => Promise<AdminMatchesResponse>;
}

export function useAdmin(): UseAdminReturn {
  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Matches state
  const [matches, setMatches] = useState<AdminMatchesResponse | null>(null);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesError, setMatchesError] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUsersError(null);
    try {
      const data = await api.get<AdminUsersResponse>('/admin/users');
      setUsers(data.users);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setUsersError(message);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Create user
  const createUser = useCallback(
    async (data: CreateUserRequest): Promise<CreateUserResponse> => {
      try {
        const response = await api.post<CreateUserResponse>('/admin/users', data);
        await fetchUsers(); // Refresh list
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create user';
        throw new Error(message);
      }
    },
    [fetchUsers]
  );

  // Update user
  const updateUser = useCallback(
    async (id: number, data: UpdateUserRequest): Promise<AdminUser> => {
      try {
        const response = await api.put<UpdateUserResponse>(`/admin/users/${id}`, data);
        await fetchUsers(); // Refresh list
        return response.user;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update user';
        throw new Error(message);
      }
    },
    [fetchUsers]
  );

  // Delete user
  const deleteUser = useCallback(
    async (id: number): Promise<DeleteUserResponse> => {
      try {
        const result = await api.delete<DeleteUserResponse>(`/admin/users/${id}`);
        await fetchUsers(); // Refresh list
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete user';
        throw new Error(message);
      }
    },
    [fetchUsers]
  );

  // Reset password
  const resetPassword = useCallback(async (id: number): Promise<string> => {
    try {
      const response = await api.put<ResetPasswordResponse>(
        `/admin/users/${id}/reset-password`
      );
      return response.password;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      throw new Error(message);
    }
  }, []);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    setLoadingMatches(true);
    setMatchesError(null);
    try {
      const data = await api.get<AdminMatchesResponse>('/admin/matches');
      setMatches(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch matches';
      setMatchesError(message);
      setMatches(null);
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  // Generate matches
  const generateMatches = useCallback(async (): Promise<AdminMatchesResponse> => {
    try {
      const data = await api.post<AdminMatchesResponse>('/admin/matches/generate');
      setMatches(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate matches';
      throw new Error(message);
    }
  }, []);

  // Update matches
  const updateMatches = useCallback(async (matchesList: { giver_id: number; receiver_id: number }[]): Promise<AdminMatchesResponse> => {
    try {
      const data = await api.put<AdminMatchesResponse>('/admin/matches', { matches: matchesList });
      setMatches(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update matches';
      throw new Error(message);
    }
  }, []);

  return {
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
  };
}
