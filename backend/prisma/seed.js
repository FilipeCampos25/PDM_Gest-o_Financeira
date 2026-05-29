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
    background: "#1c7c54",
    isIncome: true,
    isDefault: true
  },
  {
    name: "food",
    displayName: "Alimentacao",
    icon: "restaurant",
    background: "#d99a21",
    isIncome: false,
    isDefault: true
  },
  {
    name: "transport",
    displayName: "Transporte",
    icon: "directions-car",
    background: "#2f6db3",
    isIncome: false,
    isDefault: true
  },
  {
    name: "leisure",
    displayName: "Lazer",
    icon: "sports-esports",
    background: "#6d5bd0",
    isIncome: false,
    isDefault: true
  },
  {
    name: "education",
    displayName: "Educacao",
    icon: "school",
    background: "#00838f",
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
