'use client';
import { useState, useEffect } from 'react';

export default function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState('');

  const checkConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      
      const response = await fetch('http://169.254.123.26:5000/health', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend connected:', data);
        setIsConnected(true);
        setError('');
      } else {
        console.error('❌ Backend error:', response.status);
        setIsConnected(false);
        setError(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Connection failed:', error);
      setIsConnected(false);
      setError(error.message);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 3000);
    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return (
      <div className="flex items-center text-yellow-600 text-sm">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
        Backend: Checking...
      </div>
    );
  }

  return (
    <div className={`flex items-center text-sm ${
      isConnected ? 'text-green-600' : 'text-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full mr-2 ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      Backend: {isConnected ? 'Connected' : 'Disconnected'}
      {error && <span className="ml-1 text-xs">({error})</span>}
    </div>
  );
}