const mongoose = require("mongoose");
const initData = require("./sampleData");
const Note = require("../models/Note");


const dburl = "mongodb://127.0.0.1:27017/NOTEAPP";
async function main() {
    await mongoose.connect(dburl);
}
main()
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err);
  });


// Insert sample data
const initDB = async () => {
  await Note.deleteMany({});
  const result = await Note.insertMany(initData.data);
  console.log("Inserted:", result);
};

initDB();
