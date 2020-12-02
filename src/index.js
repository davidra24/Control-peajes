const express = require('express');
const app = express();
const path = require('path');
const { fileMutation } = require('./js/fileMutation');
const { fileLarge } = require('./js/fileLarge');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: 'first', maxCount: 1 },
  { name: 'second', maxCount: 1 },
]);

//settings
const port = process.env.PORT || 5002;
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
app.use(bodyParser.json({ limit: '50mb' }));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/upload', async (req, res) => {
  const files = req.body;
  return await fileMutation(files, res);
});

//listening server
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});
