import React from 'react';
import { CookieGroup } from '../types';

interface CookieFormProps {
    formData: {
        name: string;
    };
    setFormData: (data: { name: string }) => void;
    onSave: () => void;
    onCancel: () => void;
    editingCookie: CookieGroup | null;
}

export default function CookieForm({ formData, setFormData, onSave, onCancel, editingCookie }: CookieFormProps) {
    return (
        <div className="cm-form">
            <div>
                <h3>{editingCookie ? 'Edit Cookie' : 'New Cookie'}</h3>
                <input
                    type="text"
                    placeholder="Name"
                    value={formData.name}
                    maxLength={100}
                    onChange={(e) => setFormData({ name: e.target.value })}
                    className="cm-input"
                />
                <div className="cm-flex-2">
                    <button onClick={onSave} className="cm-button">Save</button>
                    <button onClick={onCancel} className="cm-button">Cancel</button>
                </div>
            </div>
        </div>
    );
}
