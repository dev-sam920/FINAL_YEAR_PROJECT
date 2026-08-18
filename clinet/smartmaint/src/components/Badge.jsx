import React from 'react';
import './Badge.css';

export default function Badge({ children, variant = 'status', type = '', className = '' }) {
  const typeSlug = String(type || '').toLowerCase().replace(/\s+/g, '-');
  const base = `badge badge--${variant} badge--${variant}-${typeSlug}`;
  return (
    <span className={`${base} ${className}`.trim()}>
      {children}
    </span>
  );
}
