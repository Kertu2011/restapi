import express from 'express'
import { register, login } from './controllers.js'
import { createTodo, getTodos, updateTodo, deleteTodo, getTodoById } from './controllers.js'
import { authenticateToken } from './auth.js'
import {getWeather} from "./controllers.js";

const router = express.Router()

router.post('/register', (req, res, next) => {
    console.info(`Registration attempt: ${req.body.username}`);
    register(req, res, next);
})

router.post('/login', (req, res, next) => {
    console.info(`Login attempt: ${req.body.username}`);
    login(req, res, next);
})

router.use(authenticateToken)

router.post('/todo', (req, res, next) => {
    console.info(`Creating new todo`);
    createTodo(req, res, next);
})

router.get('/todo', (req, res, next) => {
    console.info(`Fetching todos`);
    getTodos(req, res, next);
})

router.get('/todo/:id', (req, res, next) => {
    console.info(`Fetching todo ${req.params.id} for user: ${req.user.id}`);
    getTodoById(req, res, next);
})

router.put('/todo/:id', (req, res, next) => {
    console.info(`Updating todo ${req.params.id} for user: ${req.user.id}`);
    updateTodo(req, res, next);
})

router.delete('/todo/:id', (req, res, next) => {
    console.info(`Deleting todo ${req.params.id} for user: ${req.user.id}`);
    deleteTodo(req, res, next);
})

router.get('/weather/:city', authenticateToken, (req, res, next) => {
    console.info(`Weather request for city: ${req.params.city}`);
    getWeather(req, res, next);
});

export default router
