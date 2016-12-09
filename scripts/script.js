var wsUri = "wss://irc-ws.chat.twitch.tv/";
var output;
var username = "justinfan" + Math.round(Math.random() * (999999 - 100000) + 100000);
var hueuser;
var bulbs;
var bleedPurple = '{"on":true, "sat":255, "bri":255,"hue":47695}';
var bulbOff = '{"on":false}';
var lock = false;

function init()
{
	output = document.getElementById("output");
	$("#chatdis").prop("disabled",true);
	/*testWebSocket();*/
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

	/*console.log(reply);

	}*/
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
		for (var b in bulbs)
		{
			lambda = function(bno)
			{
				$.getJSON("http://" + ip + "/api/" + hueuser + "/lights/" + bno, function(data)
				{
					oldcolor = JSON.stringify(data.state);
					doColor($("#color").val(), bno, true);
					window.setTimeout(doColor, parseInt($("#time").val()), oldcolor, bno, false);
				});
			}(b);
		}
	}
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
	tmi = evt.data.split(" :tmi.twitch.tv ");
	// console.log(tmi);
	// console.log($("#subenable")[0].checked);
	// console.log(tmi.length);
	if ($("#subenable")[0].checked)
	{
		// console.log(tmi[1].startsWith("USERNOTICE"));
		if(tmi.length > 1 && tmi[1].startsWith("USERNOTICE"))
		{
			/*alert(evt.data);*/
			user = tmi[0].split("display-name=")[1].split(";")[0];
			message = tmi[1].split(":")[1];
			writeToScreen("<h1>" + user + "</h1>");
			if (message != undefined)
			{
				writeToScreen(message);
			}
			purpleHome();
			/*alert(user);*/
		}
		else if(tmi.length == 1 && tmi[1].startsWith(":twitchnotify!twitchnotify@twitchnotify.tmi.twitch.tv PRIVMSG"))
		{
			user = tmi[0].split(" :")[1].split(" ")[0];
			writeToScreen("<h1>" + user + "</h1>");
			purpleHome();
		}
	}
	/*console.log(evt.data);
	user = evt.data.split(" :")[1].split("!")[0].toLowerCase();
	text = evt.data.split(" :").slice(2).join(" :");
	console.log(user);
	console.log(evt);
	writeToScreen('<span style="color: blue;">' + user + ': ' + text +'</span>');
	websocket.close();*/
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
