/**
 * CS 132 Spring 2024
 * Name: Mario Solis
 * Date: May 26th, 2024
 * This is the JavaScript file for the functionality of the FAQ page
 * on the Sonic Seats website.
 */

(function() {
    "use strict";
    
    const BASE_URL = "/";

    /**
     * Initializes the page with the FAQ data from the API.
     */
    function init() {
        fetchQuestions();
    }
    
    /**
     * Fetches the FAQ data from the API and passes along the returned data
     * to the populateQuestions helper function.
     */
    async function fetchQuestions() {
        let questions;
        try {
            const response = await fetch(BASE_URL + "faq");
            checkStatus(response);
            questions = await response.json();
        } catch {
            handleError("There was an issue retrieving the FAQ. Please try again later.")
        }
        populateQuestions(questions);
    }

    /**
     * Creates paragraph elements for each question and answer
     * in the FAQ data with classes corresponding to each paragraph
     * element.
     * 
     * @param {Object} questions - questions object from the API
     */
    function populateQuestions(questions) {
        const ul = qs("section ul");
        for (const faq of questions) {
            const li = gen("li");

            const qLabel = gen("p");
            qLabel.textContent = "Q:";
            qLabel.classList.add("faq-label");
            const q = gen("p");
            q.textContent = faq.question;
            q.classList.add("question");
            li.appendChild(qLabel);
            li.appendChild(q);
            
            const aLabel = gen("p");
            aLabel.textContent = "A:";
            aLabel.classList.add("faq-label");
            const a = gen("p");
            a.textContent = faq.answer;
            a.classList.add("answer");
            li.appendChild(aLabel);
            li.appendChild(a);

            ul.appendChild(li);
        }
    }

    init();
})();