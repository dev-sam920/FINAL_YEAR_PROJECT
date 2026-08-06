import React from 'react';
import './SplashScreen.css';

export default function SplashScreen() {
  return (
    <div className="sm-splash-root" aria-hidden>
      <div className="sm-splash-inner">
        <div className="sm-splash-logo">SM</div>
        <div className="sm-splash-copy">SmartMaint</div>
      </div>
    </div>
  );
}
