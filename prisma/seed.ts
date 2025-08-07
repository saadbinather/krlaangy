import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create users
  console.log("👥 Creating users...");
  const userEmails = [
    "l230838@lhr.nu.edu.pk",
    "l230970@lhr.nu.edu.pk",
    "l230555@lhr.nu.edu.pk",
    "l230624@lhr.nu.edu.pk",
    "l230969@lhr.nu.edu.pk",
    "l230924@lhr.nu.edu.pk",
    "l230527@lhr.nu.edu.pk",
    "l230592@lhr.nu.edu.pk",
    "l230677@lhr.nu.edu.pk",
  ];

  const userNames = [
    "Saad",
    "Manzer",
    "Ghayas",
    "Burhan",
    "Saif",
    "Ali",
    "Moiz",
    "Ayk",
    "Shahzaib",
  ];

  const createdUsers: { [email: string]: string } = {};

  for (let i = 0; i < userEmails.length; i++) {
    const email = userEmails[i];
    const name = userNames[i];
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
      },
    });
    createdUsers[email] = user.id;
    console.log(`✅ Created/Updated user: ${name} (${email})`);
  }

  // Create plans
  console.log("📋 Creating plans...");
  const plans = [
    { id: "507f1f77bcf86cd799439021", title: "Should we have a team lunch?", createdById: createdUsers["l230838@lhr.nu.edu.pk"] },
    { id: "507f1f77bcf86cd799439022", title: "What should we do for the team building activity?", createdById: createdUsers["l230970@lhr.nu.edu.pk"] },
    { id: "507f1f77bcf86cd799439023", title: "Which project should we prioritize next?", createdById: createdUsers["l230555@lhr.nu.edu.pk"] },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: {},
      create: {
        id: plan.id,
        title: plan.title,
        createdById: plan.createdById,
      },
    });
    console.log(`✅ Created plan: ${plan.title}`);
  }

  // Create plan options
  console.log("🔘 Creating plan options...");
  const planOptions = [
    { id: "507f1f77bcf86cd799439031", optionText: "Yes", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439032", optionText: "No", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439033", optionText: "Maybe", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439034", optionText: "Escape Room", planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439035", optionText: "Bowling", planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439036", optionText: "Movie Night", planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439037", optionText: "Mobile App", planId: "507f1f77bcf86cd799439023" },
    { id: "507f1f77bcf86cd799439038", optionText: "Web Platform", planId: "507f1f77bcf86cd799439023" },
    { id: "507f1f77bcf86cd799439039", optionText: "AI Integration", planId: "507f1f77bcf86cd799439023" },
  ];

  for (const option of planOptions) {
    await prisma.planOption.upsert({
      where: { id: option.id },
      update: {},
      create: {
        id: option.id,
        optionText: option.optionText,
        planId: option.planId,
      },
    });
    console.log(`✅ Created option: ${option.optionText}`);
  }

  // Create votes
  console.log("🗳️ Creating votes...");
  const votes = [
    { id: "507f1f77bcf86cd799439041", userId: createdUsers["l230838@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439031", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439042", userId: createdUsers["l230970@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439031", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439043", userId: createdUsers["l230555@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439032", planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439044", userId: createdUsers["l230624@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439034", planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439045", userId: createdUsers["l230969@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439035", planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439046", userId: createdUsers["l230924@lhr.nu.edu.pk"], optionId: "507f1f77bcf86cd799439037", planId: "507f1f77bcf86cd799439023" },
  ];

  for (const vote of votes) {
    await prisma.vote.upsert({
      where: { id: vote.id },
      update: {},
      create: {
        id: vote.id,
        userId: vote.userId,
        optionId: vote.optionId,
        planId: vote.planId,
      },
    });
    console.log(`✅ Created vote for user: ${vote.userId}`);
  }

  // Create comments
  console.log("💬 Creating comments...");
  const comments = [
    { id: "507f1f77bcf86cd799439051", text: "I think lunch would be great for team bonding!", userId: createdUsers["l230838@lhr.nu.edu.pk"], planId: "507f1f77bcf86cd799439021" },
    { id: "507f1f77bcf86cd799439052", text: "Escape room sounds fun!", userId: createdUsers["l230970@lhr.nu.edu.pk"], planId: "507f1f77bcf86cd799439022" },
    { id: "507f1f77bcf86cd799439053", text: "Mobile app would be perfect for our users", userId: createdUsers["l230555@lhr.nu.edu.pk"], planId: "507f1f77bcf86cd799439023" },
  ];

  for (const comment of comments) {
    await prisma.comment.upsert({
      where: { id: comment.id },
      update: {},
      create: {
        id: comment.id,
        text: comment.text,
        userId: comment.userId,
        planId: comment.planId,
      },
    });
    console.log(`✅ Created comment: ${comment.text}`);
  }

  console.log("🎉 Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
