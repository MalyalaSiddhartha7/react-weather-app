
import React from "react";

import {
  Button,
  Stack,
  Typography
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import SendIcon from "@mui/icons-material/Send";

function ButtonTest() {
  return (
    <Stack spacing={3} sx={{ p: 3 }}>

      <Typography variant="h4">
        Material UI Button Test
      </Typography>

      <Button
        variant="contained"
        color="error"
        startIcon={<DeleteIcon />}
      >
        Delete
      </Button>

      <Button
        variant="contained"
        color="success"
        startIcon={<SendIcon />}
      >
        Submit
      </Button>

      <Button
        variant="outlined"
        disabled
      >
        Disabled Button
      </Button>

    </Stack>
  );
}

export default ButtonTest;
