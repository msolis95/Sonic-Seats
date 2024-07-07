/**
 * CS 132 Spring 2024
 * Name: Mario Solis
 * Date: May 26th, 2024
 * This is the JavaScript file for the functionality of the Contact
 * Us page on the Sonic Seats website.
 */

(function() {
    "use strict";
    
    const BASE_URL = "/";

    /**
     * Sets up the page with view toggling, populates the recent results aside,
     * and sets up the functionality of the comment form submission.
     */
    function init() {
        const form = qs("form");
        form.addEventListener("submit", submitComment);
        const anotherCommentButton = qs("section > button");
        anotherCommentButton.addEventListener("click", toggleView);
    }

    /**
     * Helper function for submitting a comment when the user
     * clicks the submit button on the page and has all of the
     * required information filled out.
     */
    async function submitComment(event) {
        event.preventDefault();
        const params = new FormData(qs("form"));
        try {
            await fetch(BASE_URL + "contact", {
                method: "POST",
                body: params
            }).then(response => checkStatus(response));
            toggleView();
        } catch (error) {
            handleError("There was an error while submitting. Please try again later.");
        }
    }

    /**
     * Sets up view toggling between the form and the submission
     * confirmation afterward.
     */
    function toggleView() {
        qs("#form").classList.toggle("hidden");
        qs("#submitted").classList.toggle("hidden");
    }

    init();
})();