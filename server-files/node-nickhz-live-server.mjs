import {createServer} from 'node:http';
import staticEndpoint from './controller/public.mjs';
import serve404 from './util/serve-404.mjs';

// const controllers = new Map();
// controllers.set(/^\/$/, origin);
// controllers.set(/^\/favicon.ico/, (req, res) => servePublic('img/nh-cursive-node-icon.png', res));

const serve = async (req, res) => {
    req.url = decodeURI(req.url);
    if(req.method === 'GET' && await staticEndpoint(req, res)) {
        // staticEndpoint also serves the requested endpoint if applicable
        return;
    }

    // console.log(req.rawHeaders[req.rawHeaders.indexOf('Host') + 1]);

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

    serve404(req, res);
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
