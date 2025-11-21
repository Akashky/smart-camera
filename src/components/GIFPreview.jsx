import { Box, Button, Typography } from "@mui/material";
import React from "react";

function GIFPreview({ gifSrc }) {
  return (
    <>
      {gifSrc && (
        <Box mt={3} textAlign="center">
          <Typography variant="subtitle1">Generated GIF:</Typography>
          <img
            src={gifSrc}
            alt="Generated GIF"
            style={{
              maxWidth: "100%",
              borderRadius: 8,
              border: "2px solid #444",
            }}
          />
          <Box mt={1}>
            <Button
              variant="outlined"
              onClick={() => {
                const a = document.createElement("a");
                a.href = gifSrc;
                a.download = "smart_camera.gif";
                a.click();
              }}
            >
              Download GIF
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
}

export default GIFPreview;
