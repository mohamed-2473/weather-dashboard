// Enhanced Weather Dashboard Script
const API_KEY = "c8425bcf46b1039d2a2c2970769f466c";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

// DOM elements
const elements = {
  searchInput: document.getElementById("city-search"),
  searchBtn: document.getElementById("search-btn"),
  locationBtn: document.getElementById("location-btn"),
  loading: document.getElementById("loading"),
  currentWeather: document.getElementById("current-weather"),
  forecast: document.getElementById("forecast"),
  citiesList: document.getElementById("cities-list"),
};

// State
let cities = JSON.parse(localStorage.getItem("weatherCities")) || [];

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Load cities from localStorage or defaults
  if (cities.length === 0) {
    loadDefaultCities();
  } else {
    renderDashboard();
  }

  // Event listeners
  elements.searchBtn.addEventListener("click", handleSearch);
  elements.locationBtn.addEventListener("click", handleLocation);
  elements.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
});

async function handleSearch() {
  const city = elements.searchInput.value.trim();
  if (!city) return;

  try {
    showLoading();
    const weatherData = await fetchWeatherData(city);
    addCityToDashboard(weatherData);
    elements.searchInput.value = "";
    hideError();
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
        hideError();
      } catch (error) {
        showError(error.message);
      } finally {
        hideLoading();
      }
    },
    (error) => {
      showError("Unable to retrieve your location. Please check permissions.");
      hideLoading();
    }
  );
}

// Enhanced API functions
async function fetchWeatherData(city) {
  const response = await fetch(
    `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
  );
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("City not found. Please check the spelling.");
    } else {
      throw new Error("Unable to fetch weather data. Please try again.");
    }
  }
  return await response.json();
}

async function fetchForecast(lat, lon) {
  const response = await fetch(
    `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&cnt=5`
  );
  if (!response.ok) throw new Error("Forecast not available");
  return await response.json();
}

async function fetchWeatherByCoords(lat, lon) {
  const response = await fetch(
    `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
  );
  if (!response.ok) throw new Error("Location weather not available");
  return await response.json();
}

// Enhanced UI functions
function showLoading() {
  elements.loading.style.display = "block";
}

function hideLoading() {
  elements.loading.style.display = "none";
}

function showError(message) {
  hideError();
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  errorDiv.id = "error-message";
  elements.searchInput.parentNode.parentNode.insertBefore(
    errorDiv,
    elements.loading
  );

  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  const errorMsg = document.getElementById("error-message");
  if (errorMsg) {
    errorMsg.remove();
  }
}

function addCityToDashboard(weatherData) {
  // Check if city already exists
  const existingIndex = cities.findIndex((c) => c.id === weatherData.id);
  if (existingIndex !== -1) {
    cities.splice(existingIndex, 1);
  }

  // Add to cities array at beginning
  cities.unshift(weatherData);
  if (cities.length > 8) cities.pop();

  // Save to localStorage
  localStorage.setItem("weatherCities", JSON.stringify(cities));

  // Update UI
  renderDashboard();
}

function renderDashboard() {
  if (cities.length === 0) return;

  const currentCity = cities[0];
  renderCurrentWeather(currentCity);
  renderForecast(currentCity.coord.lat, currentCity.coord.lon);
  renderCitiesList();
}

function renderCurrentWeather(city) {
  const iconUrl = `https://openweathermap.org/img/wn/${city.weather[0].icon}@4x.png`;
  const temp = Math.round(city.main.temp);
  const feelsLike = Math.round(city.main.feels_like);

  elements.currentWeather.innerHTML = `
                <div class="current-card">
                    <h2 class="current-location">${city.name}, ${
    city.sys.country
  }</h2>
                    <div class="current-main">
                        <img src="${iconUrl}" alt="${
    city.weather[0].description
  }" class="weather-icon">
                        <div class="current-temp">${temp}°C</div>
                    </div>
                    <div class="weather-description">${
                      city.weather[0].description
                    }</div>
                    <div class="current-details">
                        <div class="detail-item">
                            <div class="detail-label">Feels Like</div>
                            <div class="detail-value">${feelsLike}°C</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Humidity</div>
                            <div class="detail-value">${
                              city.main.humidity
                            }%</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Wind Speed</div>
                            <div class="detail-value">${
                              city.wind.speed
                            } m/s</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Pressure</div>
                            <div class="detail-value">${
                              city.main.pressure
                            } hPa</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Visibility</div>
                            <div class="detail-value">${
                              city.visibility
                                ? (city.visibility / 1000).toFixed(1) + " km"
                                : "N/A"
                            }</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">UV Index</div>
                            <div class="detail-value">N/A</div>
                        </div>
                    </div>
                </div>
            `;
}

async function renderForecast(lat, lon) {
  try {
    const forecastData = await fetchForecast(lat, lon);
    const dailyForecasts = processForecastData(forecastData.list);

    elements.forecast.innerHTML = `
                    <h3 class="section-title">5-Day Forecast</h3>
                    <div class="forecast-container">
                        ${dailyForecasts
                          .map(
                            (day) => `
                            <div class="forecast-card">
                                <div class="forecast-day">${day.day}</div>
                                <img src="https://openweathermap.org/img/wn/${
                                  day.icon
                                }@2x.png" alt="${
                              day.description
                            }" class="forecast-icon">
                                <div class="forecast-temp">${Math.round(
                                  day.temp
                                )}°C</div>
                                <div class="forecast-desc">${
                                  day.description
                                }</div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                `;
  } catch (error) {
    elements.forecast.innerHTML = `
                    <h3 class="section-title">5-Day Forecast</h3>
                    <p style="text-align: center; color: var(--text-muted);">Forecast data temporarily unavailable</p>
                `;
  }
}

function processForecastData(forecastList) {
  const dailyData = {};

  forecastList.slice(0, 5).forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dayName = date.toLocaleDateString("en", { weekday: "short" });

    if (!dailyData[dayName]) {
      dailyData[dayName] = {
        day: dayName,
        temp: item.main.temp,
        icon: item.weather[0].icon,
        description: item.weather[0].description,
      };
    }
  });

  return Object.values(dailyData);
}

function renderCitiesList() {
  if (cities.length <= 1) {
    elements.citiesList.innerHTML = "";
    return;
  }

  elements.citiesList.innerHTML = `
                <h3 class="section-title">Recent Cities</h3>
                <div class="cities-grid">
                    ${cities
                      .slice(1)
                      .map(
                        (city) => `
                        <div class="city-card" data-id="${city.id}">
                            <h4 class="city-name">${city.name}</h4>
                            <div class="city-temp">${Math.round(
                              city.main.temp
                            )}°C</div>
                            <div class="city-condition">${
                              city.weather[0].main
                            }</div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `;

  // Add click handlers to city cards
  document.querySelectorAll(".city-card").forEach((card) => {
    card.addEventListener("click", () => {
      const cityId = parseInt(card.dataset.id);
      const cityIndex = cities.findIndex((c) => c.id === cityId);
      if (cityIndex !== -1) {
        const city = cities.splice(cityIndex, 1)[0];
        cities.unshift(city);
        localStorage.setItem("weatherCities", JSON.stringify(cities));
        renderDashboard();
      }
    });
  });
}

function loadDefaultCities() {
  const defaultCities = [
    "London",
    "New York",
    "Tokyo",
    "Paris",
    "Sydney",
    "Dubai",
    "Mumbai",
  ];
  let loadedCount = 0;

  defaultCities.forEach(async (cityName) => {
    try {
      const weatherData = await fetchWeatherData(cityName);
      cities.push(weatherData);
      loadedCount++;

      if (loadedCount === 1) {
        renderDashboard();
      } else if (loadedCount < defaultCities.length) {
        renderCitiesList();
      }

      if (loadedCount === defaultCities.length) {
        localStorage.setItem("weatherCities", JSON.stringify(cities));
      }
    } catch (error) {
      console.error(`Failed to load ${cityName}:`, error.message);
    }
  });
}
