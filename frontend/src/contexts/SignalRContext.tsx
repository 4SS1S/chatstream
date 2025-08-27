import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

interface SignalRContextType {
  connection: HubConnection | null;
  connectionState: string;
}

const SignalRContext = createContext<SignalRContextType | undefined>(undefined);

export const useSignalR = () => {
  const context = useContext(SignalRContext);
  if (context === undefined) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
};

interface SignalRProviderProps {
  children: ReactNode;
  token: string;
}

export const SignalRProvider: React.FC<SignalRProviderProps> = ({ children, token }) => {
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [connectionState, setConnectionState] = useState<string>('Disconnected');

  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl('http://localhost:5000/chatHub', {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(newConnection);

    newConnection.start()
      .then(() => {
        console.log('SignalR Connected');
        setConnectionState('Connected');
      })
      .catch(err => {
        console.log('SignalR Connection Error: ', err);
        setConnectionState('Failed');
      });

    newConnection.onreconnecting(() => {
      setConnectionState('Reconnecting');
    });

    newConnection.onreconnected(() => {
      setConnectionState('Connected');
    });

    newConnection.onclose(() => {
      setConnectionState('Disconnected');
    });

    return () => {
      newConnection.stop();
    };
  }, [token]);

  const value = {
    connection,
    connectionState
  };

  return (
    <SignalRContext.Provider value={value}>
      {children}
    </SignalRContext.Provider>
  );
};