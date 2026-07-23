import { Link } from 'react-router-dom';

interface ClickableRestaurantProps {
  restaurantId: string;
  restaurantName: string;
  className?: string;
}

export default function ClickableRestaurant({ restaurantId, restaurantName, className = '' }: ClickableRestaurantProps) {
  if (!restaurantId || !restaurantName) return <span className={className}>Ristorante Sconosciuto</span>;
  
  return (
    <Link 
      to={`/restaurant/${restaurantId}`}
      className={`font-bold text-slate-800 hover:text-orange-600 hover:underline transition-colors ${className}`}
    >
      {restaurantName}
    </Link>
  );
}
