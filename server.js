const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path");

const app = express();

connectDB();

app.use(cors());

const PORT = process.env.PORT || 6001;

// Middleware
app.use(express.json());

// app.use(function (req, res, next) {
// 	res.header("Access-Control-Allow-Origin", "https://localhost:3002/register"); // update to match the domain you will make the request from
// 	res.header(
// 		"Access-Control-Allow-Headers",
// 		"Origin, X-Requested-With, Content-Type, Accept"
// 	);
// 	next();
// });

app.get("/", (req, res) => {
	res.sendStatus(200);
});

// define routes
app.use("/api/users", require("./routes/api/users.js"));
app.use("/api/auth", require("./routes/api/auth"));
app.use("/api/profile", require("./routes/api/profile"));
app.use("/api/posts", require("./routes/api/posts"));

// server static assets in prod

app.listen(PORT, () => {
	console.log(`server started on port ${PORT}`);
});

module.exports = app;
