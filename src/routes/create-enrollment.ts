import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";

function validarCPF(cpf: string) {
  const numeros = cpf.replace(/\D/g, "");

  if (numeros.length !== 11) {
    return false;
  }

  if (/^(\d)\1+$/.test(numeros)) {
    return false;
  }

  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(numeros[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  if (resto !== Number(numeros[9])) {
    return false;
  }

  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(numeros[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10) {
    resto = 0;
  }

  return resto === Number(numeros[10]);
}

export async function createEnrollment(app: FastifyInstance) {
  app.post("/enrollments", async (request, reply) => {
    const bodySchema = z.object({
      name: z.string().min(3),
      cpf: z.string(),
      course: z.string().min(1),
      turma: z.string().min(1),
      series: z.string().min(1),
      electiveId: z.uuid(),
    });

    const body = bodySchema.safeParse(request.body);

    if (!body.success) {
      return reply.status(400).send({
        message: "Dados da inscrição inválidos",
      });
    }

    const {
      name,
      cpf,
      course,
      series,
      turma,
      electiveId,
    } = body.data;

    const cpfLimpo = cpf.replace(/\D/g, "");

    // Validação do CPF
    if (!validarCPF(cpfLimpo)) {
      return reply.status(400).send({
        message: "CPF inválido",
        code: "CPF_INVALIDO",
      });
    }

    // Verifica se a eletiva existe
    const elective = await prisma.electives.findUnique({
      where: {
        id: electiveId,
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!elective) {
      return reply.status(404).send({
        message: "Eletiva não encontrada",
        code: "ELETIVA_NAO_ENCONTRADA",
      });
    }

    // Verifica limite de 27 alunos
    if (elective._count.enrollments >= 27) {
      return reply.status(409).send({
        message: "Esta eletiva está lotada",
        code: "LOTADA",
      });
    }

    // Verifica se o CPF já existe
    const studentExists = await prisma.student.findUnique({
      where: {
        cpf: cpfLimpo,
      },
      include: {
        enrollment: true,
      },
    });

    if (studentExists) {
      return reply.status(409).send({
        message: "Este aluno já possui uma inscrição",
        code: "JA_INSCRITO",
      });
    }

    // Cria Student + Enrollment
    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name: name.trim(),
          cpf: cpfLimpo,
          course: course.trim(),
          series: series.trim(),
          turma: turma.trim()
        },
      });

      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          electiveId,
        },
      });

      return {
        student,
        enrollment,
      };
    });

    return reply.status(201).send({
      message: "Inscrição realizada com sucesso",
      student: {
        id: result.student.id,
        name: result.student.name,
        cpf: result.student.cpf,
        course: result.student.course,
        series: result.student.series,
      },
      enrollment: {
        id: result.enrollment.id,
        electiveId: result.enrollment.electiveId,
      },
    });
  });
}