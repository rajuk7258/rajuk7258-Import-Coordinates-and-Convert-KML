let parsedData = [];
let headers = [];

const utm44n = "+proj=utm +zone=44 +datum=WGS84 +units=m +no_defs";
const wgs84 = proj4.WGS84;

document.getElementById('fileInput').addEventListener('change', handleFile, false);

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    parsedData = json.slice(1);
    headers = json[0];

    populateDropdowns(headers);
    previewTable(json);
    document.getElementById('columnSelects').style.display = 'block';
  };

  reader.readAsArrayBuffer(file);
}

function populateDropdowns(headers) {
  const eastingSelect = document.getElementById('eastingSelect');
  const northingSelect = document.getElementById('northingSelect');
  const nameSelect = document.getElementById('nameSelect');
  eastingSelect.innerHTML = '';
  northingSelect.innerHTML = '';
  nameSelect.innerHTML = '';

  headers.forEach(header => {
    ['eastingSelect', 'northingSelect', 'nameSelect'].forEach(id => {
      const option = document.createElement('option');
      option.value = option.text = header;
      document.getElementById(id).appendChild(option);
    });
  });
}

function previewTable(data) {
  let html = '<table class="table table-bordered"><thead><tr>';
  data[0].forEach(h => html += `<th>${h}</th>`);
  html += '</tr></thead><tbody>';
  for (let i = 1; i < data.length; i++) {
    html += '<tr>';
    data[i].forEach(cell => html += `<td>${cell}</td>`);
    html += '</tr>';
  }
  html += '</tbody></table>';
  document.getElementById('previewTable').innerHTML = html;
}

function downloadKML() {
  const eastingCol = document.getElementById('eastingSelect').value;
  const northingCol = document.getElementById('northingSelect').value;
  const nameCol = document.getElementById('nameSelect').value;
  
  const eastingIndex = headers.indexOf(eastingCol);
  const northingIndex = headers.indexOf(northingCol);
  const nameIndex = headers.indexOf(nameCol);

  const coords = parsedData.map(row => {
    const easting = parseFloat(row[eastingIndex]);
    const northing = parseFloat(row[northingIndex]);
    const name = row[nameIndex] || \`Point \${row[eastingIndex]}_\${row[northingIndex]}\`;

    if (isNaN(easting) || isNaN(northing)) return null;

    const [lon, lat] = proj4(utm44n, wgs84, [easting, northing]);
    return { lat, lon, name };
  }).filter(c => c !== null);

  const kmlHeader = \`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>\`;
  const kmlFooter = \`</Document></kml>\`;

  let placemarks = '';
  coords.forEach(coord => {
    placemarks += \`
  <Placemark>
    <name>\${coord.name}</name>
    <Point><coordinates>\${coord.lon},\${coord.lat},0</coordinates></Point>
  </Placemark>\`;
  });

  const kmlContent = kmlHeader + placemarks + kmlFooter;
  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'converted_utm44_with_names.kml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}