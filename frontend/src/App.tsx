import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Friends from './pages/Friends'
import Groups from './pages/Groups'
import FriendDetail from './pages/FriendDetail'
import GroupDetail from './pages/GroupDetail'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Header from './components/Header'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import PublicRoute from './components/PublicRoute'

export default function App(){
  return (
    <div>
      <AuthProvider>
        <Header />
        <div className="page">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/friends" element={<PrivateRoute><Friends /></PrivateRoute>} />
            <Route path="/friends/:id" element={<PrivateRoute><FriendDetail /></PrivateRoute>} />
            <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
            <Route path="/groups/:id" element={<PrivateRoute><GroupDetail /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          </Routes>
        </div>
      </AuthProvider>
    </div>
  )
}
