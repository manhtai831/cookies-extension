import React from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="cm-toast-container">
      {messages.map(msg => (
        <div key={msg.id} className={`cm-toast cm-toast-${msg.type}`}>
          <span>{msg.message}</span>
          <button onClick={() => onRemove(msg.id)} className="cm-toast-close">×</button>
        </div>
      ))}
    </div>
  );
}
