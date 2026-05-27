const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(__dirname, "../.env"), quiet: true });
dotenv.config({ path: path.resolve(__dirname, "../../.env"), quiet: true });

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: "income",
    displayName: "Receita",
    icon: "attach-money",
    background: "#B7F7C1",
    isIncome: true,
    isDefault: true
  },
  {
    name: "food",
    displayName: "Alimentação",
    icon: "restaurant",
    background: "#FFD6A5",
    isIncome: false,
    isDefault: true
  },
  {
    name: "transport",
    displayName: "Transporte",
    icon: "directions-car",
    background: "#A0C4FF",
    isIncome: false,
    isDefault: true
  },
  {
    name: "leisure",
    displayName: "Lazer",
    icon: "sports-esports",
    background: "#FFC6FF",
    isIncome: false,
    isDefault: true
  },
  {
    name: "education",
    displayName: "Educação",
    icon: "school",
    background: "#CAFFBF",
    isIncome: false,
    isDefault: true
  }
];

async function main() {
  for (const category of defaultCategories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        isDefault: true,
        userId: null
      }
    });

    if (existingCategory) {
      await prisma.category.update({
        where: {
          id: existingCategory.id
        },
        data: category
      });
      continue;
    }

    await prisma.category.create({
      data: category
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
