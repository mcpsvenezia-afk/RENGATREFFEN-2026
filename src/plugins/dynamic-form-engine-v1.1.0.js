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
            }
            .renga-input:focus {
                outline: none !important;
                background: #232330 !important;
                border-color: #FFCC00 !important;
                box-shadow: 0 0 20px rgba(255, 204, 0, 0.15) !important;
            }
            
            /* Radio Group Styles */
            .radio-group {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            .radio-item {
                flex: 1;
                min-width: 120px;
            }
            .radio-item input {
                display: none;
            }
            .radio-item label {
                display: block;
                padding: 1rem;
                background: #1a1a23;
                border: 1px solid #333340;
                border-radius: 12px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
                font-weight: 800;
                color: #888;
            }
            .radio-item input:checked + label {
                background: #FFCC00;
                color: #000;
                border-color: #FFCC00;
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.3);
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
                        schema.sections.forEach(s => {
                            s.fields.forEach(f => {
                                if (f.condition && f.condition.field === field.name) {
                                    const depWrapper = form.querySelector(`[data-field-name="${f.name}"]`);
                                    if (depWrapper) {
                                        depWrapper.style.display = radio.value === f.condition.value ? 'flex' : 'none';
                                        const depInput = depWrapper.querySelector('.renga-input, .radio-group');
                                        // Handle input inside depWrapper
                                    }
                                }
                            });
                        });
                    });

                    item.appendChild(radio);
                    item.appendChild(radioLabel);
                    radioGroup.appendChild(item);
                });
                wrapper.appendChild(radioGroup);
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

            // Conditional Logic for inputs (non-radio)
            if (input && field.type !== 'radio') {
                input.addEventListener('change', () => {
                    schema.sections.forEach(s => {
                        s.fields.forEach(f => {
                            if (f.condition && f.condition.field === field.name) {
                                const depWrapper = form.querySelector(`[data-field-name="${f.name}"]`);
                                if (depWrapper) {
                                    depWrapper.style.display = input.value === f.condition.value ? 'flex' : 'none';
                                }
                            }
                        });
                    });
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
