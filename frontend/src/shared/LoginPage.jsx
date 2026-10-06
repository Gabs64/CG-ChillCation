import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLoginModal from './AdminLoginModal';

export default function LoginPage({ onLoginSuccess, currentUser, isLoadingAuth }) {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      if (currentUser.role === 'OWNER') {
        navigate('/owner', { replace: true });
      } else {
        navigate('/staff', { replace: true });
      }
    }
  }, [currentUser, isLoadingAuth, navigate]);

  const handleSuccess = (user, token) => {
    onLoginSuccess(user, token);
    if (user.role === 'OWNER') {
      navigate('/owner', { replace: true });
    } else {
      navigate('/staff', { replace: true });
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
