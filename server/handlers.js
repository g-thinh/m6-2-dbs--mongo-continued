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

// ---------------------------------------------------------------------------

let lastBookingAttemptSucceeded = false;

const bookSeat = async (req, res) => {
  const { seatId, creditCard, expiration, email, fullName } = req.body;
  const _id = seatId;
  // console.log("Incoming Post!", req.body);
  // console.log("ID", _id);

  if (!state) {
    state = {
      bookedSeats: randomlyBookSeats(1),
    };
  }

  // await delay(Math.random() * 3000);

  const isAlreadyBooked = !!state.bookedSeats[seatId];
  if (isAlreadyBooked) {
    return res.status(400).json({
      message: "This seat has already been booked!",
    });
  }

  if (!creditCard || !expiration) {
    return res.status(400).json({
      status: 400,
      message: "Please provide credit card information!",
    });
  }

  if (lastBookingAttemptSucceeded) {
    lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

    return res.status(500).json({
      message: "An unknown error has occurred. Please try your request again.",
    });
  }

  lastBookingAttemptSucceeded = !lastBookingAttemptSucceeded;

  state.bookedSeats[seatId] = true;

  // Connect to the DB and update the email status
  const client = await MongoClient(MONGO_URI, options);
  await client.connect();

  try {
    const query = { _id: _id };
    console.log("My Query is:", query);

    //passes a json object that will be updated via the $set call
    const newValues = { $set: { expiration, fullName, email, creditCard } };
    console.log("The Booking info is:", newValues);
    //Access the database
    const db = client.db("exercise_1");

    //Access the Greetings collections and insert the data
    const r = await db.collection("seats").updateOne(query, newValues);
    // console.log(r);
    assert.strictEqual(1, r.matchedCount);
    assert.strictEqual(1, r.modifiedCount);
    client.close();
    return res.status(200).json({
      status: 200,
      success: true,
    });
  } catch (error) {
    console.log(error);
    client.close();
    return res.status(400).json({
      status: 400,
      success: false,
    });
  }
};

module.exports = { getSeats, bookSeat };
