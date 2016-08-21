// var http = require('http')
// var url = require('url')
// var fs = require('fs')

// var server = http.createServer( function(req, res) {
// 	var objurl = url.parse(req.url)

// 	// fs.readFile('presentacion/index.html', 'utf8', function(err, data) {
// 	// 	if (err) return err;
// 	// 	console.log(data)
// 	// });
// 	console.log(url.parse(req.url))
// });

// server.listen(9090)

var fs = require('fs')
// var stream = fs.createReadStream('head.html')

// console.log(stream)
// // stream.setEncoding('utf8')

// stream.on('data', function (err, chunk) {
// 	console.log(chunk)
// });

// stream.on('end', function (err) {
// 	console.log('finalizado...')
// });

fs.readFile('head.html', 'utf8', function (err,data) {
	if (err) return 'Error al leer archivo'
	console.log(data)
})