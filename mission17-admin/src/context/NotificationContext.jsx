import React, { createContext, useContext, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const showNotification = useCallback((arg1, arg2, arg3) => {
        let message, type;

        // Extract message and type based on their polymorphic signature
        if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && !(arg1 instanceof Error)) {
            message = arg1.message;
            type = arg1.type || 'info';
        } else if (typeof arg3 === 'string' && ['success', 'error', 'info'].includes(arg3)) {
            message = arg2;
            type = arg3;
        } else if (typeof arg2 === 'string' && ['success', 'error', 'info'].includes(arg2)) {
            message = arg1;
            type = arg2;
        } else {
            message = arg1;
            type = arg2 || 'info';
        }

        // Handle objects/errors gracefully
        let finalMessage = message;
        if (message instanceof Error) finalMessage = message.message;
        else if (typeof message === 'object') finalMessage = JSON.stringify(message);

        // Map to react-hot-toast
        if (type === 'success') {
            toast.success(finalMessage, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
        } else if (type === 'error') {
            toast.error(finalMessage, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
        } else {
            toast(finalMessage, { style: { borderRadius: '10px', background: '#333', color: '#fff' }});
        }
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <Toaster position="bottom-right" reverseOrder={false} />
        </NotificationContext.Provider>
    );
};
