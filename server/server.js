var express    = require('express');
var fs = require('fs');
var path = require('path');

var app        = express();
app.use('/', express.static(path.join(__dirname, '../app/static')));


const httpsOptions = {
    key: fs.readFileSync( __dirname + '/key.pem'),
    cert: fs.readFileSync( __dirname + '/cert.pem')
}
var https      = require('https').createServer(httpsOptions, app)

String.prototype.template = function (o) {
    return this.replace(/{([^{}]*)}/g,
                        function (a, b) {
                        var r = o[b];
                        return typeof r === 'string' || typeof r === 'number' ? r : a;
                        }
                        );
};

app.get('/',function(req,res,next){
        fs.readFile("./app/static/html/index.html", 'utf8', function (err, data) {
                    if (err) return next(err);
                    var result = data.template({})
                    res.send(result);
                    });
        })


https.listen(3000, function(){
            console.log('listening on *:3000');
            });


