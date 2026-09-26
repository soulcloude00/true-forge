import React from 'react';
import {createRoot} from 'react-dom/client';
import {NimbusApp} from './web/Nimbus.tsx';
import './web/style.css';
createRoot(document.getElementById('root')!).render(<NimbusApp/>);
