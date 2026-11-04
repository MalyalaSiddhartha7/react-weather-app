import "./App.css";
import { useEffect, useState } from "react";

import ButtonTest from "./components/ButtonTest";
import SearchBox from "./components/SearchBox";
import InfoBox from "./components/InfoBox";

import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent
} from "@mui/material";

import {
  getWeather,
  getForecast,
  getWeatherByLocation,
  getForecastByCoordinates
} from "./services/weatherService";

function getWindDirection(degrees) {
  if (degrees === undefined || degrees === null) return "N/A";

  const directions = [
    "North", "North-East", "East", "South-East",
    "South", "South-West", "West", "North-West"
  ];

  return directions[Math.round(degrees / 45) % 8];
}

function formatTime(timestamp, timezone) {
  if (!timestamp) return "N/A";

  return new Date(
    (timestamp + timezone) * 1000
  ).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC"
  });
}

function convertTemperature(tempC, unit) {
  if (unit === "F") {
    return Math.round((tempC * 9) / 5 + 32);
  }

  return Math.round(tempC);
}

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [temperatureUnit, setTemperatureUnit] = useState("C");

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("weatherTheme");
      return savedTheme === null ? true : savedTheme === "dark";
    } catch {
      return true;
    }
  });

  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const savedHistory = JSON.parse(
        localStorage.getItem("weatherSearchHistory") || "[]"
      );

      return Array.isArray(savedHistory)
        ? savedHistory.filter((item) => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  });

  // Toggle theme
  const toggleTheme = () => {
    setDarkMode((previousMode) => {
      const newMode = !previousMode;

      try {
        localStorage.setItem(
          "weatherTheme",
          newMode ? "dark" : "light"
        );
      } catch {
        // Ignore storage errors
      }

      return newMode;
    });
  };

  // Save search history
  const saveSearchHistory = (cityName) => {
    setSearchHistory((previousHistory) => {
      const updatedHistory = [
        cityName,
        ...previousHistory.filter(
          (item) => item.toLowerCase() !== cityName.toLowerCase()
        )
      ].slice(0, 5);

      try {
        localStorage.setItem(
          "weatherSearchHistory",
          JSON.stringify(updatedHistory)
        );
      } catch {
        // Ignore storage errors
      }

      return updatedHistory;
    });
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);

    try {
      localStorage.removeItem("weatherSearchHistory");
    } catch {
      // Ignore storage errors
    }
  };

  // Load weather and forecast
  const loadWeather = async (weatherRequest, forecastRequest) => {
    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    try {
      const [weatherData, forecastData] = await Promise.all([
        weatherRequest,
        forecastRequest
      ]);

      setWeather(weatherData);
      setForecast(forecastData.list);
      setCity(weatherData.name);
      setLastUpdated(new Date());

      saveSearchHistory(weatherData.name);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Load Hyderabad automatically
  useEffect(() => {
    loadWeather(
      getWeather("Hyderabad"),
      getForecast("Hyderabad")
    );
  }, []);

  // Search by city
  const handleSearch = (e) => {
    e.preventDefault();

    const searchCity = city.trim();

    if (searchCity.length < 2) {
      setError("Please enter a valid city name");
      return;
    }

    loadWeather(
      getWeather(searchCity),
      getForecast(searchCity)
    );
  };

  // Search from history
  const handleHistorySearch = (cityName) => {
    setCity(cityName);

    loadWeather(
      getWeather(cityName),
      getForecast(cityName)
    );
  };

  // Detect current location
  const handleLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const [weatherData, forecastData] = await Promise.all([
            getWeatherByLocation(latitude, longitude),
            getForecastByCoordinates(latitude, longitude)
          ]);

          setWeather(weatherData);
          setForecast(forecastData.list);
          setCity(weatherData.name);
          setLastUpdated(new Date());

          saveSearchHistory(weatherData.name);
        } catch (err) {
          setError(err.message || "Unable to fetch location weather");
        } finally {
          setLoading(false);
        }
      },
      (geoError) => {
        const messages = {
          1: "Location permission denied. Please allow location access.",
          2: "Your current location is unavailable.",
          3: "Location request timed out."
        };

        setError(
          messages[geoError.code] || "Unable to detect your location."
        );

        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // Check freezing conditions using Celsius
  const isFreezing = weather && weather.main.temp <= 0;

  // Convert current weather for display
  const displayWeather = weather
    ? {
        ...weather,
        main: {
          ...weather.main,
          temp: convertTemperature(weather.main.temp, temperatureUnit),
          feels_like: convertTemperature(
            weather.main.feels_like,
            temperatureUnit
          ),
          temp_min: convertTemperature(
            weather.main.temp_min,
            temperatureUnit
          ),
          temp_max: convertTemperature(
            weather.main.temp_max,
            temperatureUnit
          )
        }
      }
    : null;

  // Next 24 hours
  const hourlyForecast = forecast.slice(0, 8);

  // Get today's date according to the city's timezone
  const todayInCity = weather
    ? new Date(
        Date.now() + weather.timezone * 1000
      ).toISOString().split("T")[0]
    : null;

  // Five-day forecast starting tomorrow, not today
  const dailyForecast = Object.values(
    forecast.reduce((days, item) => {
      const localDate = new Date(
        (item.dt + (weather?.timezone || 0)) * 1000
      );

      const date = localDate.toISOString().split("T")[0];

      // Skip today's forecast
      if (!todayInCity || date <= todayInCity) {
        return days;
      }

      if (!days[date]) {
        days[date] = {
          date,
          temperatures: [],
          weather: item.weather[0],
          icon: item.weather[0].icon
        };
      }

      days[date].temperatures.push(item.main.temp);

      return days;
    }, {})
  ).slice(0, 5);

  // Theme colors
  const pageBackground = isFreezing
    ? "linear-gradient(135deg, #dbeafe, #93c5fd, #e0f2fe)"
    : darkMode
      ? "#142238"
      : "#eef4fa";

  const textColor = isFreezing
    ? "#102a43"
    : darkMode
      ? "#ffffff"
      : "#172033";

  const cardBackground = darkMode ? "#eaf6ff" : "#ffffff";

  return (
    <Container
      maxWidth="md"
      className="app-shell"
      sx={{
        minHeight: "100vh",
        background: pageBackground,
        color: textColor,
        transition: "background 0.3s ease, color 0.3s ease",
        pb: 5
      }}
    >
      <Box sx={{ textAlign: "center", mt: 5 }}>

        {/* Theme Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2
          }}
        >
          <Button
            variant="outlined"
            onClick={toggleTheme}
            sx={{
              color: textColor,
              borderColor: textColor
            }}
          >
            {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </Button>
        </Box>

        {/* Dashboard Heading */}
        <Typography
          variant="h3"
          gutterBottom
          sx={{ color: textColor, fontWeight: "bold" }}
        >
          {isFreezing
            ? "❄️ Winter Weather Dashboard"
            : "🌤️ Weather Dashboard"}
        </Typography>

        <Typography variant="subtitle1" sx={{ color: textColor }}>
          Check real-time weather conditions
        </Typography>

        {/* Temperature Unit Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 1,
            mt: 3,
            mb: 2
          }}
        >
          <Button
            variant={temperatureUnit === "C" ? "contained" : "outlined"}
            onClick={() => setTemperatureUnit("C")}
          >
            °C Celsius
          </Button>

          <Button
            variant={temperatureUnit === "F" ? "contained" : "outlined"}
            onClick={() => setTemperatureUnit("F")}
          >
            °F Fahrenheit
          </Button>
        </Box>

        {/* Freezing Weather Alert */}
        {isFreezing && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            ❄️ Freezing conditions! Stay warm and take care in the cold weather.
          </Alert>
        )}

        {/* Search Box */}
        <SearchBox
          city={city}
          setCity={setCity}
          onSearch={handleSearch}
          loading={loading}
        />

        {/* Location Button */}
        <Button
          variant="outlined"
          onClick={handleLocation}
          disabled={loading}
          sx={{
            mt: 2,
            color: textColor,
            borderColor: textColor
          }}
        >
          📍 Use My Location
        </Button>

        {/* Recent Searches */}
        {searchHistory.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="h6"
              sx={{ color: textColor, mb: 1 }}
            >
              🕘 Recent Searches
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 1
              }}
            >
              {searchHistory.map((cityName) => (
                <Button
                  key={cityName}
                  variant="outlined"
                  disabled={loading}
                  onClick={() => handleHistorySearch(cityName)}
                  sx={{
                    color: textColor,
                    borderColor: textColor
                  }}
                >
                  {cityName}
                </Button>
              ))}
            </Box>

            <Button
              variant="text"
              onClick={clearSearchHistory}
              disabled={loading}
              sx={{
                mt: 1,
                color: darkMode ? "#fca5a5" : "#d32f2f"
              }}
            >
              Clear History
            </Button>
          </Box>
        )}

        {/* Loading */}
        {loading && (
          <Box sx={{ mt: 4 }}>
            <CircularProgress />
            <Typography sx={{ color: textColor, mt: 1 }}>
              Fetching weather...
            </Typography>
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {/* Main Weather Information */}
        {displayWeather && (
          <InfoBox weather={displayWeather} />
        )}

        {/* Last Updated */}
        {weather && lastUpdated && (
          <Typography
            variant="body2"
            sx={{ color: textColor, mt: 1, mb: 2 }}
          >
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        )}

        {/* Additional Weather Information */}
        {weather && (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>🌡️ Feels Like</Typography>
                  <Typography variant="h6">
                    {convertTemperature(
                      weather.main.feels_like,
                      temperatureUnit
                    )}°{temperatureUnit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>🔽 Pressure</Typography>
                  <Typography variant="h6">
                    {weather.main.pressure} hPa
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>🌅 Sunrise</Typography>
                  <Typography variant="h6">
                    {formatTime(weather.sys.sunrise, weather.timezone)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>🌇 Sunset</Typography>
                  <Typography variant="h6">
                    {formatTime(weather.sys.sunset, weather.timezone)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>🧭 Wind Direction</Typography>
                  <Typography variant="h6">
                    {getWindDirection(weather.wind.deg)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6}>
              <Card sx={{ background: cardBackground }}>
                <CardContent>
                  <Typography>👁️ Visibility</Typography>
                  <Typography variant="h6">
                    {weather.visibility !== undefined
                      ? `${(weather.visibility / 1000).toFixed(1)} km`
                      : "N/A"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Hourly Forecast */}
        {weather && hourlyForecast.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ color: textColor, fontWeight: "bold" }}
            >
              🕒 Hourly Weather Forecast
            </Typography>

            <Typography sx={{ color: textColor, mb: 2 }}>
              Forecast at 3-hour intervals
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              {hourlyForecast.map((hour) => (
                <Grid item xs={6} sm={4} md={3} key={hour.dt}>
                  <Card
                    sx={{
                      background: cardBackground,
                      color: "#172033",
                      borderRadius: 3
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h6">
                        {formatTime(hour.dt, weather.timezone)}
                      </Typography>

                      <img
                        src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}@2x.png`}
                        alt={hour.weather[0].description}
                      />

                      <Typography variant="h5">
                        {convertTemperature(
                          hour.main.temp,
                          temperatureUnit
                        )}°{temperatureUnit}
                      </Typography>

                      <Typography variant="body2">
                        {hour.weather[0].description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Five-Day Forecast Starting Tomorrow */}
        {weather && dailyForecast.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{ color: textColor, fontWeight: "bold" }}
            >
              📅 5-Day Weather Forecast
            </Typography>

            <Grid container spacing={2} sx={{ mt: 2 }}>
              {dailyForecast.map((day) => (
                <Grid item xs={12} sm={6} md={4} key={day.date}>
                  <Card
                    sx={{
                      background: cardBackground,
                      color: "#172033",
                      borderRadius: 3
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="h6">
                        {new Date(
                          `${day.date}T12:00:00Z`
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          timeZone: "UTC"
                        })}
                      </Typography>

                      <img
                        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                        alt={day.weather.description}
                      />

                      <Typography variant="h5">
                        {convertTemperature(
                          day.temperatures.reduce(
                            (a, b) => a + b,
                            0
                          ) / day.temperatures.length,
                          temperatureUnit
                        )}°{temperatureUnit}
                      </Typography>

                      <Typography>
                        {day.weather.description}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Min: {convertTemperature(
                          Math.min(...day.temperatures),
                          temperatureUnit
                        )}°{temperatureUnit}
                      </Typography>

                      <Typography variant="body2">
                        Max: {convertTemperature(
                          Math.max(...day.temperatures),
                          temperatureUnit
                        )}°{temperatureUnit}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Material UI Button Test */}
        <Box
          sx={{
            mt: 5,
            p: 3,
            borderRadius: 3,
            backgroundColor: darkMode ? "#20334d" : "#ffffff"
          }}
        >
          <ButtonTest />
        </Box>

      </Box>
    </Container>
  );
}

export default App;