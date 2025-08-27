import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import Stream from './components/Stream';
import StreamList from './components/StreamList';
import Navigation from './components/Navigation';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SignalRProvider } from './contexts/SignalRContext';
import './App.css';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, token, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'chat' | 'streams'>('chat');

  if (!token) {
    return <Login />;
  }

  return (
    <SignalRProvider token={token}>
      <div className="app-container">
        <Navigation 
          user={user}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onLogout={logout}
        />
        
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to="/" />} />
            <Route 
              path="/" 
              element={
                currentView === 'chat' ? (
                  <Chat user={user} />
                ) : (
                  <StreamList user={user} />
                )
              } 
            />
            <Route path="/stream/:id" element={<Stream user={user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </SignalRProvider>
  );
}