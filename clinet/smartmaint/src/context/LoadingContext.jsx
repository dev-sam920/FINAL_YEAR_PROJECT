import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import loadingManager from '../utils/loadingManager.js';

const LoadingContext = createContext({ activeRequests: 0, showSplash: false });

export function LoadingProvider({ children }) {
  const [activeRequests, setActiveRequests] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [minElapsed, setMinElapsed] = useState(true);
  const timerRef = useRef(null);
  const location = useLocation();
  const previousPathRef = useRef(location.pathname);
  const authRoutes = useRef(new Set(['/login', '/signup', '/register']));

  useEffect(() => {
    const unsubscribe = loadingManager.onChange((count) => {
      setActiveRequests(count);
    });
    return unsubscribe;
  }, []);

  // When location changes, mark navigating true and start/reset the minimum
  // display timer so the splash stays visible for at least 3000ms.
  useEffect(() => {
    const nextPath = location.pathname;
    const previousPath = previousPathRef.current;
    const isAuthCrossNavigation =
      authRoutes.current.has(previousPath) && authRoutes.current.has(nextPath);

    previousPathRef.current = nextPath;

    if (isAuthCrossNavigation) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setNavigating(false);
      setMinElapsed(true);
      return;
    }

    setNavigating(true);
    setMinElapsed(false);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    timerRef.current = setTimeout(() => {
      setMinElapsed(true);
      timerRef.current = null;
    }, 3000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    if (navigating && minElapsed) {
      // wait a frame so the new page has a chance to render, then clear
      requestAnimationFrame(() => setNavigating(false));
    }
  }, [navigating, minElapsed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const showSplash = navigating;

  return (
    <LoadingContext.Provider value={{ activeRequests, showSplash }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

export default LoadingContext;
