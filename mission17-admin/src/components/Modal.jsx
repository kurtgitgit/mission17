import React, { useState, useEffect } from 'react';
import { X, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import '../styles/Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info', 
  showInput = false, 
  inputPlaceholder = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (showInput) {
      onConfirm(inputValue);
    } else {
      onConfirm();
    }
  };

  const Icon = type === 'danger' ? AlertCircle : (type === 'success' ? CheckCircle : HelpCircle);
  const iconColor = type === 'danger' ? '#ef4444' : (type === 'success' ? '#10b981' : '#3b82f6');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <Icon size={20} color={iconColor} />
            <h3>{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
          {showInput && (
            <input 
              type="text" 
              className="modal-input" 
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button 
            className={`modal-btn-confirm ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={handleConfirm}
            disabled={showInput && !inputValue.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
