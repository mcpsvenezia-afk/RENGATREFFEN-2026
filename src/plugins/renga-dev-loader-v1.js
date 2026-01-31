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

    const version = "1.5.1-ASSEMBLY-FIX";
    console.log(`[DEV] Renga Atomic Inspector v${version} ACTIVE`);

    // 0.1 LOAD PDF ENGINES (v9.0 Visual Assembly)
    const jspdfScript = document.createElement('script');
    jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    document.head.appendChild(jspdfScript);

    const h2cScript = document.createElement('script');
    h2cScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    document.head.appendChild(h2cScript);

    // 1. SURGICAL STYLES
    const style = document.createElement('style');
    style.innerHTML = `
        /* 🛡️ SUPER MATRIOSKA FLASH */
        .dna-matrioska-flash {
            outline: 6px solid #00FFFF !important;
            outline-offset: -6px !important;
            animation: dnaFlash 0.6s cubic-bezier(0.19, 1, 0.22, 1) forwards !important;
            z-index: 2147483647 !important;
        }
        @keyframes dnaFlash {
            0% { outline-color: #00FFFF; box-shadow: 0 0 100px rgba(0,255,255,0.8); outline-width: 10px; }
            40% { outline-color: #FFCC00; box-shadow: 0 0 50px rgba(255,204,0,0.5); }
            100% { outline-color: transparent; box-shadow: none; outline-width: 0; }
        }

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
            z-index: 9999; /* v7.0 Badge Alpha */
            pointer-events: none;
            box-shadow: 0 2px 8px rgba(0,0,0,0.8);
            font-family: 'Inter', sans-serif;
            text-transform: uppercase;
            transform: translateY(-100%);
            white-space: nowrap;
        }

        /* DNA Visibility Control */
        body.hide-dna .dna-visible-badge { display: none !important; }
        body.hide-dna #renga-inspector-overlay { display: none !important; }

        /* 📑 CSS PRINT OVERHAUL v8.0 - NO CONTENT LEFT BEHIND */
        @media print {
            @page { size: A4 portrait; margin: 15mm; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            body { background: #fff !important; color: #000 !important; width: 100% !important; overflow: visible !important; }
            main, .container, .tutorial-content, .info-section { width: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
            
            nav, .gold-bar, #renga-dev-menu, #renga-inspector-overlay { display: none !important; }
            header, footer { display: block !important; opacity: 1 !important; visibility: visible !important; page-break-inside: avoid !important; break-inside: avoid !important; }
            
            .tutorial-card, .info-card, .registration-section { 
                page-break-inside: avoid !important; 
                break-inside: avoid !important; 
                margin-bottom: 25px !important;
                border: 1px solid #eee !important;
                box-shadow: none !important;
                background: #fff !important;
                color: #000 !important;
                padding: 20px !important;
                width: 100% !important;
                box-sizing: border-box !important;
            }

            .tutorial-card h2, .info-card h2 { 
                display: flex !important; 
                align-items: center !important; 
                gap: 15px !important; 
                margin-top: 0 !important;
            }
            
            .dna-visible-badge { 
                position: static !important; 
                display: inline-block !important; 
                opacity: 1 !important; 
                visibility: visible !important; 
                background: #000 !important; 
                color: #FFFF00 !important; 
                padding: 3px 8px !important;
                font-size: 8pt !important;
                font-weight: 900 !important;
                border-radius: 4px !important;
                transform: none !important;
                z-index: 9999 !important;
            }
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

    // 3. ATOMIC SELECTOR (DNA v3 - SUPER MATRIOSKA)
    let lastAtomicElement = null;

    const findDnaHierarchy = (el) => {
        let current = el;
        const hierarchy = [];
        const baseUrl = window.location.origin + window.location.pathname;

        while (current && current !== document.documentElement) {
            let dnaId = current.getAttribute('data-dna');
            let type = current.getAttribute('data-component') || 'CORE';

            // Check for previous sibling comment (Legacy/Static HTML)
            if (!dnaId) {
                let prev = current.previousSibling;
                while (prev && prev.nodeType === 3 && !prev.nodeValue.trim()) prev = prev.previousSibling;
                if (prev && prev.nodeType === 8 && prev.nodeValue.includes('ID ')) {
                    const match = prev.nodeValue.match(/ID\s+([^\s]+)/);
                    if (match) dnaId = match[1].trim();
                }
            }

            if (dnaId) {
                hierarchy.push({ id: dnaId, type: type });
            }

            current = current.parentElement;
        }

        if (hierarchy.length === 0) return null;

        const steps = hierarchy.reverse();
        const breadcrumb = steps.map((s, i) => {
            const role = i === 0 ? 'ROOT' : i === steps.length - 1 ? 'ELEMENT' : 'SECTION';
            return `[${role}: ${s.id}]`;
        }).join(' > ');

        const technical = steps.map((s) => {
            // New strict format as requested: <URL:... ID:XXXX TYPE:COMPONENT_NAME -->
            const cleanType = s.type.toUpperCase().replace(/\s+/g, '_');
            return `<URL:${baseUrl} ID:${s.id} TYPE:${cleanType} -->`;
        }).join('\n');

        return { breadcrumb, technical };
    };

    // 🧬 VISIBLE BADGES ENGINE
    const refreshVisibleBadges = () => {
        const showDna = localStorage.getItem('RENGATREFFEN_SHOW_DNA') !== 'false'; // Default to true if dev mode is active
        if (!showDna) {
            document.body.classList.add('hide-dna');
        } else {
            document.body.classList.remove('hide-dna');
        }

        document.querySelectorAll('.dna-visible-badge').forEach(b => b.remove());

        // 1. Scan Comments (Legacy/Static)
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
                        addBadge(target, id);
                    }
                }
            }
        }

        // 2. Scan data-dna attributes (Modern/React)
        document.querySelectorAll('[data-dna]').forEach(el => {
            addBadge(el, el.getAttribute('data-dna'));
        });
    };

    const addBadge = (target, id) => {
        // 🛡️ Calculate Matrioska Level (Hierarchy Depth)
        let level = 1;
        let p = target.parentElement;
        while (p && p !== document.documentElement) {
            let pDna = p.getAttribute('data-dna');
            let hasComment = false;
            if (!pDna) {
                let prev = p.previousSibling;
                while (prev && prev.nodeType === 3 && !prev.nodeValue.trim()) prev = prev.previousSibling;
                if (prev && prev.nodeType === 8 && prev.nodeValue.includes('ID ')) hasComment = true;
            }
            if (pDna || hasComment) level++;
            p = p.parentElement;
        }

        const compName = target.getAttribute('data-component') || 'CORE';
        const labelText = `Lvl ${level} | ID: ${id} | ${compName.toUpperCase()}`;

        // Ensure relative positioning
        const style = window.getComputedStyle(target);
        if (style.position === 'static') {
            target.style.position = 'relative';
        }
        const badge = document.createElement('div');
        badge.className = 'dna-visible-badge';
        badge.innerText = labelText;
        target.appendChild(badge);
    };

    // 6. DYNAMIC REFRESH (MutationObserver for React/SPA)
    let refreshTimeout;
    const throttledRefresh = () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(refreshVisibleBadges, 300);
    };

    const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                // Ignore if only our own badges were added
                const isBadge = Array.from(mutation.addedNodes).every(n => n.classList && n.classList.contains('dna-visible-badge'));
                if (!isBadge) { shouldRefresh = true; break; }
            }
        }
        if (shouldRefresh) throttledRefresh();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(refreshVisibleBadges, 1000);
    window.addEventListener('resize', throttledRefresh);
    window.addEventListener('scroll', throttledRefresh);
    document.addEventListener('mousemove', (e) => {
        if (!e.ctrlKey && !e.metaKey) {
            overlay.style.display = 'none';
            return;
        }

        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (!target || target === overlay || target === label || target.classList.contains('dna-visible-badge')) return;

        const h = findDnaHierarchy(target);
        const element = target; // In v3 we hover the actual element

        const rect = element.getBoundingClientRect();
        overlay.style.display = 'block';
        overlay.style.top = `${rect.top + window.scrollY}px`;
        overlay.style.left = `${rect.left + window.scrollX}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;

        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const comp = element.closest('[data-component]')?.getAttribute('data-component') || 'HTML';
        const dnaId = element.getAttribute('data-dna') || "NO DNA";

        label.innerHTML = `${h ? '🧬 MATRIOSKA ACTIVE' : tagName}${id} <span class="comp-tag">ID: ${dnaId}</span> <span class="comp-tag">${comp}</span>`;
        lastAtomicElement = element;
    });

    // 4. DNA CLICK (SUPER MATRIOSKA)
    document.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            e.stopPropagation();

            const hierarchy = findDnaHierarchy(e.target);
            if (!hierarchy) return;

            // Flash effect
            e.target.classList.add('dna-matrioska-flash');
            setTimeout(() => e.target.classList.remove('dna-matrioska-flash'), 1000);

            const content = `${hierarchy.breadcrumb}\n\n${hierarchy.technical}`;
            navigator.clipboard.writeText(content).then(() => {
                const t = document.createElement('div');
                t.className = 'renga-supra-toast';
                t.style.background = '#00FFFF';
                t.style.color = '#000';
                t.innerHTML = `🧬 MATRIOSKA CAPTURED!`;
                document.body.appendChild(t);
                setTimeout(() => t.remove(), 2000);
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

    const dnaToggle = document.createElement('button');
    dnaToggle.className = 'dev-btn';
    dnaToggle.style.color = '#FFCC00';
    const currentShowDna = localStorage.getItem('RENGATREFFEN_SHOW_DNA') !== 'false';
    dnaToggle.innerText = currentShowDna ? '👁️ NASCONDI DNA' : '👁️ MOSTRA DNA';
    dnaToggle.onclick = () => {
        const isShowing = localStorage.getItem('RENGATREFFEN_SHOW_DNA') !== 'false';
        localStorage.setItem('RENGATREFFEN_SHOW_DNA', !isShowing);
        dnaToggle.innerText = !isShowing ? '👁️ NASCONDI DNA' : '👁️ MOSTRA DNA';
        refreshVisibleBadges();
    };
    tray.appendChild(dnaToggle);

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

    // 🚀 GENERATE BUTTON (v9.0 VISUAL ASSEMBLY)
    const exportBtn = document.createElement('button');
    exportBtn.className = 'dev-btn';
    exportBtn.style.borderColor = '#FFCC00';
    exportBtn.style.textAlign = 'center';
    exportBtn.innerText = '🚀 GENERA MASTER PDF v9.0';
    exportBtn.onclick = async () => {
        const orientation = document.querySelector('input[name="pdf-orient"]:checked').value;
        const pageName = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

        const t = document.createElement('div');
        t.className = 'renga-supra-toast';
        t.innerHTML = `🧬 INITIALIZING VISUAL ASSEMBLY v9.0...`;
        document.body.appendChild(t);

        // 1. Setup PDF (Hybrid UMD Support)
        const jsPDF = window.jspdf ? (window.jspdf.jsPDF || window.jspdf) : null;
        if (!jsPDF) {
            alert("⚠️ PDF ENGINE NOT LOADED YET. PLEASE WAIT 2 SECONDS.");
            return;
        }

        const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const contentWidth = pageWidth - (margin * 2);

        let currentY = margin;

        // 2. Identify Targets
        const targets = [];
        const header = document.querySelector('header');
        if (header) targets.push({ el: header, label: 'HEADER' });

        const cards = document.querySelectorAll('.tutorial-card, .info-card, .registration-section');
        cards.forEach((c, i) => targets.push({ el: c, label: `CARD ${i + 1}` }));

        const footer = document.querySelector('footer');
        if (footer) targets.push({ el: footer, label: 'FOOTER' });

        // 3. Recursive Snapshot Loop
        const sandbox = document.createElement('div');
        sandbox.style.position = 'absolute';
        sandbox.style.left = '-9999px';
        sandbox.style.width = '1200px';
        sandbox.style.background = '#fff';
        document.body.appendChild(sandbox);

        for (let i = 0; i < targets.length; i++) {
            const item = targets[i];
            t.innerHTML = `📸 CAPTURING ${item.label} [${i + 1}/${targets.length}]...`;

            // Clone & Clean
            const clone = item.el.cloneNode(true);
            clone.style.width = '1120px';
            clone.style.padding = '40px';
            clone.style.margin = '0';
            clone.style.background = '#fff';
            clone.style.color = '#000';
            clone.style.position = 'static';
            clone.style.transform = 'none';
            clone.style.overflow = 'visible';

            // Ensure DNA badges are visible in clone
            const badges = clone.querySelectorAll('.dna-visible-badge');
            badges.forEach(b => {
                b.style.display = 'block';
                b.style.opacity = '1';
                b.style.position = 'absolute';
                b.style.zIndex = '9999';
            });

            sandbox.innerHTML = '';
            sandbox.appendChild(clone);

            // Wait for images in clone
            const imgs = Array.from(clone.querySelectorAll('img'));
            await Promise.all(imgs.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
            }));

            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: 1200
            });

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            // Page Break Logic
            if (currentY + imgHeight > pageHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
            currentY += imgHeight + 5; // Small gap between cards
        }

        // 4. Save & Cleanup
        t.innerHTML = `💾 ASSEMBLING PDF...`;
        pdf.save(`RENGA-DNA-v9-${pageName.toUpperCase()}.pdf`);
        sandbox.remove();
        t.innerHTML = `✅ ASSEMBLY COMPLETE`;
        setTimeout(() => t.remove(), 2000);
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
