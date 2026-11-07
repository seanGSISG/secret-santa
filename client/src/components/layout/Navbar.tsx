import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { TreePine, LogOut, Settings, Menu, X, Sparkles, Languages, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { characters } from '@/assets/characters';

import { getFestiveCharacter } from '@/lib/festive';
import { translate } from '@/lib/i18n';
import { toast } from 'sonner';
import { DeleteAccountDialog } from '@/components/auth/DeleteAccountDialog';

export function Navbar() {
  const { user, logout, wishlistEnabled, language, setLanguage, config } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const handleLanguageChange = async (newLanguage: 'fr' | 'en') => {
    try {
      await setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to update language:', error);
      toast.error(translate(language, 'Unable to update your language. Please try again.'));
    }
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `text-sm font-medium transition-all flex items-center gap-2 px-4 py-2.5 rounded-xl group ${
      isActive(path)
        ? 'bg-white/15 text-white'
        : 'text-white/80 hover:text-white hover:bg-white/10'
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#1a472a] via-[#1f5233] to-[#1a472a] backdrop-blur-md shadow-lg">
      {/* Top decorative line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#f8b229]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleMobileMenuClose}
            className="flex items-center gap-3 text-white font-semibold text-lg hover:opacity-90 transition-opacity group"
          >
            <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors">
              <TreePine className="h-5 w-5 text-[#f8b229]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-serif tracking-tight">{config.gameTitle}</span>
              <img src={characters.santa} alt="Santa" className="w-7 h-7 object-contain" />
            </div>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/match" className={navLinkClass('/match')}>
              <img
                src={characters.rudolph}
                alt="Rudolph"
                className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
              />
              <span>{translate(language, 'My Match')}</span>
            </Link>
            {wishlistEnabled && (
              <>
                <Link to="/wishlist" className={navLinkClass('/wishlist')}>
                  <img
                    src={characters.clarice}
                    alt="Clarice"
                    className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                  />
                  <span>{translate(language, 'My Wishlist')}</span>
                </Link>
                <Link to="/recipient" className={navLinkClass('/recipient')}>
                  <img
                    src={characters.hermey}
                    alt="Hermey"
                    className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
                  />
                  <span>{translate(language, 'Gift Ideas')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile & Desktop Right Section */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={translate(language, 'Toggle menu')}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full transition-all hover:scale-105 hover:ring-2 hover:ring-[#f8b229]/50 focus-visible:ring-2 focus-visible:ring-[#f8b229] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a472a]"
                  aria-label={translate(language, 'User menu')}
                >
                  <Avatar className="ring-2 ring-white/20">
                    <AvatarFallback className="bg-gradient-to-br from-[#2d5a3d] to-[#1a472a] text-white font-medium p-1">
                      <img
                        src={getFestiveCharacter(user.name)}
                        alt={user.name}
                        className="w-full h-full object-contain"
                      />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{user.name}</p>
                      <Sparkles className="w-3 h-3 text-[#f8b229]" />
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>{translate(language, 'Admin Panel')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => void handleLanguageChange('fr')} className="cursor-pointer">
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === 'fr' ? '✓ ' : ''}Français</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => void handleLanguageChange('en')} className="cursor-pointer">
                  <Languages className="mr-2 h-4 w-4" />
                  <span>{language === 'en' ? '✓ ' : ''}English</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{translate(language, 'Sign Out')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => {
                    setDeleteAccountDialogOpen(true);
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{translate(language, 'Delete my account')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1a472a]/95 backdrop-blur-md -mx-4 px-4">
            <div className="py-4 space-y-2">
              <Link
                to="/match"
                onClick={handleMobileMenuClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/match')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src={characters.rudolph} alt="Rudolph" className="w-7 h-7 object-contain" />
                <span className="font-medium">{translate(language, 'My Match')}</span>
              </Link>
              {wishlistEnabled && <Link
                to="/wishlist"
                onClick={handleMobileMenuClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/wishlist')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src={characters.clarice} alt="Clarice" className="w-7 h-7 object-contain" />
                <span className="font-medium">{translate(language, 'My Wishlist')}</span>
              </Link>}
              {wishlistEnabled && <Link
                to="/recipient"
                onClick={handleMobileMenuClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive('/recipient')
                    ? 'bg-white/15 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <img src={characters.hermey} alt="Hermey" className="w-7 h-7 object-contain" />
                <span className="font-medium">{translate(language, 'Gift Ideas')}</span>
              </Link>}
              {user.isAdmin && (
                <>
                  <div className="border-t border-white/10 my-3"></div>
                  <Link
                    to="/admin"
                    onClick={handleMobileMenuClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive('/admin')
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{translate(language, 'Admin Panel')}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      <DeleteAccountDialog
        open={deleteAccountDialogOpen}
        onOpenChange={setDeleteAccountDialogOpen}
      />
    </nav>
  );
}
