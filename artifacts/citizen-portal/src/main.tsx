import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

setBaseUrl(
	import.meta.env.VITE_API_BASE_URL?.trim() ||
		(import.meta.env.DEV ? 'http://localhost:5000' : null),
);

createRoot(document.getElementById('root')!).render(<App />);
