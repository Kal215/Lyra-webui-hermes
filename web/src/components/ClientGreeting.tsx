/* eslint-disable */
'use client';
import React, { useState, useEffect } from 'react';
import { useI18nStore, useTranslation } from '@/i18n';

export function ClientGreeting() {
  const { language } = useI18nStore();
  const t = useTranslation();
  const [greeting, setGreeting] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let key = 'greet.morning';
      
      if (language === 'id') {
        if (hour >= 5 && hour < 11) key = 'greet.morning';
        else if (hour >= 11 && hour < 15) key = 'greet.noon';
        else if (hour >= 15 && hour < 18) key = 'greet.afternoon';
        else key = 'greet.night';
      } else {
        if (hour >= 5 && hour < 12) key = 'greet.morning';
        else if (hour >= 12 && hour < 18) key = 'greet.afternoon';
        else key = 'greet.night';
      }
      
      
      setGreeting(t(key));
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, [language, t]);

  if (!mounted) {
    return <>{language === 'en' ? 'Good morning' : 'Selamat pagi'}</>;
  }

  return <>{greeting}</>;
}
