import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Camera } from "@mediapipe/camera_utils";
import gifshot from "gifshot";
import SnapshotPreview from "./SnapshotPreview";
import { getExactAddress } from "./Helper";

const SmartCameraControl = ({ blurEnabled = true }) => {
  const videoRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const personCanvasRef = useRef(null);
  const segmentationRef = useRef(null);
  const cameraRef = useRef(null);

  const [blurAmount, setBlurAmount] = useState(12);
  const [brightness, setBrightness] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  // Snapshot + Preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  // GIF creation
  const [gifSrc, setGifSrc] = useState(null);
  const [isCreatingGif, setIsCreatingGif] = useState(false);

  // Refs for dynamic values
  const blurRef = useRef(blurAmount);
  const brightnessRef = useRef(brightness);
  const zoomRef = useRef(zoom);
  const aspectRef = useRef(aspectRatio);

  useEffect(() => {
    blurRef.current = blurAmount;
  }, [blurAmount]);
  useEffect(() => {
    brightnessRef.current = brightness;
  }, [brightness]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    aspectRef.current = aspectRatio;
  }, [aspectRatio]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      const address = await getExactAddress(lat, lon);
      setLocation(address);
    });
  }, []);

  const startCamera = async (video, mounted) => {
    try {
      if (!video) return;
      cameraRef.current = new Camera(video, {
        onFrame: async () => {
          await segmentationRef.current?.send({ image: video });
        },
        width: 1280,
        height: 720,
      });
      await cameraRef.current.start();
      if (mounted) setIsReady(true);
    } catch (err) {
      console.log("Camera start error:", err);
      setError("Camera access is blocked by your browser. Go to Settings → Site Permissions to enable it.");
      setIsReady(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const video = videoRef.current;

    if (!bgCanvasRef.current)
      bgCanvasRef.current = document.createElement("canvas");
    if (!personCanvasRef.current)
      personCanvasRef.current = document.createElement("canvas");

    const bgCanvas = bgCanvasRef.current;
    const personCanvas = personCanvasRef.current;

    const selfieSegmentation = new SelfieSegmentation({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });
    selfieSegmentation.setOptions({ modelSelection: 1 });

    selfieSegmentation.onResults((results) => {
      if (!mounted || !video || !outputCanvasRef.current) return;

      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;

      const targetAspect = aspectRef.current;
      let outputW = w;
      let outputH = w / targetAspect;
      if (outputH > h) {
        outputH = h;
        outputW = h * targetAspect;
      }

      const offsetX = (w - outputW) / 2;
      const offsetY = (h - outputH) / 2;

      const outputCanvas = outputCanvasRef.current;
      outputCanvas.width = outputW;
      outputCanvas.height = outputH;

      bgCanvas.width = outputW;
      bgCanvas.height = outputH;
      personCanvas.width = outputW;
      personCanvas.height = outputH;

      const outCtx = outputCanvas.getContext("2d");
      const bgCtx = bgCanvas.getContext("2d");
      const personCtx = personCanvas.getContext("2d");

      const bAmount = blurRef.current;
      const bright = brightnessRef.current;
      const z = zoomRef.current;

      // Crop region to maintain aspect ratio
      const srcX = offsetX;
      const srcY = offsetY;
      const srcW = outputW;
      const srcH = outputH;

      // Background
      bgCtx.save();
      bgCtx.filter = `${
        blurEnabled && bAmount > 0 ? `blur(${bAmount}px)` : ""
      } brightness(${bright})`;
      bgCtx.drawImage(
        results.image,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        outputW,
        outputH
      );
      bgCtx.restore();

      // Person
      personCtx.save();
      personCtx.filter = `brightness(${bright})`;
      personCtx.drawImage(
        results.image,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        outputW,
        outputH
      );
      personCtx.globalCompositeOperation = "destination-in";
      personCtx.drawImage(
        results.segmentationMask,
        srcX,
        srcY,
        srcW,
        srcH,
        0,
        0,
        outputW,
        outputH
      );
      personCtx.restore();

      // Compose
      outCtx.save();
      outCtx.clearRect(0, 0, outputW, outputH);

      // Flip horizontally to show true camera view
      outCtx.translate(outputW, 0);
      outCtx.scale(-1, 1);

      // Apply zoom
      outCtx.translate(outputW / 2, outputH / 2);
      outCtx.scale(z, z);
      outCtx.translate(-outputW / 2, -outputH / 2);

      outCtx.drawImage(bgCanvas, 0, 0, outputW, outputH);
      outCtx.drawImage(personCanvas, 0, 0, outputW, outputH);
      outCtx.restore();
    });

    segmentationRef.current = selfieSegmentation;

    startCamera(video, mounted);

    return () => {
      mounted = false;
      cameraRef.current?.stop();
      cameraRef.current = null;
      segmentationRef.current = null;
    };
  }, [blurEnabled]);

  const handleSnapshot = () => {
    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    const imageData = canvas.toDataURL("image/png");
    setPreviewImage(imageData);
    setPreviewOpen(true);
  };

  const handleKeepSnapshot = () => {
    setSnapshots((prev) => [...prev, previewImage]);
    setPreviewOpen(false);
    setPreviewImage(null);
  };

  const handleRetakeSnapshot = () => {
    setPreviewOpen(false);
    setPreviewImage(null);
  };

  // ===== GIF CREATION =====
  const createGifFromSnapshots = () => {
    if (snapshots.length < 2) {
      alert("Please capture at least 2 snapshots to create a GIF.");
      return;
    }

    setIsCreatingGif(true);
    gifshot.createGIF(
      {
        images: snapshots,
        gifWidth: 480,
        gifHeight: 480 / aspectRatio,
        interval: 0.5, // frame delay in seconds
        numFrames: snapshots.length,
        frameDuration: 1,
        sampleInterval: 10,
        progressCallback: () => {},
      },
      (obj) => {
        setIsCreatingGif(false);
        if (!obj.error) {
          setGifSrc(obj.image);
        } else {
          console.log("GIF creation failed:", obj.error);
        }
      }
    );
  };

  // ===== UI CONTROLS =====
  const increaseBlur = () => setBlurAmount((v) => Math.min(50, v + 1));
  const decreaseBlur = () => setBlurAmount((v) => Math.max(0, v - 1));
  const increaseBrightness = () =>
    setBrightness((v) => Math.min(3, +(v + 0.1).toFixed(1)));
  const decreaseBrightness = () =>
    setBrightness((v) => Math.max(0.1, +(v - 0.1).toFixed(1)));
  const increaseZoom = () => setZoom((v) => Math.min(3, +(v + 0.1).toFixed(2)));
  const decreaseZoom = () => setZoom((v) => Math.max(1, +(v - 0.1).toFixed(2)));

  return (
    <Paper
      elevation={6}
      sx={{ p: 3, maxWidth: 500, m: "32px auto", borderRadius: 2 }}
    >
      <Typography variant="h6" fontWeight={700} mb={2}>
        Smart Camera
      </Typography>
      {error ? (
         <Box mb={2} p={2} bgcolor="#fdecea" borderRadius={1}>
          <Typography color="#b71c1c">{error}</Typography>
        </Box>
      ):(
        <>
      <Box sx={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
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
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={2} mt={2} alignItems="center">
        <Typography>Blur</Typography>
        <Button onClick={decreaseBlur} disabled={!isReady}>
          -
        </Button>
        <Typography>{blurAmount}px</Typography>
        <Button onClick={increaseBlur} disabled={!isReady}>
          +
        </Button>

        <Typography>Brightness</Typography>
        <Button onClick={decreaseBrightness} disabled={!isReady}>
          -
        </Button>
        <Typography>{brightness.toFixed(1)}</Typography>
        <Button onClick={increaseBrightness} disabled={!isReady}>
          +
        </Button>

        <Typography>Zoom</Typography>
        <Button onClick={decreaseZoom} disabled={!isReady}>
          -
        </Button>
        <Typography>{zoom.toFixed(2)}x</Typography>
        <Button onClick={increaseZoom} disabled={!isReady}>
          +
        </Button>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Aspect</InputLabel>
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

        <Button
          variant="contained"
          onClick={handleSnapshot}
          disabled={!isReady}
        >
          Capture
        </Button>
      </Stack>

      <Typography
        variant="caption"
        display="block"
        mt={1}
        color="text.secondary"
      >
        {isReady
          ? "Camera active"
          : "Starting camera... allow permission if prompted."}
      </Typography>
      </>
      )}
      {/* === Saved Snapshots === */}
      {snapshots.length > 0 && (
        <Box mt={3}>
          <Typography variant="subtitle1">Saved Snapshots:</Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 1 }}>
            {snapshots.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`snapshot-${i}`}
                style={{
                  width: 120,
                  borderRadius: 8,
                  border: "1px solid #ccc",
                }}
              />
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

      {/* === Generated GIF Preview === */}
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

      {/* Snapshot Preview Dialog */}
      <SnapshotPreview
        open={previewOpen}
        imageSrc={previewImage}
        onKeep={handleKeepSnapshot}
        onRetake={handleRetakeSnapshot}
        location={location}
      />
    </Paper>
  );
};

export default SmartCameraControl;
