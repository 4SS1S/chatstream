import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignalR } from '../contexts/SignalRContext';
import { streamApi } from '../services/api';
import './StreamList.css';

interface User {
  id: string;
  displayName: string;
  isGuest?: boolean;
}

interface Stream {
  id: number;
  title: string;
  description: string;
  streamerName: string;
  startedAt: string;
  viewerCount: number;
}

interface StreamListProps {
  user: User | null;
}

const StreamList: React.FC<StreamListProps> = ({ user }) => {
  const navigate = useNavigate();
  const { connection } = useSignalR();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: ''
  });

  useEffect(() => {
    loadStreams();
    
    if (connection) {
      connection.on('StreamStarted', (streamData: any) => {
        loadStreams(); // Recarregar lista quando nova stream começar
      });

      connection.on('StreamEnded', (streamId: number) => {
        setStreams(prev => prev.filter(s => s.id !== streamId));
      });

      return () => {
        connection.off('StreamStarted');
        connection.off('StreamEnded');
      };
    }
  }, [connection]);

  const loadStreams = async () => {
    try {
      const response = await streamApi.getActiveStreams();
      setStreams(response.data);
    } catch (error) {
      console.error('Error loading streams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isGuest) {
      alert('Convidados não podem criar streams');
      return;
    }

    try {
      const response = await streamApi.startStream(createForm.title, createForm.description);
      
      // Notificar via SignalR
      if (connection) {
        await connection.invoke('StartStream', createForm.title, createForm.description);
      }
      
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '' });
      loadStreams();
    } catch (error) {
      console.error('Error creating stream:', error);
      alert('Erro ao criar stream');
    }
  };

  const joinStream = (streamId: number) => {
    navigate(`/stream/${streamId}`);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m atrás`;
    }
    return `${minutes}m atrás`;
  };

  if (loading) {
    return (
      <div className="stream-list-container">
        <div className="loading">Carregando streams...</div>
      </div>
    );
  }

  return (
    <div className="stream-list-container">
      <div className="stream-header">
        <h1>Streams Ao Vivo</h1>
        {!user?.isGuest && (
          <button
            className="btn-create-stream"
            onClick={() => setShowCreateModal(true)}
          >
            Criar Stream
          </button>
        )}
      </div>

      {streams.length === 0 ? (
        <div className="no-streams">
          <h2>Nenhuma stream ativa no momento</h2>
          <p>Seja o primeiro a começar uma transmissão!</p>
        </div>
      ) : (
        <div className="streams-grid">
          {streams.map((stream) => (
            <div key={stream.id} className="stream-card">
              <div className="stream-thumbnail">
                <div className="live-indicator">AO VIVO</div>
                <div className="viewer-count">👁 {stream.viewerCount}</div>
              </div>
              
              <div className="stream-info">
                <h3 className="stream-title">{stream.title}</h3>
                <p className="stream-streamer">por {stream.streamerName}</p>
                <p className="stream-description">{stream.description}</p>
                <div className="stream-meta">
                  <span className="stream-time">Iniciado {formatTime(stream.startedAt)}</span>
                </div>
                
                <button
                  className="btn-join-stream"
                  onClick={() => joinStream(stream.id)}
                >
                  Assistir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para criar stream */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Criar Nova Stream</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateStream} className="modal-form">
              <div className="form-group">
                <label htmlFor="title">Título da Stream</label>
                <input
                  type="text"
                  id="title"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Descrição</label>
                <textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={3}
                  maxLength={1000}
                />
              </div>
              
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreamList;