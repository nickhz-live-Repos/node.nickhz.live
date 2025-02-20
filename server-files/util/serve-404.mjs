// serves a 404 page

const pageContentOf = req => `
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
`;

export default (req, res) => {
    res.writeHead(404, {'Content-Type': 'text/html'});
    res.write(pageContentOf(req));
}
