import { useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

export function AuthTokenSetup() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      // Set up the auth token getter for API requests
      setAuthTokenGetter(async () => {
        if (!isSignedIn) return null;
        try {
          // For development with test keys, we might not have access to a template
          // Try to get the session token, otherwise return null to trigger dev bypass
          const token = await getToken().catch(() => null);
          return token;
        } catch (error) {
          console.warn('Auth token not available:', error);
          return null;
        }
      });
    }
  }, [isLoaded, isSignedIn, getToken]);

  return null; // This component doesn't render anything
}
