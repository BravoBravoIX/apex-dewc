const express = require('express');
const app = express();

app.get('/api', (req, res) => {
  res.send({ message: 'API is working!' });
});

app.listen(4000, '0.0.0.0', () => {
  console.log("API server running on port 4000");
});
