import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Auth.css';

const Auth = ({ type }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    const apiUrl = type === 'login'
      ? 'https://webrtc-server-7vrh.onrender.com/api/auth/login'
      : 'https://webrtc-server-7vrh.onrender.com/api/auth/signup';
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
  
      if (response.ok) {
        if (type === 'login' && data.message === 'success') {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.userDetails));
          navigate('/room-management');
        } else if (type === 'signup' && data.message === 'User registered successfully') {
          navigate('/login');
        }
      } else {
        setError(data.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  const handleSwitchAuth = () => {
    // Toggle between login and signup pages
    if (type === 'login') {
      navigate('/signup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit}>
        <h2>{type === 'login' ? 'Login' : 'Sign Up'}</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">{type === 'login' ? 'Login' : 'Sign Up'}</button>
        <button type="button" className="switch-auth-button" onClick={handleSwitchAuth}>
          {type === 'login' ? 'Go to Sign Up' : 'Go to Login'}
        </button>
      </form>
    </div>
  );
};

export default Auth;
