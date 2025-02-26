interface CardProps {
  suit: string;
  value: string;
  image?: string;
  faceDown?: boolean;
  cardBackImage?: string;
  selectable?: boolean;
  selected?: boolean;
  onClick?: () => void;
  size?: 'tiny' | 'small' | 'medium' | 'large';
}

const Card = ({ 
  suit, 
  value, 
  image, 
  faceDown = false, 
  cardBackImage = "https://deckofcardsapi.com/static/img/back.png",
  selectable = false,
  selected = false,
  onClick = () => {},
  size = 'medium'
}: CardProps) => {
  
  const getCardColor = () => {
    if (suit === 'HEARTS' || suit === 'DIAMONDS' || suit === '♥' || suit === '♦') {
      return 'text-red-500';
    }
    return 'text-black';
  };

  // Determine card dimensions based on size
  const getSizeClasses = () => {
    switch(size) {
      case 'tiny':
        return 'w-8 h-12';
      case 'small':
        return 'w-12 h-18';
      case 'medium':
        return 'w-20 h-28';
      case 'large':
        return 'w-24 h-36';
      default:
        return 'w-20 h-28';
    }
  };

  return (
    <div 
      className={`${getSizeClasses()} relative rounded-lg overflow-hidden cursor-pointer mx-1 ${
        selected ? 'ring-4 ring-blue-500' : ''
      } ${selectable ? 'hover:shadow-lg hover:-translate-y-1 transition-all' : ''}`}
      onClick={onClick}
      style={{ 
        backgroundColor: 'white',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'transform 0.2s'
      }}
    >
      {faceDown ? (
        <img 
          src={cardBackImage} 
          alt="Card back" 
          className="w-full h-full object-cover"
        />
      ) : image ? (
        <img 
          src={image} 
          alt={`${value} of ${suit}`} 
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="w-full h-full flex flex-col p-1">
          <div className={`font-bold ${getCardColor()}`}>
            {value}
          </div>
          <div className={`${getCardColor()}`}>
            {suit === 'HEARTS' ? '♥' : 
             suit === 'DIAMONDS' ? '♦' : 
             suit === 'CLUBS' ? '♣' : 
             suit === 'SPADES' ? '♠' : suit}
          </div>
          <div className="flex-grow flex items-center justify-center">
            <div className={`text-2xl ${getCardColor()}`}>
              {suit === 'HEARTS' ? '♥' : 
               suit === 'DIAMONDS' ? '♦' : 
               suit === 'CLUBS' ? '♣' : 
               suit === 'SPADES' ? '♠' : suit}
            </div>
          </div>
          <div className={`self-end ${getCardColor()}`}>
            {value}
          </div>
        </div>
      )}
      {selectable && (
        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-70 text-white text-xs text-center">
          Select
        </div>
      )}
    </div>
  );
};

export default Card; 