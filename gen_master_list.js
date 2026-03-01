const fs = require('fs');

const codes = JSON.parse(fs.readFileSync('correct_original_codes.json', 'utf-8'));
const WHATSAPP_MESSAGES_FILE = 'game/v5/whatsapp_pack/all_player_messages.md';
const RUNDOWN_FILE = 'game/v5/final_rundown.md';

function extractWhatsAppDetails() {
    const rawText = fs.readFileSync(WHATSAPP_MESSAGES_FILE, 'utf-8');
    const sections = rawText.split('## ');
    const dict = {};
    sections.forEach(section => {
        if (!section.trim()) return;
        const lines = section.split('\n');
        const name = lines[0].trim();
        let profile = '', mission = '', evidence = '';
        lines.forEach(line => {
            if (line.includes('- Public profile:')) profile = line.split('- Public profile:')[1].trim();
            if (line.includes('- Live mission:')) mission = line.split('- Live mission:')[1].trim();
            if (line.includes('- Evidence lane:')) evidence = line.split('- Evidence lane:')[1].trim();
        });
        dict[name] = { profile, mission, evidence };
    });
    return dict;
}

const markdown = fs.readFileSync(RUNDOWN_FILE, 'utf-8');
const detailsDict = extractWhatsAppDetails();
const lines = markdown.split('\n');
const guests = [];
let inTable = false;
for (const line of lines) {
    if (line.includes('| Name | Team |')) {
        inTable = true;
        continue;
    }
    if (inTable && line.startsWith('|---')) continue;
    if (inTable && line.startsWith('|')) {
        const parts = line.split('|').map(s => s.trim()).filter(s => s);
        if (parts.length >= 5 && parts[0] !== 'Name') {
            const name = parts[0];
            const data = detailsDict[name] || {};
            guests.push({
                name: name,
                team: parts[1],
                code: codes[name] || 'N/A',
                evidence: data.evidence || 'None (Buffer Char)'
            });
        }
    }
}

// Add buffer characters manually from previous history if not in table
const bufferChars = [
    'Vishnupriya', 'Surabhi Solanki', 'The Midnight Intern', 'The IT Support'
];

bufferChars.forEach(name => {
    if (!guests.some(g => g.name === name)) {
        guests.push({
            name: name,
            team: 'Various',
            code: codes[name] || 'N/A',
            evidence: 'Context Clue'
        });
    }
});

let out = '# FINAL MASTER GUEST LIST & ACCESS CODES\n\n';
out += '| Name | Team | Access Code | Evidence |\n';
out += '|---|---|---|---|\n';
guests.sort((a, b) => a.name.localeCompare(b.name)).forEach(g => {
    out += `| ${g.name} | ${g.team} | **${g.code}** | ${g.evidence} |\n`;
});

fs.writeFileSync('MASTER_GUEST_LIST.md', out);
console.log('Generated MASTER_GUEST_LIST.md');
