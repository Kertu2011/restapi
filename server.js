import express from 'express'
import dotenv from 'dotenv'
import helmet from 'helmet'
import cors from 'cors'
import routes from './routes.js'

dotenv.config()

const PORT = process.env.PORT || 3006
const app = express()

app.use(express.json())
app.use(helmet())
app.use(cors())

app.use('/api', routes)

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const startServer = () => {
  return app.listen(PORT, () => {
      console.info(`Server listening on port ${PORT}`)
  })
}

if (process.env.NODE_ENV !== "test") {
  startServer()
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export { app, startServer }
