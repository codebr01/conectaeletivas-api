import 'dotenv/config';

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from "@fastify/jwt";

import { resolve } from 'dns';
import { login } from './routes/auth.login';
import { register } from './routes/auth.register';
import { createElective } from './routes/create-elective';
import { getElectivesByProfessor } from './routes/get-electives-by-professor';
import { getElectiveById } from './routes/get-elective-by-id';
import { getAllEnrollments } from './routes/get-all-enrollments';
import { getAllElectives } from './routes/get-all-electives';
import { createEnrollment } from './routes/create-enrollment';
import { deleteStudent } from './routes/delete-student';
import { getStudents } from './routes/get-students';
import { authenticate } from './middlewares/authenticate';
import { authorizeRole } from './middlewares/authorize-role';

const server = fastify({
  logger: true,
});

server.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
});

server.register(fastifyCors, {
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

//rotas auth
server.register(login);
server.register(register);

//precisa ser protegida
server.register(getStudents, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});
//precisa ser protegida
server.register(deleteStudent, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});

//precisa ser protegida
server.register(createElective, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});

//precisa ser protegida
server.register(getElectivesByProfessor, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});
//precisa ser protegida
server.register(getElectiveById, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});
//precisa ser protegida
server.register(getAllEnrollments, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});
//precisa ser protegida
server.register(createEnrollment, {
  preHandler: [
    authenticate,
    authorizeRole("PROFESSOR"),
  ],
});

server.register(getAllElectives);

server.get('/health', async (request, reply) => {
  return reply.status(200).send({ status: 'ok' });
});

server.listen({
  port: 3000,
  host: "0.0.0.0",
}).then(() => {
  console.log("Server is running on http://localhost:3000");
});