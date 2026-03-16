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
            case 'success': return 'Success';
            case 'error': return 'Error';
            default: return 'Notification';
        }
    };

    return (
        <div className={`toast-message ${type}`}>
            <div className="toast-content">
                {getIcon()}
                <div className="toast-text-container">
                    <div className="toast-title">{getAutoTitle()}</div>
                    <div className="message-text">{message}</div>
                </div>
            </div>
            <button className="toast-close" onClick={onClose}>
                <X size={18} />
            </button>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

export default Toast;
