import React, { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');
    if (storedAdmin) {
      setAdminUser(JSON.parse(storedAdmin));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAdminLogin = (adminData) => {
    localStorage.setItem('adminUser', JSON.stringify(adminData));
    setAdminUser(adminData);
  };

  const handleLogout = async () => {
    if (adminUser) {
      localStorage.removeItem('adminUser');
      setAdminUser(null);
    } else {
      // Import logout from firebase.js if not already imported, but App.jsx doesn't import it.
      // Wait, we can let Dashboard handle it, or pass handleLogout.
      // Better to pass handleLogout to Dashboard so it's unified.
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <>
      {adminUser ? (
        <Dashboard user={adminUser} onAdminLogout={handleLogout} />
      ) : user ? (
        <Dashboard user={user} />
      ) : (
        <Login onAdminLogin={handleAdminLogin} />
      )}
    </>
  );
}

export default App;
