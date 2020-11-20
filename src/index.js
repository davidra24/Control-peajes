const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const { fileMutation } = require('./js/fileMutation');
const bodyParser = require('body-parser');
const cors = require('cors');

//settings
const port = process.env.PORT || 5000;
app.set('views', path.resolve(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());
//middlewares
app.use(express.static(__dirname + '/views'));
app.use(
  bodyParser.urlencoded({
    parameterLimit: 100000,
    limit: '50mb',
    extended: true,
  })
);
app.use(bodyParser.text({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', async (req, res) => {
  const file = req.body;
  return await fileMutation(file, res);
});
//static files

//listening server
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
