interface ColorScheme {
    BACKGROUND: string;
    CHAT_BACKGROUND: string;
    PRIMARY: string;
    SECONDARY: string;
    SUCCESS: string;
    ERROR: string;
    WARNING: string;
    TEXT_PRIMARY: string;
    TEXT_SECONDARY: string;
}

const Colors: ColorScheme = {
    BACKGROUND: '#1a1a1a',
    CHAT_BACKGROUND: '#2a2a2a',
    PRIMARY: '#3b82f6',
    SECONDARY: '#8b5cf6',
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#9ca3af',
};

export default Colors;
export type { ColorScheme };
