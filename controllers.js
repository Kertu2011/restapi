import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';
import postgres from 'postgres';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);


export const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user already exists
        const existingUsers = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await sql`
            INSERT INTO users (username, password)
            VALUES (${username}, ${hashedPassword})
        `;

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
};

export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        const users = await sql`
            SELECT id, username, password FROM users WHERE username = ${username}
        `;

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = users[0];

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Error logging in' });
    }
};

export const createTodo = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.id;

        const [todo] = await sql`
            INSERT INTO todo (title, description, user_id)
            VALUES (${title}, ${description === undefined ? null : description}, ${userId})
            RETURNING id, title, description, completed, created_at, updated_at, user_id
        `;

        res.status(201).json(todo);
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ message: 'Error creating todo' });
    }
};

export const getTodos = async (req, res) => {
    try {
        const userId = req.user.id;

        const todos = await sql`
            SELECT id, title, description, completed, created_at, updated_at, user_id
            FROM todo
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ message: 'Error fetching todos' });
    }
};

export const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, completed } = req.body;
        const userId = req.user.id;

        const dataToUpdate = {};
        if (title !== undefined) dataToUpdate.title = title;
        if (description !== undefined) dataToUpdate.description = description;
        if (completed !== undefined) dataToUpdate.completed = completed;

        if (Object.keys(dataToUpdate).length === 0) {
            return res.status(400).json({ message: 'No fields to update provided' });
        }
        const result = await sql`
            UPDATE todo
            SET ${sql(dataToUpdate)}
            WHERE id = ${Number(id)} AND user_id = ${userId}
        `;

        if (result.count === 0) {
            return res.status(404).json({ message: 'Todo not found or not authorized' });
        }

        res.json({ message: 'Todo updated successfully' });
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ message: 'Error updating todo' });
    }
};

export const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const result = await sql`
            DELETE FROM todo
            WHERE id = ${Number(id)} AND user_id = ${userId}
        `;

        if (result.count === 0) {
            return res.status(404).json({ message: 'Todo not found or not authorized' });
        }

        res.json({ message: 'Todo deleted successfully' });
    } catch (error)
    {
        console.error('Error deleting todo:', error);
        res.status(500).json({ message: 'Error deleting todo' });
    }
};

export const getTodoById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const todos = await sql`
            SELECT id, title, description, completed, created_at, updated_at, user_id
            FROM todo
            WHERE id = ${Number(id)} AND user_id = ${userId}
            LIMIT 1
        `;

        if (todos.length === 0) {
            return res.status(404).json({ message: 'Todo not found or not authorized' });
        }

        res.json(todos[0]);
    } catch (error) {
        console.error('Error fetching todo by id:', error);
        res.status(500).json({ message: 'Error fetching todo' });
    }
};

const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const CACHE_DURATION = 10 * 60 * 10000;

const cache = new Map();

export const getWeather = async (req, res) => {
    try {
        const { city } = req.params;
        const cacheKey = city.toLowerCase();

        const cachedData = cache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
            console.log(`Serving weather for ${city} from cache`);
            return res.json(cachedData.data);
        }

        if (cachedData) {
            console.log(`Cache expired for ${city}`);
            cache.delete(cacheKey);
        }

        console.log(`Fetching weather for ${city} from API`);
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`;

        const { data } = await axios.get(url);
        const weatherData = {
            city: data.name,
            temperature: data.main.temp
        };

        cache.set(cacheKey, {
            timestamp: Date.now(),
            data: weatherData
        });

        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        const status = error.response?.status === 404 ? 404 : 500;
        const message = status === 404 ? 'City not found' : 'Error fetching weather data';
        res.status(status).json({ message });
    }
};