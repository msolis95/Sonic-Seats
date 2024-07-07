/**
 * CS 132 Spring 2024
 * Final Project
 * @author Mario Solis
 * @author Evelyn Huerta
 * 
 * This is the JavaScript file for the functionality of ticket purchasing on
 * the Sonic Seats website.
 */

(function() {
    "use strict";

    let totalCost = 0;

    const BASE_URL = "/";
    const DATE_FORMAT = {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York"
    };
    const TIME_FORMAT = {
        hour: "numeric",
        minute: "numeric",
        timeZone: "America/New_York",
        timeZoneName: "short"
    };

    /**
    * Adds event listeners for back button and calls populate cards.
    */
    function init() {
        populateCart();
        const purchaseButton = qs("aside button");
        purchaseButton.addEventListener("click", () => {
            let paymentMethod;
            for (const radio of qsa("input")) {
                if (radio.checked) {
                    paymentMethod = radio.value;
                }
            }
            if (paymentMethod) {
                qs("#message-area").classList.add("hidden");
                purchaseTickets(paymentMethod);
            }
            else {
                handleError("Please choose a payment method to place your order.");
            }
        });
    }

    /**
     * Populates the cart section with items from localStorage,
     * fetching concert details from the server.
     */
    async function populateCart() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (cart.length > 0) {
            toggleCartEmpty();
        }
        for (const ticket of cart) {
            const concertId = ticket.concertId;
            const seat = ticket.seat;
            const price = ticket.price;
            let concert;
            try {
                let response = await fetch(BASE_URL + "concert/" + concertId);
                checkStatus(response);
                concert = await response.json();
            } catch {
                handleError("There was an error while finding the tickets in your cart."
                    + " Please try again later."
                );
            }
            genTicketCard(concert, seat, price);
            updateTotalCost(price);            
        }
    }

    /**
     * Creates a ticket card element in the cart container
     * for the given concert and seat with the given price.
     * 
     * @param {Object} concert - concert object from Sonic Seats API
     * @param {String} seat - a letter followed by a number representing a seat at the venue
     * @param {Number} price - the price of the ticket
     */
    function genTicketCard(concert, seat, price) {
        const cartContainer = qs("#cart-container");
        const ticketCard = gen("div");
        const concertInfo = gen("div");
        const artist = gen("h3");
        artist.textContent = concert.artist;
        concertInfo.appendChild(artist);

        const dateTime = gen("p");
        const utcTime = new Date(concert.timestamp);
        const dateValue = utcTime.toLocaleString("en-US", DATE_FORMAT);
        const timeValue = utcTime.toLocaleString("en-US", TIME_FORMAT);
        dateTime.textContent = dateValue + " at " + timeValue;
        concertInfo.appendChild(dateTime);
        
        const location = gen("p");
        location.textContent = concert.venue + ", " + concert.city;
        concertInfo.appendChild(location);

        const paragraphSeat = gen("p");
        paragraphSeat.textContent = "Seat: " + seat;
        concertInfo.appendChild(paragraphSeat);

        const paragraphPrice = gen("p");
        paragraphPrice.textContent = "Price: $" + price + ".00";
        concertInfo.appendChild(paragraphPrice);

        const removeButton = gen("button");
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", function () {
            removeFromCart(this, concert, seat);
        });
        concertInfo.append(removeButton);
        ticketCard.appendChild(concertInfo);

        let img = gen("img");
        img.src = "imgs/" + (artist.textContent.toLowerCase().split(' ')).join('-') + ".png";
        img.alt = (artist.textContent.toLowerCase().split(' ')).join('-');
        ticketCard.appendChild(img);

        cartContainer.append(ticketCard);
    }

    /**
     * Updates the total cost module-global variable and the total cost paragraph
     * element on the HTML page.
     * 
     * @param {Number} changeInCost - the amount to change the total cost (positive for
     *                                 adding tickets or negative for removing tickets)
     */
    function updateTotalCost(changeInCost) {
        const total = qs("aside > p");
        totalCost += changeInCost;
        total.textContent = `Total: $${totalCost}.00`;
    };

    /**
     * Removes an item from the cart and updates localStorage, the displayed total price,
     * and the CART button in the nav bar. Toggles the empty cart screen if necessary.
     * 
     * @param {HTMLButtonElement} removeButton - the button clicked by the user
     * @param {Object} concert - concert object from the API
     * @param {String} seat - seat of ticket
     */
    function removeFromCart(removeButton, concert, seat) {
        let cart = JSON.parse(localStorage.getItem("cart")) || [];
        const concertId = concert.concertId;
        const cartContainer = qs("#cart-container");
        updateTotalCost(-concert.tickets[seat[0]].price);
        cart = cart.filter(ticket => ticket.concertId != concertId || ticket.seat != seat);
        cartContainer.removeChild(removeButton.parentElement.parentElement);
        localStorage.setItem("cart", JSON.stringify(cart));
        const cartButton = qs("nav > a");
        cartButton.textContent = `CART: ${cart.length.toString()} ticket`;
        if (cart.length !== 1) {
            cartButton.textContent += "s";
            if (cart.length === 0) {
                toggleCartEmpty();
            }
        }
    };

    /**
     * Purchases the items in the cart by sending the data to the server which then deletes those items 
     * from the inventory. Finally, clears the cart and triggers the confirmation screen.
     * 
     * @param {String} paymentMethod - "credit card" or "cash"
     */
    async function purchaseTickets(paymentMethod) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        for (const ticket of cart){
            let concertId = ticket.concertId;
            let formData = new FormData();
            formData.append("concertId", concertId);
            formData.append("seats", `["${ticket.seat}"]`);
            formData.append("paymentMethod", paymentMethod);
            try {
                let resp = await fetch(BASE_URL + "purchase", {method : "POST", body: formData});
                checkStatus(resp);
            } catch (err) {
                handleError(err);
            }
        }
        localStorage.clear();
        confirmOrder();
    };

    /**
     * Displays the confirmation screen by removing all buttons on the page,
     * changing the heading, and showing the confirmation message.
     */
    function confirmOrder() {
        const h2 = qs("h2");
        h2.textContent = "Order Confirmation";
        for (const button of qsa("button")) {
            button.remove();
        }
        const confirmation = qs("section > p");
        confirmation.classList.remove("hidden");
    };

    /**
     * Helper function for updating screen when the cart is/isn't
     * empty.
     */
    function toggleCartEmpty() {
        const nothingInCart = qs("section > div > p");
        nothingInCart.classList.toggle("hidden");
        const fieldset = qs("fieldset");
        fieldset.classList.toggle("hidden");
        const purchaseButton = qs("aside button");
        purchaseButton.classList.toggle("hidden");
    };

    init();
})();