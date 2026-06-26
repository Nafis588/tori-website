import { useState, useEffect } from 'react';
import { RestaurantHome } from './pages/RestaurantHome';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { preloadDefaultHash } from './utils/db';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.hash);

  useEffect(() => {
    // Preload default admin hash from server if not cached
    preloadDefaultHash();

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
