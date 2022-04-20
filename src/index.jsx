import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBw45n_EfBKMYn_hFeLVyHE94OiIpOI_IM",
  authDomain: "ss-chatroom-d0987.firebaseapp.com",
  projectId: "ss-chatroom-d0987",
  storageBucket: "ss-chatroom-d0987.appspot.com",
  messagingSenderId: "630977914470",
  appId: "1:630977914470:web:c6ca9e88a2b5a0ed622fa7",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./styles/index.css";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login auth={auth} />} />
        <Route path="/chatroom" element={<Home />} />
        <Route path="/register" element={<Register auth={auth} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const container = document.getElementById("root");
const root = createRoot(container);

root.render(<App />);
