/*This module contains modules for creating graphs*/


/*Examole function call-> Just copy paste the code on the main javascript code




const dataset = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
  data: [10, 20, 15, 30, 25]
};

createGraph(dataset, 'myChart', 'Sample Data', 'rgba(255, 99, 132, 1)', 'rgba(255, 99, 132, 0.2)', 1, true, 'bar', 'Months', 'Values');

*/



function createGraph(dataset, canvasId, label, borderColor, backgroundColor, borderWidth, beginAtZero, graphType, xAxisLabel, yAxisLabel) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  new Chart(ctx, {
    type: graphType,
    data: {
      labels: dataset.labels,
      datasets: [{
        label: label,
        data: dataset.data,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        borderWidth: borderWidth
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: beginAtZero,
          title: {
            display: true,
            text: yAxisLabel
          }
        },
        x: {
          title: {
            display: true,
            text: xAxisLabel
          }
        }
      }
    }
  });
}


