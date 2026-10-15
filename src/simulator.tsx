import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
createRoot(document.getElementById('root')!).render(<><div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:9999,background:'#70251d',textAlign:'center',padding:6}}>Legacy v2 simulator — local testing only. Uses older rules. Run npm run dev for the v3 LAN room.</div><App/></>);
