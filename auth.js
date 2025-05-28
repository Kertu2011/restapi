import jwt from 'jsonwebtoken'
import postgres from 'postgres'

let PGHOST = "localhost";
let PGDATABASE = "postgres";
let PGUSER = "postgres";
let PGPASSWORD = "Test123";
export const sql = postgres({ host: PGHOST, database: PGDATABASE, username: PGUSER, password: PGPASSWORD, port: 5432 });

export const authenticateToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
    
        if (!token) {
          return res.status(401).json({ message: 'Authentication required' });
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const users = await sql`SELECT * FROM users WHERE id = ${decoded.id}`;

    
        if (!users || users.length === 0) {
          return res.status(401).json({ message: 'User not found' });
        }
        const user = users[0];
    
        req.user = {
          id: user.id,
          username: user.username
        };
        console.log('Authenticated user:', req.user);
        next();
      } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
      }
}