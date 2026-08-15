import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function register(app: FastifyInstance) {
	app.post('/auth/register', async (request, reply) => {

		const registerBobySchema = z.object({
      name: z.string(),
			user: z.string(),
			password: z.string(),
		});

		const cleanBody = registerBobySchema.safeParse(request.body);

		if (!cleanBody.success) {
			return reply.status(400).send({ message: 'Invalid request body' });
		}

		const { name, user, password } = cleanBody.data;

		const userExists = await prisma.user.findUnique({
			where: {
				user: user
			}
		})

		if (userExists) {
			return reply.status(409).send({ message: 'User already exists' });
		}

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        user,
        password: hashedPassword,
        role: "PROFESSOR"
      }
    })

    return reply.status(201).send({
      message: "User created successfully",
    });

	});	
}