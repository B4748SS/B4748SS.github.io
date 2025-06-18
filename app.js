// Function to retrieve the saved configuration from localStorage
function getConfiguration() {
  const config = localStorage.getItem('config');
  if (config) {
    return JSON.parse(config);  // Return the saved config
  }
  return null;  // Return null if no configuration is saved
}

// Fetch prayer times based on the saved configuration
function fetchPrayerTimesBasedOnConfig() {
  const config = getConfiguration();
  if (config) {
    fetchPrayerTimes(config.city, config.province, config.timezone);
  } else {
    alert('Please configure your location first!');
  }
}

// Example function to fetch prayer times (from the Aladhan API)
async function fetchPrayerTimes(city, province, timezone) {
  try {
    const response = await axios.get('http://api.aladhan.com/v1/calendarByCity', {
      params: {
        city: city,
        country: province,  // Province is used as 'country' in the API call
        method: 2,          // ISNA method (you can choose another method)
        month: new Date().getMonth() + 1,  // Current month
        year: new Date().getFullYear(),   // Current year
        timezone: timezone,  // WIB, WITA, WIT
      }
    });

    const prayerData = response.data.data;
    savePrayerDataToFile(prayerData);
    displayPrayerTimes(prayerData);  // Call the function to update UI with prayer times
  } catch (error) {
    console.error('Error fetching prayer times:', error);
  }
}

// Function to save prayer times to a JSON file (for offline access)
function savePrayerDataToFile(data) {
  const fs = require('fs');
  const filePath = 'prayer_times.json';
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log('Prayer times saved to file.');
}

// Function to display the prayer times dynamically
function displayPrayerTimes(prayerData) {
  const today = new Date();
  const currentDate = today.getDate();  // Get today's date
  
  // Find the prayer times for today
  const todayPrayerTimes = prayerData.find(day => new Date(day.timestamp).getDate() === currentDate);

  if (todayPrayerTimes) {
    document.getElementById('fajr-time').innerText = `Fajr: ${todayPrayerTimes.timings.Fajr}`;
    document.getElementById('dhuhr-time').innerText = `Dhuhr: ${todayPrayerTimes.timings.Dhuhr}`;
    document.getElementById('asr-time').innerText = `Asr: ${todayPrayerTimes.timings.Asr}`;
    document.getElementById('maghrib-time').innerText = `Maghrib: ${todayPrayerTimes.timings.Maghrib}`;
    document.getElementById('isha-time').innerText = `Isha: ${todayPrayerTimes.timings.Isha}`;
  } else {
    console.log('No prayer times found for today.');
  }
}

// Call this function on app load to fetch prayer times based on saved config
window.onload = function() {
  fetchPrayerTimesBasedOnConfig();  // Fetch prayer times based on saved config
}
