import React from "react";

import {
  Card,
  CardContent,
  CardMedia,
  Typography
} from "@mui/material";

function InfoBox({ weather }) {
  if (!weather) {
    return null;
  }

  const temperature = Math.round(weather.main.temp);

  // Change temperature color based on weather
  let temperatureColor = "#172033";

  if (temperature > 30) {
    temperatureColor = "red";
  } else if (temperature < 10) {
    temperatureColor = "blue";
  }

  return (
    <Card
      sx={{
        maxWidth: 500,
        margin: "30px auto",
        borderRadius: 4,
        textAlign: "center",
        backgroundColor: "#eaf6ff"
      }}
    >
      <CardContent>
        <Typography variant="h4" gutterBottom>
          {weather.name}, {weather.sys.country}
        </Typography>

        <CardMedia
          component="img"
          image={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
          alt={weather.weather[0].description}
          sx={{
            width: 120,
            height: 120,
            margin: "auto"
          }}
        />

        <Typography
          variant="h2"
          sx={{
            color: temperatureColor,
            fontWeight: "bold"
          }}
        >
          {temperature}°C
        </Typography>

        <Typography variant="h6" sx={{ mt: 1 }}>
          {weather.weather[0].description}
        </Typography>

        <Typography variant="body1" sx={{ mt: 2 }}>
          💧 Humidity: {weather.main.humidity}%
        </Typography>

        <Typography variant="body1">
          💨 Wind Speed: {weather.wind.speed} m/s
        </Typography>
      </CardContent>
    </Card>
  );
}

export default InfoBox;