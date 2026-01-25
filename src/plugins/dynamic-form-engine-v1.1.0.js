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
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 2.5rem;
                backdrop-filter: blur(10px);
                transition: transform 0.3s ease;
            }
            .form-section:hover {
                border-color: rgba(255, 204, 0, 0.3);
            }
            .section-title {
                font-family: 'Outfit', sans-serif;
                font-size: 1.5rem;
                font-weight: 900;
                color: #FFCC00;
                margin-bottom: 2rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .section-title::before {
                content: '';
                width: 4px;
                height: 24px;
                background: #E6007E;
                border-radius: 2px;
            }
            .form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 1.5rem;
            }
            .field-wrapper {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .field-wrapper label {
                font-size: 0.8rem;
                font-weight: 800;
                color: #aaa;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .renga-input {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 1rem;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            .renga-input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.1);
                border-color: #FFCC00;
                box-shadow: 0 0 15px rgba(255, 204, 0, 0.1);
            }
            .renga-select {
                appearance: none;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23FFCC00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: right 1rem center;
                background-size: 1.2em;
            }
            .renga-textarea {
                min-height: 120px;
                resize: vertical;
            }
            .submit-container {
                position: sticky;
                bottom: 2rem;
                z-index: 10;
                padding-top: 2rem;
            }
            .renga-submit-btn {
                width: 100%;
                background: linear-gradient(135deg, #FFCC00 0%, #FFB300 100%);
                color: #000;
                border: none;
                padding: 1.5rem;
                border-radius: 100px;
                font-family: 'Outfit', sans-serif;
                font-weight: 900;
                font-size: 1.2rem;
                text-transform: uppercase;
                letter-spacing: 2px;
                cursor: pointer;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                box-shadow: 0 10px 30px rgba(255, 204, 0, 0.3);
            }
            .renga-submit-btn:hover {
                transform: translateY(-5px) scale(1.02);
                box-shadow: 0 15px 40px rgba(255, 204, 0, 0.5);
            }
            .help-text {
                font-size: 0.75rem;
                color: #E6007E;
                font-style: italic;
                margin-top: 0.2rem;
            }
            @media (max-width: 600px) {
                .form-section { padding: 1.5rem; }
                .section-title { font-size: 1.2rem; }
            }
        `;
        document.head.appendChild(style);
    }

    // Render Sections
    schema.sections.forEach(section => {
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
    });

    // Submit Button
    const submitContainer = document.createElement('div');
    submitContainer.className = 'submit-container';
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'renga-submit-btn';
    btn.innerText = 'Invia Pre-Iscrizione';
    submitContainer.appendChild(btn);
    form.appendChild(submitContainer);

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

    // Re-trigger reveal animations if exists
    if (window.dispatchEvent) {
        window.dispatchEvent(new Event('scroll'));
    }
}
