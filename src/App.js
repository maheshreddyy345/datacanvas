import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import lottie from 'lottie-web';
import RecordRTC from 'recordrtc';
import { saveAs } from 'file-saver';
import chroma from 'chroma-js';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { DownloadOutlined as DownloadIcon } from '@mui/icons-material';

const generateColorPalette = (baseColor, count) => {
  return chroma.scale([
    chroma(baseColor).brighten(1),
    baseColor,
    chroma(baseColor).darken(1)
  ]).mode('lch').colors(count);
};

const chartColors = {
  purple: generateColorPalette('#B794F4', 5),
  gold: generateColorPalette('#F6AD55', 5),
  teal: generateColorPalette('#4FD1C5', 5),
  green: generateColorPalette('#68D391', 5)
};

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#B794F4', // Elegant purple
      light: '#D6BCFA',
      dark: '#805AD5',
    },
    secondary: {
      main: '#F6AD55', // Warm orange/gold
      light: '#FBD38D',
      dark: '#DD6B20',
    },
    background: {
      default: '#171923', // Deep rich background
      paper: '#2D3748', // Elevated surfaces
    },
    text: {
      primary: '#F7FAFC',
      secondary: '#CBD5E0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
    },
    h2: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 24px',
          fontSize: '1rem',
        },
        contained: {
          boxShadow: '0 4px 14px rgba(183, 148, 244, 0.3)',
        },
      },
    },
  },
});

const sampleData = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
];

const chartTypes = [
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' },
  { value: 'pie', label: 'Pie Chart' }
];

function App() {
  const [chartType, setChartType] = useState(chartTypes[0].value);
  const [prompt, setPrompt] = useState('');
  const [chartData, setChartData] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState('purple');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [animationType, setAnimationType] = useState('easeOut');
  const chartRef = useRef(null);
  const echartsInstance = useRef(null);

  // Process data to ensure valid values
  const processData = (data) => {
    if (!Array.isArray(data)) {
      console.warn('Invalid data format received:', data);
      return [];
    }
    return data.map(item => ({
      name: item?.name || 'Unnamed',
      value: typeof item?.value === 'number' ? item.value : 0
    }));
  };

  // Animation functions
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const linear = (t) => t;
  const bounce = (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      const t2 = t - (1.5 / d1);
      return n1 * t2 * t2 + 0.75;
    } else if (t < 2.5 / d1) {
      const t2 = t - (2.25 / d1);
      return n1 * t2 * t2 + 0.9375;
    } else {
      const t2 = t - (2.625 / d1);
      return n1 * t2 * t2 + 0.984375;
    }
  };

  const getEasing = (type, progress) => {
    if (!progress) return 0;
    switch (type) {
      case 'bounce':
        return bounce(progress);
      case 'linear':
        return linear(progress);
      case 'easeOut':
      default:
        return easeOutCubic(progress);
    }
  };

  // Handle chart data animation
  useEffect(() => {
    if (chartData && chartData.length > 0) {
      const processedData = processData(chartData);
      // Initialize with zero values
      setCurrentData(processedData.map(item => ({ ...item, value: 0 })));
      
      let startTime = null;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / 2000, 1);
        
        try {
          const easedProgress = getEasing(animationType, progress);
          const newData = processedData.map(item => ({
            ...item,
            value: item.value * easedProgress
          }));
          
          setCurrentData(newData);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        } catch (error) {
          console.error('Animation error:', error);
          // Fallback to showing the final data
          setCurrentData(processedData);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [chartData, animationType]);

  const handleDataUpdate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setChartData([]);
      
      const response = await fetch('http://localhost:3005/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: prompt.trim() })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze data');
      }

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No data found in the response');
      }

      setChartData(data);
      setCurrentData(data);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to generate chart');
      setChartData([]);
      setCurrentData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getChartOption = () => {
    if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
      return {
        title: {
          text: 'No data available',
          textStyle: { color: '#fff' }
        }
      };
    }

    const colors = chartColors[selectedPalette] || chartColors.default;
    
    const baseOption = {
      backgroundColor: 'transparent',
      animation: true,
      animationDuration: 2000,
      animationEasing: animationType === 'linear' ? 'linear' : 'cubicOut',
      grid: {
        top: '10%',
        right: '15%',
        bottom: '15%',
        left: '15%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      }
    };

    const axisStyle = {
      xAxis: {
        type: 'category',
        data: currentData.map(item => item.name),
        axisLabel: {
          color: '#fff',
          interval: 0,
          rotate: 30
        },
        axisLine: {
          lineStyle: { color: '#fff' }
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          color: '#fff',
          formatter: '{value}%'
        },
        axisLine: {
          lineStyle: { color: '#fff' }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255,255,255,0.1)'
          }
        }
      }
    };

    if (chartType === 'bar') {
      return {
        ...baseOption,
        ...axisStyle,
        series: [{
          type: 'bar',
          data: currentData.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colors[index % colors.length]
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            color: '#fff'
          },
          barMaxWidth: 50
        }]
      };
    }

    if (chartType === 'line' || chartType === 'area') {
      return {
        ...baseOption,
        ...axisStyle,
        series: [{
          type: chartType === 'line' ? 'line' : 'area',
          data: currentData.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colors[index % colors.length]
            }
          })),
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            color: '#fff'
          },
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3
          },
          ...(chartType === 'area' ? {
            areaStyle: {
              opacity: 0.3,
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [{
                  offset: 0,
                  color: colors[0]
                }, {
                  offset: 1,
                  color: 'rgba(0, 0, 0, 0.1)'
                }]
              }
            }
          } : {})
        }]
      };
    }

    if (chartType === 'pie') {
      return {
        ...baseOption,
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}%'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'middle',
          textStyle: {
            color: '#fff',
            fontSize: 14
          },
          formatter: name => {
            const item = currentData.find(d => d.name === name);
            return item ? `${name} (${item.value}%)` : name;
          }
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: '#1a1a1a',
            borderWidth: 2
          },
          label: {
            show: true,
            position: 'outside',
            formatter: '{b}: {d}%',
            color: '#fff',
            fontSize: 14
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true,
            lineStyle: {
              color: '#fff'
            }
          },
          data: currentData.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colors[index % colors.length]
            }
          }))
        }]
      };
    }

    return baseOption;
  };

  const renderChart = () => {
    if (!currentData || currentData.length === 0) {
      return (
        <div className="chart-placeholder">
          <div className="no-data-message">
            {isLoading ? 'Generating chart...' : error || 'No data to display'}
          </div>
        </div>
      );
    }

    const option = getChartOption();
    
    return (
      <div className="chart-container" style={{ width: '100%', height: '400px' }}>
        <ReactECharts
          key={`${chartType}-${JSON.stringify(currentData)}`}
          option={option}
          style={{ width: '100%', height: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
        {isRecording && <div className="recording-indicator" />}
      </div>
    );
  };

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);

      // Get the chart canvas
      const canvas = document.querySelector('.echarts-for-react canvas');
      if (!canvas) {
        throw new Error('Chart canvas not found');
      }

      // Create stream with lower settings for better compatibility
      const stream = canvas.captureStream(30);
      
      // Create recorder with basic settings
      const recorder = new RecordRTC(stream, {
        type: 'video',
        mimeType: 'video/webm',
        frameRate: 30,
        quality: 90,
        width: canvas.width,
        height: canvas.height
      });

      // Reset animation
      setCurrentData([]);
      
      // Start recording
      recorder.startRecording();
      
      // Wait a frame then start animation
      await new Promise(resolve => requestAnimationFrame(resolve));
      setCurrentData(chartData);

      // Record for 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop recording
      recorder.stopRecording(() => {
        const blob = recorder.getBlob();
        
        // Create and click download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'chart-animation.webm';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
          URL.revokeObjectURL(url);
          document.body.removeChild(a);
          stream.getTracks().forEach(track => track.stop());
          recorder.destroy();
          setIsRecording(false);
        }, 100);
      });

    } catch (err) {
      console.error('Recording error:', err);
      setError(`Recording failed: ${err.message}`);
      setIsRecording(false);
    }
  };

  const handleDownload = async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error('Download error:', err);
      setError(`Download failed: ${err.message}`);
    }
  };

  // Update animation duration to match recording time
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      .echarts-for-react canvas {
        animation: none !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // Set fixed animation duration
  const [animationDuration] = useState(2000); // Fixed 2 second animation

  useEffect(() => {
    console.log('Animation duration:', 2000);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #171923 0%, #2D3748 100%)',
        py: 4,
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h1"
              component="h1"
              align="center"
              sx={{
                mb: 4,
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                background: 'linear-gradient(45deg, #B794F4, #F6AD55)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              DataCanvas
            </Typography>
          </motion.div>

          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            elevation={3}
            sx={{ 
              p: 4, 
              mb: 4, 
              borderRadius: 2,
              background: 'rgba(45, 55, 72, 0.8)',
              backdropFilter: 'blur(10px)', 
            }}
          >
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="chart-type-label" sx={{ color: 'text.secondary' }}>Chart Type</InputLabel>
                <Select
                  labelId="chart-type-label"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                  label="Chart Type"
                >
                  {chartTypes.map((chartType) => (
                    <MenuItem key={chartType.value} value={chartType.value}>{chartType.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: In Q4 2023, our company's revenue breakdown was: Product Sales 45%, Services 30%, Subscriptions 15%, and Licensing 10%. The total revenue was $2.5M."
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.23)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'text.primary',
                  },
                }}
              />

              <Button
                variant="contained"
                fullWidth
                onClick={handleDataUpdate}
                disabled={isLoading || !prompt.trim()}
                sx={{
                  background: 'linear-gradient(45deg, #B794F4, #F6AD55)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #A687E0, #E5A04E)'
                  }
                }}
              >
                {isLoading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Generate Chart'
                )}
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 4 }}>
              <FormControl sx={{ mr: 2, minWidth: 120 }}>
                <InputLabel>Animation</InputLabel>
                <Select
                  value={animationType}
                  onChange={(e) => setAnimationType(e.target.value)}
                  label="Animation"
                >
                  <MenuItem value="easeOut">Smooth</MenuItem>
                  <MenuItem value="linear">Linear</MenuItem>
                  <MenuItem value="bounce">Bounce</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={2000}
                  onChange={(e) => {}}
                  label="Duration"
                >
                  <MenuItem value={500}>Fast (0.5s)</MenuItem>
                  <MenuItem value={1000}>Normal (1s)</MenuItem>
                  <MenuItem value={2000}>Slow (2s)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <div style={{ width: '100%', height: '400px', position: 'relative' }}>
              {renderChart()}
            </div>

            {chartData && chartData.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button
                  variant="contained"
                  onClick={handleDownload}
                  disabled={isLoading || isRecording || !currentData.length}
                  startIcon={isRecording ? <CircularProgress size={20} /> : null}
                  sx={{
                    background: isRecording ? '#f44336' : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                    '&:hover': {
                      background: isRecording ? '#d32f2f' : 'linear-gradient(45deg, #1976D2, #00BCD4)'
                    }
                  }}
                >
                  {isRecording ? `Recording ${Math.round(recordingProgress)}%` : 'Download Animation'}
                </Button>
                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </Container>
        
        <Box sx={{ mt: 4, textAlign: 'center', py: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            "Transforming Data into Visual Stories"
          </Typography>
          <Typography 
            variant="body2" 
            color="primary.main"
            sx={{ 
              fontStyle: 'italic',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Created with ❤️ by Umamaheshwar Reddy
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
