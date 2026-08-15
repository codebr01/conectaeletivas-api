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

    // Busca as eletivas do professor
    const electives = await prisma.electives.findMany({
      where: {
        professorId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
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
      professorId: elective.professorId,
      createdAt: elective.createdAt,
      updatedAt: elective.updatedAt,

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