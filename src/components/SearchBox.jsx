import React, { useState } from "react";
import { Box, TextField, Button } from "@mui/material";

function SearchBox({ city, setCity, onSearch, loading }) {
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setError("Please enter a city name");
      return;
    }

    if (trimmedCity.length < 2) {
      setError("City name must contain at least 2 characters");
      return;
    }

    setError("");
    onSearch(event);
  };

  const handleChange = (event) => {
    setCity(event.target.value);

    if (event.target.value.trim().length >= 2) {
      setError("");
    } else {
      setError("Please enter at least 2 characters");
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        gap: 2,
        mt: 3
      }}
    >
      <TextField
        fullWidth
        label="Enter city name"
        value={city}
        onChange={handleChange}
        error={Boolean(error)}
        helperText={error}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
      >
        Search
      </Button>
    </Box>
  );
}

export default SearchBox;