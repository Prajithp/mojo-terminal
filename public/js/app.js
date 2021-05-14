Session = {
	windows: {},
	utils: {
		selectedTab: false
	},
	selectTab: tabname => {
		for (let i of document.getElementById('tabs').children)
			if (i.id.startsWith('tab')) i.className = "tab";
		for (let i of document.getElementById('window').children) i.hidden = true;
		for (let i of document.getElementById('tabs').children) {
			if (i.hasAttribute('data-name') && i.getAttribute('data-name').startsWith(tabname)) {
				i.className = "selectedtab";
				document.getElementById(`win-${i.id.slice(4)}`).hidden = false;
				return true;
			}
		}
		return false;
	},
	Init: (name, socketUrl) => {
		name = name + Math.floor((Math.random() * 100) + 1);
		

		let tabid = document.getElementById('tabs').childElementCount;
		while (true) {
			if (document.getElementById('tab-' + tabid)) {
				tabid++;
			} else break;
        }
        
        let socket = new WebSocket(socketUrl); 
        Session.windows[name] = {
            name: name,
            socket: socket,
		};

		document.getElementById('tabs').insertAdjacentHTML(`beforeend`, `<span id="tab-${tabid}" data-name="${name}" class="tab">Terminal <button onclick="
            if(document.getElementById('tabs').childElementCount === 2) return;
            let session_id = this.parentElement.getAttribute('data-name');
            Session.windows[session_id].socket.close();
            delete Session.windows[session_id];
            this.parentElement.remove();
            Session.selectTab(document.getElementById('tabs').children[1].getAttribute('data-name'));
            document.getElementById('win-'+${tabid}).remove();
            " class="close-btn"> ×</button></span>`);
		document.getElementById('window').insertAdjacentHTML('beforeend', `<div style="position: absolute" class="win" id="win-${tabid}"></div>`);
		document.getElementById(`tab-${tabid}`).addEventListener("click", () => {
			if (document.getElementById(`tab-${tabid}`)) Session.selectTab(name);
		});

		var term = new Terminal({
			cursorBlink: true,
			fontSize: 3,
		});
		term.open(document.getElementById('window').lastChild);
		term.fit();

		var cols = term.cols,
			rows = term.rows;

		socket.onopen = function(e) {
			socket.send(JSON.stringify({
				"screen": {
					"cols": cols,
					"rows": rows
				}
			}));

			term.on('data', function(data) {
				socket.send(JSON.stringify({
					'stdin': data
				}));
			});

			socket.onmessage = function(event) {
				json_msg = JSON.parse(event.data);
				var type = json_msg.type;
				switch (type) {
					case 'terminal':
						term.write(json_msg.stdout);
						break;
				}
			};
			socket.onclose = function() {
				term.destroy();
			};
		};
		Session.selectTab(name);
		return true;
	}
};