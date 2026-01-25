/**
 * 🧬 PLUGIN: RENGA ULTRA-PRECISION INSPECTOR v1.3.0
 * Goal: Deep element detection, component awareness, and multi-page stability.
 */

(function () {
    const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
    if (!isStored) return;

    const version = "1.3.0-SUPER-DENSE";
    console.log(`[DEV] Renga Ultra-Precision Inspector v${version} ACTIVE`);

    // 1. SUPREME STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        #renga-inspector-overlay {
            position: fixed;
            pointer-events: none;
            border: 2px solid #FFCC00;
            background: rgba(255, 204, 0, 0.05);
            z-index: 2147483647;
            display: none;
            box-shadow: 0 0 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,204,0,0.2);
            mix-blend-mode: normal;
        }
        #renga-inspector-label {
            position: absolute;
            bottom: 100%;
            left: -2px;
            background: #FFCC00;
            color: #000;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
            border-radius: 6px 6px 0 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: flex;
            gap: 10px;
            align-items: center;
        }
        .comp-tag { background: #000; color: #FFCC00; padding: 1px 6px; border-radius: 3px; font-size: 9px; }
        
        .renga-supra-toast {
            position: fixed;
            top: 40px;
            right: 40px;
            background: #FFCC00;
            color: #000;
            padding: 20px 40px;
            border-radius: 100px;
            font-weight: 900;
            z-index: 2147483647;
            box-shadow: 0 30px 60px rgba(0,0,0,0.8);
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            border: 2px solid #000;
            display: flex;
            flex-direction: column;
            gap: 5px;
            animation: supraSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .renga-supra-toast small { font-size: 10px; opacity: 0.6; text-transform: uppercase; }

        @keyframes supraSlideIn {
            from { transform: translateX(120%) scale(0.8); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }

        #renga-dev-menu { position: fixed; bottom: 40px; right: 40px; z-index: 2147483646; display: flex; flex-direction: column; gap: 15px; align-items: flex-end; font-family: 'Outfit', sans-serif; }
        .dev-tray { display: none; flex-direction: column; gap: 10px; margin-bottom: 20px; background: #09090b; padding: 30px; border-radius: 32px; border: 1px solid #FFCC00; box-shadow: 0 40px 100px rgba(0,0,0,1); width: 320px; box-sizing: border-box; }
        .dev-label { font-size: 11px; font-weight: 900; color: #444; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px; margin-top: 20px; border-bottom: 1px solid #222; padding-bottom: 5px; }
        .dev-btn { background: #111; color: #fff; border: 1px solid #333; padding: 16px; border-radius: 16px; cursor: pointer; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 12px; transition: 0.2s; width: 100%; box-sizing: border-box; }
        .dev-btn:hover { background: #1a1a1f; border-color: #FFCC00; color: #FFCC00; transform: translateX(-5px); }
        .dev-main-btn { background: #FFCC00; color: #000; border: none; width: 70px; height: 70px; border-radius: 50%; cursor: pointer; box-shadow: 0 20px 50px rgba(255, 204, 0, 0.3); display: flex; align-items: center; justify-content: center; font-size: 30px; transition: 0.3s; }
        .dev-main-btn:hover { transform: scale(1.1) rotate(45deg); }
    `;
    document.head.appendChild(style);

    // 2. DOM ELEMENTS
    const overlay = document.createElement('div');
    overlay.id = 'renga-inspector-overlay';
    const label = document.createElement('div');
    label.id = 'renga-inspector-label';
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // 3. TOAST ENGINE
    function supraToast(title, subtitle = "") {
        const t = document.createElement('div');
        t.className = 'renga-supra-toast';
        t.innerHTML = `<b>${title}</b><small>${subtitle}</small>`;
        document.body.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateY(-20px)';
            t.style.transition = '0.4s';
            setTimeout(() => t.remove(), 400);
        }, 2500);
    }

    // 4. SMART TARGETING
    let activeElement = null;
    let activeComponent = "Unknown";

    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            document.body.style.cursor = 'default';
            return;
        }

        document.body.style.cursor = 'crosshair';
        const target = e.target;
        if (target === overlay || target === label || !target) return;

        // Smart Container detection
        const element = target.closest('button, a, input, select, textarea, label, [data-component], section, .team-block, .card') || target;
        const componentParent = target.closest('[data-component]');
        activeComponent = componentParent ? componentParent.getAttribute('data-component') : "Native / HTML";

        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        const tagName = element.tagName.toLowerCase();
        const className = element.className ? '.' + element.className.split(' ')[0] : '';
        label.innerHTML = `<span>${tagName}${className}</span> <span class="comp-tag">${activeComponent}</span>`;

        activeElement = element;
    });

    // 5. DNA CAPTURE
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!activeElement) return;

            const html = activeElement.outerHTML;
            navigator.clipboard.writeText(html).then(() => {
                supraToast("🧬 DNA COPIATO", `${activeComponent} > ${activeElement.tagName}`);

                // Visual Flash
                const originalOutline = activeElement.style.outline;
                activeElement.style.outline = "6px solid #FFCC00";
                setTimeout(() => activeElement.style.outline = originalOutline, 400);
            });
        }
    }, true);

    // 6. FLOATING HUD (TRAY)
    const container = document.createElement('div');
    container.id = 'renga-dev-menu';
    const tray = document.createElement('div');
    tray.className = 'dev-tray';

    const menu = [
        { t: 'PLATFORM MAP', type: 'label' },
        { t: '🏠 HOME PAGE', act: () => location.href = '/' },
        { t: '📊 DASHBOARD', act: () => location.href = '/dashboard.html' },
        { t: '🏆 TEAM LIST', act: () => location.href = '/team.html' },
        { t: 'ISPEZIONE DNA', type: 'label' },
        { t: '🧹 CLEAR CACHE', act: () => { localStorage.clear(); location.reload(); } },
        { t: '🔴 EXIT DEV MODE', act: () => { localStorage.removeItem('RENGATREFFEN_DEV_MODE'); location.reload(); } }
    ];

    menu.forEach(m => {
        if (m.type === 'label') {
            const l = document.createElement('div'); l.className = 'dev-label'; l.innerText = m.t;
            tray.appendChild(l);
        } else {
            const b = document.createElement('button');
            b.className = 'dev-btn';
            b.innerText = m.t;
            b.onclick = m.act;
            tray.appendChild(b);
        }
    });

    const fab = document.createElement('button');
    fab.className = 'dev-main-btn';
    fab.innerHTML = '⚙️';
    fab.onclick = () => {
        const isExp = tray.style.display === 'flex';
        tray.style.display = isExp ? 'none' : 'flex';
        fab.innerHTML = isExp ? '⚙️' : '✖️';
        fab.style.background = isExp ? '#FFCC00' : '#E6007E';
    };

    container.appendChild(tray);
    container.appendChild(fab);
    document.body.appendChild(container);

})();
