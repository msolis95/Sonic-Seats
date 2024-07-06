"use strict";
/**
 * CS 132 Spring 2024
 * Final Project
 * @author Mario Solis
 * @author Evelyn Huerta
 * 
 * This JavaScript sets up the Sonic Seats API, allowing fetch requests
 * for concert data, cart information, frequently asked questions and
 * website feedback.
*/

const express = require("express")
const fs = require("fs/promises");
const app = express();
const multer = require("multer");

app.use(multer().none());

const CONCERTS_FILE_PATH = "data/concerts-DMV.json";
const FAQ_FILE_PATH = "data/faq.json";
const COMMENTS_FILE_PATH = "data/comments.json";
const PURCHASES_FILE_PATH = "data/purchases.json";
const SPACE_INDENT = 4;

const CLIENT_ERROR_CODE = 400;
const SERVER_ERROR_CODE = 500;
const SERVER_ERROR = "Something went wrong on the server. Please try again later.";

const DEBUG = false;

/**
 * Utility function to load JSON data from a file.
 * Sends a 500 error if file reading fails.
 * 
 * @param {Object} res - response object from caller endpoint function
 * @param {Function} next - next function from Express
 * @param {String} filePath - file path to load JSON object from
 * @returns 
 */
async function loadJson(res, next, filePath) {
    try {
        const result = await fs.readFile(filePath, "utf8");
        const concerts = JSON.parse(result);
        return concerts;
    } catch (err) {
        res.status(SERVER_ERROR_CODE);
        err.message = SERVER_ERROR;
        return next(err);
    }
};

/**
 * Retrieves details of a specific concert by ID.
 * Required URL parameter: concertId (integer).
 * Response type: application/json
 * Sends a 400 error if concertId is not an integer.
 * Sends a 400 error if concertId is out of bounds.
 */
app.get("/concert/:concertId", async (req, res, next) => {
    const concertId = parseInt(req.params.concertId, 10);
    if (concertId != req.params.concertId) {
        res.status(CLIENT_ERROR_CODE);
        return next(Error("Concert ID needs to be an integer."));
    }
    const concerts = await loadJson(res, next, CONCERTS_FILE_PATH);
    if (!(0 <= concertId && concertId < concerts.length)) {
        res.status(CLIENT_ERROR_CODE);
        return next(Error(`Concert ID needs to be between 0 and ${concerts.length-1}.`));
    }
    res.json(concerts[concertId]);
});

/**
 * Filters the concerts object with the given filter if it exists in the query.
 * 
 * @param {Object} query - req.query object from GET endpoint
 * @param {Object} concerts - concerts object from API data
 * @param {String} filter - the parameter to filter the concerts object with
 * @returns the filtered concerts object
 */
function filterConcerts(query, concerts, filter) {
    if (query[filter]) {
        concerts = concerts.filter(concert => concert[filter] === query[filter])
    }
    return concerts;
}

/**
 * Returns an array of concerts from a JSON file. Filters concerts based on query parameters.
 * 
 * Optional query parameters: artist (String), venue (String), city (String),
 *                            genre (String), limit (Number).
 * Response type: application/json
 * 
 * Sends a 500 error if something goes wrong in file-processing.
 */
app.get("/concerts", async (req, res, next) => {
    let concerts = await loadJson(res, next, CONCERTS_FILE_PATH);
    if (req.query.artist) {
        concerts = concerts.filter(concert => concert.artist.includes(req.query.artist));
    }
    concerts = filterConcerts(req.query, concerts, "venue");
    concerts = filterConcerts(req.query, concerts, "city");
    concerts = filterConcerts(req.query, concerts, "genre");
    if (req.query.limit) {
        concerts = concerts.slice(0, req.query.limit);
    }
    res.json(concerts);
});

/**
 * Retrieves frequently asked questions (FAQ) from a JSON file.
 * Response type: application/json
 * 
 * Sends a 500 error if something goes wrong in file-processing.
 */
app.get("/faq", async (req, res, next) => {
    const faqs = await loadJson(res, next, FAQ_FILE_PATH);
    res.json(faqs);
});

/**
 * Retrieves comments from a JSON file.
 * Response type: application/json
 * 
 * Sends a 500 error if something goes wrong in file-processing.
 */
app.get("/comments", async (req, res, next) => {
    const comments = await loadJson(res, next, COMMENTS_FILE_PATH);
    res.json(comments);
});

/**
 * Adds a new comment to the comments.json file to be reviewed by admins.
 * If no comments.json yet exists, will add a new file.
 * Required POST parameters: category, description.
 * Optional POST parameter: name, phone, email
 * Response type: text/plain
 * Sends a 400 error if missing one of the 2 required params.
 * Sends a 500 error if something goes wrong in file-processing.
 * Sends a success message otherwise.
 */
app.post("/contact", async (req, res, next) => {
    if (!(req.body && req.body.category && req.body.description)) {
        res.status(CLIENT_ERROR_CODE);
        return next(Error("Category and description are both required parameters."));
    }
    const comment = {"category": req.body.category};
    if (req.body.name) {
        comment.name = req.body.name;
    }
    if (req.body.phone) {
        comment.phone = req.body.phone;
    }
    if (req.body.email) {
        comment.email = req.body.email;
    }
    comment.description = req.body.description;
    let comments;
    try {
        comments = await fs.readFile(COMMENTS_FILE_PATH, "utf8");
    } catch (err) {
        if (err.code !== "ENOENT") { // file-not-found error
            res.status(SERVER_ERROR_CODE);
            err.message = SERVER_ERROR;
            return next(err);
        }
    }
    comments = JSON.parse(comments);
    comments.push(comment);
    try {
        await fs.writeFile(COMMENTS_FILE_PATH, JSON.stringify(comments, null, SPACE_INDENT), "utf8");
        res.send(`Request to submit comment successfully received!`);
    } catch (err) {
        res.status(SERVER_ERROR_CODE);
        err.message = SERVER_ERROR;
        return next(err);
    }
});

/**
 * Handles a purchase request for concert tickets, which deletes purchased items from inventory.
 * The concertId needs to be a valid ID within the database and the seats parameter
 * needs to be a string containing comma-separated seat numbers (e.g. "['A1','A2','A3']")
 * NOTE: duplicate seats will cause an error on the second occurrence because the
 * seat will no longer be available.
 * 
 * Required POST parameters: concertId, seats (JSON array), paymentMethod.
 * Response type: text/plain
 * 
 * Sends a 400 error if missing any of the required params or if seats format is invalid.
 * Sends a 400 error if payment method is not 'cash' or 'credit card'.
 * Sends a 400 error if seats requested are not valid for the specified concert.
 * Sends a 500 error if something goes wrong in file-processing.
 * Sends a success message otherwise.
 */
app.post("/purchase", async (req, res, next) => {
    if (!(req.body && req.body.concertId && req.body.seats && req.body.paymentMethod)) {
        res.status(CLIENT_ERROR_CODE);
        return next(Error("Concert ID, seats, and payment method are all required parameters."));
    }
    const concertId = req.body.concertId;
    let seats = req.body.seats;
    try {
        seats = JSON.parse(seats);
    } catch {
        res.status(CLIENT_ERROR_CODE);
        return next(Error("The argument passed into the seats parameter is not valid." +
            " Check the documentation for details about proper formatting."));
    }
    const paymentMethod = req.body.paymentMethod;
    if (!(paymentMethod === "credit card" || paymentMethod === "cash")) {
        res.status(CLIENT_ERROR_CODE);
        return next(Error('Payment method must be either "credit card" or "cash".'));
    }
    let concerts;
    let purchases;
    try {
        concerts = await fs.readFile(CONCERTS_FILE_PATH, "utf8");
        concerts = JSON.parse(concerts);
        purchases = await fs.readFile(PURCHASES_FILE_PATH, "utf8");
        purchases = JSON.parse(purchases);

    } catch (err) {
        res.status(SERVER_ERROR_CODE);
        err.message = SERVER_ERROR;
        return next(err);
    }
    const tickets = concerts[concertId].tickets;
    for (const seat of seats) {
        // first letter of seat is section followed by a number between
        // zero and the number of concerts
        const pattern = `^[A-E](1?\\d|${concerts.length})$`;
        const regex = new RegExp(pattern);
        if (!regex.test(seat)) {
            res.status(CLIENT_ERROR_CODE);
            return next(Error(`"${seat}" is not a valid seat.`));
        }
        const section = seat[0];
        const seatsInSection = tickets[section].seats;
        if (!seatsInSection.includes(seat)) {
            res.status(CLIENT_ERROR_CODE);
            return next(Error(`"${seat}" is not available at this concert.`));
        }
        const availableSeats = seatsInSection.filter(avail_seat => avail_seat != seat);
        tickets[section].seats = availableSeats;
    }
    concerts[concertId].tickets = tickets;
    const purchase = {
        purchaseId: purchases.length,
        concertId: concertId,
        seats: seats,
        paymentMethod: paymentMethod,
        timestamp: Date.now()
    };
    purchases.push(purchase);
    try {
        await fs.writeFile(CONCERTS_FILE_PATH, JSON.stringify(concerts, null, SPACE_INDENT), "utf8");
        await fs.writeFile(PURCHASES_FILE_PATH, JSON.stringify(purchases, null, SPACE_INDENT), "utf8");
        res.send(`Purchase successfully received!`);
    } catch (err) {
        res.status(SERVER_ERROR_CODE);
        err.message = SERVER_ERROR;
        return next(err);
    }
});

/**
 * Error-handling middleware to cleanly handle different types of errors.
 * Any function that calls next with an Error object will hit this error-handling
 * middleware since it's defined with app.use at the end of the middleware stack.
 */
function errorHandler(err, req, res, next) {
    if (DEBUG) {
        console.error(err);
    }
    res.type("text");
    res.send(err.message);
}

app.use(express.static("public"));
app.use(errorHandler); // add to bottom of middleware stack
const PORT = process.env.PORT || 8000;
app.listen(PORT);
