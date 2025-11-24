"use client";
import { createContext, useState } from "react";

export const ActionContext = createContext();

export const ActionProvider = ({ children }) => {
    const [action, setAction] = useState(null);

    return (
        <ActionContext.Provider value={{ action, setAction }}>
            {children}
        </ActionContext.Provider>
    );
};
