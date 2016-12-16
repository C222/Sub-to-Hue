var wsUri = "wss://irc-ws.chat.twitch.tv/";
var output;
var username = "justinfan" + Math.round(Math.random() * (999999 - 100000) + 100000);
var hueuser;
var bulbs;
var bleedPurple = '{"on":true, "sat":255, "bri":255,"hue":47695}';
var bulbOff = '{"on":false}';
var lock = false;

function hsl_to_hsb(hsl)
{
	l = hsl[2];
	s_hsl = hsl[1];
	h = hsl[0];
	b = (2 * l + s_hsl * (1 - Math.abs(2 * l - 1))) / 2;
	s = (2 * (b - l)) / b;

	return [h, s, b];
}

function doColor(color, b, lockend)
{
	console.log("Setting " + bulbs[b].name + " to " + color);
	$.ajax({
		url: "http://" + ip + "/api/" + hueuser + "/lights/" + b + "/state",
		type: 'PUT',
		data: color
	});
	lock = lockend;
}

function init()
{
	output = document.getElementById("output");
	$("#chatdis").prop("disabled",true);
}

function send_to_hue(str, lock)
{
	for (var b in bulbs)
	{
		lambda = function(bno)
		{
			$.getJSON("http://" + ip + "/api/" + hueuser + "/lights/" + bno, function(data)
			{
				doColor(str, bno, lock);
			});
		}(b);
	}
}

function send_obj_to_hue(obj, lock)
{
	send_to_hue(JSON.stringify(obj), lock)
}

function startHue()
{
	ip = $("#bname")[0].value;
	if(window.localStorage.getItem("hueuser"))
	{
		hueuser = window.localStorage.getItem("hueuser");
		$.getJSON("http://" + ip + "/api/" + hueuser + "/lights", cacheBulbs);
	}
	else
	{
		$.post("http://" + ip + "/api", '{"devicetype":"subtohue1458949"}', finishHue);
	}
}

function finishHue(data)
{
	data = data[0];
	if (("error" in data) && (data.error.type == 101))
	{
		alert("Please press the button on your bridge.");
	}
	else if ("success" in data)
	{
		hueuser = data.success.username;
		window.localStorage.setItem("hueuser", hueuser);
		console.log(hueuser);
		$.getJSON("http://" + ip + "/api/" + hueuser + "/lights", cacheBulbs);
	}
	else
	{
		console.log(data);
	}
}

function purpleHome()
{
	if(!lock)
	{
		lock = true;
		$.getJSON("http://" + ip + "/api/" + hueuser + "/lights/1", function(data)
		{
			oldcolor = data.state;
			send_to_hue($("#color").val(), true);
			console.log(data);
			console.log(oldcolor);
			for (i=1000; i < parseInt($("#time").val()); i += 1000)
			{
				window.setTimeout(send_obj_to_hue, i, {alert: "select"}, false);
			}
			window.setTimeout(send_obj_to_hue, parseInt($("#time").val()), oldcolor, false);
		});
	}
}

function cacheBulbs(data)
{
	bulbs = data;
	purpleHome();
	$("#huecon").prop("disabled",true);
	$("#bname").prop("disabled",true);
}

function testWebSocket()
{
	websocket = new WebSocket(wsUri);
	websocket.onopen = function(evt) { onOpen(evt) };
	websocket.onclose = function(evt) { onClose(evt) };
	websocket.onmessage = function(evt) { onMessage(evt) };
	websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt)
{
	writeToScreen('<span style="color: gray;">CONNECTED</span> ');
	doSend("CAP REQ :twitch.tv/tags twitch.tv/commands\n");
	doSend("PASS blah\n");
	doSend("NICK " + username + "\n");
	doSend("JOIN #" + $("#cname")[0].value.toLowerCase() + "\n");
	$("#chatcon").prop("disabled",true);
	$("#chatdis").prop("disabled",false);
}

function onClose(evt)
{
	writeToScreen('<span style="color: gray;">DISCONNECTED</span> ');
	$("#chatcon").prop("disabled",false);
	$("#chatdis").prop("disabled",true);
}

function onMessage(evt)
{
	if (evt.data.startsWith("PING"))
	{
		doSend("PONG\n");
	}
	else
	{
		if ($("#subenable")[0].checked)
		{
			tmi = evt.data.split(" :tmi.twitch.tv ");
			if(tmi.length > 1 && tmi[1].startsWith("USERNOTICE"))
			{
				user = tmi[0].split("display-name=")[1].split(";")[0];
				message = tmi[1].split(":")[1];
				writeToScreen("<h1>" + user + "</h1>");
				if (message != undefined)
				{
					writeToScreen(message);
				}
				purpleHome();
			}
			else if(tmi.length == 1 && tmi[0].startsWith(":twitchnotify!twitchnotify@twitchnotify.tmi.twitch.tv PRIVMSG"))
			{
				user = tmi[0].split(" :")[1].split(" ")[0];
				writeToScreen("<h1>" + user + "</h1>");
				purpleHome();
			}
		}
		if ($("#cmdenable")[0].checked && $("#ctext")[0].value != "")
		{
			mod = evt.data.split(";mod=")[1].split(";")[0] == "1";
			dname = evt.data.split(";display-name=")[1].split(";")[0];
			uname = evt.data.split(" :")[1].split("!")[0];
			mod |= uname == $("#cname")[0].value.toLowerCase();
			mod = Boolean(mod);
			message = evt.data.split(" :")[2];
			if(message.startsWith($("#ctext")[0].value + " ") && mod)
			{
				message = message.replace($("#ctext")[0].value + " ", "");
				message = message.trimLeft();
				message = message.trimRight("\n");
				if (message == "black" || message == "off")
				{
					to_send = {"on":false};
					send_obj_to_hue(to_send, false);
					writeToScreen("<h1>" + dname + "</h1>");
					writeToScreen("Set color to " + message);
				}
				else
				{
					color = Color.parse(message);
					if (color == null)
					{
						color = Color.get(message);
					}
					if (color != null)
					{
						color = color.hslData();
						color = hsl_to_hsb(color);
						to_send = {"on":true,
							"sat": Math.round(color[1]*255),
							"hue": Math.round(color[0]*65535)
						};
						brimin = parseInt($("#brimin")[0].value);
						to_send.bri = brimin + (255 - brimin) * Math.round(color[2]*255) / (255);
						to_send.bri = Math.round(to_send.bri);
						send_obj_to_hue(to_send, false);
						console.log(to_send);
						writeToScreen("<h1>" + dname + "</h1>");
						writeToScreen("Set color to " + message);
					}
				}
			}
		}
	}
}

function onError(evt)
{
	writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message)
{
	writeToScreen('<span style="color: gray;">SENT: ' + message + '</span>');
	websocket.send(message);
}

function writeToScreen(message)
{
	var pre = document.createElement("p");
	pre.style.wordWrap = "break-word";
	pre.innerHTML = message;
	output.appendChild(pre);
	pre.scrollIntoView();
}

window.addEventListener("load", init, false);
