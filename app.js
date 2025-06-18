// Function to fetch provinces and cities from the JSON file
async function fetchProvincesAndCities() {
  try {
    const response = await fetch('provinces_cities.json');
    const provincesAndCities = await response.json();
    populateProvinces(provincesAndCities);
  } catch (error) {
    console.error('Error loading provinces and cities:', error);
  }
}

// Function to populate provinces dropdown
function populateProvinces(provincesAndCities) {
  const provinceSelect = document.getElementById('province');
  for (const province in provincesAndCities) {
    const option = document.createElement('option');
    option.value = province;
    option.innerText = province;
    provinceSelect.appendChild(option);
  }
}

// Function to update cities dropdown based on the selected province
function updateCities() {
  const provinceSelect = document.getElementById('province');
  const citySelect = document.getElementById('city');
  const selectedProvince = provinceSelect.value;

  // Clear previous cities
  citySelect.innerHTML = '<option value="">--Select City--</option>';

  if (selectedProvince && provincesAndCities[selectedProvince]) {
    provincesAndCities[selectedProvince].forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.innerText = city;
      citySelect.appendChild(option);
    });
  }
}

// Save configuration to localStorage
function saveConfiguration() {
  const province = document.getElementById('province').value;
  const city = document.getElementById('city').value;
  const timezone = document.getElementById('timezone').value;

  if (province && city && timezone) {
    const config = { province, city, timezone };
    localStorage.setItem('config', JSON.stringify(config));  // Save to localStorage
    alert('Configuration Saved! Now you can go back to the Display Page.');
    window.location.href = '../index.html';  // Redirect to the Display Page
  } else {
    alert('Please select all fields!');
  }
}

// Initialize the configuration page by fetching provinces and cities
window.onload = function() {
  fetchProvincesAndCities();
}
