import express from 'express';
import doten from 'dotenv';
import authRoutes from './routes/auth.routes';

doten.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
  res.send('DYN E-Wallet API is healthy!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});