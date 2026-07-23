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

  useEffect(() => {
    if (!userId && !username) return;

    const fetchUserData = async () => {
      try {
        if (userId) {
          const { data: user } = await supabase
            .from('users')
            .select('avatar, username')
            .eq('secret_id', userId)
            .maybeSingle();

          if (user) {
            setAvatar(user.avatar || null);
            setDisplayName(user.username);
          }
        }
      } catch (err) {
        console.error('Errore nel caricamento avatar:', err);
      }
    };

    fetchUserData();
  }, [userId, username]);

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
