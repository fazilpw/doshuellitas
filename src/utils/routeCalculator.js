// Archivo: src/utils/routeCalculator.js
export async function calculateETA(origin, destination) {
  try {
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        trafficModel: google.maps.TrafficModel.BEST_GUESS,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        },
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK') {
          const duration = response.rows[0].elements[0].duration_in_traffic;
          resolve({
            eta: Math.ceil(duration.value / 60), // minutos
            distance: response.rows[0].elements[0].distance.text,
            duration: duration.text
          });
        } else {
          reject(new Error(`Error calculando ruta: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error en calculateETA:', error);
    return null;
  }
}