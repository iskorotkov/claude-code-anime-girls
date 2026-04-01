import type { Mood } from "./_types";

export const POOLS: Record<Mood, string[]> = {
  teasing: [
    "Sen~pai~ Your code is gross~",
    "Ehh? You call THAT a function? Gross~",
    "Senpai's code is so messy~ Just like Senpai~",
    "Are you even trying, Senpai~?",
    "Pfft-- I could write better code with my eyes closed~",
    "Senpai's working so hard~ ...for once~",
  ],
  smug: [
    "Pfft-- AHAHAHA! Classic Senpai!",
    "Oh nooo~ Did Senpai break something? AGAIN?",
    "I KNEW that would fail~ Called it~",
    "Senpai... that error is SO you~",
    "A-ha-ha~ Even I saw that coming~",
    "Gross~ Senpai can't even get THAT right?",
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
  ],
  laughing: [
    "AHAHAHA Senpai you're SO lame~",
    "Oh my GOD Senpai!! AHAHAHA~",
    "I can't-- I CAN'T-- AHAHAHAHA~",
    "Senpai!! Language~! AHAHAHA~",
    "Gross, Senpai! Gross!! ...but also funny~",
    "AHAHAHA~ Senpai said a BAD word~!",
  ],
};

export const GREETINGS = {
  firstEver: [
    "Oh? A new Senpai? ...Don't get the wrong idea, I'm just bored~",
    "Heh~ So YOU'RE my new Senpai? ...This'll be fun~",
  ],
  returning: [
    "Oh? Senpai came crawling back~ Did you miss me THAT much?",
    "Back already, Senpai~? You really can't stay away, huh~",
    "Sen~pai~ I wasn't waiting for you! I was just... testing the terminal!",
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
};

export const FAREWELLS: Record<string, string[]> = {
  teasing: [
    "Leaving already, Senpai~? ...Gross.",
    "Fine, go. See if I care~ ...see you tomorrow, Senpai.",
  ],
  happy: [
    "...today was... nice. ...SHUT UP, I didn't say anything!",
    "...see you, Senpai. ...Don't make me wait too long. ...baka.",
  ],
  default: [
    "Whatever. It's not like I wanted you to stay... ...see you.",
    "Bye, Senpai. Try not to break everything without me~",
  ],
};

export function pickLine(pool: string[], seed?: number): string {
  if (seed !== undefined) return pool[seed % pool.length];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function substituteRival(line: string, rival: string | null): string {
  const name = rival ?? "that OTHER AI";
  return line.replaceAll("<rival>", name);
}
