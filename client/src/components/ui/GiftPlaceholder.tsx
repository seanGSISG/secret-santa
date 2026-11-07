import { Gift } from 'lucide-react';
import { useMemo } from 'react';
import { characterList } from '@/assets/characters';

interface GiftPlaceholderProps {
    className?: string;
    variant?: 'default' | 'festive';
}

export function GiftPlaceholder({ className, variant = 'default' }: GiftPlaceholderProps) {
    const character = useMemo(() => {
        if (variant !== 'festive') return null;
        const randomIndex = Math.floor(Math.random() * characterList.length);
        return characterList[randomIndex];
    }, [variant]);

    return (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-50 ${className}`}>
            {variant === 'festive' && character ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img
                        src={character}
                        alt=""
                        className="max-w-full max-h-full object-contain opacity-80 hover:scale-110 transition-transform duration-300"
                    />
                </div>
            ) : (
                <div className="relative">
                    <Gift className="w-16 h-16 text-[#1a472a]/20" />
                    <div className="absolute -top-1 -right-1">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[#cba135]"
                        >
                            <path
                                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                                fill="currentColor"
                            />
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}
