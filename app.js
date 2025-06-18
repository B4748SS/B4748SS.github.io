// Function to retrieve the saved configuration from localStorage
function getConfiguration() {
  const config = localStorage.getItem('config');
  if (config) {
    return JSON.parse(config);  // Return the saved config
  }
  return null;  // Return null if no configuration is saved
}

// Real-time clock function
function updateClock() {
  const clockElement = document.getElementById('real-time-clock');
  if (clockElement) {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    clockElement.textContent = timeString;
  }
}

// Function to check which prayer is next and calculate iqomah countdown
function checkNextPrayer(prayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
  
  const prayers = [
    { name: 'Fajr', time: prayerTimes.timings.Fajr },
    { name: 'Dhuhr', time: prayerTimes.timings.Dhuhr },
    { name: 'Asr', time: prayerTimes.timings.Asr },
    { name: 'Maghrib', time: prayerTimes.timings.Maghrib },
    { name: 'Isha', time: prayerTimes.timings.Isha }
  ];
  
  let nextPrayer = null;
  let nextPrayerTime = null;
  
  for (let prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeInMinutes = hours * 60 + minutes;
    
    if (prayerTimeInMinutes > currentTime) {
      nextPrayer = prayer.name;
      nextPrayerTime = prayerTimeInMinutes;
      break;
    }
  }
  
  // If no prayer found for today, check tomorrow's first prayer (Fajr)
  if (!nextPrayer) {
    nextPrayer = 'Fajr';
    const [hours, minutes] = prayers[0].time.split(':').map(Number);
    nextPrayerTime = hours * 60 + minutes + 24 * 60; // Add 24 hours
  }
  
  return { nextPrayer, nextPrayerTime, currentTime };
}

// Function to check if we're in the iqomah countdown window
function isInIqomahWindow(prayerTimes) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
  
  const prayers = [
    { name: 'Fajr', time: prayerTimes.timings.Fajr },
    { name: 'Dhuhr', time: prayerTimes.timings.Dhuhr },
    { name: 'Asr', time: prayerTimes.timings.Asr },
    { name: 'Maghrib', time: prayerTimes.timings.Maghrib },
    { name: 'Isha', time: prayerTimes.timings.Isha }
  ];
  
  for (let prayer of prayers) {
    const [hours, minutes] = prayer.time.split(':').map(Number);
    const prayerTimeInMinutes = hours * 60 + minutes;
    
    // Check if current time is within 1-10 minutes after prayer time (9-minute window)
    const timeSincePrayer = currentTime - prayerTimeInMinutes;
    if (timeSincePrayer >= 1 && timeSincePrayer <= 9) {
      return {
        inWindow: true,
        prayerName: prayer.name,
        timeRemaining: 9 - timeSincePrayer
      };
    }
  }
  
  return { inWindow: false };
}

// Function to update iqomah countdown and redirect to prayer.html
function updateIqomahCountdown() {
  const savedData = localStorage.getItem('prayerData');
  if (!savedData) return;
  
  const prayerData = JSON.parse(savedData);
  const today = new Date();
  const currentDateString = today.toISOString().split('T')[0];
  
  const todayPrayerTimes = prayerData.find(day => day.date.gregorian.date === currentDateString);
  if (!todayPrayerTimes) return;
  
  // Check if we're in the iqomah countdown window
  const iqomahStatus = isInIqomahWindow(todayPrayerTimes);
  
  if (iqomahStatus.inWindow) {
    // Redirect to prayer.html when countdown starts (at exactly 1 minute after prayer time)
    if (iqomahStatus.timeRemaining === 9) {
      const prayerTime = todayPrayerTimes.timings[iqomahStatus.prayerName];
      const prayerUrl = `prayer.html?prayer=${iqomahStatus.prayerName}&time=${prayerTime}`;
      window.location.href = prayerUrl;
    }
  }
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
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const url = `http://api.aladhan.com/v1/calendarByCity/${year}/${month}`;
    const response = await axios.get(url, {
      params: {
        city: city,
        country: 'Indonesia',  // Fixed: Use Indonesia as country, not province
        method: 2,          // ISNA method (you can choose another method)
        timezone: timezone,  // WIB, WITA, WIT
      }
    });

    const prayerData = response.data.data;
    savePrayerDataToLocalStorage(prayerData);
    displayPrayerTimes(prayerData);  // Call the function to update UI with prayer times
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    // Try to load from localStorage if API fails
    const savedData = localStorage.getItem('prayerData');
    if (savedData) {
      displayPrayerTimes(JSON.parse(savedData));
    }
  }
}

// Function to save prayer times to localStorage (for offline access)
function savePrayerDataToLocalStorage(data) {
  localStorage.setItem('prayerData', JSON.stringify(data));
  console.log('Prayer times saved to localStorage.');
}

// Function to display the prayer times dynamically
function displayPrayerTimes(prayerData) {
  const today = new Date();
  const currentDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Find the prayer times for today
  const todayPrayerTimes = prayerData.find(day => day.date.gregorian.date === currentDateString);

  if (todayPrayerTimes) {
    const fajrElement = document.getElementById('fajr-time');
    const dhuhrElement = document.getElementById('dhuhr-time');
    const asrElement = document.getElementById('asr-time');
    const maghribElement = document.getElementById('maghrib-time');
    const ishaElement = document.getElementById('isha-time');
    
    if (fajrElement) fajrElement.innerText = todayPrayerTimes.timings.Fajr.slice(0, -6);
    if (dhuhrElement) dhuhrElement.innerText = todayPrayerTimes.timings.Dhuhr.slice(0, -6);
    if (asrElement) asrElement.innerText = todayPrayerTimes.timings.Asr.slice(0, -6);
    if (maghribElement) maghribElement.innerText = todayPrayerTimes.timings.Maghrib.slice(0, -6);
    if (ishaElement) ishaElement.innerText = todayPrayerTimes.timings.Isha.slice(0, -6);
    
    // Update next prayer information
    updateNextPrayerInfo(todayPrayerTimes);
  } else {
    console.log('No prayer times found for today.');
    // Display first available prayer times if today's not found
    if (prayerData.length > 0) {
      const firstDay = prayerData[0];
      const fajrElement = document.getElementById('fajr-time');
      const dhuhrElement = document.getElementById('dhuhr-time');
      const asrElement = document.getElementById('asr-time');
      const maghribElement = document.getElementById('maghrib-time');
      const ishaElement = document.getElementById('isha-time');
      
      if (fajrElement) fajrElement.innerText = firstDay.timings.Fajr.slice(0, -6);
      if (dhuhrElement) dhuhrElement.innerText = firstDay.timings.Dhuhr.slice(0, -6);
      if (asrElement) asrElement.innerText = firstDay.timings.Asr.slice(0, -6);
      if (maghribElement) maghribElement.innerText = firstDay.timings.Maghrib.slice(0, -6);
      if (ishaElement) ishaElement.innerText = firstDay.timings.Isha.slice(0, -6);
      
      // Update next prayer information
      updateNextPrayerInfo(firstDay);
    }
  }
}

// Function to update next prayer information display
function updateNextPrayerInfo(prayerTimes) {
  const nextPrayerInfo = checkNextPrayer(prayerTimes);
  const nextPrayerNameElement = document.getElementById('next-prayer-name');
  const nextPrayerTimeElement = document.getElementById('next-prayer-time');
  
  if (nextPrayerNameElement && nextPrayerTimeElement) {
    nextPrayerNameElement.textContent = nextPrayerInfo.nextPrayer;
    
    // Convert minutes back to HH:MM format
    const hours = Math.floor(nextPrayerInfo.nextPrayerTime / 60) % 24;
    const minutes = nextPrayerInfo.nextPrayerTime % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    nextPrayerTimeElement.textContent = timeString;
  }
}

// Call this function on app load to fetch prayer times based on saved config
window.onload = function() {
  fetchPrayerTimesBasedOnConfig();  // Fetch prayer times based on saved config
  
  // Start real-time clock
  updateClock();
  setInterval(updateClock, 1000); // Update clock every second
  
  // Start iqomah countdown updates
  updateIqomahCountdown();
  setInterval(updateIqomahCountdown, 1000); // Update countdown every second for precise timing
  
  // Update next prayer info every minute
  setInterval(function() {
    const savedData = localStorage.getItem('prayerData');
    if (savedData) {
      const prayerData = JSON.parse(savedData);
      const today = new Date();
      const currentDateString = today.toISOString().split('T')[0];
      const todayPrayerTimes = prayerData.find(day => day.date.gregorian.date === currentDateString);
      if (todayPrayerTimes) {
        updateNextPrayerInfo(todayPrayerTimes);
      }
    }
  }, 60000); // Update every minute
}
