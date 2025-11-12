import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Box, Typography } from "@mui/material";

const SnapshotPreview = ({ open, imageSrc, onKeep, onRetake, location }) => {
  if (!imageSrc) return null;

  return (
    <Dialog open={open} onClose={onRetake} maxWidth="xs" fullWidth>
      <DialogTitle>Snapshot Preview</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <img
            src={imageSrc}
            alt="Snapshot Preview"
            style={{ maxWidth: "100%", borderRadius: 8 }}
          />
        </Box>
        {location ? (
          <Box sx={{ mt: 2, textAlign: "center" }}>
            <Typography variant="body2">Location:</Typography>
            <Typography variant="body2">
              <p>
                <b>Address:</b> {location.fullAddress}
              </p>
              <p>
                <b>City:</b> {location.city}
              </p>
              <p>
                <b>State:</b> {location.state}
              </p>
              <p>
                <b>Country:</b> {location.country}
              </p>
              <p>
                <b>Pincode:</b> {location.postcode}
              </p>
            </Typography>
          </Box>
        ) : <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>Location access denied. Your image will be saved without location data.</Typography>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onRetake}>
          Retake
        </Button>
        <Button variant="contained" color="primary" onClick={onKeep}>
          Keep
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SnapshotPreview;
