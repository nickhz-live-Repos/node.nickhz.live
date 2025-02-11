// serves requests to the domain's origin
import {readFile} from 'node:fs/promises';

export default async (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(await readFile('./origin/index.html'));
};
