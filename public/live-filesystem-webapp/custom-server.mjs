import {createServer} from 'node:http';
import {createWriteStream} from 'node:fs';
import {readFile, stat, readdir, mkdir, rmdir, unlink} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {lookup} from 'mime-types';

const methods = Object.create(null);
const basePath = process.cwd() + sep + 'files';

const confirmBasePath = async () => {
	try {
		const stats = await stat(basePath);

		if(stats.isDirectory()) {
			return;
		} else if(stats.isFile()) {
			await unlink(basePath);
			await mkdir(basePath);
		}
	} catch(e) {
		if(e.code === 'ENOENT') {
			await mkdir(basePath);
		}
	}
};

// default methods for serving the home page, its favicon, and its script
const serveIndex = async (res) => {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write(await readFile('index.html'));
};

const serveFavicon = async (res) => {
	res.writeHead(200, {'Content-Type': 'image/gif'});
	res.write(await readFile('folder.gif'));
};

const serveUIScript = async (res) => {
	res.writeHead(200, {'Content-Type': 'text/javascript'});
	res.write(await readFile('custom-client.js'));
}

const defaultServeMethods = {
	'/':res => serveIndex(res),
	'/index.html':res => serveIndex(res),
	'/folder.gif':res => serveFavicon(res),
	'/custom-client.js':res => serveUIScript(res)
};

// recursively retrieves all file & folder addresses underneath a specified directory
const getFilesFrom = async (directory) => {
	const result = Object.create(null);

	let folderContents = await readdir(directory);
	for(const item of folderContents) {
		const qualifiedItem = directory + sep + item;
		const stats = await stat(qualifiedItem);

		if(stats.isFile()) {
			result[item] = null;
		} else if(stats.isDirectory()) {
			result[item] = await getFilesFrom(qualifiedItem);
		}
	}

	return result;
};

// path resolution functions
const getCanonicalPath = (urlPath) => {
	return resolve(decodeURIComponent('files' + urlPath));
};

const isInBasePath = (canonicalFilePath) => {
	return canonicalFilePath === basePath || canonicalFilePath.startsWith(basePath + sep);
};



// HTTP methods
methods['GET'] = async (req, res) => {
	// handles requests for the base file resources
	const defaultServe = defaultServeMethods[req.url];

	if(defaultServe) {
		await defaultServe(res);
		return;
	}

	if(new URL('http://a' + req.url).searchParams.get('action') === 'getfiles') {
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(await getFilesFrom(basePath)));
		return;
	}

	// handles other requests for resources inside the app-managed folder
	let filePath = getCanonicalPath(req.url);

	if(isInBasePath(filePath)) {
		try {
			const stats = await stat(filePath);

			if(stats.isFile()) {
				// the path led to a file
				res.writeHead(200, {'Content-Type': lookup(filePath)});
				res.write(await readFile(filePath));
			} else if(stats.isDirectory()) {
				// the path led to a directory
				const folderContents = await readdir(filePath);
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.write(folderContents.length > 0 ? 'Folder contents:\n\n' + folderContents.join('\n') : 'This folder was found, but there are no contents!');
			} else {
				// the path led to something that wasn't a file or directory (like a filesystem shortcut)
				res.writeHead(400, {'Content-Type': 'text/plain'});
				res.write('400 - Bad Request - attempted to access a resource that\'s not a file or directory.');
			}
		} catch(e) {
			// file not found
			res.writeHead(404, {'Content-Type': 'text/plain'});
			res.write('404 - File Not Found - attempted to access a resource that\'s not on the server.\n\n');
			res.write(e.toString());
		}
	} else {
		res.writeHead(403, {'Content-Type': 'text/plain'});
		res.write('403 - Forbidden - attempted to access a resource outside the server\'s operating bounds.');
	}
};

methods['PUT'] = async (req, res) => {
	const parentFolderPath = getCanonicalPath(req.url);

	const itemType = req.headers['create-item-type'];
	const itemName = req.headers['item-name'];

	try {
		if((await stat(parentFolderPath)).isDirectory()) {
			switch(itemType) {
				case 'write-file':
				case 'upload-file':
					const writeStream = createWriteStream(parentFolderPath + sep + itemName)
					writeStream.on('error', error => {
						console.warn('File was not created!\n\n' + error.toString() + '\n\n');
					});
					req.pipe(writeStream);
					break;
				case 'create-folder':
					await mkdir(parentFolderPath + sep + itemName);
					break;
			}
		}
	} catch(e) {

	}

	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write(`Carried out ${itemType} for the item ${itemName}`);
};

methods['DELETE'] = async (req, res) => {
	const resource = getCanonicalPath(req.url);

	try {
		const stats = await stat(resource);
		if(stats.isDirectory()) {
			await rm(resource, {recursive: true, force: true}, err => {});
		} else if(stats.isFile()) {
			await unlink(resource);
		}
	} catch(e) {

	}

	res.writeHead(204); // 204 - No Content
};



// server runner
const server = createServer((req, res) => {
	const controller = methods[req.method] || (async (request, response) => { response.writeHead(405, {'Content-Type': 'text/plain'}); response.write('405 - Method Not Allowed'); });

	confirmBasePath()
		.then(() => controller(req, res))
		.then(() => {res.end()})
	;
});

server.listen(8000);

console.log('server now running...');
