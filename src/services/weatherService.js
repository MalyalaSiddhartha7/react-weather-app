const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;

async function fetchWeatherData(url) {
  try {
    if (!API_KEY) {
      throw new Error("Weather API key is missing. Check your .env file.");
    }

    const response = await fetch(url);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to fetch weather data"
      );
    }

    return data;

  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        "Network error. Please check your internet connection."
      );
    }

    throw error;
  }
}

// 1. Get current weather by city
export async function getWeather(city) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  return fetchWeatherData(url);
}

// 2. Get five-day forecast by city
export async function getForecast(city) {
  const url =
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

  return fetchWeatherData(url);
}

// 3. Get current weather using location
export async function getWeatherByLocation(lat, lon) {
  const url =
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  return fetchWeatherData(url);
}

// 4. Get forecast using location
export async function getForecastByCoordinates(lat, lon) {
  const url =
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  return fetchWeatherData(url);
}