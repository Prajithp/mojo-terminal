var client = {};

client.run = function (options) {

	options = options || {};


        var socket = new WebSocket(options.remote);
        var term = new Terminal({
            rows: options.screen.rows,
            cols: options.screen.cols,
            screenKeys: true,
            cursorBlink: true,
            useStyle: true,
        });

        term.open(options.parent || document.body);
        socket.onopen = function(e) {
            socket.send(JSON.stringify({"screen":{"cols": options.screen.cols, "rows": options.screen.rows}}));

            term.on('data', function(data) {
                socket.send(JSON.stringify({'stdin':data}));
            });

            socket.onmessage = function(event) {
                json_msg = JSON.parse(event.data);
                term.write(json_msg.stdout);
            };

            socket.onclose = function() {
                term.destroy();
            };
        };
        return {'socket': socket, 'term': term};
};
