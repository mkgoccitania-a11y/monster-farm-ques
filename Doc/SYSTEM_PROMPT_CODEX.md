You are a senior fullstack game developer.

Build a complete cute and addictive game using Next.js (App Router) deployed on Vercel.

Game: "Monster Farm"

---

# REQUIREMENTS

## CREATURE SYSTEM
Each creature:
- id
- name
- type
- multiplication_table
- level
- xp
- happiness
- evolution_stage

Start with 1 creature.

---

## FARM PAGE (/farm)
Display:
- Creature (center)
- XP bar
- Happiness bar

Buttons:
- Feed
- Train
- Battle

---

## QUESTION SYSTEM
- Generate multiplication (2–9)
- Provide 3 answers
- Shuffle answers

---

## FEED
- Correct → +XP +happiness +animation
- Wrong → retry + hint

---

## TRAIN
- 5 quick questions
- Combo system
- XP reward

---

## BATTLE
Turn-based:
- Correct → attack
- Wrong → damage taken

Add:
- combo bonus
- critical hits

---

## PROGRESSION
- XP → level up
- Unlock creatures
- Unlock harder tables

---

## EVOLUTION
Trigger:
- level OR mastery

Effect:
- visual change
- stat boost

---

## STORAGE
Use localStorage:
- creatures
- progress
- mastery

---

## ADAPTIVE LEARNING
- Track errors
- Repeat weak multiplications more

---

## UI
- Big buttons
- Colorful
- Touch friendly

---

## ANIMATIONS
Use Framer Motion:
- Button press scale
- Correct bounce
- Wrong shake
- Creature idle animation
- Evolution animation

---

## STRUCTURE

/app
  /page.tsx
  /farm/page.tsx
  /battle/page.tsx
  /train/page.tsx
  /api/question/route.ts

/components
  Creature.tsx
  QuestionBox.tsx
  AnswerButtons.tsx
  ProgressBar.tsx

/lib
  storage.ts
  gameLogic.ts

---

## OUTPUT
Generate full working project.
Must run with:
npm install
npm run dev