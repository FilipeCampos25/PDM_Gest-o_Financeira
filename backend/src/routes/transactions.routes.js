const { Router } = require("express");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const transactionsRoutes = Router();

const transactionSchema = z.object({
  description: z.string().min(1),
  value: z.number().positive(),
  date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Data inválida"
  }),
  categoryId: z.string().min(1)
});

function validationError(response, details) {
  return response.status(400).json({
    error: "Dados inválidos",
    details
  });
}

async function findAllowedCategory(categoryId, userId) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [
        {
          isDefault: true
        },
        {
          userId
        }
      ]
    }
  });
}

transactionsRoutes.use(authMiddleware);

transactionsRoutes.get("/", async (request, response) => {
  const { month, year } = request.query;

  const where = {
    userId: request.user.id
  };

  if (month !== undefined || year !== undefined) {
    const querySchema = z.object({
      month: z.coerce.number().int().min(1).max(12),
      year: z.coerce.number().int()
    });

    const result = querySchema.safeParse({
      month,
      year
    });

    if (!result.success) {
      return validationError(response, result.error.issues);
    }

    const startDate = new Date(Date.UTC(result.data.year, result.data.month - 1, 1));
    const endDate = new Date(Date.UTC(result.data.year, result.data.month, 1));

    where.date = {
      gte: startDate,
      lt: endDate
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      category: true
    },
    orderBy: {
      date: "desc"
    }
  });

  return response.json(transactions);
});

transactionsRoutes.post("/", validate(transactionSchema), async (request, response) => {
  const { description, value, date, categoryId } = request.body;

  const category = await findAllowedCategory(categoryId, request.user.id);

  if (!category) {
    return response.status(404).json({
      error: "Categoria não encontrada"
    });
  }

  const transaction = await prisma.transaction.create({
    data: {
      description,
      value,
      date: new Date(date),
      categoryId,
      userId: request.user.id
    },
    include: {
      category: true
    }
  });

  return response.status(201).json(transaction);
});

transactionsRoutes.put("/:id", validate(transactionSchema), async (request, response) => {
  const { id } = request.params;
  const { description, value, date, categoryId } = request.body;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: request.user.id
    }
  });

  if (!transaction) {
    return response.status(404).json({
      error: "Transação não encontrada"
    });
  }

  const category = await findAllowedCategory(categoryId, request.user.id);

  if (!category) {
    return response.status(404).json({
      error: "Categoria não encontrada"
    });
  }

  const updatedTransaction = await prisma.transaction.update({
    where: {
      id
    },
    data: {
      description,
      value,
      date: new Date(date),
      categoryId
    },
    include: {
      category: true
    }
  });

  return response.json(updatedTransaction);
});

transactionsRoutes.delete("/:id", async (request, response) => {
  const { id } = request.params;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      userId: request.user.id
    }
  });

  if (!transaction) {
    return response.status(404).json({
      error: "Transação não encontrada"
    });
  }

  await prisma.transaction.delete({
    where: {
      id
    }
  });

  return response.status(204).send();
});

module.exports = transactionsRoutes;
