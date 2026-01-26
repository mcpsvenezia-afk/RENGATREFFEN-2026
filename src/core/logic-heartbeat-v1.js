const fs = require('fs');
const path = require('path');

/**
 * 🧬 HEARTBEAT v1.0
 * Automated mapping and convention validation for Renga Treffen 2026.
 */

const TARGET_DIRECTORIES = {
    skills: './skills',
    plugins: './src/plugins',
    schemas: './src/schemas'
};

const LOG_DIR = './docs/heartbeats';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

function isKebabCase(str) {
    return /^[a-z0-9]+(-[a-z0-9]+)*(\.[a-z0-9]+)*$/.test(str);
}

function runHeartbeat() {
    const timestamp = new Date().toISOString();
    const fileName = `HB_${new Date().getTime()}.md`;
    const logPath = path.join(LOG_DIR, fileName);

    let report = `# 💓 BLITZ HEARTBEAT v1.0\n`;
    report += `**Timestamp:** ${timestamp}\n\n`;
    report += `--- \n\n`;

    let totalFiles = 0;
    let errors = [];

    for (const [key, dirPath] of Object.entries(TARGET_DIRECTORIES)) {
        report += `## 📂 Directory: ${key}\n`;

        if (!fs.existsSync(dirPath)) {
            report += `⚠️ Directory not found: ${dirPath}\n\n`;
            continue;
        }

        const files = fs.readdirSync(dirPath);
        totalFiles += files.length;

        if (files.length === 0) {
            report += `*Empty*\n\n`;
        } else {
            files.forEach(file => {
                const isValid = isKebabCase(file);
                const status = isValid ? '✅' : '❌';
                report += `- [${status}] \`${file}\`\n`;

                if (!isValid) {
                    errors.push({ dir: key, file: file, error: 'Non-kebab-case naming' });
                }
            });
            report += `\n`;
        }
    }

    report += `--- \n\n`;
    report += `## 📊 SUMMARY\n`;
    report += `- **Total Files Scanned:** ${totalFiles}\n`;
    report += `- **Convention Errors:** ${errors.length}\n\n`;

    if (errors.length > 0) {
        report += `### ❌ CONVENTION BUGS FOUND\n`;
        errors.forEach(err => {
            report += `- \`${err.dir}/${err.file}\`: ${err.error}\n`;
        });
    } else {
        report += `### ✅ SYSTEM COMPLIANT\n`;
        report += `All analyzed components follow the **BLITZ_CONVENTION_v1** protocol.\n`;
    }

    fs.writeFileSync(logPath, report);
    console.log(`Heartbeat generated: ${logPath}`);
}

try {
    runHeartbeat();
} catch (error) {
    console.error(`Heartbeat failed: ${error.message}`);
    process.exit(1);
}
