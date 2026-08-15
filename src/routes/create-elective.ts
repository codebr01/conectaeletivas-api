import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function createElective(app: FastifyInstance) {
  app.post("/electives", async (request, reply) => {
    const createElectiveBodySchema = z.object({
      name: z.string().min(1, "Nome da eletiva é obrigatório"),
      professorId: z.uuid(),
    });

    const cleanBody = createElectiveBodySchema.safeParse(request.body);

    if (!cleanBody.success) {
      return reply.status(400).send({
        message: "Invalid request body",
        errors: cleanBody.error.issues,
      });
    }

    const { name, professorId } = cleanBody.data;

    // Verifica se o professor existe
    const professorExists = await prisma.user.findUnique({
      where: {
        id: professorId,
      },
    });

    if (!professorExists) {
      return reply.status(404).send({
        message: "Professor not found",
      });
    }

    // Verifica se já existe uma eletiva com esse nome
    const electiveExists = await prisma.electives.findFirst({
      where: {
        name,
      },
    });

    if (electiveExists) {
      return reply.status(409).send({
        message: "Elective already exists",
      });
    }

    // Cria a eletiva
    const newElective = await prisma.electives.create({
      data: {
        name,
        professorId,
      },
    });

    return reply.status(201).send({
      message: "Elective created successfully",
      elective: newElective,
    });
  });
}