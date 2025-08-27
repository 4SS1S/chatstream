import React, { useState, useEffect, useRef } from 'react';
import { useSignalR } from '../contexts/SignalRContext';
import './Chat.css';

interface User {
  id: string;
  displayName: string;
  isGuest?: boolean;
}

interface Message {
  id: number;
  content: string;
  senderName: string;
  senderId: string;
  sentAt: string;
  isGuest: boolean;
}

interface ChatProps {
  user: User | null;
}

const Chat: React.FC<ChatProps> = ({ user }) => {
  const { connection } = useSignalR();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState('General');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (connection) {
      // Entrar na sala padrão
      connection.invoke('JoinRoom', currentRoom);

      // Configurar event listeners
      connection.on('ReceiveMessage', (message: Message) => {
        setMessages(prev => [...prev, message]);
      });

      connection.on('MessageHistory', (history: Message[]) => {
        setMessages(history);
      });

      connection.on('UserJoined', (userName: string, roomName: string) => {
        if (roomName === currentRoom) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: `${userName} entrou na sala`,
            senderName: 'Sistema',
            senderId: 'system',
            sentAt: new Date().toISOString(),
            isGuest: false
          }]);
        }
      });

      connection.on('UserLeft', (userName: string, roomName: string) => {
        if (roomName === currentRoom) {
          setMessages(prev => [...prev, {
            id: Date.now(),
            content: `${userName} saiu da sala`,
            senderName: 'Sistema',
            senderId: 'system',
            sentAt: new Date().toISOString(),
            isGuest: false
          }]);
        }
      });

      connection.on('UserConnected', (userName: string) => {
        setOnlineUsers(prev => [...prev, userName]);
      });

      connection.on('UserDisconnected', (userName: string) => {
        setOnlineUsers(prev => prev.filter(u => u !== userName));
      });

      return () => {
        connection.off('ReceiveMessage');
        connection.off('MessageHistory');
        connection.off('UserJoined');
        connection.off('UserLeft');
        connection.off('UserConnected');
        connection.off('UserDisconnected');
      };
    }
  }, [connection, currentRoom]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && connection && user) {
      try {
        await connection.invoke('SendMessage', currentRoom, messageInput.trim());
        setMessageInput('');
      } catch (err) {
        console.error('Error sending message:', err);
      }
    }
  };

  const changeRoom = async (roomName: string) => {
    if (connection && roomName !== currentRoom) {
      await connection.invoke('LeaveRoom', currentRoom);
      await connection.invoke('JoinRoom', roomName);
      setCurrentRoom(roomName);
      setMessages([]);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="rooms-section">
          <h3>Salas</h3>
          <div className="room-list">
            {['General', 'Tech', 'Gaming', 'Random'].map(room => (
              <button
                key={room}
                className={`room-button ${currentRoom === room ? 'active' : ''}`}
                onClick={() => changeRoom(room)}
              >
                #{room}
              </button>
            ))}
          </div>
        </div>

        <div className="users-section">
          <h3>Online ({onlineUsers.length})</h3>
          <div className="user-list">
            {onlineUsers.map((userName, index) => (
              <div key={index} className="user-item">
                <div className="user-status online"></div>
                <span>{userName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-header">
          <h2>#{currentRoom}</h2>
          <div className="connection-status">
            Status: Conectado
          </div>
        </div>

        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.senderId === user?.id ? 'own-message' : ''} ${message.senderId === 'system' ? 'system-message' : ''}`}
            >
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
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-form">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder={`Enviar mensagem para #${currentRoom}`}
            className="message-input"
            maxLength={2000}
          />
          <button type="submit" className="send-button" disabled={!messageInput.trim()}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;