/**
 * 🧬 PLUGIN: RENGA DEV LOADER v1.0.0
 * Context: Universal Floating Dev Tools
 * Adapted from: Unified Dev Mode v1.4.1 (Legacy)
 */

(function () {
    const version = '1.0.0-RENGA-BLITZ';
    console.log(`[DEV] Renga Dev Mode v${version} Initiated`);

    // Cleanup old instances
    const kill = () => {
        const old = document.getElementById('renga-dev-menu');
        if (old) old.remove();
    };
    kill();

    // Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        #renga-dev-menu { position: fixed; bottom: 30px; right: 30px; z-index: 99999999 !important; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; font-family: 'Outfit', sans-serif; }
        .dev-tray { display: none; flex-direction: column; gap: 8px; margin-bottom: 12px; background: #161616; padding: 20px; border-radius: 12px; border: 1px solid #FFCC00; box-shadow: 0 10px 40px rgba(0,0,0,0.9); width: 280px; box-sizing: border-box; }
        .dev-label { font-size: 10px; font-weight: 800; color: #8d8d8d; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; margin-top: 10px; }
        .dev-label:first-child { margin-top: 0; }
        
        .dev-btn { background: #262626; color: #f4f4f4; border: 1px solid #393939; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: 0.2s; width: 100%; box-sizing: border-box; text-decoration: none; justify-content: flex-start; }
        .dev-btn:hover { background: #393939; border-color: #FFCC00; color: #FFCC00; }
        .dev-btn i { width: 20px; text-align: center; }

        .dev-main-btn { background: #FFCC00; color: #161616; border: none; width: 56px; height: 56px; border-radius: 50%; cursor: pointer; box-shadow: 0 0 20px rgba(255, 204, 0, 0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .dev-main-btn:hover { transform: scale(1.1) rotate(90deg); }
    `;
    document.head.appendChild(style);

    // Create Container
    const container = document.createElement('div');
    container.id = 'renga-dev-menu';

    // Create Tray
    const tray = document.createElement('div');
    tray.className = 'dev-tray';

    // Section 1: Navigation
    const label1 = document.createElement('div'); label1.className = 'dev-label'; label1.innerText = 'BLITZ NAVIGATION';
    tray.appendChild(label1);

    const links = [
        { t: '🏠 HOME PAGE', u: '/' },
        { t: '📊 ADMIN DASHBOARD', u: '/dashboard.html' },
        { t: '🏆 SPONSOR PAGE', u: '/sponsor.html' }
    ];

    links.forEach(l => {
        const b = document.createElement('button');
        b.className = 'dev-btn';
        b.innerHTML = `<span>${l.t}</span>`;
        b.onclick = () => window.location.href = l.u;
        tray.appendChild(b);
    });

    // Section 2: Utilities
    const label2 = document.createElement('div'); label2.className = 'dev-label'; label2.innerText = 'DEBUG TOOLS';
    tray.appendChild(label2);

    const utils = [
        { t: '💾 CLEAR LOCAL STORAGE', action: () => { localStorage.clear(); alert('Storage Cleared'); location.reload(); } },
        { t: '🧬 INSPECT DNA (LOG)', action: () => { console.log('[DNA] Current Page State:', window.location); alert('DNA Logged to Console'); } }
    ];

    utils.forEach(u => {
        const b = document.createElement('button');
        b.className = 'dev-btn';
        b.innerHTML = `<span>${u.t}</span>`;
        b.onclick = u.action;
        tray.appendChild(b);
    });

    // Main Trigger Button
    const trigger = document.createElement('button');
    trigger.className = 'dev-main-btn';
    trigger.innerHTML = '⚙️'; // Gear Icon
    trigger.onclick = () => {
        const isOpening = tray.style.display === 'none' || !tray.style.display;
        tray.style.display = isOpening ? 'flex' : 'none';
        trigger.innerHTML = isOpening ? '✖️' : '⚙️';
    };

    container.appendChild(tray);
    container.appendChild(trigger);
    document.body.appendChild(container);

    // Global Ctrl+Click Inspector (Universal Copy Engine)
    document.addEventListener('click', (e) => {
        // Se menu aperto e clicco fuori, non fare nulla di speciale a meno che non sia ctrl+click
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            const target = e.target;
            // Risali al genitore se clicco su uno span/icona dentro un bottone
            const element = target.closest('button, a, div.card, section') || target;
            const code = element.outerHTML;

            console.group('🧬 UNIVERSAL INSPECTOR HIT');
            console.log('Target:', element);
            console.log('Code:', code);
            console.groupEnd();

            // Visual feedback
            const originalOutline = element.style.outline;
            element.style.outline = '4px solid #FFCC00';
            element.style.boxShadow = '0 0 20px #FFCC00';

            // Copy to clipboard
            navigator.clipboard.writeText(code).then(() => {
                setTimeout(() => {
                    element.style.outline = originalOutline;
                    element.style.boxShadow = '';
                    alert(`🧬 CODICE COPIATO NEGLI APPUNTI!\n\nElemento: <${element.tagName.toLowerCase()} class="${element.className}">\n\nIncolla pure dove vuoi.`);
                }, 200);
            }).catch(err => {
                console.error('Clipboard failed', err);
                alert('Errore copia clipboard. Guarda la console.');
            });
        }
    }, true); // Capture phase

    console.log('[DEV] Ctrl+Click Inspector Attached Globally');

})();
