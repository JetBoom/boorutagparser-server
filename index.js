var http = require('http');
var fs = require('fs');
var crypto = require('crypto');

var cloudscraper;
var request;
try {
	request = require('request');
	cloudscraper = require('cloudscraper');
}
catch (e) {
	console.log('some libraries were not found - did you run install_modules.bat or install_modules.sh?');
	process.exit(1);
	return;
}

const PORT = 14007;

function handleRequest(req, response)
{
	var url = req.url;

	if (req.method != 'POST')
		return response.end('error');

	var body = '';

	req.on('data', function(data) {
		body += data;

		/*if (body.length > 1e6)
			req.connection.destroy();
		});*/
	});

	req.on('end', function() {
		//var data = querystring.parse(body);
		var url = req.url.replace(/\/$/, '').replace(/^\//, '');

		console.log(url);

		var cmd;
		var args;

		var sep = url.indexOf('\?');
		if (sep >= 0)
		{
			cmd = url.substr(0, sep);
			args = url.substr(sep + 1, url.length - 1);
		}
		else
		{
			cmd = req.url;
			args = '';
		}

		if (cmd == 'download')
		{
			//console.log('req: %s', url);
			console.log('cmd: %s', cmd);
			console.log('args: %s', args);
			//console.log('body:\n%s', body);

			body = body.replace(/,/g, "\r\n");

			var filename = args.replace(/\.\./, '').replace(/^.*[\\\/]/, '').replace(/\?.+/, '');

			// There's some rediculously long file names out there and some boorus have collisions if images have identical tags.
			// hydrus ruins the file name and ignores duplicates anyway so who cares if I do this.
			var filesplit = filename.split('.');
			var fileext = filesplit.pop();
			var filenamenoext = filesplit.pop();
			filename = crypto.createHash('md5').update(args).digest("hex") + '.' + fileext;

			var txtfilename = filename + '.txt';

			// Just in case people have user agent checking.
			var headers = {
			    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36'
			}

			var options = {
			    url: args,
			    method: 'GET',
			    headers: headers
			}

			cloudscraper(
				{
					method: 'GET',
                	url:args,
                	encoding: null,
                },
                function(err, response, rbody) {
                	if (err)
                	{
                		console.log('cloudflare scraper error!');
                		console.log(err);
                	}
                	else
						fs.writeFile('./import_me/' + filename, rbody, null, function(err, w, b) { if (err == null) console.log('wrote %s', filename); });
				}
			);

			/*request(args)
			.pipe(fs.createWriteStream('./import_me/' + filename))
			.on('close', function() { console.log('wrote %s', filename); });*/

			if (body.length > 0)
				fs.writeFile('./import_me/' + txtfilename, body, 'utf8', function(err, w, b) { if (err == null) console.log('wrote %s', txtfilename); });

			return response.end('ok');
		}

		return response.end('error');
	});
}

try {
	fs.mkdirSync("./import_me");
}
catch (e) {
	console.log("warning: couldn't make import_me directory");
}

var server = http.createServer(handleRequest);
server.listen(PORT, 'localhost', 511, function() {
	console.log("boorutagparser-server listening on localhost:%s", PORT);
	console.log('you can now use the \'download with tags\' button\n');

	console.log('to import images with tags in to hydrus: file -> import files -> add folder -> add the import_me folder');
	console.log('you can also simply drag the import_me folder on to hydrus');
	console.log('make sure you tick \'try to load tags from neighbouring .txt files\'');
	console.log('you may also want to tick \'delete files after successful import\'\n');

	console.log('YOU MUST LEAVE THIS PROGRAM RUNNING FOR THE FUNCTIONALITY TO WORK.');
});
