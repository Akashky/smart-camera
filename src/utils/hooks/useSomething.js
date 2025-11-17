import { useRef, useState, useCallback, useMemo } from "react";
import { challenges } from "../constants/SmartCamera";

export const useSomething = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState(new Set());
  const TOTAL_CHALLENGES = challenges?.length;
  
  // Check if all challenges are completed
  const isAllVerified = useMemo(() => {
    return completedChallenges.size === TOTAL_CHALLENGES;
  }, [completedChallenges, TOTAL_CHALLENGES]);

  // Face detection state
  const faceDetectionStateRef = useRef({
    eyeAspectRatio: 0,
    previousEyeAspectRatio: 0,
    headRotation: { x: 0, y: 0, z: 0 },
    previousHeadRotation: { x: 0, y: 0, z: 0 },
    headNodHistory: [],
    headShakeHistory: [],
    leftTurnDetected: false,
    rightTurnDetected: false,
  });

   // ===== LIVENESS DETECTION FUNCTIONS =====
   const calculateEyeAspectRatio = (landmarks, eyeIndices) => {
    // Use 6 key points for EAR calculation
    if (eyeIndices.length < 6) return 0.3;
    
    const p1 = landmarks[eyeIndices[0]]; // outer corner
    const p2 = landmarks[eyeIndices[1]]; // inner corner  
    const p3 = landmarks[eyeIndices[2]]; // top point 1
    const p4 = landmarks[eyeIndices[3]]; // top point 2
    const p5 = landmarks[eyeIndices[4]]; // bottom point 1
    const p6 = landmarks[eyeIndices[5]]; // bottom point 2
    
    // Calculate vertical distances
    const verticalDist1 = Math.sqrt(
      Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2)
    );
    const verticalDist2 = Math.sqrt(
      Math.pow(p4.x - p6.x, 2) + Math.pow(p4.y - p6.y, 2)
    );
    
    // Calculate horizontal distance
    const horizontalDist = Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    );
    
    if (horizontalDist === 0) return 0.3;
    return (verticalDist1 + verticalDist2) / (2 * horizontalDist);
  };

  const detectSmile = (landmarks) => {
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];

  const leftCheek = landmarks[234]; 
  const rightCheek = landmarks[454];

  if (!leftCorner || !rightCorner || !leftCheek || !rightCheek) return false;

  // Compute mouth width (how wide the smile is)
  const mouthWidth = Math.hypot(
    rightCorner.x - leftCorner.x,
    rightCorner.y - leftCorner.y
  );

  // Compute cheek elevation (cheeks go UP in a real smile)
  const cheekLift =
    ((leftCheek.y + rightCheek.y) / 2) -
    ((leftCorner.y + rightCorner.y) / 2);

  // Normalize cheek lift by mouth width
  const normalizedCheekLift = cheekLift / mouthWidth;

  // Compute corner elevation relative to overall face height
  const headTop = landmarks[10];  // forehead
  const headBottom = landmarks[152]; // chin

  const faceHeight = headBottom.y - headTop.y;
  const avgCornerY = (leftCorner.y + rightCorner.y) / 2;
  const cornerElevation = (headTop.y + faceHeight * 0.35) - avgCornerY;

  const normalizedCornerElevation = cornerElevation / faceHeight;

  // Final combined logic
  const isSmile =
    normalizedCornerElevation > 0.02 ||   // corners raised
    normalizedCheekLift > 0.03 ||         // cheeks lifted
    mouthWidth > 0.045;                   // smiling widens the mouth

  return isSmile;
};
  const calculateHeadRotation = (landmarks) => {
    // Use nose tip position relative to face center for better accuracy
    const noseTip = landmarks[4];
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const chin = landmarks[152];
    const forehead = landmarks[10];

    // Calculate face center (between eyes)
    const eyeCenterX = (leftEye.x + rightEye.x) / 2;
    const eyeCenterY = (leftEye.y + rightEye.y) / 2;
    
    // Calculate face width (distance between eyes)
    const eyeDistance = Math.sqrt(
      Math.pow(rightEye.x - leftEye.x, 2) + Math.pow(rightEye.y - leftEye.y, 2)
    );
    
    if (eyeDistance === 0) return { x: 0, y: 0, z: 0, angleY: 0 };
    
    // Y-axis rotation (left/right) - using nose tip position relative to face center
    // When head turns left, nose tip moves to the right relative to face center
    // When head turns right, nose tip moves to the left relative to face center
    const noseOffsetX = noseTip.x - eyeCenterX;
    
    // Calculate the actual angle in degrees using trigonometry
    // The angle is calculated based on how far the nose tip is from the eye center
    // relative to the eye distance (which represents the face width)
    const normalizedOffset = noseOffsetX / eyeDistance;
    
    // Convert to degrees: atan gives us the angle, then convert to degrees
    // We multiply by a factor to account for the 3D projection
    // For a typical face, a 30-degree turn corresponds to approximately 0.5-0.6 normalized offset
    const angleY = Math.atan(normalizedOffset * 1.2) * (180 / Math.PI);
    
    // X-axis rotation (up/down) - using nose tip vertical position
    const faceHeight = Math.abs(forehead.y - chin.y);
    if (faceHeight === 0) return { x: 0, y: 0, z: 0, angleY };
    const verticalOffset = (noseTip.y - eyeCenterY) / faceHeight;
    const xRotation = (verticalOffset - 0.3) * 2; // Normalized

    return { x: xRotation, y: normalizedOffset, z: 0, angleY };
  };

  const detectLivenessActions = useCallback((landmarks) => {
    const state = faceDetectionStateRef.current;
    
    if (!isVerifying) return; // Don't process if not verifying
    
    // Left eye indices (MediaPipe Face Mesh) - 6 key points for EAR
    const leftEyeIndices = [33, 133, 159, 158, 145, 153];
    // Right eye indices
    const rightEyeIndices = [362, 263, 386, 385, 374, 380];
    
    // Calculate eye aspect ratio
    const leftEAR = calculateEyeAspectRatio(landmarks, leftEyeIndices);
    const rightEAR = calculateEyeAspectRatio(landmarks, rightEyeIndices);
    const avgEAR = (leftEAR + rightEAR) / 2;
    
    // Detect blink
    if (state.previousEyeAspectRatio > 0.25 && avgEAR < 0.2) {
      setCompletedChallenges((prev) => new Set(prev).add(0)); // "Blink your eyes"
    }
    state.previousEyeAspectRatio = avgEAR;
    state.eyeAspectRatio = avgEAR;

    // Calculate head rotation using nose tip
    const headRotation = calculateHeadRotation(landmarks);
    const currentAngle = headRotation.angleY; // Angle in degrees
    
    // When head turns LEFT, nose tip moves RIGHT (positive angle)
    // When head turns RIGHT, nose tip moves LEFT (negative angle)
    
    // Detect head turn left - angle must exceed 30 degrees (positive)
    // Works for both slow and fast turns
    if (currentAngle > 30 && !state.leftTurnDetected) {
      setCompletedChallenges((prev) => {
        if (!prev.has(1)) {
          state.leftTurnDetected = true; // Mark as detected to prevent multiple triggers
          return new Set(prev).add(1); // "Turn your head left" (index 1)
        }
        return prev;
      });
    }
    
    // Reset left turn detection if head returns to center (angle < 20 degrees)
    if (currentAngle < 20) {
      state.leftTurnDetected = false;
    }
    
    // Detect head turn right - angle must exceed -30 degrees (negative)
    // Works for both slow and fast turns
    if (currentAngle < -30 && !state.rightTurnDetected) {
      setCompletedChallenges((prev) => {
        if (!prev.has(2)) {
          state.rightTurnDetected = true; // Mark as detected to prevent multiple triggers
          return new Set(prev).add(2); // "Turn your head right" (index 2)
        }
        return prev;
      });
    }
    
    // Reset right turn detection if head returns to center (angle > -20 degrees)
    if (currentAngle > -20) {
      state.rightTurnDetected = false;
    }
    
    state.previousHeadRotation = headRotation;
    state.headRotation = headRotation;

    // Detect smile using mouth corner elevation (works with closed mouth)
    const isSmiling = detectSmile(landmarks);
    if (isSmiling) {
      setCompletedChallenges((prev) => new Set(prev).add(3)); // "Smile"
    }

    // Detect nod yes (vertical movement)
    state.headNodHistory.push(headRotation.x);
    if (state.headNodHistory.length > 10) {
      state.headNodHistory.shift();
    }
    if (state.headNodHistory.length >= 5) {
      const max = Math.max(...state.headNodHistory);
      const min = Math.min(...state.headNodHistory);
      if (max - min > 0.3) {
        setCompletedChallenges((prev) => new Set(prev).add(4)); // "Nod your head Yes"
      }
    }

    // Detect nod no (horizontal shake)
    state.headShakeHistory.push(headRotation.y);
    if (state.headShakeHistory.length > 10) {
      state.headShakeHistory.shift();
    }
    if (state.headShakeHistory.length >= 5) {
      const max = Math.max(...state.headShakeHistory);
      const min = Math.min(...state.headShakeHistory);
      if (max - min > 0.4) {
        setCompletedChallenges((prev) => new Set(prev).add(5)); // "Nod your head No"
      }
    }
  }, [isVerifying]);

  const handleStartVerification = useCallback(() => {
    setIsVerifying(true);
    setCompletedChallenges(new Set());
    faceDetectionStateRef.current = {
      eyeAspectRatio: 0,
      previousEyeAspectRatio: 0,
      headRotation: { x: 0, y: 0, z: 0 },
      previousHeadRotation: { x: 0, y: 0, z: 0 },
      headNodHistory: [],
      headShakeHistory: [],
      leftTurnDetected: false,
      rightTurnDetected: false,
    };
  }, []);

  const handleStopVerification = useCallback(() => {
    setIsVerifying(false);
    setCompletedChallenges(new Set());
  }, []);

  return {
    isVerifying,
    setIsVerifying,
    completedChallenges,
    setCompletedChallenges,
    faceDetectionStateRef,
    detectLivenessActions,
    handleStartVerification,
    handleStopVerification,
    isAllVerified,
  };
};