/**
 * CS 132 Spring 2024
 * Final Project
 * Name: Mario Solis
 * Partner: Evelyn Huerta
 * 
 * This is the JavaScript file that loads the number of tickets in the cart
 * on every page of the Sonic Seats website.
 */

(function() {
    "use strict";

    /**
     * Sets up the page with view toggling, populates the recent results aside,
     * and sets up the functionality of the team search bar.
     */
    function init() {
        populateCartButton();
    }

    function populateCartButton() {
        const cartButton = qs("nav > a");
        const cart = JSON.parse(localStorage.getItem('cart'));
        if (cart) {
            cartButton.textContent += ": " + cart.length.toString() + " ticket";
            if (cart.length !== 1) {
                cartButton.textContent += "s";
            }
        }
        else {
            cartButton.textContent += ": 0 tickets";
        }
    }
    
    init();
})();