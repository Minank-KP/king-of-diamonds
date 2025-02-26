import { useState } from 'react';

interface LobbyProps {
  playerName: string;
  roomId: string | null;
  message: string;
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
}

const Lobby = ({ playerName: initialPlayerName, roomId, message, onCreateRoom, onJoinRoom }: LobbyProps) => {
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [activeTab, setActiveTab] = useState('create');

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      onCreateRoom(playerName);
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomIdInput.trim()) {
      onJoinRoom(roomIdInput, playerName);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">High Stakes War</h1>
      
      <div className="mb-6">
        <div className="flex">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'create' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'} rounded-l-lg`}
            onClick={() => setActiveTab('create')}
          >
            Create Game
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'join' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'} rounded-r-lg`}
            onClick={() => setActiveTab('join')}
          >
            Join Game
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="playerName">
          Your Name
        </label>
        <input
          id="playerName"
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      {activeTab === 'join' && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomId">
            Room Code
          </label>
          <input
            id="roomId"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
            placeholder="Enter room code"
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {activeTab === 'create' ? (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            onClick={handleCreateRoom}
          >
            Create Room
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            onClick={handleJoinRoom}
          >
            Join Room
          </button>
        )}
      </div>

      {roomId && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p className="text-sm text-gray-700">Room Code: <span className="font-bold">{roomId}</span></p>
          <p className="text-xs text-gray-500 mt-1">Share this code with your opponent</p>
        </div>
      )}

      {message && (
        <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default Lobby; 