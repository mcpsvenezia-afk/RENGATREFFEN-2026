/**
 * 🧬 PLUGIN: RENGA ATOMIC INSPECTOR v1.4.0
 * Goal: Surgical precision, no-clash highlights, and deep element detection.
 */

(function () {
    const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
    if (!isStored) return;

    const version = "1.4.0-ATOMIC";
    console.log(`[DEV] Renga Atomic Inspector v${version} ACTIVE`);

    // 1. SURGICAL STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        #renga-inspector-overlay {
            position: fixed;
            pointer-events: none;
            border: 1px solid #FFCC00;
            background: rgba(255, 204, 0, 0.08);
            z-index: 2147483647;
            display: none;
            box-shadow: 0 0 10px rgba(255, 204, 0, 0.3);
            transition: none; /* Instant movement for micro-precision */
        }
        #renga-inspector-label {
            position: absolute;
            bottom: 100%;
            left: 0;
            background: #FFCC00;
            color: #000;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 900;
            white-space: nowrap;
            border-radius: 4px 4px 0 0;
            text-transform: uppercase;
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .comp-tag { background: #000; color: #FFCC00; padding: 0px 4px; border-radius: 2px; font-size: 8px; }
        
        .renga-supra-toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FFCC00;
            color: #000;
            padding: 15px 30px;
            border-radius: 12px;
            font-weight: 900;
            z-index: 2147483647;
            box-shadow: 0 20px 50px rgba(0,0,0,0.8);
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            border-left: 5px solid #000;
            animation: supraSlideIn 0.3s ease-out forwards;
        }

        @keyframes supraSlideIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        #renga-dev-menu { position: fixed; bottom: 30px; right: 30px; z-index: 2147483646; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
        .dev-tray { display: none; flex-direction: column; gap: 8px; margin-bottom: 15px; background: #0c0c0e; padding: 25px; border-radius: 20px; border: 1px solid #FFCC00; box-shadow: 0 30px 80px rgba(0,0,0,1); width: 280px; box-sizing: border-box; }
        .dev-label { font-size: 10px; font-weight: 900; color: #444; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 15px; margin-bottom: 5px; }
        .dev-btn { background: #161616; color: #eee; border: 1px solid #222; padding: 12px; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 700; width: 100%; text-align: left; }
        .dev-btn:hover { background: #222; border-color: #FFCC00; color: #FFCC00; }
        .dev-main-btn { background: #FFCC00; color: #000; border: none; width: 56px; height: 56px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 10px 30px rgba(255, 204, 0, 0.3); }
    `;
    document.head.appendChild(style);

    // 2. DOM INFRA
    const overlay = document.createElement('div');
    overlay.id = 'renga-inspector-overlay';
    const label = document.createElement('div');
    label.id = 'renga-inspector-label';
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // 3. ATOMIC SELECTOR (Deepest node logic)
    let lastAtomicElement = null;

    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            return;
        }

        // Get the actual small element under mouth (not just the big container)
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === overlay || target === label) return;

        // Surgical Element: focus on the small target unless it's a huge container
        const isHuge = target.tagName === 'SECTION' || target.tagName === 'BODY' || target.tagName === 'MAIN';
        const element = isHuge ? target : target;

        const componentParent = element.closest('[data-component]');
        const componentName = componentParent ? componentParent.getAttribute('data-component') : "HTML";

        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        const tagName = element.tagName.toLowerCase();
        const firstClass = element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : '';
        label.innerHTML = `<span>${tagName}${firstClass}</span> <span class="comp-tag">${componentName}</span>`;

        lastAtomicElement = element;
    });

    // 4. DNA CLICK
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!lastAtomicElement) return;

            const html = lastAtomicElement.outerHTML;
            navigator.clipboard.writeText(html).then(() => {
                const t = document.createElement('div');
                t.className = 'renga-supra-toast';
                t.innerHTML = `🧬 DNA COPIATO<br><small>${lastAtomicElement.tagName}</small>`;
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 2000);

                // Visual Sparkle
                lastAtomicElement.style.outline = "2px solid #FFCC00";
                setTimeout(() => lastAtomicElement.style.outline = "", 300);
            });
        }
    }, true);

    // 5. TRAY UI
    const container = document.createElement('div');
    container.id = 'renga-dev-menu';
    const tray = document.createElement('div');
    tray.className = 'dev-tray';

    const menu = [
        { t: 'DASHBOARD', act: () => location.href = '/dashboard.html' },
        { t: 'HOME PAGE', act: () => location.href = '/' },
        { t: 'TEAM LIST', act: () => location.href = '/team.html' },
        { t: '🔴 EXIT DEV', act: () => { localStorage.removeItem('RENGATREFFEN_DEV_MODE'); location.reload(); } }
    ];

    menu.forEach(m => {
        const b = document.createElement('button');
        b.className = 'dev-btn';
        b.innerText = m.t;
        b.onclick = m.act;
        tray.appendChild(b);
    });

    const fab = document.createElement('button');
    fab.className = 'dev-main-btn';
    fab.innerHTML = '⚙️';
    fab.onclick = () => {
        const isExp = tray.style.display === 'flex';
        tray.style.display = isExp ? 'none' : 'flex';
        fab.innerHTML = isExp ? '⚙️' : '✖️';
    };

    container.appendChild(tray);
    container.appendChild(fab);
    document.body.appendChild(container);

})();
