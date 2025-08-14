// API configuration
const API_KEY = 'c8425bcf46b1039d2a2c2970769f466c';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM elements
const elements = {
    searchInput: document.getElementById('city-search'),
    searchBtn: document.getElementById('search-btn'),
    locationBtn: document.getElementById('location-btn'),
    loading: document.getElementById('loading'),
    currentWeather: document.getElementById('current-weather'),
    forecast: document.getElementById('forecast'),
    citiesList: document.getElementById('cities-list')
};

// State
let cities = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Load default cities or from localStorage
    loadDefaultCities();
    
    // Event listeners
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.locationBtn.addEventListener('click', handleLocation);
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
});

async function handleSearch() {
    const city = elements.searchInput.value.trim();
    if (!city) return;
    
    try {
        showLoading();
        const weatherData = await fetchWeatherData(city);
        addCityToDashboard(weatherData);
        elements.searchInput.value = '';
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function handleLocation() {
    if (!navigator.geolocation) {
        showError("Geolocation is not supported by your browser");
        return;
    }
    
    showLoading();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                addCityToDashboard(weatherData);
            } catch (error) {
                showError(error.message);
            } finally {
                hideLoading();
            }
        },
        (error) => {
            showError("Unable to retrieve your location");
            hideLoading();
        }
    );
}

// API functions
async function fetchWeatherData(city) {
    const response = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('City not found');
    return await response.json();
}

async function fetchForecast(cityId) {
    const response = await fetch(`${BASE_URL}/forecast?id=${cityId}&appid=${API_KEY}&units=metric&cnt=4`);
    if (!response.ok) throw new Error('Forecast not available');
    return await response.json();
}

async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('Location weather not available');
    return await response.json();
}

// UI functions
function showLoading() {
    elements.loading.style.display = 'block';
}

function hideLoading() {
    elements.loading.style.display = 'none';
}

function showError(message) {
    alert(message); // In a real app, you'd have a nicer error display
}

function addCityToDashboard(weatherData) {
    // Check if city already exists
    if (cities.some(c => c.id === weatherData.id)) return;
    
    // Add to cities array
    cities.unshift(weatherData);
    if (cities.length > 5) cities.pop();
    
    // Update UI
    renderDashboard();
}

function renderDashboard() {
    if (cities.length === 0) return;
    
    const currentCity = cities[0];
    renderCurrentWeather(currentCity);
    renderForecast(currentCity.id);
    renderCitiesList();
}

function renderCurrentWeather(city) {
    const iconUrl = `https://openweathermap.org/img/wn/${city.weather[0].icon}@2x.png`;
    
    elements.currentWeather.innerHTML = `
        <div class="current-card">
            <h2>${city.name}, ${city.sys.country}</h2>
            <div class="current-main">
                <img src="${iconUrl}" alt="${city.weather[0].description}">
                <div class="current-temp">${Math.round(city.main.temp)}°C</div>
            </div>
            <div class="current-details">
                <div>Humidity: ${city.main.humidity}%</div>
                <div>Wind: ${city.wind.speed} m/s</div>
                <div>${city.weather[0].description}</div>
            </div>
        </div>
    `;
}

async function renderForecast(cityId) {
    try {
        const forecastData = await fetchForecast(cityId);
        
        elements.forecast.innerHTML = `
            <h3>3-Day Forecast</h3>
            <div class="forecast-cards">
                ${forecastData.list.slice(0, 3).map(day => `
                    <div class="forecast-card">
                        <div>${new Date(day.dt * 1000).toLocaleDateString('en', { weekday: 'short' })}</div>
                        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                        <div>${Math.round(day.main.temp)}°C</div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        elements.forecast.innerHTML = '<p>Forecast not available</p>';
    }
}

function renderCitiesList() {
    if (cities.length <= 1) {
        elements.citiesList.innerHTML = '';
        return;
    }
    
    elements.citiesList.innerHTML = `
        <h3>Recent Cities</h3>
        <div class="cities-grid">
            ${cities.slice(1).map(city => `
                <div class="city-card" data-id="${city.id}">
                    <h4>${city.name}</h4>
                    <div>${Math.round(city.main.temp)}°C</div>
                    <div>${city.weather[0].main}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Add click handlers to city cards
    document.querySelectorAll('.city-card').forEach(card => {
        card.addEventListener('click', () => {
            const cityId = parseInt(card.dataset.id);
            const city = cities.find(c => c.id === cityId);
            if (city) {
                cities = [city, ...cities.filter(c => c.id !== cityId)];
                renderDashboard();
            }
        });
    });
}

function loadDefaultCities() {
    const defaultCities = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney'];
    defaultCities.forEach(async city => {
        try {
            const weatherData = await fetchWeatherData(city);
            addCityToDashboard(weatherData);
        } catch (error) {
            console.error(`Failed to load ${city}:`, error.message);
        }
    });
}