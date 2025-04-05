import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Scatter
} from 'recharts';
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  Plus,
  X,
  ChevronDown,
  Info
} from 'lucide-react';
import styles from '../styles/timeline.module.css';

const HealthTimeline = ({ reports, userData }) => {
  const [timeRange, setTimeRange] = useState('all');
  const [selectedParameters, setSelectedParameters] = useState([]);
  const [availableParameters, setAvailableParameters] = useState([]);
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrends, setShowTrends] = useState(false);
  const [healthEvents, setHealthEvents] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', description: '', type: 'medication' });
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [parametersByCategory, setParametersByCategory] = useState({});
  
  // Colors for different parameters
  const paramColors = [
    '#0D9488', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B',
    '#10B981', '#6366F1', '#EC4899', '#F97316', '#14B8A6'
  ];

  // Event type colors
  const eventTypeColors = {
    medication: '#8B5CF6',
    procedure: '#EF4444',
    illness: '#F97316',
    lifestyle: '#10B981',
    other: '#6B7280'
  };

  // Extract all parameters from reports
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Function to extract parameters from all reports
    const extractParameters = () => {
      // For testing until real parameters are available
      // In production, this would extract real parameters from reports
      const mockParameters = [
        { id: 'hemoglobin', name: 'Hemoglobin', unit: 'g/dL', category: 'Hematology', normalRange: '13.5-17.5' },
        { id: 'wbc', name: 'White Blood Cells', unit: 'K/uL', category: 'Hematology', normalRange: '4.5-11.0' },
        { id: 'rbc', name: 'Red Blood Cells', unit: 'M/uL', category: 'Hematology', normalRange: '4.5-5.9' },
        { id: 'glucose', name: 'Glucose', unit: 'mg/dL', category: 'Chemistry', normalRange: '70-100' },
        { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', category: 'Chemistry', normalRange: '0.7-1.3' },
        { id: 'sodium', name: 'Sodium', unit: 'mEq/L', category: 'Chemistry', normalRange: '135-145' },
        { id: 'cholesterol', name: 'Total Cholesterol', unit: 'mg/dL', category: 'Lipids', normalRange: '125-200' },
        { id: 'ldl', name: 'LDL Cholesterol', unit: 'mg/dL', category: 'Lipids', normalRange: '0-100' },
        { id: 'hdl', name: 'HDL Cholesterol', unit: 'mg/dL', category: 'Lipids', normalRange: '40-60' },
        { id: 'systolic', name: 'Systolic BP', unit: 'mmHg', category: 'Vitals', normalRange: '90-120' },
        { id: 'diastolic', name: 'Diastolic BP', unit: 'mmHg', category: 'Vitals', normalRange: '60-80' },
        { id: 'weight', name: 'Weight', unit: 'kg', category: 'Vitals', normalRange: '50-100' }
      ];

      setAvailableParameters(mockParameters);
      
      // Group parameters by category
      const groupedParameters = mockParameters.reduce((acc, param) => {
        if (!acc[param.category]) {
          acc[param.category] = [];
        }
        acc[param.category].push(param);
        return acc;
      }, {});
      
      setParametersByCategory(groupedParameters);
      setExpandedCategories(Object.keys(groupedParameters));
      
      // Set first parameter as default selected
      if (mockParameters.length > 0 && selectedParameters.length === 0) {
        setSelectedParameters([mockParameters[0].id]);
      }
    };

    // Function to generate timeline data from reports
    const generateTimelineData = () => {
      // For testing until real parameters are available
      // This would be replaced with actual parameter extraction from reports
      const today = new Date();
      const mockTimelineData = [];
      
      // Create data points for the last 12 months
      for (let i = 0; i < 12; i++) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        
        const dataPoint = {
          date: date.toISOString().split('T')[0],
          dateObj: date,
          // Generate random values for each parameter
          hemoglobin: 14 + Math.random() * 2 - 1,
          wbc: 7 + Math.random() * 4 - 2,
          rbc: 5.2 + Math.random() * 1 - 0.5,
          glucose: 85 + Math.random() * 30 - 15,
          creatinine: 1 + Math.random() * 0.6 - 0.3,
          sodium: 140 + Math.random() * 10 - 5,
          cholesterol: 170 + Math.random() * 50 - 25,
          ldl: 90 + Math.random() * 40 - 20,
          hdl: 50 + Math.random() * 20 - 10,
          systolic: 115 + Math.random() * 30 - 15,
          diastolic: 75 + Math.random() * 20 - 10,
          weight: 80 + Math.random() * 10 - 5
        };
        
        // Add some abnormal values for demonstration
        if (i === 2) dataPoint.hemoglobin = 12.0; // Low
        if (i === 5) dataPoint.glucose = 115; // High
        if (i === 8) dataPoint.ldl = 130; // High
        if (i === 3) dataPoint.systolic = 135; // High
        
        mockTimelineData.push(dataPoint);
      }
      
      // Sort by date ascending
      mockTimelineData.sort((a, b) => a.dateObj - b.dateObj);
      
      setTimelineData(mockTimelineData);
    };

    // Mock health events
    const generateMockHealthEvents = () => {
      const today = new Date();
      const mockEvents = [
        {
          id: 1,
          date: new Date(today.getFullYear(), today.getMonth() - 2, 15).toISOString().split('T')[0],
          title: 'Started Medication',
          description: 'Started taking Lisinopril 10mg daily',
          type: 'medication'
        },
        {
          id: 2,
          date: new Date(today.getFullYear(), today.getMonth() - 6, 5).toISOString().split('T')[0],
          title: 'Annual Physical',
          description: 'Completed annual physical exam',
          type: 'procedure'
        },
        {
          id: 3,
          date: new Date(today.getFullYear(), today.getMonth() - 9, 20).toISOString().split('T')[0],
          title: 'Diet Change',
          description: 'Started Mediterranean diet',
          type: 'lifestyle'
        }
      ];
      
      setHealthEvents(mockEvents);
    };

    extractParameters();
    generateTimelineData();
    generateMockHealthEvents();
    setLoading(false);
  }, [reports]);

  // Calculate trends for selected parameters
  const calculateTrends = () => {
    if (!timelineData || timelineData.length === 0) return {};
    
    // Calculate the trend for each selected parameter
    const trends = {};
    
    selectedParameters.forEach(paramId => {
      const values = filteredTimelineData.map(item => item[paramId]);
      const n = values.length;
      
      if (n < 2) {
        trends[paramId] = { direction: 'stable', percent: 0 };
        return;
      }
      
      // Calculate simple trend based on first and last values
      const firstValue = values[0];
      const lastValue = values[n - 1];
      const diff = lastValue - firstValue;
      const percentChange = (diff / firstValue) * 100;
      
      let direction = 'stable';
      if (percentChange > 5) direction = 'increasing';
      else if (percentChange < -5) direction = 'decreasing';
      
      trends[paramId] = {
        direction,
        percent: Math.abs(percentChange).toFixed(1)
      };
    });
    
    return trends;
  };
  
  // Filter timeline data based on selected time range
  const filteredTimelineData = timelineData.filter(item => {
    if (timeRange === 'all') return true;
    
    const itemDate = new Date(item.date);
    const today = new Date();
    
    if (timeRange === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return itemDate >= threeMonthsAgo;
    } else if (timeRange === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      return itemDate >= sixMonthsAgo;
    } else if (timeRange === '1y') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return itemDate >= oneYearAgo;
    }
    
    return true;
  });

  // Calculate parameter trends
  const trends = showTrends ? calculateTrends() : {};

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip to show all selected parameters
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.timelineTooltip}>
          <p className={styles.tooltipDate}>{formatDate(label)}</p>
          <div className={styles.tooltipParameters}>
            {payload.map((entry, index) => {
              const param = availableParameters.find(p => p.id === entry.dataKey);
              if (!param) return null;
              
              // Check if value is abnormal
              let status = 'normal';
              if (param.normalRange) {
                const [min, max] = param.normalRange.split('-').map(v => parseFloat(v));
                if (entry.value < min) status = 'low';
                else if (entry.value > max) status = 'high';
              }
              
              return (
                <div key={index} className={styles.tooltipParameter}>
                  <span style={{ color: entry.color }}>{param?.name}: </span>
                  <span className={`${styles.tooltipValue} ${styles[`tooltipValue${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
                    {entry.value.toFixed(1)} {param?.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot to highlight abnormal values
  const renderDot = (props) => {
    const { cx, cy, payload, dataKey } = props;
    const param = availableParameters.find(p => p.id === dataKey);
    
    if (!param || !param.normalRange) return null;
    
    const [min, max] = param.normalRange.split('-').map(v => parseFloat(v));
    const value = payload[dataKey];
    
    const isAbnormal = value < min || value > max;
    
    if (isAbnormal) {
      return (
        <svg x={cx - 6} y={cy - 6} width={12} height={12} fill={value < min ? "#3B82F6" : "#EF4444"}>
          <circle cx="6" cy="6" r="6" />
        </svg>
      );
    }
    
    return null;
  };

  // Set active class on time range button
  const getTimeRangeButtonClass = (range) => {
    return timeRange === range
      ? `${styles.timelineRangeButton} ${styles.timelineRangeButtonActive}`
      : styles.timelineRangeButton;
  };

  // Toggle category expansion
  const toggleCategory = (category) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  // Handle health event submission
  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.date || !newEvent.title) return;
    
    const eventToAdd = {
      id: Date.now(),
      ...newEvent
    };
    
    setHealthEvents([...healthEvents, eventToAdd]);
    setNewEvent({ date: '', title: '', description: '', type: 'medication' });
    setShowAddEvent(false);
  };

  // Export data as CSV
  const exportData = () => {
    // Create CSV content
    let csvContent = "date,";
    selectedParameters.forEach(paramId => {
      const param = availableParameters.find(p => p.id === paramId);
      csvContent += `${param?.name} (${param?.unit}),`;
    });
    csvContent = csvContent.slice(0, -1) + "\n";
    
    filteredTimelineData.forEach(dataPoint => {
      csvContent += `${dataPoint.date},`;
      selectedParameters.forEach(paramId => {
        csvContent += `${dataPoint[paramId]},`;
      });
      csvContent = csvContent.slice(0, -1) + "\n";
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `health_timeline_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter health events by time range
  const filteredHealthEvents = healthEvents.filter(event => {
    if (timeRange === 'all') return true;
    
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (timeRange === '3m') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return eventDate >= threeMonthsAgo;
    } else if (timeRange === '6m') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      return eventDate >= sixMonthsAgo;
    } else if (timeRange === '1y') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return eventDate >= oneYearAgo;
    }
    
    return true;
  });

  if (loading) {
    return <div className={styles.timelineLoading}>Loading health timeline...</div>;
  }

  return (
    <div className={styles.healthTimeline}>
      <div className={styles.timelineHeader}>
        <h2 className={styles.timelineTitle}>Health Timeline</h2>
        <div className={styles.timelineControls}>
          <div className={styles.timelineActions}>
            <button
              className={styles.timelineActionButton}
              onClick={() => setShowTrends(!showTrends)}
              title="Show/Hide Trends"
            >
              <TrendingUp size={16} />
              {showTrends ? 'Hide Trends' : 'Show Trends'}
            </button>
            <button
              className={styles.timelineActionButton}
              onClick={exportData}
              title="Export Data"
            >
              <Download size={16} />
              Export
            </button>
            <button
              className={styles.timelineActionButton}
              onClick={() => setShowAddEvent(true)}
              title="Add Health Event"
            >
              <Plus size={16} />
              Add Event
            </button>
          </div>
          <div className={styles.timeRangeControls}>
            <button
              className={getTimeRangeButtonClass('3m')}
              onClick={() => setTimeRange('3m')}
            >
              3 Months
            </button>
            <button
              className={getTimeRangeButtonClass('6m')}
              onClick={() => setTimeRange('6m')}
            >
              6 Months
            </button>
            <button
              className={getTimeRangeButtonClass('1y')}
              onClick={() => setTimeRange('1y')}
            >
              1 Year
            </button>
            <button
              className={getTimeRangeButtonClass('all')}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.parameterSelection}>
        {Object.entries(parametersByCategory).map(([category, params]) => (
          <div key={category} className={styles.parameterCategory}>
            <div
              className={styles.parameterCategoryHeader}
              onClick={() => toggleCategory(category)}
            >
              <ChevronDown
                size={16}
                className={`${styles.categoryToggle} ${expandedCategories.includes(category) ? styles.categoryToggleExpanded : ''}`}
              />
              <span className={styles.parameterCategoryName}>{category}</span>
            </div>
            {expandedCategories.includes(category) && (
              <div className={styles.parameterButtons}>
                {params.map((param, index) => {
                  const isSelected = selectedParameters.includes(param.id);
                  const colorIndex = availableParameters.findIndex(p => p.id === param.id) % paramColors.length;
                  
                  return (
                    <button
                      key={param.id}
                      className={`${styles.parameterButton} ${isSelected ? styles.parameterButtonActive : ''}`}
                      style={{
                        borderColor: isSelected ? paramColors[colorIndex] : 'transparent',
                        color: isSelected ? paramColors[colorIndex] : '#4b5563'
                      }}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedParameters(selectedParameters.filter(p => p !== param.id));
                        } else {
                          setSelectedParameters([...selectedParameters, param.id]);
                        }
                      }}
                    >
                      {param.name}
                      {showTrends && isSelected && trends[param.id] && (
                        <span
                          className={`${styles.trendIndicator} ${styles[`trend${trends[param.id].direction.charAt(0).toUpperCase() + trends[param.id].direction.slice(1)}`]}`}
                          title={`${trends[param.id].direction} by ${trends[param.id].percent}%`}
                        >
                          {trends[param.id].direction === 'increasing' ? '↑' :
                           trends[param.id].direction === 'decreasing' ? '↓' : '→'}
                          {trends[param.id].percent}%
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className={styles.timelineChartContainer}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={filteredTimelineData}
            margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {selectedParameters.map((paramId, index) => {
              const param = availableParameters.find(p => p.id === paramId);
              if (!param) return null;
              
              const colorIndex = availableParameters.findIndex(p => p.id === paramId) % paramColors.length;
              const color = paramColors[colorIndex];
              
              // Extract normal range if available
              let refLines = [];
              if (param.normalRange) {
                const [min, max] = param.normalRange.split('-').map(v => parseFloat(v));
                refLines = [
                  <ReferenceLine
                    key={`${paramId}-min`}
                    y={min}
                    stroke={color}
                    strokeDasharray="3 3"
                    opacity={0.6}
                  />,
                  <ReferenceLine
                    key={`${paramId}-max`}
                    y={max}
                    stroke={color}
                    strokeDasharray="3 3"
                    opacity={0.6}
                  />
                ];
              }
              
              return [
                <Line
                  key={paramId}
                  type="monotone"
                  dataKey={paramId}
                  name={param.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={renderDot}
                  activeDot={{ r: 8 }}
                />,
                ...refLines
              ];
            })}
            
            {/* Add event markers to chart */}
            {filteredHealthEvents.map(event => {
              // Find the closest data point to the event date
              const eventDate = new Date(event.date);
              const closestDataPoint = filteredTimelineData.reduce((closest, dataPoint) => {
                const dataPointDate = new Date(dataPoint.date);
                const currentDiff = Math.abs(dataPointDate - eventDate);
                const closestDiff = closest ? Math.abs(new Date(closest.date) - eventDate) : Infinity;
                return currentDiff < closestDiff ? dataPoint : closest;
              }, null);
              
              if (!closestDataPoint) return null;
              
              // Use the Y-value of the first selected parameter for placement
              const paramId = selectedParameters[0];
              if (!paramId || !closestDataPoint[paramId]) return null;
              
              return (
                <ReferenceLine
                  key={`event-${event.id}`}
                  x={closestDataPoint.date}
                  stroke={eventTypeColors[event.type]}
                  strokeWidth={2}
                  opacity={0.7}
                  label={{
                    value: "⚑",
                    position: 'top',
                    fill: eventTypeColors[event.type],
                    fontSize: 16
                  }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Health Events Section */}
      <div className={styles.healthEventsSection}>
        <h3 className={styles.healthEventsTitle}>Health Events</h3>
        
        <div className={styles.healthEventsList}>
          {filteredHealthEvents.length > 0 ? (
            filteredHealthEvents.map(event => (
              <div key={event.id} className={styles.healthEventCard} style={{ borderLeftColor: eventTypeColors[event.type] }}>
                <div className={styles.healthEventHeader}>
                  <span className={styles.healthEventDate}>{formatDate(event.date)}</span>
                  <span className={styles.healthEventType} style={{ backgroundColor: eventTypeColors[event.type] }}>
                    {event.type}
                  </span>
                </div>
                <div className={styles.healthEventTitle}>{event.title}</div>
                {event.description && (
                  <div className={styles.healthEventDescription}>{event.description}</div>
                )}
                <button
                  className={styles.healthEventDelete}
                  onClick={() => setHealthEvents(healthEvents.filter(e => e.id !== event.id))}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className={styles.healthEventsEmpty}>
              <Info size={18} />
              <span>No health events in the selected time period</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Event Modal */}
      {showAddEvent && (
        <div className={styles.eventModalOverlay}>
          <div className={styles.eventModal}>
            <div className={styles.eventModalHeader}>
              <h3>Add Health Event</h3>
              <button
                className={styles.eventModalClose}
                onClick={() => setShowAddEvent(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleEventSubmit} className={styles.eventForm}>
              <div className={styles.eventFormField}>
                <label htmlFor="event-date">Date</label>
                <input
                  type="date"
                  id="event-date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                  required
                />
              </div>
              <div className={styles.eventFormField}>
                <label htmlFor="event-type">Type</label>
                <select
                  id="event-type"
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                >
                  <option value="medication">Medication</option>
                  <option value="procedure">Procedure/Test</option>
                  <option value="illness">Illness</option>
                  <option value="lifestyle">Lifestyle Change</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.eventFormField}>
                <label htmlFor="event-title">Title</label>
                <input
                  type="text"
                  id="event-title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  placeholder="e.g., Started new medication"
                  required
                />
              </div>
              <div className={styles.eventFormField}>
                <label htmlFor="event-description">Description (optional)</label>
                <textarea
                  id="event-description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div className={styles.eventFormActions}>
                <button
                  type="button"
                  className={styles.eventFormCancel}
                  onClick={() => setShowAddEvent(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.eventFormSubmit}>
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className={styles.timelineLegend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendMarker} ${styles.normal}`}></div>
          <div className={styles.legendText}>Normal Value</div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendMarker} ${styles.high}`}></div>
          <div className={styles.legendText}>High Value</div>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendMarker} ${styles.low}`}></div>
          <div className={styles.legendText}>Low Value</div>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendLine}></div>
          <div className={styles.legendText}>Reference Range</div>
        </div>
        {filteredHealthEvents.length > 0 && (
          <div className={styles.legendItem}>
            <div className={styles.legendFlag}>⚑</div>
            <div className={styles.legendText}>Health Event</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTimeline;
