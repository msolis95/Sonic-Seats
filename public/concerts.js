/**
 * CS 132 Spring 2024
 * @author Mario Solis
 * @author Evelyn Huerta
 * This is the JavaScript file for the functionality of the Concerts page
 * on the Sonic Seats website.
 */

(function() {
    "use strict";

    const BASE_URL = "/";
    const RESULTS_LIMIT = 15;
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
     * Sets up view toggling and event listeners for buttons and the search bar.
     */
    function init() {
        fetchConcertData();
        const searchBar = qs("input");
        const newSearch = () => {
            qs("#message-area").classList.add("hidden");
            fetchConcertData();
        };
        searchBar.addEventListener("search", newSearch);
        const searchButton = qs("#concert-results > div > button");
        searchButton.addEventListener("click", newSearch);
        const backButton = qs("#map-container button");
        backButton.addEventListener("click", toggleView);
        const sectionSelect = qs("#seat-container select");
        sectionSelect.addEventListener("change", populateTickets);
    };
    
    // CONCERT RESULTS SECTION

    /**
     * Updates the current URL with the filter parameter if the given
     * value is not null.
     * 
     * @param {String} url - original URL
     * @param {String} filter - filter parameter
     * @param {String} value - value of the parameter
     * @returns the updated URL
     */
    function updateURL(url, filter, value) {
        if (value) {
            url += filter + `=${value}&`;
        }
        return url
    };

    /**
     * Creates the URL with the user's parameters and fetches concerts
     * from the API. If no concerts are returned, displays an error
     * message. Otherwise, populates the concert results on screen.
     */
    async function fetchConcertData() {
        const artist = qs("input").value;
        const venue = qs("#venue").value;
        const city = qs("#city").value;
        const genre = qs("#genre").value;
        let url = BASE_URL + "concerts?";
        url = updateURL(url, "artist", artist);
        url = updateURL(url, "venue", venue);
        url = updateURL(url, "city", city);
        url = updateURL(url, "genre", genre);
        url += `limit=${RESULTS_LIMIT}`;
        let concerts;
        try {
            const response = await fetch(url);
            checkStatus(response);
            concerts = await response.json();
        } catch {
            handleError("There was an issue retrieving the concerts. Please try again later.")
        }
        if (concerts.length === 0) {
            handleError("No concerts were found for the given search.")
        }
        else {
            populateConcertsResults(concerts);
        }
    };

    /**
     * Resets the concert results and populates it with new concert cards
     * based on the provided concerts object.
     * 
     * @param {Object} concerts - concerts array from the APi
     */
    function populateConcertsResults(concerts) {
        const concertCardContainer = qs("#search-results > div");
        concertCardContainer.innerHTML = "";
        for (const concert of concerts) {
            concertCardContainer.appendChild(genConcertCard(concert));
        }
    };

    /**
     * Creates a new concert card for the given concert object, containing
     * the artist's name, date, time, and venue for the concert, an image
     * for the concert, and a button to look for tickets.
     * 
     * e.g.
     * <div class="concert-card">
     *     <div>
     *         <h3>The Weeknd</h3>
     *         <p>Friday, June 14 at 8 pm</p>
     *         <p>Capital One Arena</p>
     *     </div>
     *     <img src="imgs/weeknd.jpg" alt="weeknd">
     *     <button>Get tickets!</button>
     * </div>
     * 
     * @param {Object} concert - concert object from the API
     * @returns the new concertCard
     */
    function genConcertCard(concert) {
        const concertCard = gen("div");
        concertCard.classList.add("concert-card");

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

        concertCard.appendChild(concertInfo);

        const img = gen("img");
        img.src = "imgs/" + artist.textContent.toLowerCase().split(" ").join("-") + ".png";
        img.alt = (artist.textContent.toLowerCase().split(" ")).join("-");
        concertCard.appendChild(img);
        
        const button = gen("button");
        button.textContent = "Get tickets!";
        button.addEventListener("click", function() {
            toggleView();
            qs("#message-area").classList.add("hidden");
            populateConcertInfo(concert);
        });
        concertCard.appendChild(button);
        return concertCard;
    };

    // CONCERT TICKETS SECTION

    /**
     * Populates the concert tickets section with the concert information
     * for the concert that the user clicked previously.
     * 
     * @param {Object} concert - concert object from the API
     */
    function populateConcertInfo(concert) {
        const h2 = qs("#concert-tickets h2");
        h2.textContent = concert.artist;
        h2.setAttribute("data-concert-id", concert.concertId);
        const utcTime = new Date(concert.timestamp);
        const dateValue = utcTime.toLocaleString("en-US", DATE_FORMAT);
        const timeValue = utcTime.toLocaleString("en-US", TIME_FORMAT);
        qs("#date-time").textContent = dateValue + " at " + timeValue;
        qs("#location").textContent = concert.venue + ", " + concert.city;
    };

    /**
     * Populates available tickets in scrollable element based on the section chosen
     * by the user.
     */
    async function populateTickets() {
        const concertId = qs("#concert-tickets h2").getAttribute("data-concert-id");
        let concert;
        try {
            let response = await fetch("/concert/" + concertId);
            checkStatus(response);
            concert = await response.json();
        } catch (err) {
            handleError(err);
        }
        generateTickets(concert);
    };

    /**
     * Creates ticket elements in the scrollable element with the seat number,
     * price, and a button to add it to the cart.
     * 
     * @param {Object} concert - concert object from the API
     */
    function generateTickets(concert) {
        const seats = qs("#seat-container > div");
        seats.innerHTML = "";
        const sectionLetter = qs("#seat-container select").value;
        if (sectionLetter){
            const section = concert.tickets[sectionLetter];
            const availableSeats = section.seats;
            for (const availableSeat of availableSeats) {
                const seatCard = gen("div");
                const paragraphSeat = gen("p");
                paragraphSeat.textContent = "Section " + sectionLetter + " Seat " + availableSeat.slice(1);

                const price = section.price;
                const paragraphPrice = gen("p");
                paragraphPrice.textContent = "$" + price + ".00";

                const addButton = gen("button");
                addButton.textContent = " Add to Cart ";
                addButton.setAttribute("data-seat", availableSeat);

                seatCard.appendChild(paragraphSeat);
                seatCard.appendChild(paragraphPrice);
                seatCard.appendChild(addButton);
                seats.appendChild(seatCard);
                addButton.addEventListener("click", function () {
                    addToCart(this, concert, price)
                });
            }
        }
    };

    /**
     * When a user clicks on an "Add to Cart" button, adds the ticket to the cart
     * in localStorage and updates the cart button in the nav bar.
     * 
     * @param {HTMLButtonElement} addButton - the button clicked by the user
     * @param {Object} concert - concert object from the API
     * @param {Number} price - price of ticket
     */
    function addToCart(addButton, concert, price) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const seat = addButton.getAttribute("data-seat")
        cart.push({
            concertId: concert.concertId,
            seat: seat,
            price: price
        });
        addButton.parentElement.remove();
        const cartButton = qs("nav > a");
        cartButton.textContent = `CART: ${cart.length.toString()} ticket`;
        if (cart.length !== 1) {
            cartButton.textContent += "s";
        }
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    /**
     * Sets up view toggling between the concert results and the view showing
     * available tickets for the chosen concert.
     */
    function toggleView() {
        qs("#concert-results").classList.toggle("hidden");
        qs("#concert-tickets").classList.toggle("hidden");
    };

    init();
})();