const express = require('express');
const path = require('path');

const viewRoutes = require('./routes/views');
const apiRoutes = require('./routes/api');

const app = express();
const port = 3004;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', viewRoutes);
app.use('/api', apiRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});