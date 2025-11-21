import { Box, Typography, Chip } from "@mui/material";
import { getQualityColor } from "./Helper";

export default function CameraControl({
  videoRef,
  outputCanvasRef,
  aspectRatio,
  qualityScore,
  cameraQuality,
}) {
  return (
    <Box
      id="camera-preview"
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: "none" }}
      />
      <canvas
        ref={outputCanvasRef}
        style={{
          width: "100%",
          height: "auto",
          aspectRatio: `${aspectRatio}`,
          display: "block",
          background: "#000",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Chip
          label={cameraQuality}
          size="small"
          sx={{
            backgroundColor: getQualityColor(cameraQuality),
            color: "white",
            fontWeight: "bold",
            fontSize: "0.75rem",
            height: 24,
          }}
        />
      </Box>
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          right: 8,
          alignItems: "center",
          gap: 1,
          background: "rgba(0, 0, 0, 0.5)",
          color: "white",
          padding: "4px 8px",
          borderRadius: 2,
        }}
      >
        <Typography variant="subtitle1">
          💡 Lighting: {qualityScore.lighting}%
        </Typography>
        <Typography variant="subtitle1">
          🌫️ Sharpness: {qualityScore.sharpness}%
        </Typography>
        <Typography variant="subtitle1">
          🔍 Clarity: {qualityScore.clarity}%
        </Typography>
      </Box>
    </Box>
  );
}
