import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";

export async function getAllElectives(app: FastifyInstance) {
  app.get("/electives", async (request, reply) => {
    try {
      const electives = await prisma.electives.findMany({
        orderBy: {
          createdAt: "desc",
        },

        include: {
          professors: {
            select: {
              professor: {
                select: {
                  id: true,
                  name: true,
                  user: true,
                },
              },
            },
          },

          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      });

      const formattedElectives = electives.map((elective) => ({
        id: elective.id,
        name: elective.name,

        professores: elective.professors.map((relation) => ({
          id: relation.professor.id,
          name: relation.professor.name,
          user: relation.professor.user,
        })),

        inscritos: elective._count.enrollments,

        limite_vagas: 27,

        createdAt: elective.createdAt,
        updatedAt: elective.updatedAt,
      }));

      return reply.status(200).send({
        electives: formattedElectives,
      });
    } catch (error) {
      console.error("Erro ao buscar eletivas:", error);

      return reply.status(500).send({
        message: "Erro interno ao buscar eletivas",
      });
    }
  });
}