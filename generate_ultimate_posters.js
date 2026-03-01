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
  'prod-deploy-log-7:03.txt': 'CONTEXT: This log proves the 19:03 shadow deploy was a deliberate override by Anubhav, Dev, and Kovid, excluding the founder from the process.',
  'auth-vuln-P0-jira.pdf': 'CONTEXT: This report shows Engineering knew the system was broken before launch. Harsh ignored the leak at 18:50 under pressure from Neil.',
  'cease-desist-draft.pdf': 'CONTEXT: This legal threat proves the Investors and Product Council were actively suppressing V while he was trapped in Room 4.',
  'inboard-notes-v-edit.pdf': 'CONTEXT: These redacted notes reveal the coordinated timeline: locked in SR-4 by Iti/Prachi, card revoked by Shikhar/Mittal, oxygen cut by Naisargi/Bharat/Pooja.',
  'side-letter-v2-signed.pdf': 'CONTEXT: This document shows the predatory financial pressure that forced the 19:03 launch at all costs.',
  'ab-test-raw-export.csv': 'CONTEXT: These metrics prove the "Record Breaking" engagement was actually a rigged simulation fed to the dashboard by Shubham.',
  'treasury-map-Nov.xlsx': 'CONTEXT: This spreadsheet reveals the massive payout everyone received for staying silent about the "Technical Malfunction".',
  'grove-commentary-gen-v4.txt': 'CONTEXT: This file proves the Culture team was using AI to generate fake positive sentiment while V was still trapped.',
  'voice-clone-founder.m4a': 'CONTEXT: This audio file is a deepfake of V created after his death by the Culture team to reassure the board.'
};

const PERSONAL_MEMORIES = {
  // CLUSTER 1: THE ARCHITECTS (Valuation Pressure)
  'Siddak Bakshi': "PERSONAL MEMORY: At 18:55 PM, you physically slammed the door to the executive suite and told V, 'Launch it or lose your seat.' You knew the 19:03 Shadow Deploy was a fraud, but you needed the valuation to spike for the Series B. You ignored the rising heat-sensors on your phone dashboard.",
  'Mehul Mohan': "PERSONAL MEMORY: You were the one who told the Product Council, 'I do not care if the code is burning. Give me a green dashboard today.' You watched the Shadow Deploy trigger at 19:03 PM and celebrated with champagne, knowing V was locked out of the system.",

  // CLUSTER 2: THE EXECUTIONERS (Shadow Deploy)
  'Anubhav Gaba': "PERSONAL MEMORY: At 19:03 PM, you reached across the console and hit 'EXECUTE' on the V3-Shadow branch alongside Devashish and Kovid. You felt the static in the air as the fake Version 3 code swapped. You saw V's panicked face through the server room glass at 20:15 PM and you turned your back.",
  'Devashish Rane': "PERSONAL MEMORY: You co-signed the deployment keys at 19:03 PM with Anubhav and Kovid. You knew the Version 3 patch was a lie. Later, at 20:30 PM, you drafted the final Cease and Desist to prove V was 'insubordinate' while he was still trapped in the server room.",
  'Kovid Poudel': "PERSONAL MEMORY: Your hands were shaking at 19:03 PM as you authorized the Shadow Deploy credentials for Anubhav and Devashish. Later, at 21:05 PM, you triggered the remote server purge to wipe the logs of the deploy. You intentionally ignored the 'Zone 4 Occupied' flag.",

  // CLUSTER 3: THE NEGLIGENT (The Leak & Pressure)
  'Harsh Bhimrajka': "PERSONAL MEMORY: You saw the P0 memory leak spike at 18:50 PM. You felt the room getting humid. Neil told you, 'Don't worry about it, catch your flight.' You saved your work and left at 19:00 PM. You chose your weekend over V's life.",
  'Neil Daftary': "PERSONAL MEMORY: You signed the predatory side-letter at 17:55 PM. At 18:55, you saw Harsh worrying about a memory leak and told him to 'Pack it up and go home, we've got it covered.' You were the one who provided the legal 'kill-switch' use to trap V.",

  // CLUSTER 4: THE SILENCERS (Locking the Door)
  'Iti Kathed': "PERSONAL MEMORY: You were manning the security desk. You watched V walk into Server Room 4 at 20:15 PM with his manual repair kit. Shaunak was standing right next to you. You locked the heavy magnetic security door from the outside to 'prevent a scene' while investors were nearby.",
  'Shaunak': "PERSONAL MEMORY: You watched Iti lock the SR-4 door at 20:15 PM. You heard the muffled shouting for ten minutes. You looked at the camera feed and saw V struggling with the internal vent. You turned the monitor off so the investors wouldn't see.",

  // CLUSTER 5: THE REVOKERS (Keycard Lockdown)
  'Shikhar Sharma': "PERSONAL MEMORY: At 21:00 PM, you and Ayush Mittal shared the root terminal. You clicked 'REVOKE ALL' on V's executive keycard while he was still inside Room 4. You also set the Shadow Deploy script to self-destruct right after the power cycle.",
  'Ayush Mittal': "PERSONAL MEMORY: You gave the root credentials to Shikhar and Anubhav. At 21:00 PM, you watched Shikhar deactivate V's emergency exit privileges. You heard the magnetic lock click into 'Permanent Seal' mode and you did nothing to help him.",

  // CLUSTER 6: THE ERASERS (Log Wipe & Oxygen Fail)
  'Naisargi Kothari': "PERSONAL MEMORY: At 21:03 PM, you initiated the 'Full System Power Cycle' with Bharat and Pooja to wipe the deploy logs. You heard a metallic thud from the vents right as the power cut. You didn't realize the power-cycle also disabled the emergency oxygen scrubbers in SR-4.",
  'Bharat Dhir': "PERSONAL MEMORY: You were there when Naisargi triggered the power-cycle at 21:03. You found V's body at 21:14 PM. The air in SR-4 tasted like ozone. His fingernails were broken from scratching at the door. You were told by Pooja to 'Clean it up' immediately.",
  'Pooja Ghatia': "PERSONAL MEMORY: You authorized Naisargi to cycle the power at 21:03. When Bharat found the body, you were the one who ordered the floor-wipe and told everyone to 'Stick to the Technical Malfunction story' or lose their payouts.",

  // CLUSTER 7: THE MASKER (Alarms)
  'Shubham Jain': "PERSONAL MEMORY: At 19:05 PM, you manually disabled the building's haptic alarm floor-grid for Zone 4. You didn't want the investors to hear the cooling-failure sirens. You saw the 'OXYGEN WARNING' flicker on your screen and you clicked 'Dismiss All'.",

  // NARRATIVE CONTROL & MEDIA MASKING
  'Rahul': "PERSONAL MEMORY: At 19:15 PM, you were told the metrics were entirely fake. You wrote the press release celebrating the 'record-breaking launch' anyway. You saw the shadows moving toward SR-4 and you turned your back to write more copy.",
  'Aiswarya Mahajan': "PERSONAL MEMORY: You were told at 19:30 PM that the launch was a total failure. You spent the next hour drafting fake testimonials to drown out the negative press. You saw the paramedics arrive at 21:30 PM and you kept typing.",
  'Sarthak': "PERSONAL MEMORY: You were the one who authorized the 'Emergency Liquidity' transfer at 18:45 PM. You saw V's desperate Slack message asking to stop the launch, but you muted the notification to focus on the Series B term sheet.",
  'Vihan': "PERSONAL MEMORY: You were in the server room basement when the power-cycle hit at 21:03. You heard the cooling systems groan and fail. You saw the 'Zone 4 Lock' engage on the master board and you didn't override it because you were told it was a 'Security protocol'.",
  'Abhishek Mukharjee': "PERSONAL MEMORY: You spent the night running the 'Sentiment Engine'—an AI script that generated thousands of fake positive tweets to bury the news of the hardware failure in SR-4.",
  'Pranjal Srivastava': "PERSONAL MEMORY: You were tasked with editing the live-stream footage of the launch to remove the frames where the server-rack cooling fans were visibly sparking at 19:10 PM.",

  // THE AUDITORS & INVESTIGATORS (Searching for Truth)
  'Aanak Sengupta': "PERSONAL MEMORY: You found the discrepancy in the 'Version 3' checksums at 19:20 PM. You tried to alert the Product Council, but your access was restricted by Shikhar. You knew a shadow-deploy had happened.",
  'Ritvik Hedge': "PERSONAL MEMORY: You saw the emails from V at 18:35 PM titled 'THEY ARE KILLING THE CORE'. You marked them as spam per Siddak's order, but you kept a local copy on a USB drive. You know the truth is in the side-letter.",
  'Shubh Khandelwal': "PERSONAL MEMORY: You were the one who noticed that V's calendar for March 1st had been wiped by an admin at 18:00 PM. You realized they were erasing him long before the power-cycle.",
  'Manasi Chansoria': "PERSONAL MEMORY: You saw the temperature in SR-4 hit 114°F on your dashboard at 20:45 PM. You tried to call V, but the lines had been cut. You were too afraid of Siddak to scream for help.",
  'Vrishali': "PERSONAL MEMORY: You were monitoring the life-support grid for SR-4. You saw the oxygen scrubbers go offline at 21:03 PM and you reached for the override, but Gunjan told you to 'Let the system stabilize' while the logs were wiping.",

  // THE SUPPORTERS & WITNESSES
  'Abhishek Gosavi': "PERSONAL MEMORY: You spent the night deleting the 'CRITICAL ERROR' Jira tickets that Harsh had ignored. You felt like you were burying a person, not just data.",
  'Adarsh': "PERSONAL MEMORY: You were at the security gate at 20:15 PM. You saw V walk in and then saw Iti click the lock. You thought it was a prank, until the power went out at 21:03.",
  'Ayush Borse': "PERSONAL MEMORY: You were told to stay in the lobby and 'keep the investors happy' at any cost. You heard the muffled thumps from the floor below at 20:50 and you turned up the music.",
  'Swapnil': "PERSONAL MEMORY: You were tasked with distracting V's family on the phone while his keycard was being revoked. You heard them asking if he was coming home for the birthday cake.",
  'Mohnish Mhatre': "PERSONAL MEMORY: You saw the 'Log-Wipe-Successful' notification on the main display at 21:10 PM. You looked at Pooja and saw her delete the 'Occupancy Sensor' data for Zone 4.",
  'Sagar Badiyani': "PERSONAL MEMORY: You leaked the 'Record Breaking Metrics' at 19:10 PM. You knew the code was broken, but you wanted the glory. You saw V's silhouette in the server room and ignored his frantic waving.",
  'Akshat': "PERSONAL MEMORY: You told the Product Council that if they didn't hit the 19:00 launch, you would bankrupt the company. You were the ghost in the machine that forced their hand.",
  'Aniket Chandra': "PERSONAL MEMORY: You saw the 'Emergency Fund' being drained at 18:30 PM to pay off the media. You realized V was being erased before he was even dead.",
  'Gunjan Samtani': "PERSONAL MEMORY: You were the first to say 'We can't stop now' at the 6:00 PM bridge call. You watched the clock hit 19:03 and felt the victory, unaware of the cost.",
  'Kartik Khandelwal': "PERSONAL MEMORY: You assigned the 'Version 3' label to the broken legacy code. You saw the OOM-RACE errors at 20:58 PM and hid them from the log, just before the power cycle.",
  'Shrenik Golecha': "PERSONAL MEMORY: You were in Ops when the power-cycle happened. You heard the ventilation fans die. You looked at the board and realized V was still in there, but you said nothing to Naisargi.",
  'Aanak Sengupta': "PERSONAL MEMORY: You found the discrepancy in the 'Version 3' checksums at 19:20 PM. You tried to alert the Product Council, but your access was restricted. You know the shadow-deploy happened.",
  'Varun Chopra': "PERSONAL MEMORY: You drafted the 'Technical Malfunction' script at 21:20 PM for the press. You used the exact wording Pooja gave you, knowing it was a blatant lie.",
  'Pranjal Srivastava': "PERSONAL MEMORY: You edited the security camera footage at 21:45 PM to remove the 10-minute gap where the SR-4 door was locked from the outside by Iti.",
  'Vaibhav Gupta': "PERSONAL MEMORY: You were the one who noticed the 'Failover Loop' at 19:05 PM but didn't report it because you were too busy helping Sagar with the media metrics.",
  'Vishnupriya': "PERSONAL MEMORY: You are the guardian of the truth. You saw the shadow-deploy logs before they were wiped. You know that V was not alone in that room—someone was watching the cameras the whole time.",
  'Surabhi Solanki': "PERSONAL MEMORY: You represent the narrative lab's final stand. You hold the original, un-redacted inboard notes that show the exact second the oxygen failed in SR-4.",
  'The IT Support': "PERSONAL MEMORY: You were the one who received the 'Emergency Access' request from V's phone at 20:59. You were about to grant it when Shikhar revoked his root credentials.",
  'The Midnight Intern': "PERSONAL MEMORY: You saw the trash bins at 22:00 PM full of shredded 'COOLING FAILURE' reports. You realized that everyone on this floor is a murderer, even if they never touched the door.",
  'Mammoth': "PERSONAL MEMORY: You were the physical security lead. You were told by Iti to 'take a break' at 20:10 PM. When you came back at 21:14, the power was back on and a body was on the floor.",

  // ABSENT / GHOSTS (For completeness but not generated)
  'Sajag Jain': "PERSONAL MEMORY: GHOST - You were the one who first suggested the keycard revocation strategy to the board.",
  'Srishti Malviya': "PERSONAL MEMORY: GHOST - You were the one who drafted the initial voice-clone script for the founder's fake farewell.",
  'Padmanabhan Murli': "PERSONAL MEMORY: GHOST - You were the original engineer who designed the failing oxygen scrubbers in SR-4."
};

const ORIGINAL_CODES = {
  "Anubhav Gaba": "13025",
  "Adarsh": "17013",
  "Pranjal Srivastava": "18038",
  "Shubh Khandelwal": "20086",
  "Gunjan Samtani": "21699",
  "Mehul Mohan": "23748",
  "Siddak Bakshi": "24842",
  "Kovid Poudel": "26744",
  "Ayush Borse": "28895",
  "Ritvik Hedge": "31678",
  "Vrishali": "32306",
  "Harsh Bhimrajka": "32705",
  "Aiswarya Mahajan": "32859",
  "Sagar Badiyani": "33633",
  "Sajag Jain": "33717",
  "Varun Chopra": "34091",
  "Aniket Chandra": "35235",
  "Devashish Rane": "38037",
  "Iti Kathed": "38503",
  "Srishti Malviya": "40633",
  "Abhishek Gosavi": "47092",
  "Swapnil": "47931",
  "Vaibhav Gupta": "48090",
  "Aanak Sengupta": "48335",
  "Shrenik Golecha": "49857",
  "Mammoth": "53320",
  "Shubham Jain": "53767",
  "The Midnight Intern": "55131",
  "Padmanabhan Murli": "55554",
  "Vishnupriya": "58497",
  "Neil Daftary": "67535",
  "Mohnish Mhatre": "69300",
  "Shaunak": "72497",
  "Prachi Verma": "72589",
  "Manasi Chansoria": "74911",
  "Kartik Khandelwal": "74965",
  "Rahul": "75322",
  "Naisargi Kothari": "79863",
  "Bharat Dhir": "80022",
  "The IT Support": "85908",
  "Akshat": "89225",
  "Abhishek Mukharjee": "89777",
  "Shikhar Sharma": "90111",
  "Ayush Mittal": "92970",
  "Surabhi Solanki": "94326",
  "Pooja Ghatia": "98180",
  "Sarthak": "11111",
  "Vihan": "22222"
};

const DEFAULT_MEMORIES_BY_TEAM = {
  'Startup Investors': 'PERSONAL MEMORY: Your greed at 18:00 PM led you to threaten the founder. You told them that if the valuation didn\'t hit the target tonight, you\'d see them in court.',
  'Product Council': 'PERSONAL MEMORY: You saw the unpatched bug list at 18:30 PM. You decided it wasn\'t a "blocker" and actively concealed the risk level from the technical floor.',
  'Engineering Blackbox': 'PERSONAL MEMORY: You copy-pasted the fake code blocks into the 19:03 deploy yourself. You were afraid of being fired, but you knew you were breaking the system.',
  'Ops & Ground Truth': 'PERSONAL MEMORY: You were the one who told the security desk to ignore the status alerts coming from Server Room 4 because the "Launch Party" was more important.',
  'Culture & Narrative Lab': 'PERSONAL MEMORY: You were told at 19:30 PM that the launch was a total failure. You spent the next hour drafting fake testimonials to drown out the negative press.',
  'Culture & Narrative/Media': 'PERSONAL MEMORY: You were told at 19:30 PM that the launch was a total failure. You spent the next hour drafting fake testimonials to drown out the negative press.'
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

        let evidenceFile = data.evidence;
        let finalClue = evidenceFile ? 'You hold the access to: ' + evidenceFile : 'No physical evidence provided. Rely on your testimony.';
        if (evidenceFile && EVIDENCE_CONTEXT[evidenceFile]) {
          finalClue += '\n\n' + EVIDENCE_CONTEXT[evidenceFile];
        }

        let guestMemory = PERSONAL_MEMORIES[name] || DEFAULT_MEMORIES_BY_TEAM[parts[1]] || "PERSONAL MEMORY: You were present in the building when V died, but you chose to stay completely silent.";

        guests.push({
          name: name,
          team: parts[1],
          role: parts[3],
          mission: data.mission || parts[4],
          quirk: CHARACTER_QUIRKS[Math.floor(Math.random() * CHARACTER_QUIRKS.length)],
          profile: data.profile || 'Standard employee profile.',
          clue: finalClue,
          memory: guestMemory
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
      clue: 'Clue: "I saw Mehul checking his phone nervously at 19:03 PM. What happened at 19:03?"\n\nCONTEXT: This testimony proves that someone in the Investor team was aware of unfolding events right as the shadow deploy occurred.',
      memory: 'PERSONAL MEMORY: You saw Mehul manually delete a furious message thread from the Product Council right after V died. You know he is directly involved.'
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
      clue: 'Clue: "Shubham told me his model was perfect, but Product forced him to change the outputs for the investors."\n\nCONTEXT: This proves that the Engineering team was pressured into falsifying data by the Product Council.',
      memory: 'PERSONAL MEMORY: You walked onto the engineering floor at 19:03 PM and saw Shubham physically unplugging a warning siren when the metrics spiked. He lied to you about what he was doing.'
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
      clue: 'Clue: "I found a shredded paper near the printer at 8:30 PM. It had the word \'Liability\' circled in red ink."\n\nCONTEXT: This proves that someone was deliberately destroying evidence during "The Silent Hour" when the Founder was dying.',
      memory: 'PERSONAL MEMORY: You were hiding under a desk when Operations dragged V\'s body out of Server Room 4. You saw them wipe down the door handle.'
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
      clue: 'Clue: "The server logs show a massive data wipe was initiated from the VIP room at exactly 8:15 PM."\n\nCONTEXT: This timeline proves that an executive triggered the data wipe right as the founder began his own independent investigation.',
      memory: 'PERSONAL MEMORY: You bypassed the VIP room firewall at 8:15 PM on the orders of the Product Council. You gave them the backdoor access they used to trigger the data wipe.'
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

  // Inject Sarthak
  if (!guests.some(g => g.name === 'Sarthak')) {
    guests.push({
      name: 'Sarthak',
      team: 'Startup Investors',
      role: 'Emergency Fund Liquidity Mgr',
      mission: 'Ensure no one finds out about the 18:45 emergency transfer.',
      quirk: 'Fidgets with a set of car keys while talking about money.',
      profile: 'High-level finance manager. Values numbers over people.',
      clue: 'Clue: "I moved some funds around at 18:45, but it was just for internal rebalancing. Nothing to do with the launch."\n\nCONTEXT: This transfer was actually the payout for the media silence.',
      memory: PERSONAL_MEMORIES['Sarthak']
    });
  }

  // Inject Vihan
  if (!guests.some(g => g.name === 'Vihan')) {
    guests.push({
      name: 'Vihan',
      team: 'Engineering Blackbox',
      role: 'Remote Logic Switcher',
      mission: 'Convince Engineering that the power-cycle was inevitable.',
      quirk: 'Speaks in very short, clipped sentences.',
      profile: 'Systems engineer. Believes in protocols above all else.',
      clue: 'Clue: "I saw the lock engage at 21:03 on the master board. I assumed it was an automated safety feature. I didn\'t know V was inside."\n\nCONTEXT: This lock was actually the result of the keycard revocation by Shikhar and Ayush.',
      memory: PERSONAL_MEMORIES['Vihan']
    });
  }

  for (const guest of guests) {
    if (['Sajag Jain', 'Srishti Malviya', 'Padmanabhan Murli', 'Prachi Verma', 'Abhishek Mukharjee', 'Abhishek Gosavi'].includes(guest.name)) {
      console.log(`SKIPPING Generation for ABSENT/LATE guest: ${guest.name}`);
      continue;
    }
    const page = await browser.newPage();

    // Use ORIGINAL_CODES mapping if available, otherwise generate a deterministic 5-digit code
    let accessCode = ORIGINAL_CODES[guest.name] || (parseInt(crypto.createHash('sha256').update(guest.name).digest('hex').substring(0, 8), 16) % 90000 + 10000).toString();

    const hashedCode = crypto.createHash('sha256').update(accessCode).digest('hex');

    // Save to DB
    clueDatabase[hashedCode] = {
      name: Buffer.from(guest.name).toString('base64'),
      team: Buffer.from(guest.team).toString('base64'),
      clueText: Buffer.from(guest.clue).toString('base64'),
      memoryText: Buffer.from(guest.memory || 'Memory Wiped').toString('base64')
    };

    // Log the code for the master list
    console.log(`CODE_MASTER: ${guest.name} | ${accessCode}`);

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
