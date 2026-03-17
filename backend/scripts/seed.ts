import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../src/db/schema';

const DAILY_WORDS = [
  {
    word: 'Wisdom',
    definition:
      'The quality of having experience, knowledge, and good judgment; the soundness of an action or decision.',
    exampleSentence:
      'True wisdom comes not from knowing all the answers, but from knowing the right questions to ask.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Courage',
    definition:
      'The ability to do something that frightens one; strength in the face of pain or grief.',
    exampleSentence:
      'It takes great courage to stand up for what you believe in, even when others disagree.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Gratitude',
    definition:
      'The quality of being thankful; readiness to show appreciation for and to return kindness.',
    exampleSentence:
      'Practicing daily gratitude can significantly improve your overall sense of wellbeing.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Patience',
    definition:
      'The capacity to accept or tolerate delay, problems, or suffering without becoming annoyed or anxious.',
    exampleSentence:
      'Patience is not the ability to wait, but the ability to keep a good attitude while waiting.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Resilience',
    definition:
      'The capacity to recover quickly from difficulties; toughness and adaptability.',
    exampleSentence:
      'Her resilience in the face of adversity inspired everyone around her to keep going.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Clarity',
    definition:
      'The quality of being coherent and intelligible; freedom from indistinctness or ambiguity.',
    exampleSentence:
      'Speaking with clarity requires organizing your thoughts before you begin talking.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Purpose',
    definition:
      'The reason for which something is done or created; a person\'s sense of resolve or determination.',
    exampleSentence:
      'Finding your purpose gives direction and meaning to everything you do each day.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Growth',
    definition:
      'The process of developing or maturing physically, mentally, or spiritually.',
    exampleSentence:
      'Personal growth often happens outside of your comfort zone, where challenges become opportunities.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Balance',
    definition:
      'A condition in which different elements are equal or in the correct proportions.',
    exampleSentence:
      'Achieving balance between work and personal life requires conscious effort and clear boundaries.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Trust',
    definition:
      'Firm belief in the reliability, truth, ability, or strength of someone or something.',
    exampleSentence:
      'Trust is built slowly through consistent actions and can be broken in an instant.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Creativity',
    definition:
      'The use of the imagination or original ideas, especially in the production of an artistic work.',
    exampleSentence:
      'Creativity flourishes when we give ourselves permission to experiment without fear of failure.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Empathy',
    definition:
      'The ability to understand and share the feelings of another person.',
    exampleSentence:
      'Empathy bridges the gap between different experiences and fosters genuine human connection.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Focus',
    definition:
      'The center of interest or activity; the state or quality of having or producing a clear visual definition.',
    exampleSentence:
      'Maintaining focus in a world full of distractions is one of the most valuable skills to develop.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Integrity',
    definition:
      'The quality of being honest and having strong moral principles; moral uprightness.',
    exampleSentence:
      'Integrity means doing the right thing even when nobody is watching.',
    category: 'daily' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Curiosity',
    definition:
      'A strong desire to know or learn something; inquisitiveness.',
    exampleSentence:
      'Curiosity is the engine of achievement — it drives us to explore, question, and discover.',
    category: 'daily' as const,
    difficulty: 'beginner' as const,
  },
];

const PRACTICE_WORDS = [
  {
    word: 'Hope',
    definition:
      'A feeling of expectation and desire for a certain thing to happen.',
    exampleSentence: 'Hope gives us the strength to face uncertain tomorrows with open hearts.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Change',
    definition: 'The act or instance of making or becoming different.',
    exampleSentence: 'Embracing change allows us to grow beyond the limits we once thought impossible.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Ambition',
    definition: 'A strong desire to do or to achieve something, typically requiring determination and hard work.',
    exampleSentence: 'Ambition without action is merely a dream waiting to be pursued.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Power',
    definition: 'The ability to do something or act in a particular way; control or authority.',
    exampleSentence: 'True power lies not in controlling others, but in mastering yourself.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Freedom',
    definition: 'The power or right to act, speak, or think as one wants without hindrance.',
    exampleSentence: 'Freedom is most appreciated by those who have experienced its absence.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Truth',
    definition: 'The quality or state of being in accordance with fact or reality.',
    exampleSentence: 'Speaking truth requires courage, but it always builds stronger relationships.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Identity',
    definition: 'The fact of being who or what a person or thing is; individuality.',
    exampleSentence: 'Our identity is shaped by our choices just as much as our circumstances.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Legacy',
    definition: 'Something handed down from an ancestor or predecessor; long-lasting impact.',
    exampleSentence: 'The legacy we leave behind is written in the lives of those we have touched.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Failure',
    definition: 'Lack of success; the omission of expected or required action.',
    exampleSentence: 'Failure is not the opposite of success — it is a stepping stone toward it.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Success',
    definition: 'The accomplishment of an aim or purpose; the attainment of popularity or profit.',
    exampleSentence: 'Success means different things to different people, and that is perfectly fine.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Simplicity',
    definition: 'The quality or condition of being easy to understand or do; absence of complexity.',
    exampleSentence: 'Simplicity is the ultimate sophistication — removing the unnecessary reveals the essential.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Progress',
    definition: 'Forward or onward movement toward a destination or goal.',
    exampleSentence: 'Small daily progress adds up to remarkable results over time.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Doubt',
    definition: 'A feeling of uncertainty or lack of conviction.',
    exampleSentence: 'Doubt, when examined honestly, can lead us toward deeper understanding and conviction.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Belonging',
    definition: 'The feeling of being accepted as a member of a group or community.',
    exampleSentence: 'A sense of belonging is one of the deepest human needs we all share.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Vision',
    definition: 'The ability to think about or plan the future with imagination or wisdom.',
    exampleSentence: 'A clear vision of where you want to go makes every decision along the way easier.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Sacrifice',
    definition: 'An act of giving up something valued for the sake of something else.',
    exampleSentence: 'Every meaningful achievement involves some form of sacrifice along the way.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Influence',
    definition: 'The capacity to have an effect on the character, development, or behavior of someone.',
    exampleSentence: 'We underestimate our influence on others — a kind word can change someone\'s entire day.',
    category: 'practice' as const,
    difficulty: 'advanced' as const,
  },
  {
    word: 'Choice',
    definition: 'An act of selecting or making a decision when faced with two or more possibilities.',
    exampleSentence: 'Every choice we make shapes the person we are becoming.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Fear',
    definition: 'An unpleasant emotion caused by the belief that something is dangerous or threatening.',
    exampleSentence: 'Fear is often a signal pointing toward the things that matter most to us.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Wonder',
    definition: 'A feeling of amazement and admiration, caused by something beautiful or remarkable.',
    exampleSentence: 'Maintaining a sense of wonder keeps us curious and open to new possibilities.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Solitude',
    definition: 'The state or situation of being alone, often by choice.',
    exampleSentence: 'Solitude is where we reconnect with ourselves and hear our own inner voice.',
    category: 'practice' as const,
    difficulty: 'advanced' as const,
  },
  {
    word: 'Momentum',
    definition: 'The strength or force that something has when it is moving or developing.',
    exampleSentence: 'Once you build momentum, even difficult tasks start to feel effortless.',
    category: 'practice' as const,
    difficulty: 'advanced' as const,
  },
  {
    word: 'Connection',
    definition: 'A relationship in which a person, thing, or idea is linked or associated with something else.',
    exampleSentence: 'Genuine connection happens when we show up as our authentic selves.',
    category: 'practice' as const,
    difficulty: 'intermediate' as const,
  },
  {
    word: 'Time',
    definition: 'The indefinite continued progress of existence and events in the past, present, and future.',
    exampleSentence: 'Time is the one resource that, once spent, can never be recovered.',
    category: 'practice' as const,
    difficulty: 'beginner' as const,
  },
  {
    word: 'Perspective',
    definition: 'A particular attitude toward or way of regarding something; a point of view.',
    exampleSentence: 'Shifting your perspective can transform a problem into an unexpected opportunity.',
    category: 'practice' as const,
    difficulty: 'advanced' as const,
  },
];

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = postgres(url, { prepare: false });
  const db = drizzle(client, { schema });

  console.log('Seeding words...');

  const allWords = [...DAILY_WORDS, ...PRACTICE_WORDS];

  for (const wordData of allWords) {
    await db
      .insert(schema.words)
      .values(wordData)
      .onConflictDoNothing();
  }

  console.log(`Seeded ${allWords.length} words (skipping duplicates).`);
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
