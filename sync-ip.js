
const os = require('os');
const fs = require('fs');
const path = require('path');

// --- ⚙️ CONFIGURATION ---
const MOBILE_CONFIG_PATH = path.join(__dirname, 'mission17-mobile', 'src', 'config', 'api.ts');
const BACKEND_ENV_PATH = path.join(__dirname, 'mission17-backend', '.env');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    const candidates = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4
            if (iface.family === 'IPv4' && !iface.internal) {
                const ip = iface.address;
                // Skip common virtual network ranges
                if (ip.startsWith('192.168.56.') || ip.startsWith('192.168.99.') || ip.startsWith('172.')) {
                    continue;
                }
                candidates.push({ name, ip });
            }
        }
    }

    // 1. Prioritize Wi-Fi
    const wifi = candidates.find(c => c.name.toLowerCase().includes('wi-fi') || c.name.toLowerCase().includes('wifi'));
    if (wifi) return wifi.ip;

    // 2. Prioritize 192.168.1.x or 192.168.0.x (common home LANs)
    const lan = candidates.find(c => c.ip.startsWith('192.168.1.') || c.ip.startsWith('192.168.0.'));
    if (lan) return lan.ip;

    // 3. Fallback to any candidate
    if (candidates.length > 0) return candidates[0].ip;

    return '127.0.0.1';
}

function updateMobileConfig(ip) {
    if (!fs.existsSync(MOBILE_CONFIG_PATH)) {
        console.warn(`⚠️  Mobile config not found at: ${MOBILE_CONFIG_PATH}`);
        return;
    }
    let content = fs.readFileSync(MOBILE_CONFIG_PATH, 'utf8');
    const regex = /const LAN_IP = ".*";/g;
    const newContent = content.replace(regex, `const LAN_IP = "${ip}";`);
    
    if (content !== newContent) {
        fs.writeFileSync(MOBILE_CONFIG_PATH, newContent, 'utf8');
        console.log(`✅ Updated Mobile Config (api.ts) -> ${ip}`);
    } else {
        console.log(`ℹ️  Mobile Config already set to ${ip}`);
    }
}

function updateBackendEnv(ip) {
    if (!fs.existsSync(BACKEND_ENV_PATH)) {
        console.warn(`⚠️  Backend .env not found at: ${BACKEND_ENV_PATH}`);
        return;
    }
    let content = fs.readFileSync(BACKEND_ENV_PATH, 'utf8');
    const regex = /AI_SERVER_URL="http:\/\/.*:5000\/predict"/g;
    const newContent = content.replace(regex, `AI_SERVER_URL="http://${ip}:5000/predict"`);

    if (content !== newContent) {
        fs.writeFileSync(BACKEND_ENV_PATH, newContent, 'utf8');
        console.log(`✅ Updated Backend Env (.env)     -> ${ip}`);
    } else {
        console.log(`ℹ️  Backend Env already set to ${ip}`);
    }
}

// --- 🚀 EXECUTION ---
console.log("🔍 Detecting local IP address...");
const ip = getLocalIp();
console.log(`📍 Found IP: ${ip}\n`);

updateMobileConfig(ip);
updateBackendEnv(ip);

console.log("\n🚀 All synced! You can now restart your servers and the APK.");
