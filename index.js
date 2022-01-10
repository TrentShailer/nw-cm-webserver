const fs = require("fs");
const path = require("path");
const http = require("http");

const express = require("express");
const app = express();

const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/build")));
app.set("json spaces", 2);
app.set("trust proxy", 1);
app.set("Access-Control-Allow-Origin", "*");
app.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");

let data = require("./data.json");
let updateEvent = false;

function writeData() {
	if (!updateEvent) {
		updateEvent = true;
		setTimeout(() => {
			console.log("Writing Data");
			fs.writeFileSync(path.join(__dirname, "data.json"), JSON.stringify(data, "", 2));
			updateEvent = false;
		}, 1000);
	}
}

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, content-type");
	res.header("Access-Control-Allow-Headers", "GET, POST, DELETE, OPTIONS, content-type");
	next();
});

function Log(player_name, method, message) {
	console.log(`${method} // ${player_name} // ${message}`);
}

app.get("/get/*", async (req, res) => {
	let player_name = req.params[0];

	Log(player_name, "/get/*", "Start of get");

	let filteredData = data.filter((item) => item.player_name === player_name);

	if (filteredData.length === 0) {
		Log(player_name, "/get/*", "No Records Exist");
		return res.sendStatus(404);
	}

	Log(player_name, "/get/*", "Sending: ");
	console.log(filteredData[0]);

	return res.json(filteredData[0]);
});

app.post("/fetch", async (req, res) => {
	let names = req.body.names;

	Log(names, "/fetch", "Start of fetch");

	let filteredData = data.filter((item) => names.includes(item.player_name));

	Log(names, "/fetch", "Returning Filtered Data: ");
	console.log(filteredData);

	return res.json(filteredData);
});

app.delete("/delete/*", async (req, res) => {
	let player_name = req.params[0];

	Log(player_name, "/delete/*", "Start of delete");

	if (data.findIndex((item) => item.player_name === player_name) === -1) {
		Log(player_name, "/delete/*", "404 no records exist");
		return res.sendStatus(404);
	}

	Log(player_name, "/delete/*", "Removing: ");
	console.log(data.filter((item) => item.player_name === player_name)[0]);

	data = data.filter((item) => item.player_name !== player_name);

	writeData();

	return res.sendStatus(200);
});

app.post("/add/*", async (req, res) => {
	let player_name = req.params[0];

	Log(player_name, "/add/*", "Start of add");

	console.log(data.findIndex((item) => item.player_name === player_name));

	if (
		data.findIndex((item) => {
			item.player_name === player_name;
		}) !== -1
	) {
		Log(player_name, "/add/*", "Already exists; overwriting");
		data = data.filter((item) => item.player_name !== player_name);
	}

	let POIs = req.body;
	Log(player_name, "/add/*", "POIs: ");
	console.log(POIs);

	let entry = { player_name: player_name, POIs: POIs };
	Log(player_name, "/add/*", "Entry: ");
	console.log(entry);

	data.push(entry);
	Log(player_name, "/add/*", "Pushed entry to data");
	writeData();

	return res.sendStatus(200);
});

app.post("/update/*/*/*", async (req, res) => {
	let player_name = req.params[0];
	let poi = req.params[1];
	let timestamp = req.params[2];

	Log(player_name, "/update/*/*/*", "Start of update");
	Log(player_name, "/update/*/*/*", "Data: ");
	console.log(req.params);

	let index = data.findIndex((item) => item.player_name === player_name);
	if (index === -1) {
		Log(player_name, "/update/*/*/*", "Player entry doesn't exist");
		return res.sendStatus(404);
	}

	let poiIndex = data[index].POIs.findIndex((itemPOI) => itemPOI.id === poi);
	if (index === -1) {
		Log(player_name, "/update/*/*/*", "POI entry doesn't exist");
		return res.sendStatus(404);
	}

	Log(player_name, "/update/*/*/*", "Entry: ");
	console.log(data[index]);

	Log(player_name, "/update/*/*/*", "POI: " + data[index].POIs[poiIndex].id);

	data[index].POIs[poiIndex].timestamp = parseFloat(timestamp);

	Log(player_name, "/update/*/*/*", "Updated: ");
	console.log(data[index]);

	writeData();

	return res.sendStatus(200);
});

httpServer.listen(2005);
