import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketProvider';
import '../RoomManagement.css';

const RoomManagement = () => {
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

  const socket = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storeToken = localStorage.getItem('token')  
    if (storedUser && storeToken ) {
      const user = JSON.parse(storedUser);
      setEmail(user.email); 
    }
    else{
      navigate('/login');
    }
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5550/api/rooms', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError('Could not fetch rooms. Please try again later.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
  
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5550/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });
  
      if (response.ok) {
        fetchRooms(); 
        setTitle('');
        setDescription('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create room. Try again.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  const handleJoinRoom = useCallback((data) => {
    const { room } = data;
    navigate(`/room/${room}`);
  }, [navigate]);

  const joinRoomFromList = (roomTitle) => {
    if (email) {
      socket.emit('room:join', { email, room: roomTitle });
    } else {
      setError('Email is required to join a room');
    }
  };

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join', handleJoinRoom);
    };
  }, [socket, handleJoinRoom]);

  return (
    <div className="room-container">
      <h2>Create a Room</h2>
      <form onSubmit={handleCreateRoom}>
        <input
          type="text"
          placeholder="Room Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Room Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        ></textarea>
        {error && <p className="error">{error}</p>}
        <button type="submit">Create Room</button>
      </form>
      
      <h2>Rooms</h2>
      <div className="room-list">
        {rooms.map((room) => (
          <div key={room._id} className="room-item" onClick={() => joinRoomFromList(room.title)}>
            <h3>{room.title}</h3>
            <p>{room.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomManagement;
