import { Routes, Route } from "react-router-dom";
import "./App.css";
import RoomPage from "./screens/Room";
import Auth from "./screens/Auth";
import RoomManagement from "./screens/RoomManagement";

function App() {
  return (
    <div className="App">
      <Routes>
      <Route path="/" element={<Auth type="login" />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
        <Route path="/room-management" element={<RoomManagement />} />
        <Route path="/login" element={<Auth type="login" />} />
        <Route path="/signup" element={<Auth type="signup" />} />
      </Routes>
    </div>
  );
}

export default App;
