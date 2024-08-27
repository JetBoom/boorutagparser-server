from os import path, makedirs
from http.server import HTTPServer, BaseHTTPRequestHandler
from io import BytesIO
from urllib.parse import urlparse
from hashlib import md5
import base64
import json

IMPORT_PATH = r'./import_me'
PORT = 14007

class BooruTagParserServer(BaseHTTPRequestHandler):
    def do_GET(self):
        pass

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)

        data = json.loads(body)

        tags = data['tags']
        url = urlparse(data['url'])
        file_name = path.basename(url.path)
        file_name, file_extension = path.splitext(file_name)

        # There's some rediculously long file names out there and some boorus have collisions if images have identical tags.
		# hydrus ruins the file name and ignores duplicates anyway.
        file_name = md5(file_name.encode('utf-8'), usedforsecurity=False).hexdigest()

        file_name = file_name + '.' + file_extension
        file_name_tags = file_name + '.txt'

        file_data = base64.b64decode(data['fileData'])

        with open(IMPORT_PATH + '/' + file_name, mode='wb') as file_handle:
            file_handle.write(file_data)
        
        with open(IMPORT_PATH + '/' + file_name_tags, mode='w', encoding="utf-8") as file_handle:
            file_handle.write('\r\n'.join(tags))

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'OK')
    
def create_server():
    if not path.exists(IMPORT_PATH):
        makedirs(IMPORT_PATH)
    
    print('Listening on localhost: %s' % PORT)
    print('You can now use the "download with tags" button')

    print('To import images with tags in to hydrus: file -> import files -> add folder -> add the import_me folder')
    print('You can also simply drag the import_me folder on to hydrus')
    print('Make sure you tick "try to load tags from neighbouring .txt files"')
    print('You may also want to tick "delete files after successful import"')

    print('YOU MUST LEAVE THIS PROGRAM RUNNING FOR THE FUNCTIONALITY TO WORK.')

    httpd = HTTPServer(('localhost', PORT), BooruTagParserServer)
    httpd.serve_forever()
