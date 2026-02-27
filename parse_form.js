const fs = require('fs');
const html = fs.readFileSync('/tmp/form.html', 'utf8');

// The form data is usually in a variable starting with FB_PUBLIC_LOAD_DATA_
let match = html.match(/var FB_PUBLIC_LOAD_DATA_ = (\[.*\]);/);
if (match) {
    try {
        const data = JSON.parse(match[1]);
        const fields = data[1][1];
        fields.forEach(f => {
            console.log(`Field Name: ${f[1]}`);
            console.log(`  ID (entry.X): entry.${f[4][0][0]}`);
            console.log(`  Type: ${f[3]} (0=text, 1=paragraph, 2=multiple choice, 3=dropdown, 4=checkbox)`);
            if (f[4][0][2]) {
                console.log(`  Required: !!(${f[4][0][2]})`);
            }
            if (f[4][0][1]) {
                console.log(`  Options: ${f[4][0][1].map(o => o[0]).join(', ')}`);
            }
            console.log('---');
        });
    } catch (e) {
        console.log("Error parsing JSON");
    }
} else {
    console.log("FB_PUBLIC_LOAD_DATA_ not found");

    // Try extracting directly from inputs
    const inputRegex = /<input[^>]*name="entry\.(\d+)"[^>]*>/g;
    let inputMatch;
    while ((inputMatch = inputRegex.exec(html)) !== null) {
        console.log(`Found input for entry.${inputMatch[1]}`);
    }
}
