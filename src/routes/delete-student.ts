import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function deleteStudent(app: FastifyInstance) {
  app.delete("/students/:id", async (request, reply) => {
    const paramsSchema = z.object({
      id: z.uuid(),
    });

    const params = paramsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        message: "ID do estudante inválido",
      });
    }

    const { id } = params.data;

    // Verifica se o estudante existe
    const student = await prisma.student.findUnique({
      where: {
        id,
      },
      include: {
        enrollment: true,
      },
    });

    if (!student) {
      return reply.status(404).send({
        message: "Estudante não encontrado",
      });
    }

    // Apaga inscrição e estudante
    await prisma.$transaction(async (tx) => {
      // Se possuir inscrição, remove primeiro
      if (student.enrollment) {
        await tx.enrollment.delete({
          where: {
            id: student.enrollment.id,
          },
        });
      }

      // Depois remove o estudante
      await tx.student.delete({
        where: {
          id,
        },
      });
    });

    return reply.status(200).send({
      message: "Estudante removido com sucesso",
    });
  });
}