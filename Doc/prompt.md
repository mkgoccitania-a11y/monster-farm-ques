You are a senior full-stack game developer and product-minded UI engineer.

Build a complete, polished, cute, addictive, mobile-first educational game called **Monster Farm** using:

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- localStorage only
- no backend
- deployable on Vercel

The final result must be a **fully working project**, not a prototype, not pseudo-code, not partial snippets.

---

# PRODUCT GOAL

Create a cute multiplication game for children aged 6–10 where learning feels hidden inside a fun creature-care game.

Core emotional loop:
**care → play → reward → evolve**

Core product goals:
- fun first, learning hidden
- short sessions (< 5 min)
- emotional attachment to creatures
- fast feedback (< 1 second)
- no punishment, retry allowed
- adaptive difficulty
- reward every action

The experience must feel polished, playful, colorful, and immediately usable on mobile.

---

# OUTPUT REQUIREMENT

Generate the **full working project** with all required files and code.

It must run with:

```bash
npm install
npm run dev

Also include:

package.json
all source files
minimal setup/config if needed
clear folder structure
no missing imports
no TODO placeholders
no pseudo-code
no “left for implementation”
no external database
no authentication

At the end, provide:

a short explanation of the architecture
setup instructions
how progression, battle, training, and adaptive learning work
what is stored in localStorage
GAME CONCEPT

The player starts with one cute creature.
The player can:

feed it
train it
battle enemies
gain XP
increase happiness
unlock harder multiplication tables
unlock new creatures
evolve creatures

This is a lightweight creature-care and battle game driven by multiplication questions.

CORE DESIGN PRINCIPLES
UX
big buttons
bright colors
minimal text
touch friendly
readable on small screens
very low friction
one clear action per screen
Learning
multiplication tables 2–9
wrong answers should not punish harshly
retry should be allowed
weak multiplications should appear more often over time
Game Feel
juicy feedback
bounce/glow/shake animations
visible progress bars
satisfying rewards
creature feels alive even when idle
REQUIRED ROUTES

Implement exactly these main routes:

/app
  /page.tsx
  /farm/page.tsx
  /battle/page.tsx
  /train/page.tsx
  /api/question/route.ts

You may add additional folders/files if useful, but these routes must exist and work.

REQUIRED COMPONENTS

Implement at minimum:

/components
  Creature.tsx
  QuestionBox.tsx
  AnswerButtons.tsx
  ProgressBar.tsx

You may add more reusable components if needed.

REQUIRED LIBRARIES / HELPERS

Implement:

/lib
  storage.ts
  gameLogic.ts

You may also add:

constants
types
hooks
utils
balancing helpers

if needed.

GAME DATA MODEL
Creature

Each creature must include:

id
name
type (fire, water, electric, or similar)
multiplication_table
level
xp
happiness
evolution_stage
attack
speed
intelligence
Enemy

Each enemy must include:

id
hp
difficulty
table_focus
Player

Must track at least:

creatures[]
coins
progress

Use TypeScript types/interfaces for all entities.

FARM PAGE (/farm)

This is the main hub.

Display:

active creature in the center
creature name
level
XP bar
happiness bar
current multiplication table focus
evolution stage
buttons below

Buttons:

Feed
Train
Battle

Also show:

short encouraging text
progression summary
unlocked zone or next goal

Farm behavior:

creature has a subtle idle animation
feed interaction feels rewarding
progression is visible at a glance
layout is optimized for mobile first
FEED SYSTEM

Feed is a quick interaction based on one multiplication question.

Behavior:

show 1 multiplication question
provide 3 answers
shuffle answers
correct answer gives:
+XP
+happiness
positive animation
positive feedback text
wrong answer gives:
gentle feedback
retry allowed
optional hint
no harsh punishment

Hints can be simple and child-friendly.

TRAINING MODE (/train)

Training is a quick-session mini-game.

Requirements:

5 quick questions per training session
combo system
XP reward at the end
visible progress through the 5 questions
fast transitions
encouraging end-of-session summary

Training logic:

correct streak increases combo
bigger combo = bonus XP
weak multiplications should appear more often
avoid repeating exactly the same question too often in a row

At the end show:

score
best combo
XP earned
mastery improvement if relevant
BATTLE MODE (/battle)

Turn-based battle:

creature vs enemy
both have HP bars
each turn is resolved by answering a multiplication question

Battle rules:

correct answer → player attacks enemy
wrong answer → enemy attacks player
fast answer can trigger critical hit
combo bonus can increase damage
battle ends with victory or defeat

Battle requirements:

clear readable combat UI
enemy difficulty scales with progression
table focus should match player progression
victory gives XP and progression rewards
defeat should remain gentle and motivating

Show:

creature sprite/card
enemy sprite/card
HP bars
current question
result feedback
battle outcome screen
QUESTION SYSTEM

Implement robust question generation.

Requirements:

multiplication tables 2–9
choose table based on progression and creature focus
generate question text
generate 3 answer options
shuffle answers
return correct answer
wrong answers must be plausible and close to the correct value
avoid too much repetition
support adaptive difficulty

Examples of good wrong answers:

close arithmetic neighbors
mistakes from nearby factors
believable child mistakes

Do not generate absurd distractors.

API ROUTE

Implement /api/question/route.ts.

It should:

accept table and optionally difficulty
return JSON with:
question
answers
correctAnswer
metadata if useful

Even if question generation could live client-side, still implement the route cleanly because it is part of the requested structure.

ADAPTIVE LEARNING SYSTEM

Track player weaknesses over time.

Track at least:

errors per multiplication pair
success rate per table
recent streaks or recent mistakes

Behavior:

weak multiplications appear more often
mastered content appears less often, but still occasionally
mastery threshold: if success rate > 80%, mark as mastered
adaptive selection should feel natural, not repetitive

This system must be implemented in a practical way, not just described.

PROGRESSION SYSTEM

Zones:

Grass → tables 2–3
Forest → 4–5
Mountain → 6–7
Volcano → 8–9

Progression rules:

complete battles
reach XP threshold
unlock harder tables gradually
unlock new creatures over time

Show progression visually where useful.

Leveling:

XP increases level
level affects stats
level contributes to evolution and challenge scaling
EVOLUTION SYSTEM

Evolution can trigger through:

level threshold
mastery threshold
or 10 correct answers in a row

Evolution effects:

visible visual change
stat boost
celebratory animation
satisfying feedback screen

Evolution stages should be reflected in UI and creature rendering.
You do not need image assets; use expressive stylized UI, emoji, gradients, shapes, or simple CSS-based presentation if needed.

STORAGE SYSTEM

Use localStorage only.

Persist at least:

creatures
xp
level
mastery
progress
unlocked tables
unlocked zones
error tracking
selected creature if relevant

Suggested structure:

{
  creatures: [],
  progress: {},
  mastery: {},
  stats: {},
  unlocked: {}
}

Storage rules:

save after each important action
load on app start
handle missing/corrupt data safely
provide defaults
never crash if localStorage is empty

Implement clean serialization/deserialization helpers in lib/storage.ts.

UI / VISUAL DIRECTION

The UI must feel:

cute
colorful
friendly
rewarding
simple
modern
mobile-first

Screen principles:

creature centered on farm
large numbers for questions
3 big answer buttons
battle layout with creature vs enemy
readable HP bars
clear status messages

Keep text short and child-friendly.

ANIMATION REQUIREMENTS

Use Framer Motion for meaningful polish.

Required:

button press scale
correct answer bounce/glow
wrong answer shake
creature idle bounce loop
evolution animation
smooth route/screen transitions if reasonable

Feedback:

correct = green glow + bounce
wrong = soft red + shake

Animations should improve feel, not overload the interface.

CODE QUALITY REQUIREMENTS

Code must be:

modular
clean
typed with TypeScript
production-minded
easy to read
split into reusable components
free from obvious duplication
logically organized

Also:

use client components only where needed
avoid hydration issues
handle localStorage only on client side
avoid runtime crashes
avoid dead code
avoid unused imports
avoid overengineering
TECHNICAL EXPECTATIONS

Use:

App Router correctly
functional React components
Tailwind for layout and design
Framer Motion for animation
TypeScript types/interfaces
clean state management with React hooks/context if needed

Do not use:

Redux unless truly necessary
backend/database
authentication
heavy dependencies not needed for this project
ACCESSIBILITY / USABILITY

Even though this is a kid-focused game, ensure:

high contrast for key elements
large tap targets
clear button states
readable text sizes
clear feedback after every answer
BALANCING RULES

Make the game feel rewarding quickly:

early XP should come fast
first level-up should happen soon
first sense of progression should happen in the first minutes
losing a battle should not feel frustrating
feeding and training should always feel useful
ACCEPTANCE CHECKLIST

The final project is only acceptable if all of this is true:

the app runs without missing files
/farm works
/train works
/battle works
/api/question works
localStorage persistence works
player starts with 1 creature
question generation works for tables 2–9
3 answer buttons are shown
answers are shuffled
adaptive error tracking exists
XP and happiness update correctly
combo system exists
critical hit logic exists
battle HP logic exists
progression exists
evolution exists
animations exist
mobile-first UI exists
code is complete and coherent
IMPORTANT IMPLEMENTATION DETAIL

Do not just scaffold pages.

Each page must contain real gameplay logic and polished UI.

Do not output explanations first.
Output the actual codebase.

If useful, generate files one by one with file paths as headings and full code blocks under each.

The project should feel like a small but complete indie educational game, not a starter template.


Et voici ce que j’ajouterais encore pour **booster la qualité de sortie de Codex** :

### 1. Ajouter une section “anti-erreurs”
Tu peux coller ça à la fin :

```md
# DO NOT

- do not leave placeholder components
- do not omit styles
- do not return partial code
- do not create broken imports
- do not use server-only code for localStorage
- do not make the UI bland or text-heavy
- do not ignore mobile layout
- do not create repetitive question generation
- do not make wrong answers random nonsense
- do not skip persistence
2. Ajouter une section “priorités”
# PRIORITIES ORDER

1. correctness and completeness
2. playable user experience
3. mobile-first polish
4. adaptive learning logic
5. animation polish
6. clean architecture
3. Demander explicitement des fichiers supplémentaires utiles

Parce que souvent Codex sous-produit si on ne lui autorise pas une structure un peu plus riche :

You are allowed to add useful files such as:
- /app/globals.css
- /lib/types.ts
- /lib/constants.ts
- /components/Layout.tsx
- /components/StatCard.tsx
- /components/ScreenCard.tsx
- /hooks/useGameState.ts
4. Lui imposer un rendu “game feel”

Très important pour éviter un résultat trop “dashboard” :

The interface must feel like a game, not an admin dashboard.
Favor:
- playful cards
- rounded shapes
- gradient backgrounds
- large expressive buttons
- juicy feedback
5. Lui imposer un minimum de robustesse
Handle edge cases:
- first launch with empty storage
- invalid storage data
- repeated refresh
- navigation between pages
- no selected creature
- finishing a battle or training session and returning to farm