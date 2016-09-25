var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Changi Responder' });
});

var memoryCommandDb = [];
var executionId = 0;

// ROBOT calls this. This is weird I know, small time no sockets.
router.post('/callback', function(req, res, next) {
  var executionId = req.body.executionId;
  if (req.body && executionId) {
    
    var callback = memoryCommandDb[executionId];
    if (callback) {
      callback.res.send({
        status: true,
        executionId: executionId,
        data: req.body
      });
      delete memoryCommandDb[executionId];
      res.send({
        status: true
      })
    }
    else {
      res.send({
        status: false
      })
    }
  }
});

router.post('/api', function(req, res, next) {
  var currentExecutionId = executionId++;
  memoryCommandDb.push({
    executionId: currentExecutionId,
    data: req.body,
    res: res
  });
});

// For simplicity, no internet in train to get socket.io we will do
// polling instead,
router.get('/api', function(req, res, next) {
  res.send({
    status: true,
    data: memoryCommandDb.filter(function(db) {return !db.sent}).map(function(d) { return {
      data: d.data,
      executionId: d.executionId 
    }})
  })
  memoryCommandDb.forEach(function(db) {
    db.sent = true
  });
});

module.exports = router;
