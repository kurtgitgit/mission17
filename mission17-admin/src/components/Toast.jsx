import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import '../styles/Toast.css';

const Toast = ({ title, message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="toast-icon success" size={24} />;
            case 'error': return <AlertCircle className="toast-icon error" size={24} />;
            default: return <Info className="toast-icon info" size={24} />;
        }
    };

    const getAutoTitle = () => {
        if (title) return title;
        switch (type) {
            case 'success': return 'Action Successful';
            case 'error': return 'System Error';
            case 'info': return 'System Update';
            default: return 'Notification';
        }
    };

    const renderMessage = () => {
        if (!message) return 'No message details provided.';
        if (typeof message === 'string') return message;
        
        // Handle Error objects or API response objects
        if (message instanceof Error) return message.message;
        if (message.message) return String(message.message);
        if (message.error) return String(message.error);
        if (message.detail) return String(message.detail);
        
        // Fallback for objects that JSON.stringify handles poorly (like empty errors)
        try {
            const stringified = JSON.stringify(message);
            return stringified === '{}' ? 'An unexpected error occurred.' : stringified;
        } catch (e) {
            return 'An error occurred (unserializable details).';
        }
    };

    return (
        <div className={`toast-message ${type}`}>
            <div className="toast-content">
                <div className="toast-icon-wrapper">
                    {getIcon()}
                </div>
                <div className="toast-text-container">
                    <div className="toast-title">{getAutoTitle()}</div>
                    <div className="message-text">{renderMessage()}</div>
                </div>
            </div>
            <button className="toast-close" onClick={onClose} aria-label="Close">
                <X size={18} />
            </button>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

export default Toast;
