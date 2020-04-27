const messageManipulators = require("./messageManipulator");

// index file for all files that will hold utility functions for discord.js and tmi.js

const twoToOneIndex = (x, y, rows=5) => (x * rows + y);

module.exports = {
    messageManipulators,
    twoToOneIndex
};