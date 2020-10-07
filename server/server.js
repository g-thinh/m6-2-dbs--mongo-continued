const express = require("express");
const morgan = require("morgan");
const { getSeats, bookSeat } = require("./handlers");

const PORT = 5678;

var app = express();

app.use(express.json());
app.use(morgan("dev"));
// app.use(require('./routes'));
app.get("/api/seat-availability", getSeats);
app.post("/api/book-seat", bookSeat);

const server = app.listen(PORT, function () {
  console.info("🌍 Listening on port " + server.address().port);
});
