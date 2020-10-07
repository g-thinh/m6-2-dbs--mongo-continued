const assert = require("assert");
const { MongoClient } = require("mongodb");
require("dotenv").config();
const { MONGO_URI } = process.env;

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const batchImport = async (req, res) => {
  //Create and connect to client
  const client = await MongoClient(MONGO_URI, options);
  await client.connect();
  console.log("Connected!");

  const seats = [];
  const row = ["A", "B", "C", "D", "E", "F", "G", "H"];
  for (let r = 0; r < row.length; r++) {
    for (let s = 1; s < 13; s++) {
      seats.push({
        _id: `${row[r]}-${s}`,
        price: 225,
        isBooked: false,
      });
    }
  }
  console.log("Seats generated!", seats);

  try {
    //Access the database
    const db = client.db("exercise_1");

    //Access the Greetings collections and insert the data
    const r = await db.collection("seats").insertMany(seats);
    assert.strictEqual(seats.length, r.insertedCount);
    console.log("Data added successfully!");
  } catch (error) {
    console.log(error.stack);
  }

  client.close();
  console.log("disconnected!");
};

batchImport();
