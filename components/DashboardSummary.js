import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from '../styles/dashboard.module.css';

const DashboardSummary = ({ reports, userData }) => {
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalReports: 0,
    recentReports: 0,
    sharedReports: 0,
    abnormalValues: 0,
    trendingParameters: {
      improving: 0,
      worsening: 0,
      stable: 0
    }
  });
  
  // Calculate summary metrics when reports change
  useEffect(() => {
    if (!reports || reports.length === 0) return;
    
    // Calculate total reports
    const totalReports = reports.length;
    
    // Calculate recent reports (last month)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentReports = reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= oneMonthAgo;
    }).length;
    
    // Calculate shared reports
    // In a real implementation, this would count actually shared reports
    const sharedReports = Math.min(Math.floor(totalReports * 0.3), totalReports);
    
    // Count abnormal parameters across all reports
    let abnormalCount = 0;
    reports.forEach(report => {
      if (report.results) {
        const abnormalResults = report.results.filter(result =>
          result.status === 'high' || result.status === 'low' || result.status === 'abnormal'
        );
        abnormalCount += abnormalResults.length;
      }
    });
    
    // Analyze trends for parameters that appear in multiple reports
    // This is a simplified version - a real implementation would do more sophisticated trend analysis
    const parameterTrends = analyzeParameterTrends(reports);
    
    setSummaryMetrics({
      totalReports,
      recentReports,
      sharedReports,
      abnormalValues: abnormalCount,
      trendingParameters: parameterTrends
    });
  }, [reports]);
  
  // Analyze parameter trends across reports
  const analyzeParameterTrends = (reports) => {
    // Group reports by parameter name
    const parameterMap = {};
    
    // Sort reports by date (oldest first)
    const sortedReports = [...reports].sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );
    
    // Collect parameter values across reports
    sortedReports.forEach(report => {
      if (!report.results) return;
      
      report.results.forEach(result => {
        if (!parameterMap[result.name]) {
          parameterMap[result.name] = [];
        }
        
        parameterMap[result.name].push({
          date: report.date,
          value: result.value,
          status: result.status
        });
      });
    });
    
    // Analyze trends for each parameter
    let improving = 0;
    let worsening = 0;
    let stable = 0;
    
    Object.keys(parameterMap).forEach(paramName => {
      const values = parameterMap[paramName];
      
      // Only analyze parameters with multiple data points
      if (values.length >= 2) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        
        // Check if parameter is improving, worsening, or stable
        if (firstValue.status === 'high' && lastValue.status === 'normal') {
          improving++;
        } else if (firstValue.status === 'low' && lastValue.status === 'normal') {
          improving++;
        } else if (firstValue.status === 'normal' && (lastValue.status === 'high' || lastValue.status === 'low')) {
          worsening++;
        } else if ((firstValue.status === 'high' || firstValue.status === 'low') &&
                  (lastValue.status === 'high' || lastValue.status === 'low')) {
          // Check for significant change in value
          const percentChange = Math.abs((lastValue.value - firstValue.value) / firstValue.value) * 100;
          
          if (percentChange > 10) {
            if (firstValue.status === 'high' && lastValue.value < firstValue.value) {
              improving++;
            } else if (firstValue.status === 'low' && lastValue.value > firstValue.value) {
              improving++;
            } else {
              worsening++;
            }
          } else {
            stable++;
          }
        } else {
          stable++;
        }
      }
    });
    
    return { improving, worsening, stable };
  };

  return (
    <div className={styles.dashboardSummary}>
      <div className={styles.summaryCard}>
        <div className={`${styles.summaryIcon} ${styles.totalIcon}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div className={styles.summaryContent}>
          <div className={styles.summaryValue}>{summaryMetrics.totalReports}</div>
          <div className={styles.summaryLabel}>Total Reports</div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <div className={`${styles.summaryIcon} ${styles.recentIcon}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div className={styles.summaryContent}>
          <div className={styles.summaryValue}>{summaryMetrics.recentReports}</div>
          <div className={styles.summaryLabel}>Recent Reports</div>
        </div>
      </div>

      <div className={styles.summaryCard}>
        <div className={`${styles.summaryIcon} ${styles.abnormalIcon}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div className={styles.summaryContent}>
          <div className={styles.summaryValue}>{summaryMetrics.abnormalValues}</div>
          <div className={styles.summaryLabel}>Abnormal Values</div>
        </div>
      </div>

      <div className={`${styles.summaryCard} ${styles.trendsCard}`}>
        <div className={`${styles.summaryIcon} ${styles.trendsIcon}`}>
          <TrendingUp size={24} />
        </div>
        <div className={styles.summaryContent}>
          <div className={styles.trendsSummary}>
            <div className={styles.trendItem}>
              <div className={`${styles.trendIcon} ${styles.improving}`}>
                <TrendingUp size={16} />
              </div>
              <div className={styles.trendCount}>{summaryMetrics.trendingParameters.improving}</div>
            </div>
            <div className={styles.trendItem}>
              <div className={`${styles.trendIcon} ${styles.worsening}`}>
                <TrendingDown size={16} />
              </div>
              <div className={styles.trendCount}>{summaryMetrics.trendingParameters.worsening}</div>
            </div>
            <div className={styles.trendItem}>
              <div className={`${styles.trendIcon} ${styles.stable}`}>
                <Minus size={16} />
              </div>
              <div className={styles.trendCount}>{summaryMetrics.trendingParameters.stable}</div>
            </div>
          </div>
          <div className={styles.summaryLabel}>Parameter Trends</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSummary;
