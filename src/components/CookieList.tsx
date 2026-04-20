import React from 'react';
import { CookieGroup } from '../types';
import CookieItem from './CookieItem';

interface CookieListProps {
  cookies: CookieGroup[];
  onDelete: (id: string) => void;
  onEdit: (group: CookieGroup) => void;
  onCopy: (group: CookieGroup) => void;
  onUse: (group: CookieGroup) => void;
  onExport: (group: CookieGroup) => void;
  onDuplicate: (group: CookieGroup) => void;
}

export default function CookieList({ cookies, onDelete, onEdit, onCopy, onUse, onExport, onDuplicate }: CookieListProps) {
  return (
    <ul className="cm-cookie-list">
      {cookies.map(group => (
        <CookieItem
          key={group.id}
          group={group}
          onDelete={onDelete}
          onEdit={onEdit}
          onCopy={onCopy}
          onUse={onUse}
          onExport={onExport}
          onDuplicate={onDuplicate}
        />
      ))}
    </ul>
  );
}
