import React, { useState } from 'react';

/**
 * 🧬 PLUGIN: Dynamic Form Engine v1
 * ID: plugin-dynamic-form-engine-v1
 * Context: Carbon Style UI Generator
 */

const DynamicFormEngine = ({ schema, onSubmit }) => {
    const [formData, setFormData] = useState({});

    const handleChange = (e, fieldName) => {
        setFormData({
            ...formData,
            [fieldName]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // 🧬 UNIVERSAL DEV MODE (Ctrl + Click)
    const handleInspect = (e, field) => {
        if (e.ctrlKey || e.metaKey) {
            e.stopPropagation();
            e.preventDefault();
            console.group('🧬 DNA INSPECTOR: Form Field');
            console.log('ID:', `field-${field.name}`);
            console.log('Version:', '1.0.0');
            console.log('Base Plugin:', 'plugin-dynamic-form-engine-v1');
            console.log('Schema Def:', field);
            console.log('Current Value:', formData[field.name]);
            console.groupEnd();
            alert(`🧬 DNA DETECTED\nField: ${field.name}\nType: ${field.type}\nCheck Console for full payload.`);
        }
    };

    if (!schema || !schema.fields) return <div>No Schema Loaded</div>;

    return (
        <div className="carbon-form-container" style={{
            fontFamily: '"Inter", sans-serif',
            padding: '2rem',
            backgroundColor: '#161616', // Carbon Gray 100
            border: '1px solid #393939',
            color: '#f4f4f4',
            maxWidth: '600px',
            margin: '0 auto'
        }}>
            <h2 style={{
                borderBottom: '2px solid #FFCC00',
                paddingBottom: '1rem',
                marginBottom: '2rem',
                color: '#f4f4f4',
                fontSize: '1.5rem',
                letterSpacing: '0.5px'
            }}>
                {schema.meta?.description || 'Modulo Iscrizione'}
            </h2>

            <form onSubmit={handleSubmit}>
                {schema.fields.map((field) => (
                    <div
                        key={field.name}
                        className="form-group"
                        style={{ marginBottom: '1.5rem', position: 'relative' }}
                        onClick={(e) => handleInspect(e, field)}
                        title="Ctrl + Click to Inspect DNA"
                    >
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontWeight: '400',
                            fontSize: '0.875rem',
                            color: '#c6c6c6' // Carbon Gray 60
                        }}>
                            {field.label} {field.required && <span style={{ color: '#ff839b' }}>*</span>}
                        </label>
                        <input
                            type={field.type}
                            name={field.name}
                            required={field.required}
                            placeholder={field.placeholder}
                            onChange={(e) => handleChange(e, field.name)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderBottom: '1px solid #8d8d8d',
                                borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                                borderRadius: '0',
                                fontSize: '1rem',
                                backgroundColor: '#262626', // Carbon Gray 90
                                color: '#f4f4f4',
                                transition: 'all 0.1s ease',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderBottom = '2px solid #FFCC00';
                                e.target.style.backgroundColor = '#393939';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderBottom = '1px solid #8d8d8d';
                                e.target.style.backgroundColor = '#262626';
                            }}
                        />
                    </div>
                ))}

                <button
                    type="submit"
                    style={{
                        backgroundColor: '#FFCC00',
                        color: '#161616',
                        border: 'none',
                        padding: '1rem 2rem',
                        fontSize: '1rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        width: '100%',
                        marginTop: '2rem',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#ffdb4d'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#FFCC00'}
                >
                    CONFERMA ISCRIZIONE
                </button>
            </form>
        </div>
    );
};

export default DynamicFormEngine;
