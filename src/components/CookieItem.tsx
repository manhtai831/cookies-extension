import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CookieGroup } from '../types';
import { EllipsisVertical, FolderDown, Layers2, SquareArrowOutUpRight, Trash2 } from 'lucide-react';

interface CookieItemProps {
  group: CookieGroup;
  onDelete: (id: string) => void;
  onUse: (group: CookieGroup) => void;
  onCopy: (group: CookieGroup) => void;
  onExport: (group: CookieGroup) => void;
  onDuplicate: (group: CookieGroup) => void;
}

export default function CookieItem({ group, onDelete, onUse, onCopy, onExport, onDuplicate }: CookieItemProps) {
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPopover(false);
      }
    };

    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopover]);

  const getExpiryClass = (expiry: number) => {
    const now = Date.now();
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    if (daysLeft < 0) return 'cm-expiry-red';
    if (daysLeft < 7) return 'cm-expiry-yellow';
    return 'cm-expiry-green';
  };

  const getFavicon = (domain: string) => {
    return `https://www.google.com/s2/favicons?domain=${domain}`;
  };

  const firstCookieDomain = useMemo(() => {
    if (group.cookies.length === 0) return '';
    if (group.cookies[0].domain.startsWith('.')) {
      return group.cookies[0].domain.substring(1);
    }
    return group.cookies[0].domain;
  }, [group.cookies]);
  const oldestExpiry = Math.max(...group.cookies.map(c => c.expiry));

  return (
    <li className="cm-cookie-item">
      <img src={getFavicon(firstCookieDomain)} alt="favicon" />
      <div className="cm-cookie-item-content">
        <span className="cm-cookie-item-name cm-max-line-1">{group.name}</span>
        <span className="cm-cookie-item-count">
          {group.cookies.length} cookies
          ・
          <span className={getExpiryClass(oldestExpiry)}>
            {new Date(oldestExpiry).toLocaleString()}
          </span>
        </span>
      </div>

      <div className="cm-cookie-item-actions">
        <button onClick={() => onUse(group)} className="cm-button cm-button-icon" title="Use cookies">
          <SquareArrowOutUpRight size={16}/>
        </button>
        <div className="cm-popover-container" ref={popoverRef}>
          <button onClick={() => setShowPopover(!showPopover)} className="cm-button cm-button-icon" title="More options">
            <EllipsisVertical size={16}/>
          </button>
          {showPopover && (
            <div className="cm-popover">
              <button onClick={() => { onDuplicate(group); setShowPopover(false); }} className="cm-popover-item" title="Duplicate cookies">
                <Layers2 size={16} /> Duplicate
              </button>
              <button onClick={() => { onExport(group); setShowPopover(false); }} className="cm-popover-item" title="Export cookies">
                <FolderDown size={16} /> Export
              </button>
              <button onClick={() => { onCopy(group); setShowPopover(false); }} className="cm-popover-item" title="Copy cookies">
                <Layers2 size={16} /> Copy
              </button>
              <button onClick={() => { onDelete(group.id); setShowPopover(false); }} className="cm-popover-item cm-popover-item-danger" title="Delete cookies">
                <Trash2 size={16} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
