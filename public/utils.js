/**
 * CS 132
 * Provided global DOM accessor aliases.
 * These are the ONLY functions that should be global in your submissions.
 */

/**
 * Returns the first element that matches the given CSS selector.
 * @param {string} selector - CSS query selector string.
 * @returns {object} first element matching the selector in the DOM tree (null if none)
 */
function qs(selector) {
    return document.querySelector(selector);
}

/**
 * Returns the array of elements that match the given CSS selector.
 * @param {string} selector - CSS query selector
 * @returns {object[]} array of DOM objects matching the query (empty if none).
 */
function qsa(selector) {
    return document.querySelectorAll(selector);
}

/**
 * Returns a new element with the given tagname
 * @param {string} tagName - name of element to create and return
 * @returns {object} new DOM element with the given tagname
 */
function gen(tagName) {
    return document.createElement(tagName);
}

/**
 * (New) Lecture 11: Helper function to return the Response data if successful, otherwise
 * returns an Error that needs to be caught.
 * @param {object} response - response with status to check for success/error.
 * @returns {object} - The Response object if successful, otherwise an Error that
 * needs to be caught.
 */
function checkStatus(response) {
    if (!response.ok) { // response.status >= 200 && response.status < 300
        throw Error(`Error in request: ${response.statusText}`);
    } // else, we got a response back with a good status code (e.g. 200)
    return response; // A resolved Response object.
}

/**
 * Displays an error message on the page, hiding any previous results.
 * If errMsg is passed as a string, the string is used to customize an error message.
 * Otherwise (the errMsg is an object or missing), a generic message is displayed.
 * @param {String} errMsg - optional specific error message to display on page.
 */
function handleError(errMsg) {
    const messageArea = qs("#message-area");
    if (typeof errMsg === "string") {
        messageArea.textContent = errMsg;
    } else {
        // the err object was passed, don't want to show it on the page;
        // instead use generic error message.
        messageArea.textContent =
            "An error ocurred fetching data. Please try again later.";
    }
    messageArea.classList.remove("hidden");
}