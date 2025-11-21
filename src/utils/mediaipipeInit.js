/**
 * MediaPipe Initialization Utility
 * Handles proper WASM module initialization with error recovery
 */

let selfieSegmentationInstance = null;
let faceMeshInstance = null;
let initializationPromise = null;

// Force reload WASM modules if initialization fails
const WASM_INIT_RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export const initializeSelfieSegmentation = async (retryCount = 0) => {
  try {
    // Clear any stale instance
    if (selfieSegmentationInstance && retryCount === 0) {
      return selfieSegmentationInstance;
    }

    const { SelfieSegmentation } = await import('@mediapipe/selfie_segmentation');
    
    // Create new instance with proper WASM path
    const instance = new SelfieSegmentation({
      locateFile: (file) => {
        // Force fresh load with cache busting
        const timestamp = Date.now();
        return `/mediapipe/selfie_segmentation/${file}?v=${timestamp}`;
      },
    });

    // Set options immediately after creation
    instance.setOptions({ 
      modelSelection: 1,
      selfieMode: true,
    });

    // Store reference
    selfieSegmentationInstance = instance;
    return instance;
  } catch (error) {
    console.error('SelfieSegmentation initialization failed:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying SelfieSegmentation initialization... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, WASM_INIT_RETRY_DELAY));
      return initializeSelfieSegmentation(retryCount + 1);
    }
    
    throw error;
  }
};

export const initializeFaceMesh = async (retryCount = 0) => {
  try {
    // Clear any stale instance
    if (faceMeshInstance && retryCount === 0) {
      return faceMeshInstance;
    }

    const { FaceMesh } = await import('@mediapipe/face_mesh');
    
    // Create new instance with proper WASM path
    const instance = new FaceMesh({
      locateFile: (file) => {
        // Force fresh load with cache busting
        const timestamp = Date.now();
        return `/mediapipe/face_mesh/${file}?v=${timestamp}`;
      },
    });

    // Set options immediately after creation
    instance.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    // Store reference
    faceMeshInstance = instance;
    return instance;
  } catch (error) {
    console.error('FaceMesh initialization failed:', error);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying FaceMesh initialization... (${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, WASM_INIT_RETRY_DELAY));
      return initializeFaceMesh(retryCount + 1);
    }
    
    throw error;
  }
};

export const initializeMediaPipeModels = async () => {
  // Use singleton pattern to prevent multiple initialization attempts
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = Promise.all([
    initializeSelfieSegmentation(),
    initializeFaceMesh(),
  ]).then(([segmentation, faceMesh]) => {
    return { segmentation, faceMesh };
  });

  return initializationPromise;
};

export const resetMediaPipeModels = () => {
  selfieSegmentationInstance = null;
  faceMeshInstance = null;
  initializationPromise = null;
};

export const getSelfieSegmentation = () => selfieSegmentationInstance;
export const getFaceMesh = () => faceMeshInstance;
