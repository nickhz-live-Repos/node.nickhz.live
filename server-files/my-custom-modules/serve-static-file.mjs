import {readFile} from 'node:fs/promises';
import {lookup} from 'mime-types';

export default async (filePath, res) => {
    res.writeHead(200, {'Content-Type': lookup(filePath)});
    res.write(await readFile(filePath));
};
