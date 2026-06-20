import { useState, useEffect } from 'react';
import { RestaurantHome } from './pages/RestaurantHome';
import { OwnerDashboard } from './pages/OwnerDashboard';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const navigateToCms = () => {
    window.location.hash = '#/admin';
  };

  const navigateToHome = () => {
    window.location.hash = '';
  };

  const isCms = currentPath === '#/admin';

  return (
    <>
      {isCms ? (
        <OwnerDashboard onBackToHome={navigateToHome} />
      ) : (
        <RestaurantHome onNavigateToCms={navigateToCms} />
      )}
    </>
  );
}

export default App;
