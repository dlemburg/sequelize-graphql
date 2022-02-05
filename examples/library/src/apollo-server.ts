import bodyParser from 'body-parser';
import { ApolloServer } from 'apollo-server-express';
import express from 'express';
import http from 'http';

export let app;

export async function startApolloServer(schema): Promise<any> {
  const app = express();

  app.use(bodyParser.json());

  app.use((err, req, res, next) => {
    console.error(`[${err.message}]: ${err.stack}`);
    res.status(500).send({ err: err.message });
  });

  const httpServer = http.createServer(app);
  const server = new ApolloServer({
    schema,
  });
  await server.start();
  server.applyMiddleware({ app });
  await new Promise<void>((resolve) => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);

  return server;
}
