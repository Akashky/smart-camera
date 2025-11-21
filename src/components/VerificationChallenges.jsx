import { Box, Stack, Typography } from "@mui/material";
import React from "react";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { challenges } from "../utils/constants/SmartCamera";

export default function VerificationChallenges({
  isVerifying,
  isAllVerified,
  completedChallenges,
}) {
  return (
    <>
      {isVerifying && (
        <Box mt={3} p={2} bgcolor="#f5f5f5" borderRadius={2}>
          {isAllVerified ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 3,
                gap: 2,
              }}
            >
              <VerifiedIcon
                sx={{
                  fontSize: 64,
                  color: "#4caf50",
                }}
              />
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{
                  color: "#2e7d32",
                  textAlign: "center",
                }}
              >
                Verified!
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#424242",
                  textAlign: "center",
                }}
              >
                All challenges completed successfully
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                Complete these challenges:
              </Typography>
              <Stack spacing={1.5}>
                {challenges.map((challenge, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1,
                      borderRadius: 1,
                      bgcolor: completedChallenges.has(index)
                        ? "#e8f5e9"
                        : "transparent",
                      transition: "background-color 0.3s",
                    }}
                  >
                    {completedChallenges.has(index) ? (
                      <CheckCircleIcon sx={{ color: "#4caf50" }} />
                    ) : (
                      <RadioButtonUncheckedIcon sx={{ color: "#9e9e9e" }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        color: completedChallenges.has(index)
                          ? "#2e7d32"
                          : "#424242",
                        fontWeight: completedChallenges.has(index) ? 600 : 400,
                      }}
                    >
                      {challenge}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>
      )}
    </>
  );
}
