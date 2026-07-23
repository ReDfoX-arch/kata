import { User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserAvatarProps {
  userId?: string;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ userId, username, size = 'md', className = '' }: UserAvatarProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(username || '?');
  const [avatarSupported, setAvatarSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if (username) setDisplayName(username);
  }, [username]);

  useEffect(() => {
    const currentProfile = (() => {
      try {
        return JSON.parse(localStorage.getItem('kata_profile') || 'null');
      } catch {
        return null;
      }
    })();

    if (userId && currentProfile?.userId === userId && currentProfile.avatar) {
      setAvatar(currentProfile.avatar);
      if (currentProfile.username) setDisplayName(currentProfile.username);
      return;
    }

    if (!userId || avatarSupported === false) return;

    const fetchUserData = async () => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('avatar, username')
          .eq('secret_id', userId)
          .maybeSingle();

        if (error) {
          if (error.code === '42703') {
            setAvatarSupported(false);
            return;
          }
          console.error('Errore nel caricamento avatar:', error);
          return;
        }

        if (user) {
          setAvatar(user.avatar || null);
          setDisplayName(user.username || displayName);
        }
      } catch (err) {
        console.error('Errore nel caricamento avatar:', err);
      }
    };

    fetchUserData();
  }, [userId, avatarSupported]);

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-20 h-20 text-2xl'
  };

  if (avatar) {
    return (
      <img 
        src={avatar} 
        alt={displayName} 
        className={`rounded-full object-cover border-2 border-white shadow-sm ${sizeClasses[size]} ${className}`}
        title={displayName}
      />
    );
  }

  return (
    <div className={`rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm ${sizeClasses[size]} ${className}`}>
      <UserIcon className="text-orange-600" size={size === 'sm' ? 16 : size === 'md' ? 24 : 40} />
    </div>
  );
}
