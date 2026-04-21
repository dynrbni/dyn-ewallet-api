import express from 'express';
import doten from 'dotenv';

doten.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.send('DYN E-Wallet API is healthy!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});