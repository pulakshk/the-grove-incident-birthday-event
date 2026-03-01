const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RUNDOWN_FILE = path.join(__dirname, 'game', 'v5', 'final_rundown.md');
const WHATSAPP_MESSAGES_FILE = path.join(__dirname, 'game', 'v5', 'whatsapp_pack', 'all_player_messages.md');

const TEAM_DRESSCODES = {
  'Startup Investors': 'Patagonia Vests & Finance Bro Chic',
  'Product Council': 'Turtlenecks & Visionary Core',
  'Engineering Blackbox': 'Dark Mode & Hackathon Hoodies',
  'Ops & Ground Truth': 'Tactical Execution Wear',
  'Culture & Narrative Lab': 'Pretentious Creatives',
  'Culture & Narrative/Media': 'Pretentious Creatives'
};

const TEAM_COLORS = {
  'Startup Investors': '#4CAF50',
  'Product Council': '#2196F3',
  'Engineering Blackbox': '#9C27B0',
  'Ops & Ground Truth': '#FF9800',
  'Culture & Narrative Lab': '#E91E63',
  'Culture & Narrative/Media': '#E91E63'
};

const TEAM_SUMMARIES = {
  'Startup Investors': 'Hold the cap table and the leverage. Looking for scapegoats to save their portfolio.',
  'Product Council': 'Wrote the roadmaps that failed. Trying to blame Engineering for the technical collapse.',
  'Engineering Blackbox': 'Ignored security flaws to force the launch. Trying to blame Product\'s impossible deadlines.',
  'Ops & Ground Truth': 'Hold the physical timeline of V\'s death. Trying to catch the other teams in lies.',
  'Culture & Narrative Lab': 'Spun the failure into a success story. Trying to figure out who gave them the fake data.'
};

const CHARACTER_QUIRKS = [
  "Speaks entirely in corporate buzzwords (synergy, bandwidth, pivot).",
  "Adjusts glasses/hair dramatically before dropping any evidence.",
  "Always acts like they are late for a very important Zoom meeting.",
  "Refuses to make eye contact when talking about the timeline.",
  "Constantly checks their crypto wallet on their phone during conversations.",
  "Takes physical notes on a notepad when other people speak.",
  "Interrupts people to correct their grammar or technical terminology.",
  "Speaks slightly too loud, as if pitching everything to an investor.",
  "Acts extremely paranoid, looking over their shoulder before sharing clues.",
  "Drops names of fake startup founders to sound important.",
  "Overly enthusiastic about 'the mission' despite the company collapsing.",
  "Pretends to know everything about AI, but clearly has no idea."
];

const EVIDENCE_CONTEXT = {
  'prod-deploy-log-7:03.txt': 'CONTEXT: This raw server log proves that the "Version 3" launch was actually a fake shadow deployment rolled back to an older version at exactly 19:03 PM.',
  'side-letter-v2-signed.pdf': 'CONTEXT: This secret legal agreement shows the Startup Investors demanded fraudulent performance metrics to inflate the company valuation.',
  'auth-vuln-P0-jira.pdf': 'CONTEXT: This high-severity bug report proves Engineering knew the system was critically broken and vulnerable before launch.',
  'cease-desist-draft.pdf': 'CONTEXT: This unreleased legal document shows Product Council was preparing to silence anyone who spoke up about the fake launch.',
  'inboard-notes-v-edit.pdf': 'CONTEXT: These heavily redacted meeting notes show a coordinated cover-up attempt to hide the 19:03 shadow deploy.',
  'treasury-map-Nov.xlsx': 'CONTEXT: This internal financial spreadsheet reveals massive, unrecorded money transfers happening right as the warnings were ignored.',
  'voice-clone-founder.m4a': 'CONTEXT: This horrifying audio clip reveals a generated deepfake of the founder, proving Culture & Media were altering reality.',
  'grove-commentary-gen-v4.txt': 'CONTEXT: This document shows the Culture team was pre-writing PR spin for a disaster they knew was coming.',
  'ab-test-raw-export.csv': 'CONTEXT: This raw data export proves the metrics fed to the press were completely fabricated.'
};

const PERSONAL_MEMORIES = {
  'Bharat Dhir': 'PERSONAL MEMORY: You were the one who found V\'s body inside Server Room 4 at 21:14 PM. The cooling system was completely overloaded. You haven\'t told anyone what you saw.',
  'Sajag Jain': 'PERSONAL MEMORY: At 21:00 PM, you received an urgent, off-the-books request from the executive floor to completely deactivate V\'s executive keycard. You clicked confirm.',
  'Anubhav Gaba': 'PERSONAL MEMORY: You are the engineer who pushed the execute button on the 19:03 Shadow Deploy. You knew the Version 3 code was fake.',
  'Kovid Poudel': 'PERSONAL MEMORY: At 21:05 PM, you triggered the remote server purge to wipe the logs of the Shadow Deploy. You didn\'t check if Server Room 4 was occupied.',
  'Siddak Bakshi': 'PERSONAL MEMORY: At 18:55 PM, you personally demanded Product to launch anyway, threatening to tank the company valuation if the metrics delayed.',
  'Aanak Sengupta': 'PERSONAL MEMORY: You received the critical instability warnings from Ops at 18:45 PM. You deliberately chose not to halt the launch.',
  'Pranjal Srivastava': 'PERSONAL MEMORY: At 19:15 PM, you were told the metrics were entirely fake. You wrote the press release celebrating the "record-breaking launch" anyway.',
  'Devashish Rane': 'PERSONAL MEMORY: You drafted a cease-and-desist letter at 20:30 PM aimed at silencing the engineers who were complaining about the shadow deploy.',
  'Manasi Chansoria': 'PERSONAL MEMORY: You warned the executives at 18:45 PM that Server Room 4 was overheating. They told you to stay quiet.',
  'Mehul Mohan': 'PERSONAL MEMORY: You told the Product Council "I do not care if it\'s broken. Give me a green dashboard today." You forced the shadow deploy.',
  'Shubham Jain': 'PERSONAL MEMORY: You built the fake performance model that fed rigged data to the investors.',
  'Abhishek Gosavi': 'PERSONAL MEMORY: You actively buried the Jira tickets from the engineering floor so the press wouldn\'t find out about the leaks.',
  'Prachi Verma': 'PERSONAL MEMORY: You were manning the security desk. You watched V walk into Server Room 4 on the cameras at 20:15 PM and said nothing.'
};

function extractWhatsAppDetails() {
  const rawText = fs.readFileSync(WHATSAPP_MESSAGES_FILE, 'utf-8');
  const sections = rawText.split('## ');
  const dict = {};

  sections.forEach(section => {
    if (!section.trim()) return;
    const lines = section.split('\n');
    const name = lines[0].trim();

    let profile = '';
    let mission = '';
    let evidence = '';

    lines.forEach(line => {
      if (line.includes('- Public profile:')) profile = line.split('- Public profile:')[1].trim();
      if (line.includes('- Live mission:')) mission = line.split('- Live mission:')[1].trim();
      if (line.includes('- Evidence lane:')) evidence = line.split('- Evidence lane:')[1].trim();
    });

    dict[name] = { profile, mission, evidence };
  });
  return dict;
}

async function generateHTMLPosters() {
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

        let finalClue = data.evidence ? 'You hold the access to: ' + data.evidence : 'No physical evidence provided. Rely on your testimony.';
        if (data.evidence && EVIDENCE_CONTEXT[data.evidence]) {
          finalClue += '\n\n' + EVIDENCE_CONTEXT[data.evidence];
        }
        if (PERSONAL_MEMORIES[name]) {
          finalClue += '\n\n' + PERSONAL_MEMORIES[name];
        }

        guests.push({
          name: name,
          team: parts[1],
          role: parts[3],
          mission: data.mission || parts[4],
          quirk: CHARACTER_QUIRKS[Math.floor(Math.random() * CHARACTER_QUIRKS.length)],
          profile: data.profile || 'Standard employee profile.',
          clue: finalClue
        });
      }
    }
  }

  // Inject Vishnupriya
  if (!guests.some(g => g.name === 'Vishnupriya')) {
    guests.push({
      name: 'Vishnupriya',
      team: 'Startup Investors',
      role: "The Founder's Plus-One",
      mission: 'Convince two strangers that Mehul is completely innocent before Round 2.',
      quirk: 'Defends Mehul aggressively, even when no one is attacking him.',
      profile: 'Partner to the Tech founder. Trusts him completely minus one small detail.',
      clue: 'Clue: "I saw Mehul checking his phone nervously at 19:03 PM. What happened at 19:03?"\n\nCONTEXT: This testimony proves that someone in the Investor team was aware of unfolding events right as the shadow deploy occurred.'
    });
  }

  // Inject Surabhi Solanki
  if (!guests.some(g => g.name === 'Surabhi Solanki')) {
    guests.push({
      name: 'Surabhi Solanki',
      team: 'Engineering Blackbox',
      role: "The Data Scientist's Plus-One",
      mission: 'Defend Shubham\'s data models to everyone you meet. Prove his spreadsheets were pristine.',
      quirk: 'Gasps dramatically whenever someone mentions a database crash.',
      profile: 'Partner to Shubham Jain. Knows exactly how many hours he spent building the performance model.',
      clue: 'Clue: "Shubham told me his model was perfect, but Product forced him to change the outputs for the investors."\n\nCONTEXT: This proves that the Engineering team was pressured into falsifying data by the Product Council.'
    });
  }

  // Inject Buffer Character 1
  if (!guests.some(g => g.name === 'The Midnight Intern')) {
    guests.push({
      name: 'The Midnight Intern',
      team: 'Culture & Narrative Lab',
      role: "Unpaid Intern",
      mission: 'Ask someone for sign-off on a document that doesn\'t exist. Look extremely panicked.',
      quirk: 'Constantly mentions how you need this internship for your college credits.',
      profile: 'An intern who was locked in a closet during the launch party by accident.',
      clue: 'Clue: "I found a shredded paper near the printer at 8:30 PM. It had the word \'Liability\' circled in red ink."\n\nCONTEXT: This proves that someone was deliberately destroying evidence during "The Silent Hour" when the Founder was dying.'
    });
  }

  // Inject Buffer Character 2
  if (!guests.some(g => g.name === 'The IT Support')) {
    guests.push({
      name: 'The IT Support',
      team: 'Ops & Ground Truth',
      role: "Freelance IT Guy",
      mission: 'Check everyone\'s phone to ensure they don\'t have the company malware.',
      quirk: 'Asks everyone if they have tried turning it off and on again before listening to them.',
      profile: 'The guy who actually set up the WiFi at the party. Hates the engineering team.',
      clue: 'Clue: "The server logs show a massive data wipe was initiated from the VIP room at exactly 8:15 PM."\n\nCONTEXT: This timeline proves that an executive triggered the data wipe right as the founder began his own independent investigation.'
    });
  }

  // Generate the company map HTML block
  let rosterHTML = '';
  const groupedGuests = {};
  guests.forEach(g => {
    if (!groupedGuests[g.team]) groupedGuests[g.team] = [];
    groupedGuests[g.team].push(g);
  });

  for (const [team, members] of Object.entries(groupedGuests)) {
    rosterHTML += `<div class="team-block" style="border-left: 4px solid ${TEAM_COLORS[team] || '#fff'}; padding-left: 20px; margin-bottom: 30px;">`;
    rosterHTML += `<h3 style="color: ${TEAM_COLORS[team] || '#fff'}; margin-top: 0; font-size: 26px;">${team}</h3>`;
    members.forEach(m => {
      rosterHTML += `<p style="margin: 5px 0; font-size: 20px;"><strong>${m.name}</strong> - <span style="color: #A39B8A">${m.role.split('-')[0].trim()}</span></p>`;
    });
    rosterHTML += `</div>`;
  }

  const outDir = path.join(__dirname, 'ultimate_posters');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

  const browser = await puppeteer.launch({ headless: true });

  const clueDatabase = {};

  for (const guest of guests) {
    const page = await browser.newPage();

    // Generate a random 5-digit code
    const accessCode = Math.floor(10000 + Math.random() * 90000).toString();
    const hashedCode = crypto.createHash('sha256').update(accessCode).digest('hex');

    // Save to DB
    clueDatabase[hashedCode] = {
      name: Buffer.from(guest.name).toString('base64'),
      team: Buffer.from(guest.team).toString('base64'),
      clueText: Buffer.from(guest.clue).toString('base64')
    };

    // Check which team possesses the artifact they need to ask.
    // Default sending instruction based on Team dynamics.
    let instruction = "Show your clue to NO ONE until the 8:36 PM Evidence Exchange.";
    if (guest.team === 'Startup Investors') instruction = "Ask Engineering Blackbox about the deploy logs.";
    if (guest.team === 'Engineering Blackbox') instruction = "Ask Product Council about the scope changes.";
    if (guest.team === 'Product Council') instruction = "Ask Ops & Ground Truth when V actually died.";
    if (guest.team === 'Ops & Ground Truth') instruction = "Monitor all other team claims. Catch their timeline lies.";

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Inter:wght@300;400;600;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        body { margin: 0; padding: 0; background: #0A0A09; color: #EFEBE1; font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .wrapper { width: 1080px; padding: 80px; position: relative; }
        
        .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 40px; margin-bottom: 60px; }
        .eyebrow { font-family: 'Space Mono', monospace; color: #C9A84C; font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 20px; }
        .logo { font-family: 'Playfair Display', serif; font-weight: 900; font-size: 90px; margin: 0; line-height: 1; color: #fff; }
        .subtitle { font-family: 'Playfair Display', serif; font-style: italic; font-size: 32px; color: #7A5F28; margin-top: 20px; }

        .section-title { font-family: 'Space Mono', monospace; font-size: 30px; color: #C9A84C; margin-bottom: 25px; letter-spacing: 2px; text-transform: uppercase; border-bottom: 1px dashed #333; padding-bottom: 15px; margin-top: 60px;}

        .card { background: #141311; border: 1px solid #2A2824; border-radius: 12px; padding: 50px; margin-bottom: 20px; }
        .card-row { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .card-row:last-child { margin-bottom: 0; }
        .col { width: 48%; }
        
        .label { color: #A39B8A; font-size: 20px; text-transform: uppercase; font-family: 'Space Mono', monospace; margin-bottom: 10px; }
        .value { font-size: 42px; font-weight: 800; }
        .value.highlight { color: ${TEAM_COLORS[guest.team] || '#C9A84C'}; }
        
        .bio-text { font-size: 28px; line-height: 1.5; color: #D4C4A0; border-left: 4px solid #333; padding-left: 20px; margin-top: 30px;}

        .mission-box { background: rgba(201,168,76,0.05); border: 2px solid rgba(201,168,76,0.3); border-left: 8px solid #C9A84C; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .mission-text { font-size: 34px; line-height: 1.4; font-weight: 600; color: #fff; }

        .clue-box { background: rgba(33, 150, 243, 0.05); border: 2px solid rgba(33, 150, 243, 0.3); border-left: 8px solid #2196F3; padding: 40px; border-radius: 12px; margin-bottom: 30px; }
        .clue-text { font-size: 40px; line-height: 1.4; color: #fff; font-family: 'Space Mono', monospace; }

        .quirk-box { background: rgba(217,83,79,0.1); border: 2px solid rgba(217,83,79,0.3); padding: 40px; border-radius: 12px; text-align: center; }
        .quirk-label { color: #D9534F; font-size: 24px; font-family: 'Space Mono', monospace; font-weight: bold; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 3px; }
        .quirk-text { font-size: 32px; font-weight: 600; color: #fff; }

        .team-bg { font-size: 26px; color: #A39B8A; line-height: 1.5; padding: 40px; background: #141311; border-radius: 12px; }

        .roster-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

        .footer { text-align: center; margin-top: 80px; font-size: 24px; color: #555; font-family: 'Space Mono', monospace; }
        
        .top-secret-stamp {
          position: absolute;
          top: 100px;
          right: 40px;
          border: 6px solid #D9534F;
          color: #D9534F;
          padding: 10px 30px;
          font-size: 40px;
          font-family: 'Space Mono', monospace;
          font-weight: 700;
          transform: rotate(25deg);
          letter-spacing: 5px;
          border-radius: 10px;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="top-secret-stamp">DIGITAL IDENTITY</div>
        
        <div class="header">
          <div class="eyebrow">READ OFF PHONE DURING GAMEPLAY</div>
          <h1 class="logo">THE GROVE INCIDENT</h1>
          <div class="subtitle">This is your complete role package. Do not share.</div>
        </div>

        <div class="card">
          <div class="card-row">
            <div class="col">
              <div class="label">Subject Identity</div>
              <div class="value">${guest.name}</div>
            </div>
            <div class="col">
              <div class="label">Assigned Role</div>
              <div class="value highlight">${guest.role.split('-')[1]?.trim() || guest.role}</div>
            </div>
          </div>
          <div class="card-row">
            <div class="col">
              <div class="label">Team / Faction</div>
              <div class="value">${guest.team}</div>
            </div>
            <div class="col">
              <div class="label">Dresscode Focus</div>
              <div class="value" style="font-size: 30px;">${TEAM_DRESSCODES[guest.team] || 'Dark mode'}</div>
            </div>
          </div>
          <div class="bio-text">
            <strong>Background:</strong> ${guest.profile}
          </div>
        </div>

        <div class="section-title">01 // Mandatory Quirk</div>
        <div class="quirk-box">
          <div class="quirk-label">Roleplay Instruction</div>
          <div class="quirk-text">"${guest.quirk}"</div>
        </div>

        <div class="section-title">02 // Your Objectives</div>
        <div class="mission-box">
          <div class="label" style="color:#C9A84C;">Primary Action:</div>
          <div class="mission-text">${guest.mission}</div>
        </div>

        <div class="section-title">03 // Encrypted Evidence Locker</div>
        <div class="clue-box">
          <div class="label" style="color:#2196F3;">Your Artifact Access Code:</div>
          <div class="clue-text" style="font-size: 60px; text-align: center; letter-spacing: 15px; margin: 30px 0; font-weight: bold;">${accessCode}</div>
          <div class="label" style="color:#2196F3;">DECRYPTION INSTRUCTIONS:</div>
          <div class="clue-text" style="font-size: 26px;">1. Go to the event website.<br>2. Open the DECRYPTION TERMINAL.<br>3. Enter your code and solve your Faction's puzzle to view your physical clue.</div>
          <div class="label" style="color:#E91E63; margin-top: 20px;">ONCE DECRYPTED, WHO TO SHOW IT TO:</div>
          <div class="clue-text" style="font-size: 22px; color: #E91E63;">${instruction}</div>
        </div>

        <div class="section-title">04 // Faction Background</div>
        <div class="team-bg">
          <strong style="color:#fff;">Your Faction's Context:</strong> ${TEAM_SUMMARIES[guest.team] || 'You are piecing together the timeline.'} <br><br>
          <strong style="color:#fff;">General Timeline:</strong> V died at 9:14 PM exactly one year ago. The technical failure started at exactly 7:03 PM. Everything in between is a blur of panic, cover-ups, and lies. Your job is to find out who made the choices that killed the company and the founder.
        </div>

        <div class="section-title">05 // The Company Roster</div>
        <div class="roster-grid">
          ${rosterHTML}
        </div>

        <div class="footer">DO NOT SHOW THIS SCREEN TO ANYONE. PLAY YOUR PART.</div>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 1080, height: bodyHeight, deviceScaleFactor: 2 });

    const filename = guest.name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.jpg';
    await page.screenshot({ path: path.join(outDir, filename), type: 'jpeg', quality: 90, fullPage: true });

    console.log(`Generated HTML Infographic for: ${guest.name}`);
    await page.close();
  }

  await browser.close();

  // Write the database file
  fs.writeFileSync(path.join(__dirname, 'clues_database.js'), 'const CLUE_DB = ' + JSON.stringify(clueDatabase, null, 2) + ';');

  console.log('All ULTIMATE infographics generated successfully in /ultimate_posters!');
  console.log('Created clues_database.js with all access codes.');
}

generateHTMLPosters().catch(console.error);
