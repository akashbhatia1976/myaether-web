import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const SearchResultsVisualization = ({ searchResults }) => {
  const [chartData, setChartData] = useState([]);
  const [hasEnoughData, setHasEnoughData] = useState(false);
  const [parameter, setParameter] = useState('');
  const [unit, setUnit] = useState('');

  useEffect(() => {
    if (!searchResults || searchResults.length === 0) {
      setHasEnoughData(false);
      return;
    }

    // Check if we have at least 2 data points of the same parameter
    const firstResult = searchResults[0];
    const parameterName = firstResult.testName;
    
    // Filter for results with the same parameter
    const sameParameterResults = searchResults.filter(
      result => result.testName === parameterName
    );

    if (sameParameterResults.length >= 2) {
      setHasEnoughData(true);
      setParameter(parameterName);
      setUnit(sameParameterResults[0].unit || '');

      // Prepare data for chart
        // Prepare data for chart
        const formattedData = sameParameterResults
          .map(result => ({
            date: new Date(result.date),
            value: parseFloat(result.value),
            normalLow: result.normalLow,
            normalHigh: result.normalHigh
          }))
          .sort((a, b) => a.date - b.date) // Sort by date
          .map(item => ({
            date: item.date.toLocaleDateString(),
            value: item.value,
            normalLow: item.normalLow, // Now correctly referencing item from the current map
            normalHigh: item.normalHigh // Now correctly referencing item from the current map
          }));

      setChartData(formattedData);
    } else {
      setHasEnoughData(false);
    }
  }, [searchResults]);

  const formatYAxis = (value) => {
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  if (!hasEnoughData) {
    return null;
  }

  const isNormalRangeAvailable = chartData.some(
    item => item.normalLow !== undefined && item.normalHigh !== undefined
  );

  return (
    <div className="search-visualization">
      <h3>{parameter} Trend</h3>
      <div className="chart-container" style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip 
              formatter={(value) => [`${value}${unit ? ` ${unit}` : ''}`, parameter]}
              labelFormatter={(date) => `Date: ${date}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={parameter} 
              stroke="#0D9488" 
              activeDot={{ r: 8 }} 
              strokeWidth={2}
            />
            
            {isNormalRangeAvailable && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="normalHigh" 
                  name="Upper Limit" 
                  stroke="#EF4444" 
                  strokeDasharray="5 5" 
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="normalLow" 
                  name="Lower Limit" 
                  stroke="#EF4444" 
                  strokeDasharray="5 5" 
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SearchResultsVisualization;
