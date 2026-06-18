import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0F1C23] z-[9999] flex flex-col items-center justify-center text-white">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-[#A3E635] mb-4"></i>
        <p className="text-sm font-mono tracking-widest text-gray-400">VERIFYING CLEARANCE...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
