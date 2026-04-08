import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((arg1, arg2, arg3) => {
        let title, message, type;

        // Detect Polymorphic Usage
        if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1) && !(arg1 instanceof Error)) {
            // Case 1: showNotification({ title, message, type })
            title = arg1.title;
            message = arg1.message;
            type = arg1.type || 'info';
        } else if (typeof arg3 === 'string' && ['success', 'error', 'info'].includes(arg3)) {
            // Case 2: showNotification(title, message, type)
            title = arg1;
            message = arg2;
            type = arg3;
        } else if (typeof arg2 === 'string' && ['success', 'error', 'info'].includes(arg2)) {
            // Case 3: showNotification(message, type, title)
            message = arg1;
            type = arg2;
            title = arg3;
        } else {
            // Fallback: showNotification(message, [title/type?]) 
            message = arg1;
            type = arg2 || 'info';
            title = arg3;
        }

        const id = Math.random().toString(36).substr(2, 9);
        setNotifications((prev) => [...prev, { id, title, message, type }]);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 4000);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="toast-container">
                {notifications.map((n) => (
                    <Toast 
                        key={n.id} 
                        title={n.title}
                        message={n.message} 
                        type={n.type} 
                        onClose={() => removeNotification(n.id)} 
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};
