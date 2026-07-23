import { Link } from 'react-router-dom';

interface ClickableUsernameProps {
  username: string;
  className?: string;
}

export default function ClickableUsername({ username, className = '' }: ClickableUsernameProps) {
  if (!username) return <span className={className}>Sconosciuto</span>;
  
  return (
    <Link 
      to={`/user/${username}`}
      className={`font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors ${className}`}
    >
      {username}
    </Link>
  );
}
