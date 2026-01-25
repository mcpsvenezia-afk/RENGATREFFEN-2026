/**
 * 🧬 PLUGIN: Vanilla Dynamic Form Engine v1.1.0
 * Goal: Render complex multi-section forms with Premium Renga Aesthetics
 * Status: MANDATORY | Priority: HIGH
 */

export function renderDynamicForm(schema, outletId, onSubmitCallback) {
    const outlet = document.getElementById(outletId);
    if (!outlet) return;

    console.log(`[DNA] Rendering Form: ${schema.meta.name} v${schema.meta.version}`);

    // Create Form Container
    const form = document.createElement('form');
    form.id = `form-${schema.meta.id}`;
    form.className = 'renga-dynamic-form';

    // Style the form container via injected CSS for cleaner logic
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
            }
            .renga-input:focus {
                outline: none !important;
                background: #232330 !important;
                border-color: #FFCC00 !important;
                box-shadow: 0 0 20px rgba(255, 204, 0, 0.15) !important;
            }
            .renga-select {
                appearance: none !important;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFCC00' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
                background-repeat: no-repeat !important;
                background-position: right 1.2rem center !important;
                background-size: 1.2em !important;
            }
            .renga-textarea {
                min-height: 150px !important;
                resize: vertical !important;
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

            // Handle Conditional Visibility
            if (field.condition) {
                wrapper.style.display = 'none';
            }

            const label = document.createElement('label');
            label.innerHTML = `${field.label} ${field.required ? '<span style="color: #E6007E">*</span>' : ''}`;
            wrapper.appendChild(label);

            let input;
            if (field.type === 'select') {
                input = document.createElement('select');
                input.className = 'renga-input renga-select';

                const defaultOpt = document.createElement('option');
                defaultOpt.value = "";
                defaultOpt.innerText = "Seleziona...";
                defaultOpt.disabled = true;
                defaultOpt.selected = true;
                input.appendChild(defaultOpt);

                field.options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt;
                    o.innerText = opt;
                    input.appendChild(o);
                });
            } else if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.className = 'renga-input renga-textarea';
            } else {
                input = document.createElement('input');
                input.type = field.type;
                input.className = 'renga-input';
            }

            input.name = field.name;
            input.id = `field-${field.name}`;
            if (field.required) input.required = true;
            if (field.placeholder) input.placeholder = field.placeholder;

            // DNA Inspector (Ctrl + Click)
            input.addEventListener('click', (e) => {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    console.group('🧬 DNA INSPECTOR: Field');
                    console.log('Name:', field.name);
                    console.log('Type:', field.type);
                    console.log('Required:', field.required);
                    console.groupEnd();
                    alert(`🧬 DNA DETECTED\nField: ${field.name}\nLogic: ${field.type}\nCheck console for payload.`);
                }
            });

            // Conditional Logic Event
            input.addEventListener('change', () => {
                // Check other fields that might depend on this one
                schema.sections.forEach(s => {
                    s.fields.forEach(f => {
                        if (f.condition && f.condition.field === field.name) {
                            const depWrapper = form.querySelector(`[data-field-name="${f.name}"]`);
                            if (depWrapper) {
                                depWrapper.style.display = input.value === f.condition.value ? 'flex' : 'none';
                                const depInput = depWrapper.querySelector('.renga-input');
                                if (depInput) depInput.required = (input.value === f.condition.value && f.required);
                            }
                        }
                    });
                });
            });

            wrapper.appendChild(input);

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

        // 🧬 DYNAMIC REVEAL TRIGGER
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
        for (let [key, value] of data.entries()) {
            result[key] = value;
        }

        // Custom Validation for Bio (min words if authorized)
        if (result.authorize_pilot_profile === 'SI' && result.pilot_bio) {
            const words = result.pilot_bio.trim().split(/\s+/).length;
            if (words < 200) {
                alert('La biografia deve contenere almeno 200 parole.');
                return;
            }
        }

        onSubmitCallback(result);
    });

    outlet.innerHTML = '';
    outlet.appendChild(form);
}
