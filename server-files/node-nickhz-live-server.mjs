import {createServer} from 'node:http';
import origin from './controller/origin.mjs';
import servePublic from './util/serve-public-file.mjs';

const controllers = new Map();
controllers.set(/^\/$/, origin);
controllers.set(/^\/favicon.ico/, (req, res) => servePublic('img/nh-cursive-node-icon.png', res));

const serve = async (req, res) => {
    req.url = decodeURI(req.url);

    console.log(req.rawHeaders[req.rawHeaders.indexOf('Host') + 1]);

    let controller = null;

    // for(const route of controllers.keys()) {
    //     if(route.test(req.url)) {
    //         controller = controllers.get(route);
    //         break;
    //     }
    // }

    if(controller) {
        return await controller(req, res);
    }

    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write(`
<!DOCTYPE html>

<html>
    <head>
        <style>
            body {
                background-color: black;
                color: lime;
            }
        </style>
    </head>
    <body>
        <hgroup>
            <h1>
                404 not found.
            </h1>
            <h4>
                The requested URL path was: ${req.url}
            </h4>
        </hgroup>
    </body>
</html>
`)
    ;
};

const server = createServer(
    (req, res) => {
        serve(req, res)
            .then(() => res.end())
            .then(spentResponse => {
                console.log(`[${new Date()}] Served request to: ${req.url}`);
            })
            .catch(err => {
                res.end();
                console.warn(err);
                console.warn(`[${new Date()}] Failed request to: ${req.url}`);
            })
        ;
    }
);

server.listen(8000);

console.log('Server for node.nickhz.live now running...');
