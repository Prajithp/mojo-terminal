var client = {};
var terminalContainer = document.getElementById('terminal-container');

client.run = function (options) {

	options = options || {};


        var socket = new WebSocket(options.remote);
        var term = new Terminal({
            cursorBlink: true,
        });
        term.open(terminalContainer);
        term.fit();
        var cols = term.cols,
            rows = term.rows;

        socket.onopen = function(e) {
            socket.send(JSON.stringify({"screen":{"cols": cols, "rows": rows}}));

            term.on('data', function(data) {
                socket.send(JSON.stringify({'stdin':data}));
            });

            socket.onmessage = function(event) {
                json_msg = JSON.parse(event.data);
                var type = json_msg.type;
                switch (type) { 
                    case 'loadavg':
                        document.getElementById('uptime').innerHTML = "loadavg: " + json_msg.stdout;
                        break;
                    case 'terminal':
                        term.write(json_msg.stdout);
                        break;  
                }
            };
            socket.onclose = function() {
                //term.destroy();
            };
        };
        return {'socket': socket, 'term': term};
};
