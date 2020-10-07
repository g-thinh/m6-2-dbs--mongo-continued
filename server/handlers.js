"use strict";

const assert = require("assert");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

// ---------------------------------------------------------------------
//////// HELPERS
const NUM_OF_ROWS = 8;
const SEATS_PER_ROW = 12;

const getRowName = (rowIndex) => {
  return String.fromCharCode(65 + rowIndex);
};

const randomlyBookSeats = (num) => {
  const bookedSeats = {};

  while (num > 0) {
    const row = Math.floor(Math.random() * NUM_OF_ROWS);
    const seat = Math.floor(Math.random() * SEATS_PER_ROW);

    const seatId = `${getRowName(row)}-${seat + 1}`;

    bookedSeats[seatId] = true;

    num--;
  }

  return bookedSeats;
};

let state;

// ---------------------------------------------------------------------

const getSeats = async (req, res) => {
  //Create and connect to client
  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  console.log("Connected!");

  if (!state) {
    state = {
      bookedSeats: randomlyBookSeats(1),
    };
  }

  try {
    //Access the database
    const db = client.db("exercise_1");

    //Access the Greetings collections and insert the data
    const seatsColl = await db.collection("seats").find().toArray();

    let seats = {};
    seatsColl.map((seat) => {
      seats[seat._id] = {
        price: seat.price,
        isBooked: seat.isBooked,
      };
    });

    // console.log("These are all the seats", seats);

    return res.json({
      seats: seats,
      bookedSeats: state.bookedSeats,
      numOfRows: 8,
      seatsPerRow: 12,
    });
  } catch (error) {
    console.log(error.stack);
  }

  client.close();
  console.log("disconnected!");
};

module.exports = { getSeats };
