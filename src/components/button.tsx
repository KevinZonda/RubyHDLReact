import { useState } from 'react';

interface ButtonProps<T = void> {
    text: string;
    onClick?: () => (Promise<T> | T);
    className?: string;
}

export const RunnableButton = <T = void>({ text, onClick, className }: ButtonProps<T>) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (!onClick) return;

        setIsLoading(true);
        try {
            await onClick();
        } finally {
            setIsLoading(false);
        }
    };

    return <button className={className} onClick={handleClick} disabled={isLoading}>
        {isLoading ? `${text}...` : text}
    </button>
}
