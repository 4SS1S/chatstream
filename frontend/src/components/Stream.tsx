import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSignalR } from '../contexts/SignalRContext';
import { streamApi } from '../services/api';
import './Stream.css';

interface User {
  id: string;
  displayName: string;
  isGuest?: boolean;
}

interface StreamProps {
  user: User | null;
}

interface StreamInfo {
  id: number;
  title: string;
  description: string;
  streamerName: string;
  streamerId: string;
  status: string;
  startedAt: string;
  viewerCount: number;
}

interface ChatMessage {
  streamId: number;
  content: string;
  senderName: string;
  senderId: string;
  sentAt: string;
  isGuest: boolean;
}

const Stream: React.FC<StreamProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { connection } = useSignalR();
  
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isStreamer, setIsStreamer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!id) return;
    
    loadStreamInfo();
    
    if (connection) {
      // Entrar como viewer
      connection.invoke('JoinStreamViewer', parseInt(id));
      
      // Event listeners
      connection.on('StreamChatMessage', (message: ChatMessage) => {
        setChatMessages(prev => [...prev, message]);
      });
      
      connection.on('ViewerCountUpdated', (streamId: number, count: number) => {
        if (streamId === parseInt(id)) {
          setStreamInfo(prev => prev ? { ...prev, viewerCount: count } : null);
        }
      });
      
      connection.on('StreamEnded', (streamId: number) => {
        if (streamId === parseInt(id)) {
          alert('A stream foi encerrada');
          navigate('/');
        }
      });

      // WebRTC signaling
      connection.on('ReceiveOffer', handleReceiveOffer);
      connection.on('ReceiveAnswer', handleReceiveAnswer);
      connection.on('ReceiveIceCandidate', handleReceiveIceCandidate);
    }

    return () => {
      if (connection) {
        connection.invoke('LeaveStreamViewer', parseInt(id));
        connection.off('StreamChatMessage');
        connection.off('ViewerCountUpdated');
        connection.off('StreamEnded');
        connection.off('ReceiveOffer');
        connection.off('ReceiveAnswer');
        connection.off('ReceiveIceCandidate');
      }
      
      // Cleanup WebRTC
      if (peerConnection.current) {
        peerConnection.current.close();
      }
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [id, connection, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadStreamInfo = async () => {
    if (!id) return;
    
    try {
      const response = await streamApi.getStream(parseInt(id));
      const stream = response.data;
      setStreamInfo(stream);
      setIsStreamer(user?.id === stream.streamerId);
    } catch (error) {
      setError('Stream não encontrada');
      console.error('Error loading stream:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWebRTC = async () => {
    try {
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      });

      // Se é o streamer, configurar transmissão
      if (isStreamer) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStream.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        stream.getTracks().forEach(track => {
          peerConnection.current?.addTrack(track, stream);
        });

        // Criar oferta para viewers
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        
        if (connection) {
          connection.invoke('SendOffer', id, offer);
        }
      }

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate && connection) {
          connection.invoke('SendIceCandidate', 'broadcast', event.candidate);
        }
      };

      peerConnection.current.ontrack = (event) => {
        if (videoRef.current && !isStreamer) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
    }
  };

  const handleReceiveOffer = async (connectionId: string, offer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current || isStreamer) return;
    
    try {
      await peerConnection.current.setRemoteDescription(offer);
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      
      if (connection) {
        connection.invoke('SendAnswer', connectionId, answer);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleReceiveAnswer = async (connectionId: string, answer: RTCSessionDescriptionInit) => {
    if (!peerConnection.current || !isStreamer) return;
    
    try {
      await peerConnection.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleReceiveIceCandidate = async (connectionId: string, candidate: RTCIceCandidateInit) => {
    if (!peerConnection.current) return;
    
    try {
      await peerConnection.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const startStreaming = async () => {
    await initializeWebRTC();
  };

  const endStream = async () => {
    if (!streamInfo || !isStreamer) return;
    
    try {
      await streamApi.endStream(streamInfo.id);
      if (connection) {
        await connection.invoke('EndStream', streamInfo.id);
      }
      navigate('/');
    } catch (error) {
      console.error('Error ending stream:', error);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !connection || !user || !id) return;
    
    try {
      await connection.invoke('SendStreamChat', parseInt(id), chatInput.trim());
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="stream-loading">Carregando stream...</div>;
  }

  if (error || !streamInfo) {
    return (
      <div className="stream-error">
        <h2>Erro</h2>
        <p>{error || 'Stream não encontrada'}</p>
        <button onClick={() => navigate('/')}>Voltar</button>
      </div>
    );
  }

  return (
    <div className="stream-container">
      <div className="stream-main">
        <div className="stream-header">
          <button className="back-button" onClick={() => navigate('/')}>
            ← Voltar
          </button>
          <h1>{streamInfo.title}</h1>
          <div className="stream-stats">
            👁 {streamInfo.viewerCount} viewers
          </div>
        </div>

        <div className="video-container">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isStreamer}
            controls={!isStreamer}
            className="stream-video"
          />
          
          {isStreamer && (
            <div className="streamer-controls">
              <button className="btn-start-stream" onClick={startStreaming}>
                Iniciar Transmissão
              </button>
              <button className="btn-end-stream" onClick={endStream}>
                Encerrar Stream
              </button>
            </div>
          )}
        </div>

        <div className="stream-info">
          <h2>{streamInfo.title}</h2>
          <p className="streamer-name">por {streamInfo.streamerName}</p>
          <p className="stream-description">{streamInfo.description}</p>
        </div>
      </div>

      <div className="stream-chat">
        <div className="chat-header">
          <h3>Chat da Stream</h3>
        </div>

        <div className="chat-messages">
          {chatMessages.map((message, index) => (
            <div key={index} className="chat-message">
              <div className="message-header">
                <span className={`username ${message.isGuest ? 'guest' : ''}`}>
                  {message.senderName}
                  {message.isGuest && <span className="guest-badge">Convidado</span>}
                </span>
                <span className="timestamp">{formatTime(message.sentAt)}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={sendChatMessage} className="chat-form">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="chat-input"
            maxLength={500}
          />
          <button type="submit" className="send-button" disabled={!chatInput.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Stream;