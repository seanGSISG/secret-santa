import { useState, useEffect } from 'react';
import type { AdminMatchesResponse, AdminUser } from '@/types';
import { ArrowRight, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface MatchTableProps {
  matchesData: AdminMatchesResponse;
  users: AdminUser[];
  onUpdateMatches: (matches: { giver_id: number; receiver_id: number }[]) => Promise<void>;
}

export function MatchTable({ matchesData, users, onUpdateMatches }: MatchTableProps) {
  const { language } = useAuth();
  const { year, matches } = matchesData;
  const [isEditing, setIsEditing] = useState(false);
  const [editedMatches, setEditedMatches] = useState<{ giver_id: number; receiver_id: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize edited matches when entering edit mode or when matches change
  useEffect(() => {
    if (matches) {
      setEditedMatches(
        matches.map(m => ({ giver_id: m.giver.id, receiver_id: m.receiver.id }))
      );
    }
  }, [matches]);

  const handleReceiverChange = (giverId: number, newReceiverIdStr: string) => {
    const newReceiverId = parseInt(newReceiverIdStr, 10);
    setEditedMatches(prev =>
      prev.map(m => m.giver_id === giverId ? { ...m, receiver_id: newReceiverId } : m)
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateMatches(editedMatches);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in parent or global toast
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    // Reset to original
    setEditedMatches(
      matches.map(m => ({ giver_id: m.giver.id, receiver_id: m.receiver.id }))
    );
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {language === 'fr'
          ? `Aucun tirage n’a encore été effectué pour ${year}.`
          : `No matches have been generated yet for ${year}.`}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {translate(language, 'Secret Santa Matches')} {year}
          </h3>
          <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {language === 'fr' ? `${matches.length} attributions` : `${matches.length} assignments`}
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={cancelEdit}
              disabled={saving}
              className="bg-white text-gray-900 hover:bg-gray-100 border border-gray-200"
            >
              <X className="w-4 h-4 mr-2" />
              {translate(language, 'Cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {translate(language, saving ? 'Saving...' : 'Save Changes')}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="w-4 h-4 mr-2" />
            {translate(language, 'Edit Assignments')}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate(language, 'Giver')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                {/* Arrow column */}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {translate(language, 'Recipient')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {match.giver.name}
                    </div>
                    <div className="text-sm text-gray-500">{match.giver.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <ArrowRight className="w-5 h-5 text-gray-400 mx-auto" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isEditing ? (
                    <select
                      value={editedMatches.find(m => m.giver_id === match.giver.id)?.receiver_id.toString()}
                      onChange={(e) => handleReceiverChange(match.giver.id, e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>{translate(language, 'Select user')}</option>
                      {users.map(user => (
                        <option
                          key={user.id}
                          value={user.id.toString()}
                          disabled={user.id === match.giver.id} // Can't pick self
                        >
                          {user.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {match.receiver.name}
                      </div>
                      <div className="text-sm text-gray-500">{match.receiver.email}</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
