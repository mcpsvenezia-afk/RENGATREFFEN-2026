/**
 * 🧬 PLUGIN: RENGA DEV LOADER v1.1.1
 * Context: Universal Floating Dev Tools
 */

(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const forceOn = urlParams.get('dev') === 'true';
    const forceOff = urlParams.get('dev') === 'false';
    const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';

    if (forceOn) {
        localStorage.setItem('RENGATREFFEN_DEV_MODE', 'true');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (forceOff) {
        localStorage.removeItem('RENGATREFFEN_DEV_MODE');
        return;
    } else if (!isStored) {
        return;
    }

    const version = '1.1.1-CLEAN-POPUPS';
    console.log(`[DEV] Renga Dev Mode v${version} ACTIVE`);

    const kill = () => {
        const old = document.getElementById('renga-dev-menu');
        if (old) old.remove();
    };
    kill();

    const style = document.createElement('style');
    style.innerHTML = `
        #renga-dev-menu { position: fixed; bottom: 30px; right: 30px; z-index: 99999999 !important; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; font-family: 'Outfit', sans-serif; }
        .dev-tray { display: none; flex-direction: column; gap: 8px; margin-bottom: 12px; background: #161616; padding: 20px; border-radius: 12px; border: 1px solid #FFCC00; box-shadow: 0 10px 40px rgba(0,0,0,0.9); width: 280px; box-sizing: border-box; }
        .dev-label { font-size: 10px; font-weight: 800; color: #8d8d8d; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; margin-top: 10px; }
        .dev-label:first-child { margin-top: 0; }
        .dev-btn { background: #262626; color: #f4f4f4; border: 1px solid #393939; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: 0.2s; width: 100%; box-sizing: border-box; text-decoration: none; justify-content: flex-start; }
        .dev-btn:hover { background: #393939; border-color: #FFCC00; color: #FFCC00; }
        .dev-main-btn { background: #FFCC00; color: #161616; border: none; width: 56px; height: 56px; border-radius: 50%; cursor: pointer; box-shadow: 0 0 20px rgba(255, 204, 0, 0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .dev-main-btn:hover { transform: scale(1.1) rotate(90deg); }
    `;
    document.head.appendChild(style);

    const container = document.createElement('div');
    container.id = 'renga-dev-menu';

    const tray = document.createElement('div');
    tray.className = 'dev-tray';

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

    const label2 = document.createElement('div'); label2.className = 'dev-label'; label2.innerText = 'DEBUG TOOLS';
    tray.appendChild(label2);

    const utils = [
        { t: '💾 CLEAR LOCAL STORAGE', action: () => { localStorage.clear(); location.reload(); } },
        { t: '🔴 EXIT DEV MODE', action: () => { localStorage.removeItem('RENGATREFFEN_DEV_MODE'); location.reload(); } }
    ];

    utils.forEach(u => {
        const b = document.createElement('button');
        b.className = 'dev-btn';
        b.innerHTML = `<span>${u.t}</span>`;
        b.onclick = u.action;
        tray.appendChild(b);
    });

    const trigger = document.createElement('button');
    trigger.className = 'dev-main-btn';
    trigger.innerHTML = '⚙️';
    trigger.onclick = () => {
        const isOpening = tray.style.display === 'none' || !tray.style.display;
        tray.style.display = isOpening ? 'flex' : 'none';
        trigger.innerHTML = isOpening ? '✖️' : '⚙️';
    };

    container.appendChild(tray);
    container.appendChild(trigger);
    document.body.appendChild(container);

    // Global Ctrl+Click Inspector
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            const target = e.target;
            const element = target.closest('button, a, div.card, section') || target;
            const code = element.outerHTML;

            const originalOutline = element.style.outline;
            element.style.outline = '4px solid #FFCC00';
            element.style.boxShadow = '0 0 20px #FFCC00';

            navigator.clipboard.writeText(code).then(() => {
                if (window.Swal) {
                    window.Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: '🧬 DNA COPIATO',
                        showConfirmButton: false,
                        timer: 2000,
                        background: '#1a1a1f',
                        color: '#FFCC00'
                    });
                }
                setTimeout(() => {
                    element.style.outline = originalOutline;
                    element.style.boxShadow = '';
                }, 1000);
            }).catch(err => console.error('Clipboard error', err));
        }
    }, true);

})();
