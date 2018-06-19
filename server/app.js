require('dotenv').config()
const express = require('express')
const next = require('next')
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');

const appPassport = require('./appPassport')
const auth = require('./auth');

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

async function init() {
  // Some fake data
  const books = [
    {
      title: "Harry Potter and the Sorcerer's stone",
      author: 'J.K. Rowling',
    },
    {
      title: 'Jurassic Park',
      author: 'Michael Crichton',
    },
  ];

  // The GraphQL schema in string form
  const typeDefs = `
    type Query { books: [Book] }
    type Book { title: String, author: String }
  `;

  // The resolvers
  const resolvers = {
    Query: { books: () => books },
  };

  // Put together a schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  try {
    await app.prepare()
    const server = express()

    // Middleware configuration
    server.use(require('morgan')('combined'))

    // Initialize Passport and restore authentication state, if any, from the
    // session.
    server.use(appPassport.initialize())
    server.use(appPassport.session())

    // The GraphQL endpoint
    app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));

    // GraphiQL, a visual editor for queries
    app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

    server.use('/auth', auth);

    server.get('*', (req, res) => {
      return handle(req, res)
    })

    server.listen(3000, (err) => {
      if (err) throw err
      console.log('> Ready on http://localhost:3000')
    })
  } catch (e) {
    console.error(ex.stack)
    process.exit(1)
  }
}

init();