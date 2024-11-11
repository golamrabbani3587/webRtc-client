import React, { useEffect, useCallback, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import '../Room.css';

const RoomPage = () => {
  const { roomId } = useParams();
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isCalling, setIsCalling] = useState(false); // State to track if the call is ongoing
  const navigate = useNavigate();
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storeToken = localStorage.getItem('token')  
    if(!storeToken && !storedUser){
      navigate('/login');
    }
  }, []);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
    setIsCalling(true); // Set the call as ongoing
  }, [remoteSocketId, socket]);

  // const handleEndCall = useCallback(() => {
  //   socket.emit("call:end", { to: remoteSocketId });
  //   setIsCalling(false); // Set the call as ended
  //   setMyStream(null); // Stop the stream
  //   setRemoteStream(null); // Stop the remote stream

  //   // Disconnect socket after the call ends
  //   socket.disconnect();
  //   console.log("Socket disconnected");
  // }, [remoteSocketId, socket]);

  const handleEndCall = useCallback(() => {
    // Stop all tracks of the local stream
    if (myStream) {
      myStream.getTracks().forEach(track => track.stop());
    }
    // Reset streams and call state
    setMyStream(null);
    setRemoteStream(null);
    // setIsCallStarted(false);
    socket.disconnect(); // Disconnect from the socket
    navigate("/room-management"); // Navigate to room-management page
  }, [myStream, socket, navigate]);


  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call from ${from}`, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (!myStream) return;
  
    const senders = peer.peer.getSenders();
    for (const track of myStream.getTracks()) {
      const existingSender = senders.find(sender => sender.track === track);
      
      if (!existingSender) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      socket.emit("chat:message", { message: newMessage });
      setMessages([...messages, { text: newMessage, sender: "me" }]);
      setNewMessage("");
    }
  };

  const handleReceiveMessage = useCallback(({ message }) => {
    setMessages((prevMessages) => [...prevMessages, { text: message, sender: "other" }]);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("chat:message", handleReceiveMessage);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("chat:message", handleReceiveMessage);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handleReceiveMessage,
  ]);

  return (
    <div className="row">
      <div className="video-container">
        <h1>{roomId}</h1>
        <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
        {myStream && <button onClick={sendStreams}>Send Stream</button>}
        <button onClick={isCalling ? handleEndCall : handleCallUser}>
          {isCalling ? "End" : "Call"}
        </button>

        <div className="stream-container">
          {myStream && (
            <div className="stream">
              <h1>My Stream</h1>
              <ReactPlayer playing muted height="100%" width="100%" url={myStream} />
            </div>
          )}

          {remoteStream && (
            <div className="stream">
              <h1>Remote Stream</h1>
              <ReactPlayer playing muted height="100%" width="100%" url={remoteStream} />
            </div>
          )}
        </div>
      </div>
      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender === "me" ? "right" : "left"}`}>
            {msg.text}
          </div>
        ))}
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type a message..."
            className="input-field"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button className="send-btn" onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
