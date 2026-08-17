import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import loadingManager from '../utils/loadingManager.js';

const LoadingContext = createContext({ activeRequests: 0, showSplash: false, triggerSplash: () => {}, hideSplash: () => {} });

export function LoadingProvider({ children }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = loadingManager.onChange((count) => {
      setActiveRequests(count);
    });
    return unsubscribe;
  }, []);

  const triggerSplash = (duration = 3000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowSplash(true);
    timerRef.current = setTimeout(() => {
      setShowSplash(false);
      timerRef.current = null;
    }, duration);
  };

  const hideSplash = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowSplash(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ activeRequests, showSplash, triggerSplash, hideSplash }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

export default LoadingContext;
