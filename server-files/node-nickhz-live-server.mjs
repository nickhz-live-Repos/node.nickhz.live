import {createServer} from 'node:http';
// import staticEndpoint from './controller/public.mjs';
import getParsedRoute from './util/parse-url-route.mjs';
import serve404 from './util/serve-404.mjs';

const router = initializeRouter('/');
// !!! STATIC PATHS SHOULD BE AUTO-TARGETED SO THEY DON'T NEED TO BE LISTED HERE


const serve = async (req, res) => {
    const parsedRoute = getParsedRoute(req.url);
    req.path = parsedRoute.path;
    req.params = parsedRoute.params;
    req.depth = 0;
    req.isAtPathEnd = function() {
        return this.depth >= this.path.length;
    };

    const nextSubRoute = router.get(req.isAtPathEnd() || req.path[req.depth]);
    req.depth++;

    try {
        await nextSubRoute(req, res);
    } catch(e) {
        serve404(req, res);
    }

    /*
        REWORK ITEMS

        -- this framework not handling handle url parameters & links with hashes properly...
        ++ now handled by the parsedRoute object

        -- where do I put my API / fetch-intended endpoints?
        ++ down the pathway specified by the parsedRoute.path array elements

        -- should subpath handling really be separated by static versus dynamic, or should it be separated by directory path?
        ++ this new build will separate by directory path; static pathing will be handled within each path

        -- if separated by directory path, should requested paths be registered so they don't have to be checked more than once?
        ~~ TBD; potentially case by case, or register when successful & de-register when a previous success is unsuccessful

        ++ IDEA: a site that the webmaster may develop from the site itself...
        ~~ this framework may allow this idea to be developed as a sub-application of the node.nickhz.live domain
    */
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
