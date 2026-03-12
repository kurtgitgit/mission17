import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import '../styles/Toast.css';

const Toast = ({ message, type, onClose }) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="toast-icon success" size={20} />;
            case 'error': return <AlertCircle className="toast-icon error" size={20} />;
            default: return <Info className="toast-icon info" size={20} />;
        }
    };

    return (
        <div className={`toast-message ${type}`}>
            <div className="toast-content">
                {getIcon()}
                <span className="message-text">{message}</span>
            </div>
            <button className="toast-close" onClick={onClose}>
                <X size={16} />
            </button>
            <div className="toast-progress-bar"></div>
        </div>
    );
};

export default Toast;
