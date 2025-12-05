const API_KEY = '84bbc1c699930f2c9f220c722da946b3';
const BASE_URL = 'https://api.themoviedb.org/3';
let USE_PROXY = false;

const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const requests = {
    fetchTrending: `/trending/all/week?api_key=${API_KEY}&language=en-US`,
    fetchNetflixOriginals: `/discover/tv?api_key=${API_KEY}&with_networks=213`,
    fetchTopRated: `/movie/top_rated?api_key=${API_KEY}&language=en-US`,
    fetchActionMovies: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
    fetchComedyMovies: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
    fetchHorrorMovies: `/discover/movie?api_key=${API_KEY}&with_genres=27`,
    fetchRomanceMovies: `/discover/movie?api_key=${API_KEY}&with_genres=10749`,
    fetchDocumentaries: `/discover/movie?api_key=${API_KEY}&with_genres=99`,
    fetchTrendingIndia: `/trending/all/week?api_key=${API_KEY}&region=IN`,
    fetchTeluguMovies: `/discover/movie?api_key=${API_KEY}&with_original_language=te&sort_by=popularity.desc`,
    fetchKidsMovies: `/discover/movie?api_key=${API_KEY}&certification_country=US&certification.lte=PG&with_genres=10751`,
    fetchKidsTV: `/discover/tv?api_key=${API_KEY}&with_genres=10762`,
};

// Helper to make requests (handles Proxy encoding)
async function makeRequest(endpoint) {
    let url = `${BASE_URL}${endpoint}`;

    // Auto-enable proxy for local file testing
    if (window.location.protocol === 'file:' && !USE_PROXY) {
        USE_PROXY = true;
    }

    if (USE_PROXY) {
        // Switch back to codetabs as corsproxy might be failing/hanging
        return fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
    }

    return fetch(url);
}

// Initialize the app
async function init() {
    // Skip diagnostic delay if we know we need proxy
    if (window.location.protocol === 'file:') {
        USE_PROXY = true;
        console.log("Local file detected. Using Proxy mode immediately for speed.");
    }

    startBannerCarousel();

    // Create rows
    createRow("NETFLIX ORIGINALS", requests.fetchNetflixOriginals, true, "series");
    createRow("Trending Now", requests.fetchTrending, false, "trending");
    createRow("Trending in India", requests.fetchTrendingIndia, false, "trending");
    createRow("Telugu Movies", requests.fetchTeluguMovies, false, "trending");
    createRow("Top Rated", requests.fetchTopRated, false, "movies");
    createRow("Action Movies", requests.fetchActionMovies, false, "movies");
    createRow("Comedy Movies", requests.fetchComedyMovies, false, "movies");
    createRow("Horror Movies", requests.fetchHorrorMovies, false, "movies");
    createRow("Romance Movies", requests.fetchRomanceMovies, false, "movies");
    createRow("Documentaries", requests.fetchDocumentaries, false, "movies");
}

let bannerInterval;

async function startBannerCarousel(fetchUrl = requests.fetchNetflixOriginals) {
    try {
        const response = await makeRequest(fetchUrl);
        const data = await response.json();
        let movies = [];

        if (data.status_message) {
            console.error("Banner API Error:", data.status_message);
            return;
        }

        if (!data.results || data.results.length === 0) return;

        movies = data.results;

        if (!movies || movies.length === 0) return;

        let currentIndex = 0;

        // Initial Set
        setBanner(movies[currentIndex]);
        currentBannerMovie = movies[currentIndex];

        // Clear existing interval if any
        if (bannerInterval) clearInterval(bannerInterval);

        // Auto-scroll every 5 seconds
        bannerInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % movies.length;
            setBanner(movies[currentIndex]);
            currentBannerMovie = movies[currentIndex];
        }, 5000);

    } catch (error) {
        console.error("Error starting banner carousel:", error);
    }
}



function setBanner(movie) {
    const banner = document.getElementById('banner');
    const title = document.getElementById('banner-title');
    const description = document.getElementById('banner-description');

    banner.style.backgroundImage = `url("${IMAGE_BASE_URL}${movie.backdrop_path}")`;
    title.innerText = movie.title || movie.name || movie.original_name;
    description.innerText = truncate(movie.overview, 150);
}

function truncate(str, n) {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
}

async function createRow(title, fetchUrl, isLargeRow = false, category = "all") {
    const rowsContainer = document.getElementById('rows-container');

    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.category = category; // Add category for filtering

    const titleElement = document.createElement('h2');
    titleElement.className = 'row__title';
    titleElement.innerText = title;
    row.appendChild(titleElement);

    const postersElement = document.createElement('div');
    postersElement.className = 'row__posters';

    try {
        const response = await makeRequest(fetchUrl);
        const data = await response.json();

        if (data.status_message) throw new Error(data.status_message);
        if (!data.results) throw new Error("No results");

        populateRow(postersElement, data.results, isLargeRow);

    } catch (error) {
        console.error(`Error fetching row ${title}:`, error);
    }

    row.appendChild(postersElement);
    rowsContainer.appendChild(row);
}

function populateRow(container, movies, isLargeRow) {
    if (!movies) return;
    movies.forEach(movie => {
        // Use local assets or fallback placeholders if API images fail
        let imageSrc = `${IMAGE_BASE_URL}${isLargeRow ? movie.poster_path : movie.backdrop_path}`;
        if (!movie.poster_path && !movie.backdrop_path) {
            // Fallback for mock data without proper paths
            imageSrc = "https://via.placeholder.com/300x169/111/fff?text=" + encodeURIComponent(movie.title || movie.name);
        }

        const poster = document.createElement('img');
        poster.className = `row__poster ${isLargeRow ? 'row__posterLarge' : ''}`;
        poster.src = imageSrc;
        poster.alt = movie.name || movie.title;

        // Handle broken images
        poster.onerror = function () {
            this.src = "https://via.placeholder.com/300x450/111/fff?text=No+Image";
        };

        poster.addEventListener('click', () => {
            openModal(movie);
        });

        container.appendChild(poster);
    });
}


// Navbar scroll effect
window.addEventListener("scroll", () => {
    const nav = document.getElementById("nav");
    if (window.scrollY > 100) {
        nav.classList.add("black");
    } else {
        nav.classList.remove("black");
    }
});

// Modal Logic
const modal = document.getElementById("movie-modal");
const closeButton = document.querySelector(".close-button");

async function openModal(movie) {
    // Check if it's a person
    if (movie.media_type === 'person') {
        document.getElementById("modal-image").src = `${IMAGE_BASE_URL}${movie.profile_path}`;
        document.getElementById("modal-title").innerText = movie.name;
        document.getElementById("modal-date").innerText = "Actor"; // Or birthdate if fetched
        document.getElementById("modal-rating").innerText = "N/A";

        // Fetch Person Details for Biography
        try {
            const personDetails = await makeRequest(`/person/${movie.id}?api_key=${API_KEY}`);
            const personData = await personDetails.json();
            document.getElementById("modal-overview").innerText = personData.biography || "No biography available.";
        } catch (e) {
            document.getElementById("modal-overview").innerText = "Loading bio...";
        }

        document.getElementById("modal-director").innerText = "N/A";
        document.getElementById("modal-cast").innerText = "N/A";

        // Show Known For in Trailer container
        const knownFor = movie.known_for ? movie.known_for.map(m => m.title || m.name).join(", ") : "N/A";
        document.getElementById("trailer-container").innerHTML = `<div style="color:white; padding: 20px;"><h3>Known For:</h3><p>${knownFor}</p></div>`;

        modal.style.display = "flex";
        return;
    }

    document.getElementById("modal-title").innerText = movie.title || movie.name || movie.original_name;
    document.getElementById("modal-overview").innerText = movie.overview;
    document.getElementById("modal-date").innerText = movie.release_date || movie.first_air_date;
    document.getElementById("modal-rating").innerText = movie.vote_average;
    document.getElementById("modal-image").src = `${IMAGE_BASE_URL}${movie.backdrop_path || movie.poster_path}`;

    // Reset details
    document.getElementById("modal-director").innerText = "Loading...";
    document.getElementById("modal-cast").innerText = "Loading...";
    document.getElementById("trailer-container").innerHTML = ""; // Clear previous trailer

    modal.style.display = "flex";

    // Fetch details
    const type = movie.media_type === 'tv' ? 'tv' : 'movie'; // Default to movie if undefined, but API usually provides it. Fallback logic might be needed if media_type is missing.
    // Note: 'discover' endpoints don't always return media_type. We might need to guess or fetch both.
    // For simplicity, let's try to fetch movie credits first, if fail, try tv.
    // Actually, most rows are specific.
    // Let's rely on a helper to determine type or just try fetching.

    let fetchType = 'movie';
    if (movie.first_air_date) fetchType = 'tv'; // Simple heuristic

    try {
        const creditsUrl = `/${fetchType}/${movie.id}/credits?api_key=${API_KEY}`;
        const response = await makeRequest(creditsUrl);
        const data = await response.json();

        if (data.cast) {
            const topCast = data.cast.slice(0, 5).map(actor => actor.name).join(", ");
            document.getElementById("modal-cast").innerText = topCast;
        }

        if (data.crew) {
            const director = data.crew.find(member => member.job === "Director" || member.job === "Executive Producer"); // TV shows often have creators/EPs
            document.getElementById("modal-director").innerText = director ? director.name : "N/A";
        }

        // Fetch Trailer
        const videosUrl = `/${fetchType}/${movie.id}/videos?api_key=${API_KEY}`;
        const videoResponse = await makeRequest(videosUrl);
        const videoData = await videoResponse.json();

        if (videoData.results && videoData.results.length > 0) {
            // Priority:
            // 1. Official Trailer from YouTube
            // 2. Any Trailer from YouTube
            // 3. Any Teaser from YouTube
            // 4. Any video from YouTube

            let trailer = videoData.results.find(vid =>
                vid.site === "YouTube" && vid.type === "Trailer" && vid.name.includes("Official Trailer")
            );

            if (!trailer) {
                trailer = videoData.results.find(vid => vid.site === "YouTube" && vid.type === "Trailer");
            }

            if (!trailer) {
                trailer = videoData.results.find(vid => vid.site === "YouTube" && vid.type === "Teaser");
            }

            // Fallback to first YouTube video if nothing specific found
            const videoKey = trailer ? trailer.key : (videoData.results[0]?.key || "");

            if (videoKey) {
                const trailerContainer = document.getElementById("trailer-container");
                trailerContainer.innerHTML = `
                    <div style="position: relative; width: 100%; height: 350px; background: url('${IMAGE_BASE_URL}${movie.backdrop_path || movie.poster_path}') no-repeat center center/cover; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 6px;" onclick="window.open('https://www.youtube.com/watch?v=${videoKey}', '_blank')">
                        <div style="background: rgba(0,0,0,0.7); border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; border: 3px solid #e50914; transition: transform 0.2s;">
                            <i class="fas fa-play" style="color: white; font-size: 28px; margin-left: 5px;"></i>
                        </div>
                        <div style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, black, transparent); padding: 20px; text-align: center;">
                             <p style="color: white; font-weight: bold; margin: 0; text-shadow: 1px 1px 4px black;">Watch Trailer on YouTube</p>
                        </div>
                    </div>
                `;
            }
        } else {
            document.getElementById("trailer-container").innerHTML = "<p style='color: white; margin-top: 20px;'>No trailer available for this title.</p>";
        }

    } catch (error) {
        console.error("Error fetching credits or trailer:", error);
        document.getElementById("modal-cast").innerText = "N/A";
        document.getElementById("modal-director").innerText = "N/A";
    }
}

closeButton.addEventListener("click", () => {
    modal.style.display = "none";
    document.getElementById("trailer-container").innerHTML = ""; // Stop video on close
});

window.addEventListener("click", (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
        document.getElementById("trailer-container").innerHTML = ""; // Stop video on close
    }
});

// Search Logic
const searchInput = document.querySelector('.search-txt');
const searchResultsContainer = document.getElementById('search-results-container');
const searchResults = document.getElementById('search-results');

// Search Button Logic
const searchBtn = document.querySelector('.search-btn');
searchBtn.addEventListener('click', () => {
    searchInput.focus();
});

// Search Input Logic
searchInput.addEventListener('keyup', async (e) => {
    const query = e.target.value;
    console.log("Search query:", query); // Debug

    if (query.length > 2) {
        // Show loading state
        const originalPlaceholder = searchInput.placeholder;
        searchInput.placeholder = "Searching...";

        const searchEndpoint = `/search/multi?api_key=${API_KEY}&language=en-US&query=${query}&page=1&include_adult=false`;

        try {
            const response = await makeRequest(searchEndpoint);
            const data = await response.json();

            searchResults.innerHTML = ''; // Clear previous results

            // Filter out 'person' results and items without images
            const validResults = data.results ? data.results.filter(item =>
                (item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person') &&
                (item.poster_path || item.backdrop_path || item.profile_path)
            ) : [];

            if (validResults.length > 0) {
                searchResultsContainer.style.display = 'block';
                // Hide main content when searching
                document.getElementById('rows-container').style.display = 'none';
                document.getElementById('banner').style.display = 'none';

                validResults.forEach(movie => {
                    const poster = document.createElement('img');
                    poster.className = 'row__poster';
                    poster.src = `${IMAGE_BASE_URL}${movie.poster_path || movie.backdrop_path || movie.profile_path}`;
                    poster.alt = movie.name || movie.title;
                    poster.addEventListener('click', () => openModal(movie));
                    searchResults.appendChild(poster);
                });
            } else {
                searchResultsContainer.style.display = 'block';
                searchResults.innerHTML = '<p style="color: white; padding: 20px; font-size: 1.2rem;">No results found for "' + query + '"</p>';
                // Keep main content hidden to show the "No results" message clearly
                document.getElementById('rows-container').style.display = 'none';
                document.getElementById('banner').style.display = 'none';
            }
        } catch (error) {
            console.error("Error searching:", error);
            searchResults.innerHTML = '<p style="color: red; padding: 20px;">Error searching. Check console.</p>';
            searchResultsContainer.style.display = 'block';
        } finally {
            searchInput.placeholder = originalPlaceholder;
        }
    } else {
        searchResultsContainer.style.display = 'none';
        // Show main content again if search is cleared
        document.getElementById('rows-container').style.display = 'block';
        document.getElementById('banner').style.display = 'block';
    }
});

// Nav Logic
const navLinks = document.querySelectorAll('.nav__link');
const rows = document.getElementsByClassName('row');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        // Remove active class from all
        navLinks.forEach(nav => nav.classList.remove('active'));
        // Add active to clicked
        link.classList.add('active');

        const id = link.id;
        let category = 'all';

        if (id === 'nav-series') category = 'series';
        else if (id === 'nav-movies') category = 'movies';
        else if (id === 'nav-originals') category = 'series'; // Map Originals to Series for now
        else if (id === 'nav-home') category = 'all';
        else if (id === 'nav-list') {
            showMyList();
            return;
        }

        // Hide My List if showing
        document.getElementById('my-list-container').style.display = 'none';
        document.getElementById('rows-container').style.display = 'block';
        document.getElementById('banner').style.display = 'block';

        filterRows(category);
    });
});

// Kids Nav Logic
document.getElementById('nav-kids').addEventListener('click', () => {
    // Reset other navs
    navLinks.forEach(nav => nav.classList.remove('active'));
    // We don't have a specific active class for the text link, but we can handle the view

    document.getElementById('my-list-container').style.display = 'none';
    document.getElementById('rows-container').style.display = 'block';
    document.getElementById('banner').style.display = 'block';

    filterRows('kids');
});

function showMyList() {
    // Hide standard rows and banner
    document.getElementById('rows-container').style.display = 'none';
    document.getElementById('banner').style.display = 'none';
    document.getElementById('search-results-container').style.display = 'none';

    // Show My List container
    const myListContainer = document.getElementById('my-list-container');
    myListContainer.style.display = 'block';

    const myListPosters = document.getElementById('my-list-posters');
    myListPosters.innerHTML = '';

    // Pre-populate My List if empty for demonstration
    let myList = JSON.parse(localStorage.getItem('netflixMyList')) || [];
    if (myList.length === 0) {
        const demoMovies = [
            {
                id: 550,
                title: "Fight Club",
                poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
                backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
                overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
                release_date: "1999-10-15",
                vote_average: 8.4
            },
            {
                id: 13,
                title: "Forrest Gump",
                poster_path: "/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
                backdrop_path: "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
                overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.",
                release_date: "1994-07-06",
                vote_average: 8.5
            }
        ];
        localStorage.setItem('netflixMyList', JSON.stringify(demoMovies));
        myList = demoMovies;
    }

    if (myList.length === 0) {
        myListPosters.innerHTML = '<p style="color: grey; padding: 20px;">Your list is empty.</p>';
        return;
    }

    myList.forEach(movie => {
        const poster = document.createElement('img');
        poster.className = 'row__poster';
        poster.src = `${IMAGE_BASE_URL}${movie.poster_path || movie.backdrop_path}`;
        poster.alt = movie.name || movie.title;
        poster.addEventListener('click', () => openModal(movie));
        myListPosters.appendChild(poster);
    });
}

// Add to My List Button Logic (in Banner)
document.querySelector('.banner__button .fa-plus').parentElement.addEventListener('click', () => {
    // We need the current banner movie. 
    // Since we don't store it globally, let's just alert for now or implement a global state.
    // Better: Let's make the banner movie accessible.
    if (currentBannerMovie) {
        addToMyList(currentBannerMovie);
    }
});

// Banner Play Button Logic
document.querySelector('.banner__button .fa-play').parentElement.addEventListener('click', () => {
    if (currentBannerMovie) {
        openModal(currentBannerMovie);
    }
});

let currentBannerMovie = null; // Store current banner movie

function addToMyList(movie) {
    let myList = JSON.parse(localStorage.getItem('netflixMyList')) || [];

    // Check if already exists
    if (!myList.some(m => m.id === movie.id)) {
        myList.push(movie);
        localStorage.setItem('netflixMyList', JSON.stringify(myList));
        alert(`${movie.title || movie.name} added to My List!`);
    } else {
        alert(`${movie.title || movie.name} is already in My List!`);
    }
}

function filterRows(category) {
    const rowsContainer = document.getElementById('rows-container');
    rowsContainer.innerHTML = ''; // Clear existing rows

    if (category === 'kids') {
        // Update Banner for Kids
        // Update Banner for Kids
        startBannerCarousel(requests.fetchKidsMovies);

        createRow("Kids & Family Movies", requests.fetchKidsMovies, true, 'kids');
        createRow("Kids TV Shows", requests.fetchKidsTV, false, 'kids');
        createRow("Popular for Kids", requests.fetchKidsMovies + "&sort_by=popularity.desc", false, 'kids');
        return;
    }

    // Reset Banner to Original for other categories (optional, or keep random)
    if (category === 'all' || category === 'series') {
        if (category === 'all') {
            startBannerCarousel(requests.fetchNetflixOriginals);
        }
        createRow("NETFLIX ORIGINALS", requests.fetchNetflixOriginals, true, 'series');
    }

    if (category === 'all' || category === 'trending') {
        createRow("Trending Now", requests.fetchTrending, false, 'trending');
        createRow("Trending in India", requests.fetchTrendingIndia, false, 'trending');
    }

    if (category === 'all' || category === 'movies') {
        createRow("Top Rated", requests.fetchTopRated, false, 'movies');
        createRow("Action Movies", requests.fetchActionMovies, false, 'movies');
        createRow("Comedy Movies", requests.fetchComedyMovies, false, 'movies');
        createRow("Horror Movies", requests.fetchHorrorMovies, false, 'movies');
        createRow("Romance Movies", requests.fetchRomanceMovies, false, 'movies');
        createRow("Documentaries", requests.fetchDocumentaries, false, 'movies');
    }
}

// Dropdown Logic
const avatarContainer = document.getElementById('nav-avatar-container');
const dropdown = document.getElementById('nav-dropdown');

avatarContainer.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent immediate closing
    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
    } else {
        dropdown.style.display = 'flex';
    }
});

window.addEventListener('click', () => {
    dropdown.style.display = 'none';
});

// Start the app
init();
