const express    = require('express')
const app        = express();
const mysql      = require('mysql');
const mosca      = require("mosca");
const bodyParser = require('body-parser');

var server = new mosca.Server({
      port:8080,
      http: {
              port: 9000,
              bundle: true,
              static: './'
            }
});
server.on('clientConnected', function(client) {
        console.log('client connected', client.id);
});
server.on('published', function(packet, client) {
      //  console.log(packet);
      if(packet.topic.toString().includes("data")){
        var data = packet.payload.toString().split(',');
        connection.query('SELECT * FROM users WHERE users.key="'+data[0]+'"', function(err, result) {
          if (err) throw err;
          var valid=false;
          if(result.length>0)valid=true;
          var sqlData={key:data[0],valid:valid,date:new Date().toISOString().slice(0, 19).replace('T', ' ')};
          console.log(sqlData);
          connection.query('INSERT INTO controldata SET ?', sqlData, function(err, result) {
            if (err) throw err;
          });
        });

      }
});
server.on('ready', setup);

// fired when the mqtt server is ready
function setup() {
  console.log('Mosca server is up and running');
}

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database: 'accesscontrolhani'
});

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())
// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', (req, res) => {

  res.send('Hello World!');
});
app.get('/getControlData',(req,res)=>{
  var selectDate = req.query.selectDate;
  connection.query('SELECT users.name,users.surname,controldata.key,controldata.date,controldata.valid From users RIGHT JOIN controldata ON controldata.key = users.key where controldata.date BETWEEN "'+selectDate+' 00:00:00" AND "'+selectDate+' 23:59:59"', function (error, results, fields) {
    if (error) throw error;
    res.send(results);
  });
});
app.post('/addCard',(req,res)=>{
  var user  = {name: req.body.name, surname: req.body.surname,key:req.body.key};
  console.log(user);
  connection.query('INSERT INTO users SET ?', user, function(err, result) {
    if (err) throw err;
    res.send("success");
  });
});


app.listen(80, () => {
  console.log('app listening on port 80!')
});
