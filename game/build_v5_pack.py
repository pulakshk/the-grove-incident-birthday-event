#!/usr/bin/env python3
from __future__ import annotations

import csv
import hashlib
import json
import shutil
import subprocess
import textwrap
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List

from openpyxl import Workbook

ROOT = Path('/Users/pocketfm/Documents/birthday')
SOURCE_CSV = ROOT / 'Birthday Guestlist attributes - Sheet1 (1).csv'
GAME_ROOT = ROOT / 'game'
V5_DIR = GAME_ROOT / 'v5'
VAULT_DIR = ROOT / 'vault' / 'dead-drop-27'
ZIP_PATH = ROOT / 'vault' / 'dead-drop-27.zip'

NO_SHOW = {'Naren Kashyap', 'Aishwarya Manjunath', 'Sarthak Dwivedi', 'Sajag Jain', 'Padmanabhan Murli', 'Srishti Malviya', 'Prachi Verma', 'Abhishek Mukharjee', 'Abhishek Gosavi'}

TEAM_CONFIG = {
    'Startup Investors': {
        'enemy': 'Engineering Blackbox',
        'superpower': 'Can turn panic into a term sheet and call it conviction.',
        'irony': 'They ask for transparency and then request a cleaner version for investors.',
        'mission': 'Reconstruct treasury motive without collapsing market confidence.',
    },
    'Product Council': {
        'enemy': 'Ops & Ground Truth',
        'superpower': 'Can convert chaos into a roadmap with impossible deadlines.',
        'irony': 'They own prioritization but still say "this came unexpectedly."',
        'mission': 'Build one trusted timeline from conflicting meetings and chat logs.',
    },
    'Engineering Blackbox': {
        'enemy': 'Startup Investors',
        'superpower': 'Can explain every failure perfectly, 15 minutes after it already happened.',
        'irony': 'They hate vague language but write incident updates no one can parse.',
        'mission': 'Prove exactly where shadow deploy, auth risk, and crash intersected.',
    },
    'Ops & Ground Truth': {
        'enemy': 'Product Council',
        'superpower': 'Can keep systems alive while everyone else debates ownership.',
        'irony': 'They are told execution is simple by people who never execute anything.',
        'mission': 'Recover movement evidence and real-world constraints from both floors.',
    },
    'Culture & Narrative Lab': {
        'enemy': 'Engineering Blackbox',
        'superpower': 'Can make raw truth sound cinematic enough that people finally listen.',
        'irony': 'They spot spin instantly and still accidentally create better spin.',
        'mission': 'Validate deepfake vs reality and detect narrative manipulation.',
    },
}

TEAM_ALIASES = {
    'Startup Investors': ['Cap Table Mirage', 'Liquidity Coven', 'Bridge Note Cartel'],
    'Product Council': ['Backlog Ministry', 'Scope Parliament', 'Feature Tribunal'],
    'Engineering Blackbox': ['Log Custodians', 'Deploy Syndicate', 'Signal Engineers'],
    'Ops & Ground Truth': ['Execution Bureau', 'Floor Marshals', 'Reality Desk'],
    'Culture & Narrative Lab': ['Story Ops', 'Perception Unit', 'Afterhours Studio'],
}

CORE_NAMES = {
    'Kovid Poudel',
    'Anubhav Gaba',
    'Pooja Ghatia',
    'Aniket Chandra',
    'Siddak Bakshi',
    'Neil Daftary',
    'Shrenik Golecha',
    'Bharat Dhir',
    'Harsh Bhimrajka',
    'Shubham Jain',
    'Sagar Badiyani',
}

ARTIFACT_BY_TEAM = {
    'Startup Investors': ['treasury-map-Nov.xlsx', 'side-letter-v2-signed.pdf'],
    'Product Council': ['inboard-notes-v-edit.pdf', 'cease-desist-draft.pdf'],
    'Engineering Blackbox': ['prod-deploy-log-7:03.txt', 'auth-vuln-P0-jira.pdf'],
    'Ops & Ground Truth': ['inboard-notes-v-edit.pdf', 'ab-test-raw-export.csv'],
    # Prefer m4a for playback reliability; mp3 alias is still generated in vault for naming compatibility.
    'Culture & Narrative Lab': ['voice-clone-founder.m4a', 'grove-commentary-gen-v4.txt'],
}

TASK_BANK = [
    'Collect one clue from each floor and connect them in 2 sentences.',
    'Get one person from your enemy team to admit a timeline doubt.',
    'Trade one clue only after receiving a signed contradiction.',
    'Convince two strangers to co-sign your theory before Round 3 ends.',
    'Run a 60-second standup with three people outside your team.',
    'Extract one concrete timestamp from someone speaking in vague terms.',
    'Use your clue to defend someone first, then accuse someone else.',
    'Find a person with opposite personality trait and build a joint claim.',
    'Get one late guest fully onboarded using only your artifact summary.',
    'Turn one rumor into a verifiable statement with witness name.',
]

SUPERPOWER_BANK = [
    'Can translate corporate jargon into one honest sentence.',
    'Can detect performative confidence within 10 seconds.',
    'Can turn a messy debate into a decision matrix instantly.',
    'Can ask one question that breaks rehearsed narratives.',
    'Can identify missing stakeholders before plans fail.',
    'Can sense when a metric is technically true but emotionally fake.',
    'Can predict who will dodge accountability in any room.',
]

ROLE_TITLES = {
    'Startup Investors': ['Treasury Interpreter', 'Valuation Hawk', 'Deal Channel Keeper', 'Signal Investor'],
    'Product Council': ['Roadmap Custodian', 'Scope Arbiter', 'Narrative PM', 'Decision Historian'],
    'Engineering Blackbox': ['Deploy Cartographer', 'Incident Decoder', 'Auth Sentinel', 'Data Forensic'],
    'Ops & Ground Truth': ['Floor Marshal', 'Ops Witness', 'Escalation Keeper', 'Reality Coordinator'],
    'Culture & Narrative Lab': ['Narrative Auditor', 'Signal Composer', 'Context DJ', 'Perception Strategist'],
}

ROUND_TIMELINE = [
    ('17:00', 'Arrival, teams, and warm introductions.'),
    ('17:20', 'Mixer quest: one true role fact + one bluff.'),
    ('19:30', 'Host alert: dead-drop unlock in 30 minutes.'),
    ('20:00', 'Round 1 - Timeline Assembly (cross-floor memory map).'),
    ('20:18', 'Round 2 - Cross-Team Interrogation (90s challenges).'),
    ('20:36', 'Round 3 - Evidence Exchange (forced collaboration).'),
    ('20:45', 'Twist - Deepfake memo playback and authenticity vote.'),
    ('20:52', 'Round 4 - Board Vote (team verdict + implicated chain).'),
    ('21:00', 'Final reveal + sentencing + return to party mode.'),
]

CONSPIRACY_CHAIN = [
    'Kovid and Anubhav forced a shadow deploy at 7:03 PM to protect launch optics.',
    'Harsh had already flagged a P0 auth flaw that leadership deferred.',
    'Aniket and Siddak kept treasury moves active through a side-letter loophole.',
    'Shubham and Shubh maintained separate internal vs investor performance narratives.',
    'Pooja drafted legal suppression and delayed escalation in the critical window.',
    'Shrenik preserved the board-note diff proving narrative edits after the incident.',
    'Bharat found V at 9:14 PM, confirming the delay that changed the outcome.',
    'Neil and Sagar assembled and stress-tested the dead-drop to force admissions one year later.',
]

BUFFER_CHARACTERS = [
    {
        'name': 'The Slide-Deck Ghost',
        'mission': 'Interrupt one team pitch and ask: "show source, not summary."',
        'clue': 'One hidden appendix page proves a metric was reframed, not improved.'
    },
    {
        'name': 'The Elevator Witness',
        'mission': 'Appear once in Round 2 and report who switched floors at the wrong time.',
        'clue': 'Heard a line at 8:47 PM: "If 7:03 leaks, we all go down."'
    },
]

DEEPFAKE_EXPLAINER = textwrap.dedent('''\
Deepfake memo, simple version:
- The voice is synthetic: generated from old founder speech samples.
- The message contains mostly real clues but 1-2 bait details.
- Bait details are there to identify who reacts defensively too fast.
- Host line: "Fake voice, real pressure test."
''')

@dataclass
class Guest:
    name: str
    residence: str
    gender: str
    title: str
    likely: str
    plus_one: str
    trait: str
    fun: str


@dataclass
class Character:
    name: str
    team: str
    title: str
    likely: str
    role_alias: str
    role_summary: str
    superpower: str
    mission_task: str
    subplot: str
    primary_artifact: str
    implicates: str
    importance: str
    handoff_packet: str
    handoff_to: str


def slugify(name: str) -> str:
    return ''.join(c.lower() if c.isalnum() else '-' for c in name).strip('-')


def normalize_likely(v: str) -> str:
    t = (v or '').strip().lower()
    if t in {'confirm', 'confirmed'}:
        return 'confirm'
    if t in {'high', 'likely'}:
        return 'high'
    if t in {'medium', 'med'}:
        return 'medium'
    if t in {'low'}:
        return 'low'
    return 'unknown'


def sanitize_fun(fun: str) -> str:
    t = (fun or '').strip()
    if not t:
        return ''
    replacements = {
        'slept with V in the past': 'has complicated personal history with V',
        'went to prison once': 'was briefly detained during a protest year',
        'unemployeed': 'between ventures',
    }
    lower = t.lower()
    for src, dst in replacements.items():
        if src in lower:
            return dst
    return t


def read_guests() -> List[Guest]:
    if not SOURCE_CSV.exists():
        raise SystemExit(f'Missing source file: {SOURCE_CSV}')

    guests: List[Guest] = []
    with SOURCE_CSV.open('r', encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get('Name') or '').strip()
            if not name:
                continue
            if name in NO_SHOW:
                continue
            g = Guest(
                name=name,
                residence=(row.get('Residence') or '').strip(),
                gender=(row.get('Gender') or '').strip(),
                title=(row.get('Title/ Designation') or '').strip() or 'Guest',
                likely=normalize_likely(row.get('Likely to come') or ''),
                plus_one=(row.get('Could bring +1') or '').strip().lower(),
                trait=(row.get('personality trait') or '').strip() or 'unpredictable',
                fun=sanitize_fun(row.get('Fun story element') or ''),
            )
            guests.append(g)
    # deterministic by name
    guests.sort(key=lambda x: x.name.lower())
    return guests


def team_override(name: str) -> str | None:
    overrides = {
        'Aniket Chandra': 'Startup Investors',
        'Akshat': 'Startup Investors',
        'Siddak Bakshi': 'Startup Investors',
        'Neil Daftary': 'Startup Investors',
        'Mehul Mohan': 'Startup Investors',
        'Sagar Badiyani': 'Startup Investors',

        'Kovid Poudel': 'Engineering Blackbox',
        'Anubhav Gaba': 'Engineering Blackbox',
        'Ayush Mittal': 'Engineering Blackbox',
        'Shikhar Sharma': 'Engineering Blackbox',
        'Harsh Bhimrajka': 'Engineering Blackbox',
        'Shubham Jain': 'Engineering Blackbox',
        'Padmanabhan Murli': 'Engineering Blackbox',
        'Vaibhav Gupta': 'Engineering Blackbox',

        'Pooja Ghatia': 'Product Council',
        'Shubh Khandelwal': 'Product Council',
        'Kartik Khandelwal': 'Product Council',
        'Aanak Sengupta': 'Product Council',
        'Devashish Rane': 'Product Council',
        'Ritvik Hedge': 'Product Council',
        'Swapnil': 'Product Council',
        'Gunjan Samtani': 'Product Council',
        'Varun Chopra': 'Product Council',

        'Bharat Dhir': 'Ops & Ground Truth',
        'Manasi Chansoria': 'Ops & Ground Truth',
        'Sajag Jain': 'Ops & Ground Truth',
        'Naisargi Kothari': 'Ops & Ground Truth',
        'Shrenik Golecha': 'Ops & Ground Truth',
        'Prachi Verma': 'Ops & Ground Truth',
        'Iti Kathed': 'Ops & Ground Truth',
        'Mammoth': 'Ops & Ground Truth',
        'Vrishali': 'Ops & Ground Truth',

        'Pranjal Srivastava': 'Culture & Narrative Lab',
        'Srishti Malviya': 'Culture & Narrative Lab',
        'Shaunak': 'Culture & Narrative Lab',
        'Rahul': 'Culture & Narrative Lab',
        'Mohnish Mhatre': 'Culture & Narrative Lab',
        'Abhishek Gosavi': 'Culture & Narrative Lab',
        'Ayush Borse': 'Culture & Narrative Lab',
        'Aiswarya Mahajan': 'Culture & Narrative Lab',
        'Adarsh': 'Culture & Narrative Lab',
        'Abhishek Mukharjee': 'Culture & Narrative Lab',
    }
    return overrides.get(name)


def assign_team(guest: Guest) -> str:
    if team_override(guest.name):
        return team_override(guest.name)  # type: ignore

    title = guest.title.lower()
    if any(k in title for k in ['finance', 'crypto', 'founder', 'investor', 'goldman', 'jp morgan']):
        return 'Startup Investors'
    if any(k in title for k in ['data', 'tech', 'security', 'engineer', 'hacker']):
        return 'Engineering Blackbox'
    if 'product' in title:
        return 'Product Council'
    if any(k in title for k in ['business', 'operations', 'program', 'chief of staff', 'customer']):
        return 'Ops & Ground Truth'
    return 'Culture & Narrative Lab'


def pick_from(items: List[str], seed: str) -> str:
    digest = hashlib.sha256(seed.encode('utf-8')).hexdigest()
    idx = int(digest[:16], 16) % len(items)
    return items[idx]


def importance_for(guest: Guest) -> str:
    if guest.name in CORE_NAMES:
        return 'Core'
    if guest.likely in {'confirm', 'high'}:
        return 'High-engagement'
    if guest.likely == 'medium':
        return 'Flexible'
    return 'Optional'


def captain_for(team: str, members: List[Guest]) -> str:
    preferred = {
        'Startup Investors': 'Aniket Chandra',
        'Product Council': 'Pooja Ghatia',
        'Engineering Blackbox': 'Kovid Poudel',
        'Ops & Ground Truth': 'Manasi Chansoria',
        'Culture & Narrative Lab': 'Shaunak',
    }
    p = preferred.get(team)
    if p and any(m.name == p for m in members):
        return p
    return members[0].name if members else 'Host'


def implicates_for(guest: Guest, team: str) -> str:
    if team == 'Startup Investors':
        return 'Aniket, Siddak, Neil'
    if team == 'Engineering Blackbox':
        return 'Kovid, Anubhav, Harsh'
    if team == 'Product Council':
        return 'Pooja, Shubh, Shubham'
    if team == 'Ops & Ground Truth':
        return 'Shrenik, Bharat, Pooja'
    return 'Neil, Shaunak, Rahul'


def summary_for(guest: Guest, team: str) -> str:
    trait = guest.trait
    fun = guest.fun
    if fun:
        return f"{guest.title}. Known for being {trait}; rumor thread: {fun}."
    return f"{guest.title}. Known for being {trait}; carries untapped context from the launch night."


def build_characters(guests: List[Guest]) -> List[Character]:
    team_members: Dict[str, List[Guest]] = {t: [] for t in TEAM_CONFIG}
    for g in guests:
        team_members[assign_team(g)].append(g)

    captains = {team: captain_for(team, members) for team, members in team_members.items()}

    characters: List[Character] = []
    for g in guests:
        team = assign_team(g)
        alias = f"{pick_from(TEAM_ALIASES[team], g.name)} - {pick_from(ROLE_TITLES[team], g.name + 'role')}"
        art = pick_from(ARTIFACT_BY_TEAM[team], g.name + 'artifact')
        handoff = f"PKT-{slugify(g.name)[:10].upper()}"
        character = Character(
            name=g.name,
            team=team,
            title=g.title,
            likely=g.likely,
            role_alias=alias,
            role_summary=summary_for(g, team),
            superpower=pick_from(SUPERPOWER_BANK, g.name + team),
            mission_task=pick_from(TASK_BANK, g.name + g.title),
            subplot=f"Cross-floor subplot: verify one claim from {TEAM_CONFIG[team]['enemy']} and return with witness name.",
            primary_artifact=art,
            implicates=implicates_for(g, team),
            importance=importance_for(g),
            handoff_packet=handoff,
            handoff_to=captains[team],
        )
        characters.append(character)

    return characters


def ensure_dirs() -> None:
    for p in [
        V5_DIR,
        V5_DIR / 'team_cards',
        V5_DIR / 'character_cards',
        V5_DIR / 'pdf' / 'characters',
        V5_DIR / 'pdf' / 'teams',
        V5_DIR / 'rounds',
        ROOT / 'vault',
        VAULT_DIR,
    ]:
        p.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + '\n', encoding='utf-8')


def txt_to_pdf(txt_path: Path, pdf_path: Path) -> bool:
    pdf_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with pdf_path.open('wb') as f_out:
            subprocess.run(['cupsfilter', str(txt_path)], stdout=f_out, stderr=subprocess.PIPE, check=True)
        return True
    except Exception:
        return False


def write_master_script(chars: List[Character]) -> None:
    teams = []
    for team in TEAM_CONFIG:
        names = ', '.join(c.name for c in chars if c.team == team)
        teams.append(f"- {team}: {names}")

    core = ', '.join(c.name for c in chars if c.importance == 'Core')

    content = textwrap.dedent(f'''\
    # THE GROVE INCIDENT - Script v5 (Interaction-first)

    Date: Sunday, 1 March 2026
    Venue: The Grove A7

    ## What Changed
    - New characters from latest guest sheet are included.
    - New team added: Startup Investors.
    - Story upgraded to multi-person conspiracy with explicit interaction loops.
    - Only 2 buffer characters kept for light fallback (+1 friendly).

    ## Primary Objective
    Keep everyone talking to new people while solving the incident chain.

    ## Teams
    {chr(10).join(teams)}

    ## Team Superpowers (satire)
    {chr(10).join(f"- {t}: {cfg['superpower']} | Irony: {cfg['irony']}" for t, cfg in TEAM_CONFIG.items())}

    ## Round Structure
    {chr(10).join(f"- {t}: {e}" for t, e in ROUND_TIMELINE)}

    ## Canonical Conspiracy Chain
    {chr(10).join(f"{i+1}. {line}" for i, line in enumerate(CONSPIRACY_CHAIN))}

    ## Deepfake Clarity
    {DEEPFAKE_EXPLAINER}

    ## Core Cast
    {core}

    ## Attendance Rule
    If someone is missing, their captain can activate their packet once in each round. No storyline dependency breaks.

    ## Interaction Rule (non-negotiable)
    Every accusation must include one witness from outside your team, otherwise it is invalid.
    ''')
    write_text(GAME_ROOT / 'game_script_v5.md', content)


def write_notebooklm_ingest(chars: List[Character]) -> None:
    lines = [
        '# NotebookLM Ingest Pack - Grove Incident v5',
        '',
        'Use this as the single source for host script, team cards, and character cards.',
        '',
        '## Facts',
        '- Date: Sunday, 1 March 2026',
        '- Main goal: interaction-first murder mystery with social rotation',
        '- Floor setup: parallel vibes, common evidence network',
        '- Removed no-show names from active cast: Naren Kashyap, Aishwarya Manjunath, Sarthak Dwivedi',
        '',
        '## Team Superpowers and Ironies',
    ]
    for team, cfg in TEAM_CONFIG.items():
        lines.append(f"- {team}: {cfg['superpower']} | irony={cfg['irony']} | enemy={cfg['enemy']}")

    lines.extend([
        '',
        '## Canonical Chain',
    ])
    for i, line in enumerate(CONSPIRACY_CHAIN, 1):
        lines.append(f"{i}. {line}")

    lines.extend([
        '',
        '## Deepfake Memo Explainer',
        DEEPFAKE_EXPLAINER.strip(),
        '',
        '## Character Matrix',
        '| Name | Team | Importance | Role Alias | Superpower | Mission | Primary Artifact | Handoff To |',
        '|---|---|---|---|---|---|---|---|',
    ])

    for c in chars:
        lines.append(
            f"| {c.name} | {c.team} | {c.importance} | {c.role_alias} | {c.superpower} | {c.mission_task} | {c.primary_artifact} | {c.handoff_to} ({c.handoff_packet}) |"
        )

    lines.extend([
        '',
        '## Buffer Characters',
    ])
    for b in BUFFER_CHARACTERS:
        lines.append(f"- {b['name']}: mission={b['mission']} | clue={b['clue']}")

    lines.extend([
        '',
        '## Prompt Starter',
        'Generate printable role cards, a host script with timestamps, and one-paragraph intros per team.',
    ])

    write_text(V5_DIR / 'notebooklm_ingest_v5.md', '\n'.join(lines))


def write_host_sheet(chars: List[Character]) -> None:
    team_lines = []
    for team in TEAM_CONFIG:
        names = ', '.join(c.name for c in chars if c.team == team)
        team_lines.append(f"- {team}: {names}")

    content = textwrap.dedent(f'''\
    THE GROVE INCIDENT - HOST SHEET v5
    ==================================

    DATE: Sunday, 1 March 2026
    VENUE: The Grove A7

    TIMELINE
    --------
    {chr(10).join(f"{t} | {e}" for t, e in ROUND_TIMELINE)}

    TEAMS
    -----
    {chr(10).join(team_lines)}

    TEAM SATIRE POWERS
    ------------------
    {chr(10).join(f"- {team}: {cfg['superpower']}" for team, cfg in TEAM_CONFIG.items())}

    INTERACTION ENFORCER RULES
    --------------------------
    1) No monologues longer than 45 seconds.
    2) Each team must involve at least two non-team players by Round 3.
    3) Any claim without witness + artifact is "theory", not evidence.
    4) Host can call "cross-floor switch" once per round.

    PRE-8PM REBALANCE RULE (IF ATTENDANCE DROPS)
    --------------------------------------------
    1) Any team with fewer than 4 live players gets one floating player from the largest team.
    2) Floating players keep their original character card but temporarily serve the smaller team.
    3) Keep all core characters in original teams; only move flexible/optional players.

    DEEPFAKE EXPLAINER (IF CONFUSED)
    --------------------------------
    Playback tip: use `voice-clone-founder.m4a` first. Keep `voice-clone-founder.mp3` as filename-compatible backup.

    {DEEPFAKE_EXPLAINER.strip()}

    FINAL REVEAL LINES
    ------------------
    {chr(10).join(f"- {l}" for l in CONSPIRACY_CHAIN)}

    ATTENDANCE CONTINGENCY
    ----------------------
    Use absentee handoff packets. Missing players never block core reveal.
    ''')

    txt_path = V5_DIR / 'host_sheet_v5.txt'
    write_text(V5_DIR / 'host_sheet_v5.md', content)
    write_text(txt_path, content)
    txt_to_pdf(txt_path, V5_DIR / 'pdf' / 'host_sheet_v5.pdf')


def write_team_cards(chars: List[Character]) -> None:
    readme = ['# Team Cards v5', '']
    for team, cfg in TEAM_CONFIG.items():
        team_chars = [c for c in chars if c.team == team]
        member_lines = '\n'.join(f"- {c.name} ({c.importance})" for c in team_chars)
        content = textwrap.dedent(f'''\
        # {team}

        Enemy Team: {cfg['enemy']}
        Team Superpower (satire): {cfg['superpower']}
        Team Irony: {cfg['irony']}
        Team Objective: {cfg['mission']}

        Members:
        {member_lines}

        Round Goal:
        - Round 1: Build your timeline with 5 fixed timestamps.
        - Round 2: Challenge enemy team on one contradiction.
        - Round 3: Trade one clue and force one admission.
        - Round 4: Submit 3+ person conspiracy chain with proof.
        ''')
        slug = slugify(team)
        md = V5_DIR / 'team_cards' / f'{slug}.md'
        txt = V5_DIR / 'team_cards' / f'{slug}.txt'
        pdf = V5_DIR / 'pdf' / 'teams' / f'{slug}.pdf'
        write_text(md, content)
        write_text(txt, content)
        txt_to_pdf(txt, pdf)
        readme.append(f"- {team}: {len(team_chars)} members")

    write_text(V5_DIR / 'team_cards' / 'README.md', '\n'.join(readme))


def write_character_cards(chars: List[Character]) -> None:
    summary_rows = []
    for c in chars:
        content = textwrap.dedent(f'''\
        # {c.name}

        Team: {c.team}
        Likelihood: {c.likely}
        Importance: {c.importance}

        Role Alias: {c.role_alias}
        Profile: {c.role_summary}

        Corporate Superpower:
        {c.superpower}

        Live Mission:
        {c.mission_task}

        Subplot:
        {c.subplot}

        Primary Artifact: {c.primary_artifact}
        Implicates: {c.implicates}

        If Absent:
        Packet {c.handoff_packet} goes to {c.handoff_to}.
        ''')
        slug = slugify(c.name)
        md = V5_DIR / 'character_cards' / f'{slug}.md'
        txt = V5_DIR / 'character_cards' / f'{slug}.txt'
        pdf = V5_DIR / 'pdf' / 'characters' / f'{slug}.pdf'
        write_text(md, content)
        write_text(txt, content)
        txt_to_pdf(txt, pdf)

        summary_rows.append({
            'name': c.name,
            'team': c.team,
            'importance': c.importance,
            'alias': c.role_alias,
            'artifact': c.primary_artifact,
            'mission': c.mission_task,
            'superpower': c.superpower,
            'handoff_to': c.handoff_to,
            'handoff_packet': c.handoff_packet,
        })

    write_text(V5_DIR / 'character_cards' / 'characters.json', json.dumps(summary_rows, indent=2))


def write_round_docs() -> None:
    docs = {
        'round_1_timeline.md': 'Round 1: Build timeline with 5 timestamp claims. Each claim must have person + source.',
        'round_2_interrogation.md': 'Round 2: Enemy challenge. 90 seconds response limit. Vague answer = penalty token.',
        'round_3_exchange.md': 'Round 3: Evidence trade. No trade means no vote weight in final board.',
        'round_4_vote.md': 'Round 4: Submit chain with at least 3 implicated names and one proving artifact.',
        'deepfake_twist_2045.md': 'Play memo, run authenticity vote, mark defensive overreaction patterns.',
    }
    for fn, body in docs.items():
        write_text(V5_DIR / 'rounds' / fn, f"# {fn.replace('_', ' ').replace('.md', '').title()}\n\n{body}\n")


def write_rundown(chars: List[Character]) -> None:
    lines = [
        '# Final Rundown - Script + Everyone\'s Role',
        '',
        '## 2-Minute Story Summary',
        'One year after V\'s death at Grove Labs launch night, a dead-drop archive appears at your birthday gathering.',
        'The room must prove who shaped the crash, who hid the truth, and who delayed help.',
        'This is a conspiracy story: no single killer, multiple culpable choices.',
        '',
        '## Everyone\'s Role',
        '| Name | Team | Importance | Role Alias | Mission Hook |',
        '|---|---|---|---|---|',
    ]
    for c in chars:
        lines.append(f"| {c.name} | {c.team} | {c.importance} | {c.role_alias} | {c.mission_task} |")

    lines.extend([
        '',
        '## Buffer Characters',
    ])
    for b in BUFFER_CHARACTERS:
        lines.append(f"- {b['name']}: {b['mission']} | clue: {b['clue']}")

    lines.extend([
        '',
        '## How to Keep Everyone Stimulated',
        '- Force cross-team witness requirement for every accusation.',
        '- Use host-triggered floor switch once per round.',
        '- Reward best collaboration, not just correct suspect guess.',
        '- Rotate who speaks first in every round so quieter players engage.',
    ])

    write_text(V5_DIR / 'final_rundown.md', '\n'.join(lines))


def write_interaction_engine(chars: List[Character]) -> None:
    lines = [
        '# Interaction Engine v5',
        '',
        'Purpose: maximize mingling and prevent passive spectators.',
        '',
        '## Interaction Rules',
        '1. Every player must complete at least 2 interactions outside their own team by Round 3.',
        '2. Every team must recruit one non-team witness before board vote.',
        '3. Any player who unlocks contradiction gets to assign one sip.',
        '4. Quiet player priority: host gives first mic to least-spoken player each round.',
        '',
        '## Cross-Team Pair Suggestions',
    ]

    team_groups: Dict[str, List[str]] = {t: [c.name for c in chars if c.team == t] for t in TEAM_CONFIG}
    teams = list(TEAM_CONFIG.keys())
    for i, team in enumerate(teams):
        enemy = TEAM_CONFIG[team]['enemy']
        a = team_groups.get(team, [])
        b = team_groups.get(enemy, [])
        if a and b:
            lines.append(f"- {team} x {enemy}: {a[0]} with {b[0]} (starter pair)")

    write_text(V5_DIR / 'interaction_engine.md', '\n'.join(lines))


def write_absence_matrix(chars: List[Character]) -> None:
    fields = ['name', 'team', 'importance', 'likely', 'handoff_to', 'handoff_packet', 'primary_artifact']
    with (V5_DIR / 'absence_handoff_matrix.csv').open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for c in chars:
            w.writerow({
                'name': c.name,
                'team': c.team,
                'importance': c.importance,
                'likely': c.likely,
                'handoff_to': c.handoff_to,
                'handoff_packet': c.handoff_packet,
                'primary_artifact': c.primary_artifact,
            })


def write_printing_guide(chars: List[Character]) -> None:
    lines = [
        '# Printing Guide - What Must Be Printed?',
        '',
        'Short answer: no, you do NOT need to print everything.',
        '',
        '## Must Print (minimum)',
        '- 1 copy: host sheet (`game/v5/pdf/host_sheet_v5.pdf`)',
        '- 1 per team: team cards (5 PDFs in `game/v5/pdf/teams/`)',
        '- 1 per active player: character cards (`game/v5/pdf/characters/`)',
        '',
        '## Optional Print',
        '- Artifact manifest (`vault/dead-drop-27/artifact_manifest.csv`)',
        '- One-page reveal summary (`game/v5/final_rundown.md`)',
        '',
        '## Keep Digital (recommended)',
        '- Full dead-drop zip (`vault/dead-drop-27.zip`)',
        '- Audio memo (`voice-clone-founder.mp3` or `.m4a`)',
        '- Spreadsheet artifacts (`treasury-map-Nov.xlsx`, `ab-test-raw-export.csv`)',
        '',
        f'Active players in this build: {len(chars)}',
        '- If any team has fewer than 4 players at 8 PM, apply host rebalance from `host_sheet_v5.md`.',
    ]
    write_text(V5_DIR / 'printing_guide.md', '\n'.join(lines))


def artifact_pdf_from_text(filename: str, text_content: str) -> None:
    txt_tmp = VAULT_DIR / f'{filename}.txtsrc'
    pdf_out = VAULT_DIR / filename
    write_text(txt_tmp, text_content)
    ok = txt_to_pdf(txt_tmp, pdf_out)
    if not ok:
        # fallback: keep text with .txt suffix if PDF conversion fails
        write_text(pdf_out.with_suffix('.txt'), text_content)
    txt_tmp.unlink(missing_ok=True)


def generate_artifacts() -> None:
    # clean vault artifacts for deterministic zip
    for p in VAULT_DIR.iterdir():
        if p.is_file():
            p.unlink()

    inboard = textwrap.dedent('''\
    Board Notes Diff: Original vs Edited
    - Original: "Auth and treasury risk unresolved."
    - Edited: "Risks are cosmetic and manageable."
    - Original: "Transfer requires board sign-off."
    - Edited: "Transfer discussed informally."

    Extracted by: Sajag
    Redline reviewed by: Bharat
    ''')
    artifact_pdf_from_text('inboard-notes-v-edit.pdf', inboard)

    commentary = textwrap.dedent('''\
    [SYSTEM PROMPT: founder_update_smoother_v4]
    Objective: transform rough internal updates into investor-safe narrative.

    Rules:
    1) Avoid outage specifics.
    2) Convert "delay" to "stability pass".
    3) Convert "flat retention" to "quality-user concentration".
    4) Never mention unresolved auth vulnerabilities.

    Suspected prompt operators: Shaunak, Rahul
    ''')
    write_text(VAULT_DIR / 'grove-commentary-gen-v4.txt', commentary)

    wb = Workbook()
    ws = wb.active
    ws.title = 'wallet_moves'
    ws.append(['date', 'from_wallet', 'to_wallet', 'amount_usd', 'channel', 'note', 'implicates', 'round'])
    rows = [
        ['2025-11-08', 'GROVE_MAIN', 'OTC_BUFFER_9', 420000, 'off-chain', 'side-letter enabled', 'Siddak, Aniket', '2'],
        ['2025-11-11', 'OTC_BUFFER_9', 'PRIVATE_CUSTODY_X', 390000, 'off-chain', 'split transfer', 'Siddak', '2'],
        ['2025-11-20', 'PRIVATE_CUSTODY_X', 'UNKNOWN_RETURN', 50000, 'off-chain', 'anomalous return', 'Neil, Sagar', '4'],
    ]
    for r in rows:
        ws.append(r)
    ws2 = wb.create_sheet('notes')
    ws2.append(['Interpretation'])
    ws2.append(['Transfers overlapped with launch pressure and confrontation windows.'])
    wb.save(VAULT_DIR / 'treasury-map-Nov.xlsx')

    transcript = (
        'If this is my voice, remember this: seven zero three was a choice, not an accident. '
        'The wallet story is real; one hint in this memo is fake on purpose. '
        'Find who edited the notes, who delayed the call, and who signed the side-letter.'
    )
    m4a = VAULT_DIR / 'voice-clone-founder.m4a'
    mp3 = VAULT_DIR / 'voice-clone-founder.mp3'
    try:
        subprocess.run(['say', '-v', 'Samantha', '-o', str(m4a), transcript], check=True, stderr=subprocess.PIPE)
        shutil.copyfile(m4a, mp3)
    except Exception:
        write_text(mp3, 'Audio generation failed; use transcript.')
    write_text(VAULT_DIR / 'voice-clone-founder-transcript.txt', transcript)

    deploy = textwrap.dedent('''\
    [19:03:12] user=kovid.p action=deploy_start branch=launch-shadow
    [19:03:18] user=anubhav.g action=guardrail_override value=true
    [19:07:40] user=sagar.b action=debug_tunnel_detected source=unknown
    [20:58:09] user=v.vora action=manual_patch module=auth_gate
    [20:58:46] system=core action=crash code=OOM-RACE
    ''')
    write_text(VAULT_DIR / 'prod-deploy-log-7:03.txt', deploy)

    with (VAULT_DIR / 'ab-test-raw-export.csv').open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['cohort', 'variant', 'retention_d7_internal', 'retention_d7_investor', 'owner'])
        w.writerow(['new_users', 'A', 0.18, 0.31, 'Shubham'])
        w.writerow(['new_users', 'B', 0.17, 0.29, 'Shubham'])
        w.writerow(['power_users', 'A', 0.42, 0.42, 'Shubh'])

    jira = textwrap.dedent('''\
    JIRA SEC-1198
    Priority: P0
    Issue: Auth token replay can cross tenant boundary under failover.
    Reporter: Harsh Bhimrajka
    Status at launch: Deferred
    Leadership comment: "Ship now, patch after launch."
    ''')
    artifact_pdf_from_text('auth-vuln-P0-jira.pdf', jira)

    legal = textwrap.dedent('''\
    Draft: Cease and Desist
    Purpose: block external disclosure of board notes and treasury narrative.
    Last modified by: pooja.g
    Timestamp: 21:06
    Status: draft, unsent
    ''')
    artifact_pdf_from_text('cease-desist-draft.pdf', legal)

    side = textwrap.dedent('''\
    Side Letter v2 (Signed)
    Parties: Aniket Chandra, Siddak Bakshi
    Clause: temporary authority for off-chain treasury allocation during launch-critical window.
    Risk: board reporting may be deferred.
    ''')
    artifact_pdf_from_text('side-letter-v2-signed.pdf', side)

    manifest = [
        ('inboard-notes-v-edit.pdf', 'Edited vs original board notes', 'V, Sajag, Bharat', 'Round 1'),
        ('grove-commentary-gen-v4.txt', 'Prompt system for narrative smoothing', 'Shaunak, Rahul', 'Round 2'),
        ('treasury-map-Nov.xlsx', 'Wallet moves and off-chain transfers', 'Siddak, Aniket, Neil, Sagar', 'Round 2'),
        ('voice-clone-founder.mp3', 'Synthetic memo (AAC payload). Prefer .m4a for playback', 'Neil (author), V (voice clone)', 'Twist 2 (8:45 PM)'),
        ('prod-deploy-log-7:03.txt', 'Shadow deploy + override chain', 'Kovid, Anubhav, Sagar', 'Round 3'),
        ('ab-test-raw-export.csv', 'Internal vs investor metrics', 'Shubham, Shubh', 'Round 3'),
        ('auth-vuln-P0-jira.pdf', 'Unpatched P0 auth issue', 'Harsh, leadership', 'Round 3'),
        ('cease-desist-draft.pdf', 'Legal suppression draft', 'Pooja', 'Round 4'),
        ('side-letter-v2-signed.pdf', 'Treasury authority side-letter', 'Siddak, Aniket', 'Round 4'),
    ]

    with (VAULT_DIR / 'artifact_manifest.csv').open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['Artifact', 'Contains', 'Implicates', 'Revealed'])
        for row in manifest:
            w.writerow(row)

    md = ['# Dead Drop 27 Manifest', '', '| Artifact | Contains | Implicates | Revealed |', '|---|---|---|---|']
    for a, b, c, d in manifest:
        md.append(f'| {a} | {b} | {c} | {d} |')
    write_text(VAULT_DIR / 'README.md', '\n'.join(md))


def build_zip() -> None:
    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED) as zf:
        for p in sorted(VAULT_DIR.iterdir()):
            if p.is_file():
                zf.write(p, arcname=f'dead-drop-27/{p.name}')


def write_build_summary(chars: List[Character]) -> None:
    counts: Dict[str, int] = {t: len([c for c in chars if c.team == t]) for t in TEAM_CONFIG}
    lines = [
        '# Build Summary v5',
        '',
        f'Source file: {SOURCE_CSV.name}',
        f'Active characters: {len(chars)}',
        f'Core characters: {len([c for c in chars if c.importance == "Core"])}',
        f'Dropouts removed from active: {", ".join(sorted(NO_SHOW))}',
        '',
        'Team counts:',
    ]
    for team, n in counts.items():
        lines.append(f'- {team}: {n}')

    lines.extend([
        '',
        'Outputs:',
        '- game/game_script_v5.md',
        '- game/v5/notebooklm_ingest_v5.md',
        '- game/v5/final_rundown.md',
        '- game/v5/pdf/host_sheet_v5.pdf',
        '- game/v5/pdf/teams/*.pdf',
        '- game/v5/pdf/characters/*.pdf',
        '- vault/dead-drop-27.zip',
    ])

    write_text(V5_DIR / 'BUILD_SUMMARY.md', '\n'.join(lines))


def main() -> None:
    ensure_dirs()
    guests = read_guests()
    chars = build_characters(guests)

    write_master_script(chars)
    write_notebooklm_ingest(chars)
    write_host_sheet(chars)
    write_team_cards(chars)
    write_character_cards(chars)
    write_round_docs()
    write_rundown(chars)
    write_interaction_engine(chars)
    write_absence_matrix(chars)
    write_printing_guide(chars)

    generate_artifacts()
    build_zip()
    write_build_summary(chars)

    print(f'v5 build complete. Guests: {len(guests)} | Characters: {len(chars)}')
    print(f'Script: {GAME_ROOT / "game_script_v5.md"}')
    print(f'Rundown: {V5_DIR / "final_rundown.md"}')
    print(f'Zip: {ZIP_PATH}')


if __name__ == '__main__':
    main()
