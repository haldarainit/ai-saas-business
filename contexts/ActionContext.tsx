"use client";
import { createContext, useState, ReactNode, Dispatch, SetStateAction } from "react";

// Define the action type - can be extended based on what actions are used
export type ActionType = string | null;

// Define the context value type
export interface ActionContextValue {
    action: ActionType;
    setAction: Dispatch<SetStateAction<ActionType>>;
}

// Create context with undefined as default (to enforce Provider usage)
export const ActionContext = createContext<ActionContextValue | undefined>(undefined);

// Props for the provider component
interface ActionProviderProps {
    children: ReactNode;
}

export const ActionProvider = ({ children }: ActionProviderProps) => {
    const [action, setAction] = useState<ActionType>(null);

    return (
        <ActionContext.Provider value={{ action, setAction }}>
            {children}
        </ActionContext.Provider>
    );
};
