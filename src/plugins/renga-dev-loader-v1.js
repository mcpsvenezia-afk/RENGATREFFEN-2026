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

    const version = "1.5.1-SHELL";
    console.log(`[DEV] Renga Atomic Inspector v${version} ACTIVE`);

    // 0.1 LOAD PDF ENGINE
    const pdfScript = document.createElement('script');
    pdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    document.head.appendChild(pdfScript);

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

        /* 📄 PDF SELECTOR STYLES */
        .dev-selector { color: #eee; font-size: 11px; margin: 10px 0; padding: 12px; border: 1px dashed #333; border-radius: 10px; background: #111; }
        .dev-selector label { display: block; margin-bottom: 8px; font-weight: 900; color: #FFCC00; text-transform: uppercase; font-size: 9px; letter-spacing: 1px; }
        .selector-row { display: flex; gap: 15px; align-items: center; }
        .selector-item { display: flex; align-items: center; gap: 5px; cursor: pointer; }
        .selector-item input { margin: 0; cursor: pointer; accent-color: #FFCC00; }
        .selector-item span { font-size: 10px; font-weight: 600; }

        /* 📑 PDF ENGINE v6.0 - HIGH-FIDELITY HYBRID */
        .pdf-hybrid-container { 
            background: #f4f4f4 !important; 
            color: #000 !important; 
            padding: 40px 20px !important;
            font-family: 'Inter', Arial, sans-serif !important;
        }
        .pdf-hybrid-card { 
            background: #ffffff !important; 
            width: 95% !important; 
            margin: 20px auto !important; 
            padding: 25px !important; 
            border: 1px solid #ddd !important;
            border-radius: 8px !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
            position: relative !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            overflow: hidden !important;
        }
        .pdf-hybrid-badge { 
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            background: #FFCC00 !important;
            color: #000 !important;
            padding: 5px 12px !important;
            font-size: 10px !important;
            font-weight: 900 !important;
            border-bottom-left-radius: 8px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            border: 1px solid #e0b400 !important;
            border-top: none !important;
            border-right: none !important;
        }
        .pdf-hybrid-card h2 { color: #000 !important; font-size: 18pt !important; margin-top: 5px !important; border-bottom: 2px solid #FFCC00 !important; padding-bottom: 10px !important; margin-bottom: 15px !important; width: fit-content !important; }
        .pdf-hybrid-card p { color: #333 !important; font-size: 11pt !important; line-height: 1.6 !important; margin-top: 10px !important; }
        .pdf-hybrid-asset { width: 100% !important; height: auto !important; max-height: 300px !important; object-fit: contain !important; border-radius: 10px !important; margin: 15px 0 !important; background: #fafafa !important; border: 1px solid #eee !important; display: block !important; }
        
        .pdf-hybrid-btn {
            display: flex !important;
            align-items: center !important;
            gap: 15px !important;
            background: #000 !important;
            color: #fff !important;
            padding: 15px 25px !important;
            border-radius: 10px !important;
            margin-top: 15px !important;
            text-decoration: none !important;
            font-weight: bold !important;
        }
        .pdf-hybrid-btn-icon { width: 40px !important; height: 40px !important; object-fit: contain !important; }

        .dev-selector .selector-section { margin-bottom: 10px; }
        .dev-selector .section-title { font-size: 9px; color: #666; font-weight: 900; margin-bottom: 5px; display: block; }

        /* 🟢 ATOMIC HIGHLIGHTER & BADGES */
        .atomic-highlight { 
            outline: 4px solid #FFCC00 !important; 
            outline-offset: -4px !important; 
            box-shadow: inset 0 0 50px rgba(255, 204, 0, 0.3) !important;
            transition: all 0.2s ease !important;
        }
        .dna-visible-badge {
            position: absolute;
            top: 0;
            left: 0;
            background: #000 !important;
            color: #FFFF00 !important;
            padding: 2px 6px;
            font-size: 10px !important;
            font-weight: 900;
            border-radius: 4px;
            z-index: 2000;
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.8);
            font-family: 'Inter', sans-serif;
            text-transform: uppercase;
            transform: translateY(-100%);
            white-space: nowrap;
        }
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

    // 🧬 VISIBLE BADGES ENGINE
    const refreshVisibleBadges = () => {
        document.querySelectorAll('.dna-visible-badge').forEach(b => b.remove());
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT, null, false);
        let node;
        while (node = walker.nextNode()) {
            if (node.nodeValue.includes('ID ')) {
                const idMatch = node.nodeValue.match(/ID\s+([^\s]+)/);
                if (idMatch) {
                    const id = idMatch[1].trim();
                    let target = node.nextSibling;
                    while (target && target.nodeType === 3) target = target.nextSibling;
                    if (target && target.nodeType === 1) {
                        // Ensure relative positioning
                        const style = window.getComputedStyle(target);
                        if (style.position === 'static') {
                            target.style.position = 'relative';
                        }
                        const badge = document.createElement('div');
                        badge.className = 'dna-visible-badge';
                        badge.innerText = id;
                        target.appendChild(badge);
                    }
                }
            }
        }
    };

    setTimeout(refreshVisibleBadges, 1000);
    window.addEventListener('resize', refreshVisibleBadges);
    window.addEventListener('scroll', refreshVisibleBadges);

    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            return;
        }

        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === overlay || target === label || target.classList.contains('dna-visible-badge')) return;

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
            // 🛑 CLEANUP & PREVENTION
            e.preventDefault();
            e.stopPropagation();

            // Rimuove l'highlight da qualsiasi altro elemento precedentemente selezionato
            document.querySelectorAll('.atomic-highlight, .is-highlighted').forEach(el => {
                el.classList.remove('atomic-highlight');
                el.classList.remove('is-highlighted');
            });

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

                // Applica il nuovo highlight unico (Persistente fino al prossimo click)
                lastAtomicElement.classList.add('atomic-highlight');
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
        { t: 'REGOLAMENTO', act: () => location.href = '/regolamento.html' }
    ];

    menu.forEach(m => {
        const b = document.createElement('button');
        b.className = 'dev-btn';
        b.innerText = m.t;
        b.onclick = m.act;
        tray.appendChild(b);
    });

    // 📄 ADVANCED PDF EXPORT PANEL (v3.0)
    const isTutorials = window.location.pathname.includes('tutorials.html');
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'dev-selector';
    selectorContainer.innerHTML = `
        <label>Advanced PDF Export v3.0</label>
        <div class="selector-section">
            <span class="section-title">FORMATO:</span>
            <div class="selector-row">
                <label class="selector-item">
                    <input type="radio" name="pdf-format" value="desktop" checked>
                    <span>Desktop</span>
                </label>
                <label class="selector-item">
                    <input type="radio" name="pdf-format" value="mobile">
                    <span>Mobile</span>
                </label>
            </div>
        </div>
        <div class="selector-section">
            <span class="section-title">ORIENTAMENTO:</span>
            <div class="selector-row">
                <label class="selector-item">
                    <input type="radio" name="pdf-orient" value="portrait" ${!isTutorials ? 'checked' : ''}>
                    <span>Verticale</span>
                </label>
                <label class="selector-item">
                    <input type="radio" name="pdf-orient" value="landscape" ${isTutorials ? 'checked' : ''}>
                    <span>Orizzontale</span>
                </label>
            </div>
        </div>
    `;
    tray.appendChild(selectorContainer);

    // 🚀 GENERATE BUTTON (v6.0 HIGH-FIDELITY HYBRID)
    const exportBtn = document.createElement('button');
    exportBtn.className = 'dev-btn';
    exportBtn.style.borderColor = '#FFCC00';
    exportBtn.style.textAlign = 'center';
    exportBtn.innerText = '🚀 GENERA HANDBOOK v6.0';
    exportBtn.onclick = () => {
        const format = document.querySelector('input[name="pdf-format"]:checked').value;
        const orientation = document.querySelector('input[name="pdf-orient"]:checked').value;
        const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

        // 1. Construct Hybrid Report
        const report = document.createElement('div');
        report.className = 'pdf-hybrid-container';
        if (format === 'mobile') report.style.maxWidth = '400px';

        report.innerHTML = `
            <div style="background: #000; color: #FFCC00; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 40px; border: 2px solid #FFCC00;">
                <h1 style="margin: 0; font-size: 28pt; letter-spacing: 2px;">RENGATREFFEN 2026</h1>
                <p style="margin: 10px 0; font-size: 12pt; font-weight: bold; opacity: 0.8;">HIGH-FIDELITY HANDBOOK v6.0</p>
                <p style="margin: 20px 0 0 0; font-size: 9pt; opacity: 0.6; font-family: monospace;">AUDIT: ${pageName.toUpperCase()} | ${new Date().toLocaleString()}</p>
            </div>
        `;

        // Extraction Logic
        const sourceCards = document.querySelectorAll('.tutorial-card, .info-card');
        sourceCards.forEach(card => {
            const frame = document.createElement('div');
            frame.className = 'pdf-hybrid-card';

            // DNA Label
            const badge = card.querySelector('.dna-visible-badge');
            if (badge) {
                const label = document.createElement('div');
                label.className = 'pdf-hybrid-badge';
                label.innerText = badge.innerText;
                frame.appendChild(label);
            }

            // Title
            const title = card.querySelector('h2');
            if (title) {
                const h2 = document.createElement('h2');
                h2.innerText = title.innerText;
                frame.appendChild(h2);
            }

            // Asset
            const img = card.querySelector('img:not(.store-logo)');
            if (img) {
                const asset = document.createElement('img');
                asset.className = 'pdf-hybrid-asset';
                asset.src = img.src;
                frame.appendChild(asset);
            }

            // Text content
            const pTags = card.querySelectorAll('p');
            pTags.forEach(p => {
                const text = document.createElement('p');
                text.innerText = p.innerText;
                frame.appendChild(text);
            });

            // Button recovery
            const sourceBtn = card.querySelector('.app-download-btn');
            if (sourceBtn) {
                const hybridBtn = document.createElement('div');
                hybridBtn.className = 'pdf-hybrid-btn';

                const icon = sourceBtn.querySelector('.app-icon img');
                if (icon) {
                    const bIcon = document.createElement('img');
                    bIcon.className = 'pdf-hybrid-btn-icon';
                    bIcon.src = icon.src;
                    hybridBtn.appendChild(bIcon);
                }

                const label = document.createElement('span');
                label.innerText = sourceBtn.innerText.replace(/\n/g, ' ').trim();
                hybridBtn.appendChild(label);

                frame.appendChild(hybridBtn);
            }

            report.appendChild(frame);
        });

        const opt = {
            margin: 0.2,
            filename: `RENGA-HANDBOOK-v6-${pageName.toUpperCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
            jsPDF: { unit: 'in', format: 'a4', orientation: orientation }
        };

        const t = document.createElement('div');
        t.className = 'renga-supra-toast';
        t.innerHTML = `🧬 GENERATING HYBRID HANDBOOK v6.0...`;
        document.body.appendChild(t);

        html2pdf().set(opt).from(report).save().then(() => {
            t.innerHTML = `✅ HANDBOOK v6.0 READY`;
            setTimeout(() => t.remove(), 2000);
        });
    };
    tray.appendChild(exportBtn);

    const exitBtn = document.createElement('button');
    exitBtn.className = 'dev-btn';
    exitBtn.style.color = '#ff4444';
    exitBtn.innerText = '🔴 EXIT DEV';
    exitBtn.onclick = () => { localStorage.removeItem('RENGATREFFEN_DEV_MODE'); location.reload(); };
    tray.appendChild(exitBtn);

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

    // Self-Mapping DNA v2.1
    const dnaComment = document.createComment(" URL:https://www.rengatreffen.it/dev-menu ID 0001-DEV ");
    const pdfComment = document.createComment(" URL:https://www.rengatreffen.it/dev-menu/export ID 0001-EXPORT-DNA-PDF ");
    document.body.appendChild(dnaComment);
    document.body.appendChild(pdfComment);
    document.body.appendChild(container);

})();
