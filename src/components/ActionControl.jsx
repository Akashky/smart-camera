import {
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import FlipCameraAndroidIcon from "@mui/icons-material/FlipCameraAndroid";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import BlurOnIcon from "@mui/icons-material/BlurOn";
import LightModeIcon from "@mui/icons-material/LightMode";

export default function ActionControl({
  blurAmount,
  setBlurAmount,
  brightness,
  setBrightness,
  zoom,
  setZoom,
  aspectRatio,
  setAspectRatio,
  isReady,
  switchCamera,
  handleSnapshot,
  isVerifying,
  handleStartVerification,
  handleStopVerification,
}) {
  return (
    <Grid container spacing={3} rowSpacing={2} sx={{px:2,"&>.MuiGrid-root": { display: "flex", alignItems:"center", flexDirection:"column", justifyContent:"center" }}}>
      {/* BLUR CONTROL */}
      <Grid item size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Blur
        </Typography>
        <Slider
          value={blurAmount}
          onChange={(e, newValue) => setBlurAmount(newValue)}
          min={0}
          max={30}
          step={1}
          sx={{ mt: 1 }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <BlurOnIcon fontSize="small" />
          <Typography variant="body2">{blurAmount}px</Typography>
        </Stack>
      </Grid>

      {/* BRIGHTNESS CONTROL */}
      <Grid item size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Brightness
        </Typography>
        <Slider
          value={brightness}
          onChange={(e, newValue) => setBrightness(newValue)}
          min={0}
          max={2}
          step={0.1}
          sx={{ mt: 1 }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <LightModeIcon fontSize="small" />
          <Typography variant="body2">{brightness.toFixed(1)}</Typography>
        </Stack>
      </Grid>

      {/* ZOOM CONTROL */}
      <Grid item size={{ xs: 12, md: 6 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Zoom
        </Typography>
        <Slider
          value={zoom}
          onChange={(e, newValue) => setZoom(newValue)}
          min={1}
          max={3}
          step={0.1}
          sx={{ mt: 1 }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <ZoomOutIcon fontSize="small" />
          <Typography variant="body2">{zoom.toFixed(1)}x</Typography>
          <ZoomInIcon fontSize="small" />
        </Stack>
      </Grid>

      {/* ASPECT RATIO */}
      <Grid item size={{ xs: 12, md: 6 }}>
        <FormControl fullWidth>
          <InputLabel>Aspect Ratio</InputLabel>
          <Select
            label="Aspect"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(Number(e.target.value))}
            disabled={!isReady}
          >
            <MenuItem value={16 / 9}>16:9</MenuItem>
            <MenuItem value={4 / 3}>4:3</MenuItem>
            <MenuItem value={1}>1:1</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* CAMERA TOGGLE + ACTION BUTTONS */}
      <Grid item size={{ xs: 12}}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="center"
          width={"100%"}
          py={2}
        >
          <Button
            variant="outlined"
            startIcon={<FlipCameraAndroidIcon />}
            onClick={switchCamera}
          >
            Switch Camera
          </Button>

          <Button variant="contained" color="primary" onClick={handleSnapshot}>
            Capture
          </Button>

          <Button
            variant="contained"
            color="success"
            onClick={
              isVerifying ? handleStopVerification : handleStartVerification
            }
            disabled={!isReady}
          >
            Verify
          </Button>
        </Stack>
      </Grid>
    </Grid>
  );
}
