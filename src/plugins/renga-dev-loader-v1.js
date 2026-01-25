/**
 * 🧬 PLUGIN: RENGA SUPREME INSPECTOR v1.2.0
 * Goal: Professional hovering, high-fidelity element selection, and universal feedback.
 */

(function () {
    const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
    if (!isStored) return;

    console.log("[DEV] Renga Supreme Inspector v1.2.0 ACTIVE");

    // 1. STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        #renga-inspector-overlay {
            position: fixed;
            pointer-events: none;
            border: 2px solid #FFCC00;
            background: rgba(255, 204, 0, 0.1);
            z-index: 100000000;
            transition: all 0.1s ease-out;
            display: none;
            box-shadow: 0 0 15px rgba(255, 204, 0, 0.5);
        }
        #renga-inspector-label {
            position: absolute;
            top: -25px;
            left: -2px;
            background: #FFCC00;
            color: #000;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 900;
            white-space: nowrap;
            border-radius: 4px 4px 0 0;
            text-transform: uppercase;
        }
        .renga-supra-toast {
            position: fixed;
            top: 30px;
            right: 30px;
            background: #FFCC00;
            color: #000;
            padding: 15px 30px;
            border-radius: 50px;
            font-weight: 900;
            z-index: 100000001;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            animation: supraSlideIn 0.3s ease-out forwards;
            font-family: sans-serif;
            font-size: 14px;
        }
        @keyframes supraSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        /* Tray Styles */
        #renga-dev-menu { position: fixed; bottom: 30px; right: 30px; z-index: 99999999 !important; display: flex; flex-direction: column; gap: 10px; align-items: flex-end; font-family: 'Outfit', sans-serif; }
        .dev-tray { display: none; flex-direction: column; gap: 8px; margin-bottom: 12px; background: #161616; padding: 25px; border-radius: 24px; border: 1px solid #FFCC00; box-shadow: 0 20px 60px rgba(0,0,0,0.9); width: 280px; box-sizing: border-box; }
        .dev-label { font-size: 10px; font-weight: 800; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px; margin-top: 15px; }
        .dev-btn { background: #222; color: #fff; border: 1px solid #333; padding: 14px; border-radius: 12px; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 10px; transition: 0.2s; width: 100%; box-sizing: border-box; justify-content: flex-start; }
        .dev-btn:hover { background: #333; border-color: #FFCC00; color: #FFCC00; }
        .dev-main-btn { background: #FFCC00; color: #000; border: none; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; box-shadow: 0 10px 30px rgba(255, 204, 0, 0.4); display: flex; align-items: center; justify-content: center; font-size: 26px; transition: 0.3s; }
        .dev-main-btn:hover { transform: scale(1.1) rotate(90deg); }
    `;
    document.head.appendChild(style);

    // 2. CREATE ELEMENTS
    const overlay = document.createElement('div');
    overlay.id = 'renga-inspector-overlay';
    const label = document.createElement('div');
    label.id = 'renga-inspector-label';
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // 3. UNIVERSAL FEEDBACK
    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'renga-supra-toast';
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => {
            t.style.animation = 'supraSlideIn 0.3s ease-in reverse forwards';
            setTimeout(() => t.remove(), 300);
        }, 2000);
    }

    // 4. MOUSE LOGIC: HOVER & HIGHLIGHT
    let lastTarget = null;
    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            return;
        }

        const target = e.target;
        if (target === overlay || target === label || !target) return;

        // Find the "meaningful" element: button, link, card, or the text itself
        const element = target.closest('button, a, .card, section, h1, h2, h3, h4, p, label') || target;

        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        label.innerText = `<${element.tagName.toLowerCase()}> ${element.className ? '.' + element.className.split(' ')[0] : ''}`;
        lastTarget = element;
    });

    // 5. CLICK LOGIC: COPY DNA
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!lastTarget) return;

            const codeSnippet = lastTarget.outerHTML;
            navigator.clipboard.writeText(codeSnippet).then(() => {
                showToast(`🧬 DNA COPIATO: <${lastTarget.tagName.toLowerCase()}>`);

                // Visual confirmation on element
                const originalBg = lastTarget.style.backgroundColor;
                lastTarget.style.backgroundColor = 'rgba(255, 204, 0, 0.3)';
                setTimeout(() => lastTarget.style.backgroundColor = originalBg, 500);
            });
        }
    }, true);

    // 6. DEV TRAY (UI)
    const container = document.createElement('div');
    container.id = 'renga-dev-menu';
    const tray = document.createElement('div');
    tray.className = 'dev-tray';

    const menuItems = [
        { l: 'PLATFORM NAVIGATION', type: 'label' },
        { l: '🏠 HOME PAGE', action: () => location.href = '/' },
        { l: '📊 DASHBOARD', action: () => location.href = '/dashboard.html' },
        { l: '🏆 TEAM LIST', action: () => location.href = '/team.html' },
        { l: 'SYSTEM TOOLS', type: 'label' },
        { l: '🧹 PULISCI CACHE', action: () => { localStorage.clear(); location.reload(); } },
        { l: '🔴 ESCI DA MODO DEV', action: () => { localStorage.removeItem('RENGATREFFEN_DEV_MODE'); location.reload(); } }
    ];

    menuItems.forEach(item => {
        if (item.type === 'label') {
            const l = document.createElement('div'); l.className = 'dev-label'; l.innerText = item.l;
            tray.appendChild(l);
        } else {
            const b = document.createElement('button');
            b.className = 'dev-btn';
            b.innerText = item.l;
            b.onclick = item.action;
            tray.appendChild(b);
        }
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

})();
