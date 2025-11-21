import { Box, Button, CircularProgress, Typography } from "@mui/material";
import React from "react";

export default function Snapshots({
  snapshots,
  createGifFromSnapshots,
  isCreatingGif,
}) {
  return (
    <>
      {snapshots.length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle1">Saved Snapshots:</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
            {snapshots.map((snap, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.5,
                }}
              >
                <img
                  src={snap.image}
                  alt={`snapshot-${i}`}
                  style={{
                    width: 120,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
                {snap.challengeName && (
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      maxWidth: 120,
                    }}
                  >
                    {snap.challengeName}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>

          <Box mt={2}>
            <Button
              variant="contained"
              color="secondary"
              onClick={createGifFromSnapshots}
              disabled={isCreatingGif}
            >
              {isCreatingGif ? (
                <CircularProgress size={20} sx={{ mr: 1 }} />
              ) : (
                "Create GIF"
              )}
            </Button>
          </Box>
        </Box>
      )}
    </>
  );
}
