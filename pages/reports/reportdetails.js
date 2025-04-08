
// ✅ Fixed reportdetails.js with parameter fallback and no regressions
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getReportDetails,
  getConfidenceScore,
  submitConfidenceFeedback,
} from "../services/apiService";
import toast from "react-hot-toast";

const ReportDetails = () => {
  const router = useRouter();
  const { reportId, userId } = router.query;

  const [reportDetails, setReportDetails] = useState(null);
  const [confidenceScore, setConfidenceScore] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    parameterFeedback: [],
  });

  useEffect(() => {
    if (reportId && userId) {
      fetchReportDetails();
      fetchConfidence();
    }
  }, [reportId, userId]);

  const fetchReportDetails = async () => {
    try {
      const report = await getReportDetails(userId, reportId);
      setReportDetails(report);
    } catch (err) {
      console.error("Failed to fetch report:", err);
    }
  };

  const fetchConfidence = async () => {
    try {
      const score = await getConfidenceScore(reportId);
      setConfidenceScore(score);
    } catch (err) {
      console.error("Confidence fetch error:", err);
    }
  };

  const handleConfidenceFeedback = async (isPositive) => {
    try {
      const feedback = {
        ...feedbackData,
        reportFeedback: isPositive ? "thumbs_up" : "thumbs_down",
        confidenceScore: confidenceScore?.overallConfidence,
      };
      await submitConfidenceFeedback(reportId, feedback);
      toast.success("Thank you for your feedback!");
    } catch (error) {
      console.error("Error submitting report feedback:", error);
    }
  };

  const handleParameterFeedback = (paramName, feedbackType) => {
    const newFeedback = {
      ...feedbackData,
      parameterFeedback: [
        ...(feedbackData.parameterFeedback || []),
        { parameterName: paramName, feedback: feedbackType },
      ],
    };
    setFeedbackData(newFeedback);
    toast.success(`Feedback recorded for ${paramName}`);
  };

  const groupParametersByCategory = () => {
    const flatParams = reportDetails?.parameters;

    if (Array.isArray(flatParams) && flatParams.length > 0) {
      const grouped = {};
      flatParams.forEach((param) => {
        if (!grouped[param.category]) grouped[param.category] = {};
        grouped[param.category][param.name] = {
          Value: param.value,
          Unit: param.unit,
          "Reference Range": param.referenceRange,
        };
      });
      return grouped;
    }

    const legacyParams = reportDetails?.extractedParameters;
    if (
      legacyParams &&
      typeof legacyParams === "object" &&
      !Array.isArray(legacyParams)
    ) {
      return legacyParams;
    }

    return {};
  };

  const categorizedParams = groupParametersByCategory();

  return (
    <div>
      <h1>Report Details</h1>
      {confidenceScore && (
        <div>
          <p>
            Confidence Score: {confidenceScore.overallConfidence.toFixed(2)}%
          </p>
          <p>
            {confidenceScore.overallConfidence >= 80
              ? "🟢 High Confidence"
              : confidenceScore.overallConfidence >= 50
              ? "🟡 Moderate Confidence"
              : "🔴 Low Confidence"}
          </p>
          <button onClick={() => handleConfidenceFeedback(true)}>👍</button>
          <button onClick={() => handleConfidenceFeedback(false)}>👎</button>
        </div>
      )}

      {categorizedParams && Object.keys(categorizedParams).length > 0 ? (
        Object.entries(categorizedParams).map(([category, params]) => (
          <div key={category}>
            <h2>{category}</h2>
            {Object.entries(params).map(([name, val], index) => (
              <div key={index}>
                <p>
                  <strong>{name}</strong>: {val.Value} {val.Unit}{" "}
                  {val["Reference Range"] && `(${val["Reference Range"]})`}
                </p>
                <button onClick={() => handleParameterFeedback(name, "thumbs_up")}>👍</button>
                <button onClick={() => handleParameterFeedback(name, "thumbs_down")}>👎</button>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No parameters inserted or upload failed.</p>
      )}
    </div>
  );
};

export default ReportDetails;
