import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLoginModal from './AdminLoginModal';

export default function LoginPage({ onLoginSuccess, currentUser }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'OWNER') {
        navigate('/owner');
      } else {
        navigate('/staff');
      }
    }
  }, [currentUser, navigate]);

  const handleSuccess = (user, token) => {
    onLoginSuccess(user, token);
    if (user.role === 'OWNER') {
      navigate('/owner');
    } else {
      navigate('/staff');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4">
      <AdminLoginModal
        onClose={() => navigate('/')}
        onLoginSuccess={handleSuccess}
      />
    </div>
  );
}
