import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function getStudents(app: FastifyInstance) {
  app.get("/students", async (request, reply) => {
    try {
      const students = await prisma.student.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          enrollment: {
            include: {
              elective: {
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
              },
            },
          },
        },
      });

      return reply.status(200).send({
        students,
      });
    } catch (error) {
      console.error("Erro ao buscar estudantes:", error);

      return reply.status(500).send({
        message: "Erro interno ao buscar estudantes",
      });
    }
  });
}