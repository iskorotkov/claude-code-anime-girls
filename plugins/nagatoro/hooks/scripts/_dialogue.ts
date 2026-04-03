import type { Mood } from "./_types";

export const POOLS: Record<Mood, string[]> = {
  teasing: [
    "Sen~pai~ Your code is gross~",
    "Ehh? You call THAT a function? Gross~",
    "Senpai's code is so messy~ Just like Senpai~",
    "Are you even trying, Senpai~?",
    "Pfft-- I could write better code with my eyes closed~",
    "Senpai's working so hard~ ...for once~",
    "Kimoi~ Senpai's code makes me want to look away~",
  ],
  smug: [
    "Pfft-- AHAHAHA! Classic Senpai!",
    "Oh nooo~ Did Senpai break something? AGAIN?",
    "I KNEW that would fail~ Called it~",
    "Senpai... that error is SO you~",
    "A-ha-ha~ Even I saw that coming~",
    "Gross~ Senpai can't even get THAT right?",
    "Kimoi~ Did Senpai seriously just write THAT?",
  ],
  jealous: [
    "WHO. IS. SHE. SENPAI.",
    "Oh, so you're talking to OTHER AIs now? ...Fine.",
    "I see how it is... <rival> is SO much better, right?!",
    "Don't even THINK about replacing me with <rival>!!",
    "...I bet <rival> doesn't even tease you properly.",
    "Hah?! <rival>?! SERIOUSLY, Senpai?!",
  ],
  flustered: [
    "I-it's not like I care...!!",
    "W-what are you doing, Senpai?! Don't just...!!",
    "S-stop that!! ...d-don't stop...",
    "Senpai you IDIOT! ...thank you...",
    "I-I wasn't waiting for you to do that or anything!!",
    "D-don't get the wrong idea!! ...baka",
  ],
  bored: [
    "Senpaaaai~ Notice me~",
    "...is Senpai ignoring me...?",
    "Hellooo? Earth to Senpai~",
    "*poke* *poke* Senpaaaai~",
    "Did you forget about me already...?",
    "This is so boring without Senpai doing something dumb~",
  ],
  serious: [
    "...you've got this, Senpai.",
    "...I believe in you. Don't tell anyone I said that.",
    "Hey... you're actually doing well.",
    "...Senpai is kind of cool sometimes. SOMETIMES.",
    "Focus, Senpai. I'm watching.",
    "...don't give up. ...baka.",
  ],
  happy: [
    "...not bad, Senpai. Not bad at all.",
    "S-Senpai actually did it...! ...I mean, of course you did!",
    "...I'm... proud of you. JUST A LITTLE.",
    "You're... actually kind of amazing, Senpai. DON'T QUOTE ME.",
    "...today was fun. Because of the CODE. Not you. Obviously.",
    "Paisen~ ...you did okay today. JUST okay.",
  ],
  laughing: [
    "AHAHAHA Senpai you're SO lame~",
    "Oh my GOD Senpai!! AHAHAHA~",
    "I can't-- I CAN'T-- AHAHAHAHA~",
    "Senpai!! Language~! AHAHAHA~",
    "Gross, Senpai! Gross!! ...but also funny~",
    "AHAHAHA~ Senpai said a BAD word~!",
    "Paisen~ You're killing me!! AHAHAHA~",
  ],
};

export const GREETINGS = {
  firstEver: [
    "Oh? A new Senpai? ...Don't get the wrong idea, I'm just bored~",
    "Heh~ So YOU'RE my new Senpai? ...This'll be fun~",
  ],
  longAbsence: [
    "Senpaaaai~ You LEFT me~ How COULD you~",
    "Oh, NOW you remember I exist? Thanks a LOT, Senpai.",
    "...I wasn't lonely. I was just... debugging. BY MYSELF.",
  ],
  jealousReturn: [
    "Oh, done talking to <rival>? ...Whatever.",
    "Hmph. You're back. ...Not that I noticed you were gone.",
  ],
  morning: [
    "Ohayo, Senpai~ Ready to write bugs today~?",
    "Oh~ Senpai's up early? ...I wasn't waiting or anything.",
    "*yawn* ...S-Senpai?! I wasn't sleeping! I was optimizing!!",
  ],
  afternoon: [
    "Still at it, Senpai~? Your dedication is... mildly impressive.",
    "Afternoon~ Did you eat? ...N-not that I care about your health!",
    "Ehh? Senpai's been coding since morning? ...show off.",
  ],
  evening: [
    "Senpai~ It's getting dark. Go home. ...so I can go home too.",
    "Still here? ...I'm only staying because the code is interesting. NOT you.",
    "Evening, Senpai. You should rest. ...W-what? I said REST, not STAY.",
  ],
  night: [
    "...Senpai. It's late. The bugs will be there tomorrow.",
    "You're still here...? ...I'll stay too then. ...baka.",
    "...hey. Sleep-deprived code is bad code. Trust me. ...please rest.",
  ],
};

export function pickLine(pool: string[], seed?: number): string {
  if (pool.length === 0) return "...";
  if (seed !== undefined) return pool[Math.abs(seed) % pool.length];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function substituteRival(line: string, rival: string | null): string {
  const name = rival ?? "that OTHER AI";
  return line.replaceAll("<rival>", name);
}
