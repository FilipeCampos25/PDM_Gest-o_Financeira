const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const categoriesRoutes = Router();

const createCategorySchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  icon: z.string().min(1),
  background: z.string().min(1),
  isIncome: z.boolean()
});

const updateCategorySchema = createCategorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "Informe ao menos um campo para atualizar"
  }
);

categoriesRoutes.use(authMiddleware);

categoriesRoutes.get("/", async (request, response) => {
  const categories = await prisma.category.findMany({
    where: {
      OR: [
        {
          isDefault: true
        },
        {
          userId: request.user.id
        }
      ]
    },
    orderBy: {
      displayName: "asc"
    }
  });

  return response.json(categories);
});

categoriesRoutes.post("/", validate(createCategorySchema), async (request, response) => {
  const { name, displayName, icon, background, isIncome } = request.body;

  const categoryAlreadyExists = await prisma.category.findFirst({
    where: {
      name,
      userId: request.user.id
    }
  });

  if (categoryAlreadyExists) {
    return response.status(409).json({
      error: "Categoria customizada ja cadastrada"
    });
  }

  const category = await prisma.category.create({
    data: {
      name,
      displayName,
      icon,
      background,
      isIncome,
      isDefault: false,
      userId: request.user.id
    }
  });

  return response.status(201).json(category);
});

categoriesRoutes.put("/:id", validate(updateCategorySchema), async (request, response) => {
  const { id } = request.params;

  const category = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!category || category.isDefault || category.userId !== request.user.id) {
    return response.status(404).json({
      error: "Categoria não encontrada"
    });
  }

  if (request.body.name && request.body.name !== category.name) {
    const categoryAlreadyExists = await prisma.category.findFirst({
      where: {
        name: request.body.name,
        userId: request.user.id
      }
    });

    if (categoryAlreadyExists) {
      return response.status(409).json({
        error: "Categoria customizada ja cadastrada"
      });
    }
  }

  const updatedCategory = await prisma.category.update({
    where: {
      id
    },
    data: request.body
  });

  return response.json(updatedCategory);
});

categoriesRoutes.delete("/:id", async (request, response) => {
  const { id } = request.params;

  const category = await prisma.category.findUnique({
    where: {
      id
    }
  });

  if (!category) {
    return response.status(404).json({
      error: "Categoria não encontrada"
    });
  }

  if (category.isDefault) {
    return response.status(400).json({
      error: "Categorias padrão não podem ser excluídas"
    });
  }

  if (category.userId !== request.user.id) {
    return response.status(404).json({
      error: "Categoria não encontrada"
    });
  }

  const linkedTransactionsCount = await prisma.transaction.count({
    where: {
      categoryId: id,
      userId: request.user.id
    }
  });

  if (linkedTransactionsCount > 0) {
    return response.status(409).json({
      error: "Nao e possivel excluir uma categoria com transacoes vinculadas"
    });
  }

  await prisma.category.delete({
    where: {
      id
    }
  });

  return response.status(204).send();
});

module.exports = categoriesRoutes;
