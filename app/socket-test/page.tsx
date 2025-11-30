'use client';

import { useEffect, useState, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

export default function SocketTestPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const opts: any = {
      transports: ['websocket', 'polling'],
      reconnection: true,
    };
    const socket = socketUrl ? io(socketUrl, opts) : io(opts);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to Socket.io server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from Socket.io server');
    });

    socket.on('message', (data) => {
      setResponse(data);
      console.log('Received from server:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (isConnected && socketRef.current) {
      socketRef.current.emit('message', message);
      setMessage('');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950">
      <h1 className="text-3xl font-bold mb-4">Socket.io Test</h1>
      <p className="mb-2">Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message"
        className="p-2 border border-gray-300 rounded mb-2"
      />
      <button
        onClick={sendMessage}
        disabled={!isConnected}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Send Message
      </button>
      {response && <p className="mt-4">Server Response: {response}</p>}
    </div>
  );
}