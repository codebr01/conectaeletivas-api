import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

export async function getElectivesByProfessor(app: FastifyInstance) {
  app.get("/electives/professor/:professorId", async (request, reply) => {
    const paramsSchema = z.object({
      professorId: z.uuid(),
    });

    const params = paramsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({
        message: "Professor ID inválido",
      });
    }

    const { professorId } = params.data;

    // Verifica se o professor existe
    const professor = await prisma.user.findUnique({
      where: {
        id: professorId,
      },
    });

    if (!professor) {
      return reply.status(404).send({
        message: "Professor não encontrado",
      });
    }

    // Busca todas as eletivas nas quais o professor está vinculado
    const electives = await prisma.electives.findMany({
      where: {
        professors: {
          some: {
            professorId,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
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

        enrollments: {
          include: {
            student: true,
          },

          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const electivesWithEnrollmentData = electives.map((elective) => ({
      id: elective.id,
      name: elective.name,

      createdAt: elective.createdAt,
      updatedAt: elective.updatedAt,

      // Todos os professores responsáveis
      professors: elective.professors.map((relation) => ({
        id: relation.professor.id,
        name: relation.professor.name,
        user: relation.professor.user,
      })),

      limiteVagas: 27,

      inscritos: elective.enrollments.length,

      students: elective.enrollments.map((enrollment) => ({
        enrollmentId: enrollment.id,
        grade: enrollment.grade,

        student: {
          id: enrollment.student.id,
          name: enrollment.student.name,
          cpf: enrollment.student.cpf,
          course: enrollment.student.course,
          series: enrollment.student.series,
        },
      })),
    }));

    return reply.status(200).send({
      electives: electivesWithEnrollmentData,
    });
  });
}