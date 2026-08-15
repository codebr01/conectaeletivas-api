import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function createElective(app: FastifyInstance) {
  app.post("/electives", async (request, reply) => {
    const createElectiveBodySchema = z.object({
      name: z.string().min(1, "Nome da eletiva é obrigatório"),
      professorIds: z
        .array(z.uuid())
        .min(1, "A eletiva deve ter pelo menos um professor"),
    });

    const cleanBody = createElectiveBodySchema.safeParse(request.body);

    if (!cleanBody.success) {
      return reply.status(400).send({
        message: "Invalid request body",
        errors: cleanBody.error.issues,
      });
    }

    const { name, professorIds } = cleanBody.data;

    // Remove IDs duplicados
    const uniqueProfessorIds = [...new Set(professorIds)];

    // Verifica se todos os professores existem
    const professors = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueProfessorIds,
        },
        role: "PROFESSOR",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (professors.length !== uniqueProfessorIds.length) {
      return reply.status(404).send({
        message: "One or more professors not found",
      });
    }

    // Verifica se já existe uma eletiva com esse nome
    const electiveExists = await prisma.electives.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (electiveExists) {
      return reply.status(409).send({
        message: "Elective already exists",
      });
    }

    // Cria a eletiva e os vínculos com os professores
    const newElective = await prisma.electives.create({
      data: {
        name,
        professors: {
          create: uniqueProfessorIds.map((professorId) => ({
            professor: {
              connect: {
                id: professorId,
              },
            },
          })),
        },
      },
      include: {
        professors: {
          include: {
            professor: {
              select: {
                id: true,
                name: true,
                user: true,
              },
            },
          },
        },
      },
    });

    return reply.status(201).send({
      message: "Elective created successfully",
      elective: newElective,
    });
  });
}