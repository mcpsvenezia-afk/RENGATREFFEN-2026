/**
 * 🧬 MOUNT: Public Dynamic Team List
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { PublicTeamList } from './components/comp-public-teams';

const container = document.getElementById('dynamic-teams-root');
if (container) {
    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <PublicTeamList />
        </React.StrictMode>
    );
    console.log('--- 🏆 DYNAMIC TEAM LIST MOUNTED ---');
}
