/**
 * 🧬 PLUGIN: Vanilla Dynamic Form Engine v1.2.0
 * Goal: Render complex multi-section forms with Premium Renga Aesthetics
 * Features: Radio Buttons, Character Counters, Advanced Validation
 */

export function renderDynamicForm(schema, outletId, onSubmitCallback) {
    const outlet = document.getElementById(outletId);
    if (!outlet) return;

    console.log(`[DNA] Rendering Form: ${schema.meta.name} v${schema.meta.version}`);

    // Create Form Container
    const form = document.createElement('form');
    form.id = `form-${schema.meta.id}`;
    form.className = 'renga-dynamic-form';

    // Style the form container via injected CSS
    const styleId = 'renga-form-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .renga-dynamic-form {
                display: flex;
                flex-direction: column;
                gap: 3rem;
                padding-bottom: 2rem;
            }
            .form-section {
                background: #0d0d12;
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 24px;
                padding: 3rem;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                transition: transform 0.3s ease, border-color 0.3s ease;
            }
            .form-section:hover {
                border-color: #FFCC00;
            }
            .section-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.8rem;
                font-weight: 900;
                color: #FFCC00;
                margin-bottom: 2.5rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .section-title::before {
                content: '';
                width: 6px;
                height: 30px;
                background: #E6007E;
                border-radius: 3px;
            }
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
            }
            .field-wrapper {
                display: flex;
                flex-direction: column;
                gap: 0.8rem;
                position: relative;
            }
            .field-wrapper label {
                font-size: 0.9rem;
                font-weight: 700;
                color: #ffffff;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .renga-input {
                background: #1a1a23 !important;
                border: 1px solid #333340 !important;
                border-radius: 14px !important;
                padding: 1.2rem !important;
                color: #fff !important;
                font-family: 'Inter', sans-serif !important;
                font-size: 1rem !important;
                transition: all 0.3s ease !important;
                width: 100%;
            }
            .renga-input:focus {
                outline: none !important;
                background: #232330 !important;
                border-color: #FFCC00 !important;
                box-shadow: 0 0 20px rgba(255, 204, 0, 0.15) !important;
            }
            
            /* Select Styles */
            select.renga-input {
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFCC00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 1rem center;
                background-size: 1.2rem;
                padding-right: 3rem !important;
                cursor: pointer;
            }

            /* File Input Styles - Premium */
            .file-upload-wrapper {
                position: relative;
                width: 100%;
            }
            .file-custom-input {
                display: flex;
                align-items: center;
                gap: 1rem;
                background: #1a1a23;
                border: 2px dashed #333340;
                border-radius: 14px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .file-custom-input:hover {
                border-color: #FFCC00;
                background: #232330;
            }
            .file-icon {
                font-size: 1.5rem;
                color: #FFCC00;
            }
            .file-info {
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .file-label {
                font-size: 0.9rem;
                font-weight: 700;
                color: #fff;
            }
            .file-name {
                font-size: 0.8rem;
                color: #666;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
            }
            .hidden-file-input {
                position: absolute;
                width: 100%;
                height: 100%;
                top: 0;
                left: 0;
                opacity: 0;
                cursor: pointer;
            }

            /* Radio Group Styles - Premium Traditional */
            .radio-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            .radio-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.2rem 1.8rem;
                background: #16161a;
                border: 1px solid #222;
                border-radius: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .radio-item:hover {
                background: #1a1a23;
                border-color: #444;
            }
            .radio-item input {
                appearance: none;
                -webkit-appearance: none;
                width: 26px;
                height: 26px;
                border: 2px solid #555 !important;
                border-radius: 50% !important;
                background: transparent !important;
                margin: 0;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                order: 2; /* Sposta il cerchio a destra */
            }
            .radio-item input:checked {
                border-color: #FFCC00 !important;
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.2);
            }
            .radio-item input:checked::after {
                content: '';
                width: 14px;
                height: 14px;
                background: #FFCC00 !important;
                border-radius: 50% !important;
                display: block;
            }
            .radio-item label {
                flex: 1;
                font-size: 1.1rem !important;
                font-weight: 700 !important;
                color: #aaa !important;
                cursor: pointer;
                text-align: left !important;
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                order: 1; /* Testo a sinistra */
            }
            .radio-item input:checked + label {
                color: #fff !important;
            }
            .radio-item:has(input:checked) {
                border-color: rgba(255, 204, 0, 0.4);
                background: rgba(255, 204, 0, 0.03);
            }

            .renga-textarea {
                min-height: 150px !important;
                resize: vertical !important;
            }
            
            /* Char Counter */
            .char-counter {
                font-size: 0.75rem;
                color: #666;
                text-align: right;
                margin-top: 0.3rem;
            }
            .char-counter.limit-reached {
                color: #E6007E;
                font-weight: bold;
            }

            .submit-container {
                padding-top: 4rem;
                padding-bottom: 2rem;
            }
            .renga-submit-btn {
                width: 100%;
                background: linear-gradient(135deg, #FFCC00 0%, #FFB300 100%) !important;
                color: #000 !important;
                border: none !important;
                padding: 1.8rem !important;
                border-radius: 100px !important;
                font-family: 'Outfit', sans-serif !important;
                font-weight: 900 !important;
                font-size: 1.3rem !important;
                text-transform: uppercase !important;
                letter-spacing: 2px !important;
                cursor: pointer !important;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                box-shadow: 0 15px 40px rgba(255, 204, 0, 0.4) !important;
            }
            .renga-submit-btn:hover {
                transform: translateY(-8px) scale(1.02) !important;
                box-shadow: 0 20px 50px rgba(255, 204, 0, 0.6) !important;
            }
            .help-text {
                font-size: 0.8rem;
                color: #E6007E;
                font-weight: 600;
                margin-top: 0.4rem;
                padding: 0.5rem 1rem;
                background: rgba(230, 0, 126, 0.1);
                border-radius: 8px;
                border-left: 3px solid #E6007E;
            }
            @media (max-width: 600px) {
                .form-section { padding: 2rem 1.5rem; }
                .section-title { font-size: 1.4rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // Render Sections
    schema.sections.forEach((section, index) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'form-section reveal';
        sectionEl.id = `section-${section.id}`;

        const title = document.createElement('h3');
        title.className = 'section-title';
        title.innerText = section.title;
        sectionEl.appendChild(title);

        const grid = document.createElement('div');
        grid.className = 'form-grid';

        section.fields.forEach(field => {
            const wrapper = document.createElement('div');
            wrapper.className = 'field-wrapper';
            wrapper.dataset.fieldName = field.name;

            if (field.condition) {
                wrapper.style.display = 'none';
            }

            const label = document.createElement('label');
            label.innerHTML = `${field.label} ${field.required ? '<span style="color: #E6007E">*</span>' : ''}`;
            wrapper.appendChild(label);

            let input;
            if (field.type === 'radio') {
                const radioGroup = document.createElement('div');
                radioGroup.className = 'radio-group';

                field.options.forEach(opt => {
                    const item = document.createElement('div');
                    item.className = 'radio-item';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = field.name;
                    radio.value = opt;
                    radio.id = `radio-${field.name}-${opt}`;
                    if (field.required) radio.required = true;

                    const radioLabel = document.createElement('label');
                    radioLabel.htmlFor = `radio-${field.name}-${opt}`;
                    radioLabel.innerText = opt;

                    // Logic to handle conditional visibility for radios
                    radio.addEventListener('change', () => {
                        triggerConditionalLogic(form, schema, field.name, radio.value);
                    });

                    item.onclick = () => radio.click();

                    item.appendChild(radio);
                    item.appendChild(radioLabel);
                    radioGroup.appendChild(item);
                });
                wrapper.appendChild(radioGroup);
            } else if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'renga-input';
                input.name = field.name;
                input.id = `field-${field.name}`;
                if (field.required) input.required = true;

                const defaultOpt = document.createElement('option');
                defaultOpt.value = "";
                defaultOpt.innerText = field.placeholder || "Seleziona un'opzione...";
                defaultOpt.disabled = true;
                defaultOpt.selected = true;
                input.appendChild(defaultOpt);

                field.options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.innerText = opt;
                    input.appendChild(o);
                });

                wrapper.appendChild(input);
            } else if (field.type === 'file') {
                const uploadWrapper = document.createElement('div');
                uploadWrapper.className = 'file-upload-wrapper';

                const customInput = document.createElement('div');
                customInput.className = 'file-custom-input';
                customInput.innerHTML = `
                    <div class="file-icon">📁</div>
                    <div class="file-info">
                        <span class="file-label">Scegli file...</span>
                        <span class="file-name">Nessun file selezionato</span>
                    </div>
                `;

                input = document.createElement('input');
                input.type = 'file';
                input.className = 'hidden-file-input';
                input.name = field.name;
                input.id = `field-${field.name}`;
                if (field.required) input.required = true;
                if (field.accept) input.accept = field.accept;

                input.addEventListener('change', (e) => {
                    const fileName = e.target.files[0]?.name || "Nessun file selezionato";
                    customInput.querySelector('.file-name').innerText = fileName;
                    customInput.querySelector('.file-label').innerText = "File caricato!";
                    customInput.style.borderColor = "#FFCC00";
                    customInput.style.background = "rgba(255, 204, 0, 0.05)";
                });

                uploadWrapper.appendChild(customInput);
                uploadWrapper.appendChild(input);
                wrapper.appendChild(uploadWrapper);

            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'renga-input renga-textarea';
                input.name = field.name;
                input.id = `field-${field.name}`;
                if (field.required) input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                if (field.max_length) input.maxLength = field.max_length;

                wrapper.appendChild(input);

                // Add Char Counter
                if (field.max_length) {
                    const counter = document.createElement('div');
                    counter.className = 'char-counter';
                    counter.innerText = `0 / ${field.max_length}`;
                    wrapper.appendChild(counter);

                    input.addEventListener('input', () => {
                        const count = input.value.length;
                        counter.innerText = `${count} / ${field.max_length}`;
                        if (count >= field.max_length) {
                            counter.classList.add('limit-reached');
                        } else {
                            counter.classList.remove('limit-reached');
                        }
                    });
                }
            } else {
                input = document.createElement('input');
                input.type = field.type;
                input.className = 'renga-input';
                input.name = field.name;
                input.id = `field-${field.name}`;
                if (field.required) input.required = true;
                if (field.placeholder) input.placeholder = field.placeholder;
                wrapper.appendChild(input);
            }

            // Generic DNA Inspector for wrapper
            wrapper.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    console.group('🧬 DNA INSPECTOR: Field');
                    console.log('Name:', field.name);
                    console.log('Type:', field.type);
                    console.groupEnd();
                }
            });

            // Conditional Logic for generic inputs
            if (input && field.type !== 'radio') {
                input.addEventListener('change', () => {
                    triggerConditionalLogic(form, schema, field.name, input.value);
                });
            }

            if (field.help) {
                const help = document.createElement('div');
                help.className = 'help-text';
                help.innerText = field.help;
                wrapper.appendChild(help);
            }

            grid.appendChild(wrapper);
        });

        sectionEl.appendChild(grid);
        form.appendChild(sectionEl);

        setTimeout(() => sectionEl.classList.add('active'), 100 * (index + 1));
    });

    // Submit Button
    const submitContainer = document.createElement('div');
    submitContainer.className = 'submit-container reveal';
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'renga-submit-btn';
    btn.innerText = 'INVIA ISCRIZIONE';
    submitContainer.appendChild(btn);
    form.appendChild(submitContainer);

    setTimeout(() => submitContainer.classList.add('active'), 1000);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const result = {};

        // Ensure we preserve File objects
        for (let [key, value] of data.entries()) {
            result[key] = value;
        }

        // Advanced Validation
        if (result.authorize_pilot_profile === 'SI' && result.pilot_bio) {
            if (result.pilot_bio.length > 500) {
                alert('La biografia supera il limite di 500 caratteri.');
                return;
            }
        }

        onSubmitCallback(result);
    });

    outlet.innerHTML = '';
    outlet.appendChild(form);

    // Re-trigger reveal animations
    if (window.dispatchEvent) {
        window.dispatchEvent(new Event('scroll'));
    }
}

function triggerConditionalLogic(form, schema, fieldName, value) {
    schema.sections.forEach(s => {
        s.fields.forEach(f => {
            if (f.condition && f.condition.field === fieldName) {
                const depWrapper = form.querySelector(`[data-field-name="${f.name}"]`);
                if (depWrapper) {
                    const isVisible = value === f.condition.value;
                    depWrapper.style.display = isVisible ? 'flex' : 'none';
                    if (isVisible) {
                        depWrapper.classList.add('reveal', 'active');
                    }
                }
            }
        });
    });
}

