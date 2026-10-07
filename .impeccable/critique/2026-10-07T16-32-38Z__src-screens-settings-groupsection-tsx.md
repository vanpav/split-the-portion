---
target: Настройки → Группа
total_score: 22
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/vanpav/Projects/self/split-the-portion/.claude/worktrees/token-optimization-plan-ae2b61/src/screens/Settings/GroupSection.tsx"
target_fingerprint: "sha256:f011da1dfe212ffd408d6c5a679a4217292b9729dd2c6295f56c18859bd680a5"
target_path: /Users/vanpav/Projects/self/split-the-portion/.claude/worktrees/token-optimization-plan-ae2b61/src/screens/Settings/GroupSection.tsx
timestamp: 2026-10-07T16-32-38Z
slug: src-screens-settings-groupsection-tsx
---
Method: dual-agent (A: design review · B: detector + browser)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Open group shown only by a small check; Участники/Пригласить/Выйти don't name the group; hub says "Пока только ты" while user shares another group |
| 2 | Match System / Real World | 1 | «Личная» names a group shared with others; same group is «Личная» for owner and «Личная · Ваня» for the member; invite says «Вступай в группу «Личная»» |
| 3 | User Control and Freedom | 3 | Opening/star reversible, leave confirmed |
| 4 | Consistency and Standards | 2 | Create/join are screens, rename is inline in a row; star + radio per row is non-standard |
| 5 | Error Prevention | 2 | ~87 px layout jump on opening a group; tap landed on «Создать группу»; rename for everyone saves silently on blur |
| 6 | Recognition Rather Than Recall | 2 | Star explained only by title; circle unexplained; sections below depend on remembering the check |
| 7 | Flexibility and Efficiency | 3 | Fine for a rare screen |
| 8 | Aesthetic and Minimalist Design | 2 | Two selection controls per row, form inside list, rare actions always visible |
| 9 | Error Recovery | 3 | Specific error toasts, limit explained |
| 10 | Help and Documentation | 2 | Intro separates group vs company; star/circle unexplained |
| **Total** | | **22/40** | **Acceptable** |

## Design Specificity Verdict
LLM: generic iOS settings list in Ланчбокс skin; nothing about the kitchen (what the group shares), rows told apart only by near-identical text.
Detector: CLI 0 findings on 9 files. Browser overlay (injected): flat-type-hierarchy (page-level, body 14 / h3 14 / h2 16 / h1 18), bounce-easing and layout-transition — both false positives for this screen (index.css box-drop, sonner). Tap targets ≥44 px except inline «Компаниях» link (exempt). No horizontal overflow. Dark contrast passes AA.

## Priority Issues
- [P0] «Личная» names a state that stops being true: auto group stored as «Личная», two «Личная» rows per member, owner still sees «Личная» after others join; InviteCard uses raw name. Fix: label groups by people from viewer's POV («Только ты», «Ты и Ксю», «Ваня и ты»); custom name optional; one function everywhere (list, hub, invite, join, leave). /impeccable clarify + shape
- [P1] Two parallel unlabeled choices per row (open ○ / launch ☆). Fix: merge (last opened reopens) or move launch to group detail as a labeled Switch. /impeccable distill
- [P1] Hybrid list + inline detail; name field inside row; 87 px jump causes mis-tap into «Создать группу». Fix: group detail as own screen #/settings/group/:id like «Новая группа»; list = navigation rows. /impeccable shape + layout
- [P2] Open group's sections never name the group; invite card name disagrees with list label. /impeccable clarify
- [P2] Hub line describes only the open group, truncated, false «пригласи» nudge. /impeccable clarify

## Persona Red Flags
Jordan: single «Личная» with open «Название» field — why rename my personal space? Star/circle appear unexplained after first join.
Casey: layout jump sends taps into «Создать группу»; circle looks like a separate checkbox; mis-tap focuses name field.
Sam: open state only via aria-current; star meaning only in title/aria-label; duplicate h1/h2 «Группа»; hold-to-remove needs hint.
Ксюша (joined by invite): her kitchen is «Личная · Ваня» listed after her empty own «Личная»; invite she forwards says «Личная»; hub says she's alone.

## Minor Observations
Rename saves silently; «Пригласить» sub-line wraps; identical photos make avatar stack decoration; desktop name input ~800 px wide; duplicate sr-only h2; row accessible name run together.

## Questions to Consider
1. Does anyone need open group ≠ launch group for longer than a minute?
2. Is the auto group a group before anyone joins, or just "my data"?
3. Why does a group need a stored name if people identify it?
