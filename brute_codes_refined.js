const crypto = require('crypto');
const fs = require('fs');

const content = fs.readFileSync('old_db_hashes.js', 'utf-8');
const hashesToName = {};

// Simple regex to extract hash and name from the JS object format
const regex = /"([a-f0-9]{64})":\s*{\s*"name":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const hash = match[1];
    const encodedName = match[2];
    const name = Buffer.from(encodedName, 'base64').toString('utf-8');
    hashesToName[hash] = name;
}

const reversed = {};
for (let i = 10000; i <= 99999; i++) {
    const code = i.toString();
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hashesToName[hash]) {
        reversed[hashesToName[hash]] = code;
    }
}

console.log(JSON.stringify(reversed, null, 2));
