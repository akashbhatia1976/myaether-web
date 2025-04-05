// pages/reports/upload.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getUserDetails, uploadReport } from "../../utils/apiService";
import styles from "../../styles/dashboard.module.css";

export default function UploadReportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(router.query.userId || null);
  const [healthId, setHealthId] = useState(null);
  const [reportName, setReportName] = useState("");
  const [reportDate, setReportDate] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userId) {
      getUserDetails()
        .then((user) => {
          setUserId(user.userId);
          setHealthId(user.healthId);
        })
        .catch(() => router.push("/auth/login"));
    }
  }, [userId]);

  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !reportDate) {
      setMessage("⚠️ Please select a file and report date.");
      return;
    }

    try {
      setIsUploading(true);
      setMessage(null);

      const response = await uploadReport(
        userId,
        reportDate,
        file,
        false,
        reportName
      );

      if (response?.reportId) {
        router.push({
          pathname: "/reports/reportdetails",
          query: { reportId: response.reportId },
        });
      } else {
        throw new Error(response?.message || "Upload failed");
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  if (!userId) {
    return <div className={styles.loading}>Loading user information...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Upload Report | Aether Health</title>
      </Head>
      
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <div className={styles.logo}>⚡</div>
            <h1 className={styles.appName}>Aether Health</h1>
          </div>
          
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <h2 className={styles.username}>{userId}</h2>
              <p className={styles.healthId}>Health ID: {healthId || "Loading..."}</p>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <button
          onClick={handleGoBack}
          className={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Upload New Report</h3>
        </div>
        
        <div className={styles.uploadContainer}>
          <form onSubmit={handleSubmit} className={styles.uploadForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Report Name (optional)</label>
              <input
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className={styles.formInput}
                placeholder="Enter a name for this report"
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Report Date <span className={styles.requiredField}>*</span></label>
              <DatePicker
                selected={reportDate}
                onChange={(date) => setReportDate(date)}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select report date"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Select File <span className={styles.requiredField}>*</span></label>
              <div className={styles.fileInputContainer}>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.fileInputLabel}>
                  {file ? file.name : "Choose a file"}
                </label>
              </div>
              <p className={styles.fileHelp}>Accepted formats: PDF, JPG, PNG</p>
            </div>

            {message && (
              <div className={message.includes("✅") ? styles.successMessage : styles.errorMessage}>
                {message}
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleGoBack}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload Report"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
