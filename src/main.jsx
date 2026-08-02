import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootNode = document.getElementById('root');
const root = window.__kharchaRoot || createRoot(rootNode);
window.__kharchaRoot = root;
root.render(<App />);
