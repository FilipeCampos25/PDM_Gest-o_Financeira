const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const prisma = require("../lib/prisma");
const validate = require("../middlewares/validate.middleware");

const authRoutes = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function userResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email
  };
}

function createToken(user) {
  return jwt.sign(userResponse(user), process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

authRoutes.post("/register", validate(registerSchema), async (request, response) => {
  const { name, email, password } = request.body;

  const userAlreadyExists = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (userAlreadyExists) {
    return response.status(409).json({
      error: "E-mail já cadastrado"
    });
  }

  const passwordHash = await bcrypt.hash(password, 8);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash
    }
  });

  return response.status(201).json({
    user: userResponse(user)
  });
});

authRoutes.post("/login", validate(loginSchema), async (request, response) => {
  const { email, password } = request.body;

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user) {
    return response.status(401).json({
      error: "E-mail ou senha inválidos"
    });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return response.status(401).json({
      error: "E-mail ou senha inválidos"
    });
  }

  const token = createToken(user);

  return response.json({
    user: userResponse(user),
    token
  });
});

module.exports = authRoutes;
