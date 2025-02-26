import { createServer } from 'node:http';
import { getStaticRouter, refreshStaticRouter } from './util/serve-public-static-file.mjs';
import getApiAction from './_api/api-controller.mjs';
import getParsedRoute from './util/parse-url-route.mjs';
import serve404 from './util/serve-404.mjs';

refreshStaticRouter();

const serve = async (req, res) => {
    const parsedRoute = getParsedRoute(req.url);
    req.path = parsedRoute.path;
    req.params = parsedRoute.params;
    req.depth = 0;
    req.isAtPathEnd = function() {
        return this.depth >= this.path.length;
    };

    // check for an API action
    let serveAction = await getApiAction(req, res);

    // if the API action is just a 404, check static routes
    if(serveAction === serve404) {
        const requestedDirectory = req.path.join('/');
        const staticRouter = await getStaticRouter();
        if(req.method === 'GET' && staticRouter.has(requestedDirectory)) {
            serveAction = staticRouter.get(requestedDirectory);
        }
    }

    await serveAction(req, res);
};

const server = createServer(
    (req, res) => {
        serve(req, res)
            .then(() => res.end())
            .then(() => {
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
