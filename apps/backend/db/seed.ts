import { db } from './index';
import { users, posts, sabotagePacks } from './schema';
import * as bcrypt from 'bcrypt';
import { calculateScoreHelper } from '../src/leaderboard/leaderboard.service';

async function main() {
  console.log('Seeding database...');

  // Clean up existing data
  await db.delete(posts);
  await db.delete(users);
  await db.delete(sabotagePacks);

  // Insert Sabotage Packs seed data
  await db.insert(sabotagePacks).values([
    {
      name: 'Blur Pack',
      description: "Make a competitor's post blurry and completely unreadable. Pure frustration guaranteed.",
      price: 99, // $0.99
      effectType: 'blur',
    },
    {
      name: 'Comic Sans Pack',
      description: "Force a rival's post to render in Comic Sans. Strip away all their corporate dignity.",
      price: 199, // $1.99
      effectType: 'comic_sans',
    },
    {
      name: 'Papyrus Pack',
      description: "Force a rival's post to render in Papyrus font. Bring ancient, chaotic typography to their pitch.",
      price: 199, // $1.99
      effectType: 'papyrus',
    },
    {
      name: 'Calories Deduction Pack',
      description: 'Deduct 500 Wasted Calories from a target post. Drop them down the leaderboard in an instant.',
      price: 499, // $4.99
      effectType: 'deduct_calories',
    },
  ]);
  console.log('Created mock sabotage packs.');

  // Hash passwords
  const passwordHash = await bcrypt.hash('password123', 10);

  // Create mock users
  const [user1, user2, user3] = await db.insert(users).values([
    {
      username: 'alice',
      passwordHash,
      avatar: 'avatar_clown',
      wastedCalories: 0,
      logicViolations: 0,
    },
    {
      username: 'bob',
      passwordHash,
      avatar: 'avatar_turtle',
      wastedCalories: 0,
      logicViolations: 0,
    },
    {
      username: 'charlie',
      passwordHash,
      avatar: 'avatar_bug',
      wastedCalories: 0,
      logicViolations: 0,
    },
  ]).returning();

  console.log('Created mock users.');

  // Use the helper from leaderboard service to avoid duplication (DRY)
  const calculateScore = calculateScoreHelper;

  const postContents = [
    {
      title: 'Quick Update',
      content: 'We are pivoting. No questions asked. Just trust the process!',
      authorId: user1.id,
    },
    {
      title: 'Clean Architecture implementation details',
      content: 'Check out our clean architecture:\n```typescript\nconst add = (a: number, b: number) => a + b;\n```\nIt is extremely clean and scalable.',
      authorId: user2.id,
    },
    {
      title: 'I AM FREAKING OUT NOW',
      content: 'WHY IS THE DEPLOYMENT FAILING AGAIN?! THIS IS TOTALLY UNACCEPTABLE! OUR CLIENTS ARE LEAVING! HELP...',
      authorId: user3.id,
    },
    {
      title: 'The Ultimate Guide to Synergy',
      content: 'We need to leverage our synergy to align our core competencies and optimize our bandwidth. By scaling our paradigms and disruptive thinking, we will establish a high-performing ecosystem. Let\'s deep dive into the KPIs and OKRs that will drive our pivot. We must ensure that our deliverables are decoupled and cloud-native. This is the only way to monetize our microservices and achieve a paradigm shift. We need to run a sprint to address the low-hanging fruits. This is a game-changer! Our roadmap must be agile and customer-centric. Let\'s touch base next week to align on the action items. We should take this offline and circle back. At the end of the day, it is about the bottom line and bandwidth. We need to think outside the box and push the envelope. This is a win-win situation for all stakeholders. Let\'s hit the ground running and make it happen! Can you double check the server logs? I need to make sure we are not dropping packets. This is critical for our MVP launch. We cannot afford any downtime at this stage! Let\'s get to work now.',
      authorId: user1.id,
    },
    {
      title: 'MICROSERVICE ARCHITECTURE SHAKEUP',
      content: 'HELLO TEAM, WE ARE REFACTORING EVERYTHING TO MICROSERVICES TODAY!!!\n\nHere is the new config:\n```yaml\nservices:\n  auth:\n    image: auth-service:latest\n  leaderboard:\n    image: leaderboard:latest\n```\n\nWE MUST DEPLOY THIS RIGHT NOW TO PREVENT DISASTER! DOES ANYONE HAVE QUESTIONS?! IF NOT, JUST MERGE IT AND RUN! DO NOT DELAY OR WE ARE DOOMED!!!',
      authorId: user2.id,
    },
  ];

  for (const postData of postContents) {
    const wastedCalories = calculateScore(postData.content);
    await db.insert(posts).values({
      title: postData.title,
      content: postData.content,
      wastedCalories,
      authorId: postData.authorId,
    });
  }

  console.log('Database seeded successfully!');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
