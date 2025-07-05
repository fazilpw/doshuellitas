// src/components/dogs/WeightHistoryChart.jsx
// 📊 GRÁFICO DEL HISTORIAL DE PESO USANDO RECHARTS

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const WeightHistoryChart = ({ data, dogSize, className = '' }) => {
  
  // ============================================
  // 🎨 CONFIGURACIÓN DE RANGOS IDEALES
  // ============================================
  const getIdealWeightRange = (size) => {
    const ranges = {
      'pequeño': { min: 1, max: 10 },
      'mediano': { min: 10, max: 25 },
      'grande': { min: 25, max: 45 },
      'gigante': { min: 45, max: 90 }
    };
    return ranges[size] || ranges['mediano'];
  };

  const idealRange = getIdealWeightRange(dogSize);

  // ============================================
  // 📊 PREPARAR DATOS PARA EL GRÁFICO
  // ============================================
  const formatChartData = (weightData) => {
    if (!weightData || weightData.length === 0) return [];
    
    return weightData.map(record => ({
      date: record.date_recorded,
      weight: parseFloat(record.weight),
      formattedDate: formatDate(record.date_recorded),
      notes: record.notes,
      location: record.location,
      measurement_method: record.measurement_method,
      recorded_by: record.profiles?.full_name || 'Desconocido'
    }));
  };

  // ============================================
  // 🗓️ FORMATEAR FECHA
  // ============================================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  // ============================================
  // 🎯 CUSTOM TOOLTIP
  // ============================================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`${data.weight} kg`}</p>
          <p className="text-sm text-gray-600">{data.formattedDate}</p>
          <p className="text-xs text-gray-500 capitalize">{data.location}</p>
          {data.notes && (
            <p className="text-xs text-gray-500 mt-1 italic max-w-xs">
              "{data.notes}"
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Por: {data.recorded_by}
          </p>
        </div>
      );
    }
    return null;
  };

  // ============================================
  // 📈 CALCULAR ESTADÍSTICAS
  // ============================================
  const chartData = formatChartData(data);
  
  const stats = {
    min: Math.min(...chartData.map(d => d.weight)),
    max: Math.max(...chartData.map(d => d.weight)),
    latest: chartData[chartData.length - 1]?.weight || 0,
    oldest: chartData[0]?.weight || 0
  };

  const totalChange = stats.latest - stats.oldest;
  const changePercentage = stats.oldest > 0 ? ((totalChange / stats.oldest) * 100).toFixed(1) : 0;

  // ============================================
  // 🎨 DETERMINAR COLORES
  // ============================================
  const getLineColor = () => {
    if (totalChange > 0) return '#10B981'; // Verde para aumento
    if (totalChange < 0) return '#EF4444'; // Rojo para pérdida
    return '#6B7280'; // Gris para estable
  };

  const getYAxisDomain = () => {
    const padding = (stats.max - stats.min) * 0.1;
    return [
      Math.max(0, stats.min - padding),
      stats.max + padding
    ];
  };

  // ============================================
  // 🎨 RENDER DEL COMPONENTE
  // ============================================
  if (!data || data.length === 0) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="text-gray-400 text-4xl mb-3">📊</div>
        <p className="text-gray-600">No hay datos suficientes para mostrar el gráfico</p>
        <p className="text-sm text-gray-500 mt-1">
          Necesitas al menos 2 registros de peso para ver la evolución
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Estadísticas del gráfico */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs text-gray-500">Peso Actual</div>
          <div className="text-lg font-semibold text-gray-900">{stats.latest} kg</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Cambio Total</div>
          <div className={`text-lg font-semibold ${
            totalChange > 0 ? 'text-green-600' : 
            totalChange < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)} kg
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Porcentaje</div>
          <div className={`text-lg font-semibold ${
            totalChange > 0 ? 'text-green-600' : 
            totalChange < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {changePercentage}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">Registros</div>
          <div className="text-lg font-semibold text-gray-900">{data.length}</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">Evolución del Peso</h3>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Rango ideal</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className={`w-3 h-3 rounded`} style={{ backgroundColor: getLineColor() }}></div>
              <span>Peso registrado</span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              domain={getYAxisDomain()}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              label={{ value: 'kg', angle: -90, position: 'insideLeft' }}
            />
            
            {/* Líneas de referencia para rango ideal */}
            <ReferenceLine 
              y={idealRange.min} 
              stroke="#94A3B8" 
              strokeDasharray="5 5" 
              label={{ value: "Mín ideal", position: "insideTopRight", fontSize: 10 }}
            />
            <ReferenceLine 
              y={idealRange.max} 
              stroke="#94A3B8" 
              strokeDasharray="5 5" 
              label={{ value: "Máx ideal", position: "insideBottomRight", fontSize: 10 }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Línea principal del peso */}
            <Line 
              type="monotone" 
              dataKey="weight" 
              stroke={getLineColor()}
              strokeWidth={3}
              dot={{ r: 5, fill: getLineColor() }}
              activeDot={{ r: 7, fill: getLineColor() }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Análisis automático */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📊 Análisis Automático</h4>
        <div className="space-y-2 text-sm">
          <p className="text-blue-800">
            <span className="font-medium">Tendencia:</span> 
            {totalChange > 0.5 ? ' El peso está aumentando de forma constante.' :
             totalChange < -0.5 ? ' El peso está disminuyendo de forma constante.' :
             ' El peso se mantiene estable.'}
          </p>
          
          <p className="text-blue-800">
            <span className="font-medium">Estado:</span> 
            {stats.latest < idealRange.min ? ' Por debajo del rango ideal para su tamaño.' :
             stats.latest > idealRange.max ? ' Por encima del rango ideal para su tamaño.' :
             ' Dentro del rango ideal para su tamaño.'}
          </p>
          
          {Math.abs(totalChange) > (stats.oldest * 0.15) && (
            <p className="text-blue-800">
              <span className="font-medium">⚠️ Alerta:</span> 
              Cambio significativo detectado ({changePercentage}%). 
              Considera consultar con un veterinario.
            </p>
          )}
        </div>
      </div>

      {/* Última medición */}
      {data.length > 0 && (
        <div className="text-xs text-gray-500 text-center">
          Última medición: {formatDate(data[data.length - 1].date_recorded)} 
          en {data[data.length - 1].location}
          {data[data.length - 1].profiles?.full_name && (
            <span> por {data[data.length - 1].profiles.full_name}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default WeightHistoryChart;