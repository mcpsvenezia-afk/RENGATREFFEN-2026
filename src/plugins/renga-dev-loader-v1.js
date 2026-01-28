(function () {
    if (window.RENGA_INSPECTOR_LOADED) return;
    window.RENGA_INSPECTOR_LOADED = true;

    // 0. ACTIVATION PROTOCOL (Secret: 5 clicks on Logo)
    let clickCount = 0;
    document.addEventListener('click', (e) => {
        if (e.target.closest('.logo')) {
            clickCount++;
            if (clickCount >= 5) {
                const isDev = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
                localStorage.setItem('RENGATREFFEN_DEV_MODE', !isDev);
                alert(`🧬 DEV MODE: ${!isDev ? 'ATTIVATO' : 'DISATTIVATO'}`);
                location.reload();
            }
            setTimeout(() => clickCount = 0, 2000);
        }
    });

    const isStored = localStorage.getItem('RENGATREFFEN_DEV_MODE') === 'true';
    if (!isStored) {
        console.log("[DEV] Renga Atomic Inspector is dormant. (Logo 5-clicks to activate)");
        return;
    }

    const version = "1.5.0-ATOMIC";
    console.log(`[DEV] Renga Atomic Inspector v${version} ACTIVE`);

    // 1. SURGICAL STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        #renga-inspector-overlay {
            position: fixed;
            pointer-events: none;
            border: 2px solid #FFCC00;
            background: rgba(255, 204, 0, 0.1);
            z-index: 2147483647;
            display: none;
            box-shadow: 0 0 20px rgba(255, 204, 0, 0.4);
            transition: none;
        }
        #renga-inspector-label {
            position: absolute;
            bottom: 100%;
            left: 0;
            background: #FFCC00;
            color: #000;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 900;
            white-space: nowrap;
            border-radius: 6px 6px 0 0;
            text-transform: uppercase;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        .comp-tag { background: #000; color: #FFCC00; padding: 1px 5px; border-radius: 3px; font-size: 9px; }
        .version-tag { color: #555; font-size: 8px; }
        
        .renga-supra-toast {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #FFCC00;
            color: #000;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: 900;
            z-index: 2147483647;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            animation: supraPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes supraPop {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
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

    // 3. ATOMIC SELECTOR (DNA v2 - Shell Logic)
    let lastAtomicElement = null;
    let currentDnaPrefix = "";

    const findAtomicContainer = (el) => {
        let current = el;
        while (current && current !== document.body) {
            let prev = current.previousSibling;
            // Skip text nodes (whitespace)
            while (prev && prev.nodeType === 3 && !prev.nodeValue.trim()) {
                prev = prev.previousSibling;
            }

            if (prev && prev.nodeType === 8 && prev.nodeValue.includes('URL:')) {
                return { element: current, prefix: prev.nodeValue };
            }
            current = current.parentElement;
        }
        return null;
    };

    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            return;
        }

        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === overlay || target === label) return;

        const atomic = findAtomicContainer(target);
        const element = atomic ? atomic.element : target;
        currentDnaPrefix = atomic ? atomic.prefix : "";

        const componentParent = element.closest('[data-component]');
        const componentName = componentParent ? componentParent.getAttribute('data-component') : "HTML";
        const componentVer = componentParent ? componentParent.getAttribute('data-version') : "";

        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        const tagName = element.tagName.toLowerCase();
        const firstClass = element.className && typeof element.className === 'string' ? '.' + element.className.split(' ')[0] : '';
        const id = element.id ? `#${element.id}` : '';

        const dnaBadge = currentDnaPrefix ? `<span style="background:#000;color:#FFCC00;padding:2px 5px;border-radius:4px;margin-right:5px;font-size:9px;">DNA ACTIVE</span>` : "";

        label.innerHTML = `${dnaBadge}<span>${tagName}${id}${firstClass}</span> <span class="comp-tag">${componentName}</span> <span class="version-tag">${componentVer}</span>`;

        lastAtomicElement = element;
    });

    // 4. DNA CLICK
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!lastAtomicElement) return;

            let html = lastAtomicElement.outerHTML;
            if (currentDnaPrefix) {
                html = `<!--${currentDnaPrefix}-->\n` + html;
            }

            navigator.clipboard.writeText(html).then(() => {
                const t = document.createElement('div');
                t.className = 'renga-supra-toast';
                t.innerHTML = `🧬 MISSION ACCOMPLISHED (ID COPIED)`;
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 2000);

                lastAtomicElement.style.outline = "4px solid #FFCC00";
                lastAtomicElement.style.outlineOffset = "-4px";
                setTimeout(() => lastAtomicElement.style.outline = "", 600);
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
        { t: 'REGOLAMENTO', act: () => location.href = '/regolamento.html' },
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
