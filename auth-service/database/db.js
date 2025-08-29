const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI).then(() => {
            console.log("Database connected successfully");
        }).catch((e) => {
            console.error("Error while Database: ", e);
        })
    } catch (error) {
        console.error("Error while Database: ", e);
    }
}

module.exports = connectDB;