import React from 'react';
import './Navigation.css';

interface User {
  id: string;
  displayName: string;
  isGuest?: boolean;
}

interface NavigationProps {
  user: User | null;
  currentView: 'chat' | 'streams';
  setCurrentView: (view: 'chat' | 'streams') => void;
  onLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  user, 
  currentView, 
  setCurrentView, 
  onLogout 
}) => {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>ChatStream</h1>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab ${currentView === 'chat' ? 'active' : ''}`}
          onClick={() => setCurrentView('chat')}
        >
          💬 Chat
        </button>
        <button
          className={`nav-tab ${currentView === 'streams' ? 'active' : ''}`}
          onClick={() => setCurrentView('streams')}
        >
          📺 Streams
        </button>
      </div>

      <div className="nav-user">
        <div className="user-info">
          <span className="username">
            {user?.displayName}
            {user?.isGuest && <span className="guest-badge">Convidado</span>}
          </span>
        </div>
        <button className="logout-button" onClick={onLogout}>
          Sair
        </button>
      </div>
    </nav>
  );
};

export default Navigation;