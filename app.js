const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Function to sync the time with an NTP server
function syncTime() {
  const ntpClient = require('ntp-client');
  
  ntpClient.getNetworkTime("time.google.com", 123, function(err, date) {
    if (err) {
      console.error("Error syncing time:", err);
      return;
    }
    
    console.log("Time synced:", date);
    updateRealTimeClock(date);
  });
}

// Function to update real-time clock on the display page
function updateRealTimeClock(syncedDate) {
  const realTimeClockElement = document.getElementById('real-time-clock');
  setInterval(() => {
    realTimeClockElement.innerText = syncedDate.toLocaleString(); // Format as needed
  }, 1000); // Update every second
}

// Function to fetch prayer times and update the display
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

// Function to play sound (MP3 files in 'sounds/' folder)
function playSound(soundName) {
  const soundPath = path.join(__dirname, 'sounds', `${soundName}.mp3`);
  
  if (fs.existsSync(soundPath)) {
    exec(`start ${soundPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error playing sound: ${error.message}`);
        return;
      }
      console.log(`Playing ${soundName}.mp3`);
    });
  } else {
    console.error(`Sound file ${soundName}.mp3 not found.`);
  }
}

// Example usage to test adzan and iqomah sounds
playSound('adzan');
playSound('iqomah');

// Initial setup: Sync time and fetch prayer times
syncTime();
fetchPrayerTimes('Jakarta', 'Indonesia', 'WIB');
