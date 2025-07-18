// Time Slot Management System
// This file manages the salon's available time slots and working hours

// Default working hours (can be overridden by admin settings)
let workingHours = {
    monday: { start: '09:00', end: '18:00', closed: false },
    tuesday: { start: '09:00', end: '18:00', closed: false },
    wednesday: { start: '09:00', end: '18:00', closed: false },
    thursday: { start: '09:00', end: '18:00', closed: false },
    friday: { start: '09:00', end: '19:00', closed: false },
    saturday: { start: '10:00', end: '17:00', closed: false },
    sunday: { start: '12:00', end: '16:00', closed: true }
};

// Time slot duration in minutes
const TIME_SLOT_DURATION = 30;

// Lunch break (no appointments during this time)
const LUNCH_BREAK = { start: '12:30', end: '13:30' };

// Service durations in minutes
const serviceDurations = {
    'manicure': 30,
    'pedicure': 45,
    'gel': 60,
    'acrylic': 75,
    'nail-art': 90,
    'mushroom-design': 90
};

// Average wait times by service type (in minutes)
const averageWaitTimes = {
    'manicure': 10,
    'pedicure': 15,
    'gel': 20,
    'acrylic': 25,
    'nail-art': 30,
    'mushroom-design': 30
};

// Function to load working hours from localStorage
function loadWorkingHours() {
    const savedHours = localStorage.getItem('workingHours');
    if (savedHours) {
        workingHours = JSON.parse(savedHours);
    }
    return workingHours;
}

// Function to save working hours to localStorage
function saveWorkingHours(hours) {
    localStorage.setItem('workingHours', JSON.stringify(hours));
    workingHours = hours;
}

// Get day of week name from date
function getDayOfWeek(date) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
}

// Check if time is within working hours
function isWithinWorkingHours(date) {
    const dayOfWeek = getDayOfWeek(date);
    const daySettings = workingHours[dayOfWeek];
    
    if (daySettings.closed) return false;
    
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return time >= daySettings.start && time < daySettings.end;
}

// Check if time is during lunch break
function isDuringLunchBreak(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    return time >= LUNCH_BREAK.start && time < LUNCH_BREAK.end;
}

// Generate available time slots for a given date
function generateAvailableTimeSlots(date, serviceType) {
    // Make sure we have the latest working hours
    loadWorkingHours();
    
    const dayOfWeek = getDayOfWeek(date);
    const daySettings = workingHours[dayOfWeek];
    
    // If salon is closed on this day, return empty array
    if (daySettings.closed) {
        return [];
    }
    
    // Service duration in minutes
    const duration = serviceDurations[serviceType] || 60;
    
    // Parse working hours
    const [startHour, startMinute] = daySettings.start.split(':').map(Number);
    const [endHour, endMinute] = daySettings.end.split(':').map(Number);
    
    // Set start and end times for the day
    const startTime = new Date(date);
    startTime.setHours(startHour, startMinute, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Adjust for current time (can't book in the past)
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const startFrom = isToday && now > startTime ? new Date(now) : new Date(startTime);
    
    // Round up to the next slot
    if (isToday && now > startTime) {
        const minutes = startFrom.getMinutes();
        const remainder = minutes % TIME_SLOT_DURATION;
        if (remainder > 0) {
            startFrom.setMinutes(minutes + (TIME_SLOT_DURATION - remainder));
        }
    }
    
    // Get existing appointments for the day
    const existingAppointments = getAppointmentsForDate(date);
    
    const slots = [];
    const currentSlot = new Date(startFrom);
    
    // Generate slots until end time
    while (currentSlot.getTime() + (duration * 60000) <= endTime.getTime()) {
        // Skip lunch break
        if (isDuringLunchBreak(currentSlot)) {
            currentSlot.setTime(currentSlot.getTime() + (TIME_SLOT_DURATION * 60000));
            continue;
        }
        
        // Check if slot is available (not booked)
        const slotEndTime = new Date(currentSlot);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + duration);
        
        const isAvailable = !existingAppointments.some(appointment => {
            const aptStart = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
            const aptService = appointment.serviceType;
            const aptDuration = serviceDurations[aptService] || 60;
            const aptEnd = new Date(aptStart);
            aptEnd.setMinutes(aptEnd.getMinutes() + aptDuration);
            
            // Check if appointment overlaps with current slot
            return (currentSlot < aptEnd && slotEndTime > aptStart);
        });
        
        if (isAvailable) {
            slots.push({
                time: currentSlot.toTimeString().substring(0, 5),
                available: true,
                duration: duration
            });
        }
        
        // Move to next slot
        currentSlot.setTime(currentSlot.getTime() + (TIME_SLOT_DURATION * 60000));
    }
    
    return slots;
}

// Get appointments for a specific date
function getAppointmentsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    // Filter global appointments array for the given date
    return appointments.filter(apt => apt.appointmentDate === dateString);
}

// Calculate estimated wait time based on service type
function calculateEstimatedWaitTime(serviceType) {
    return averageWaitTimes[serviceType] || 20;
}

// Create UI for admin to set working hours
function createWorkingHoursUI() {
    // Get current working hours
    const hours = loadWorkingHours();
    
    // Create UI elements
    const container = document.createElement('div');
    container.className = 'working-hours-settings';
    
    const heading = document.createElement('h3');
    heading.innerHTML = '<i class="fas fa-clock"></i> Salon Working Hours';
    container.appendChild(heading);
    
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Create form
    const form = document.createElement('form');
    form.id = 'workingHoursForm';
    
    daysOfWeek.forEach(day => {
        const daySettings = hours[day];
        
        const dayContainer = document.createElement('div');
        dayContainer.className = 'day-settings';
        
        // Day label with capitalized first letter
        const dayLabel = document.createElement('div');
        dayLabel.className = 'day-label';
        dayLabel.textContent = day.charAt(0).toUpperCase() + day.slice(1);
        dayContainer.appendChild(dayLabel);
        
        // Closed checkbox
        const closedContainer = document.createElement('div');
        closedContainer.className = 'closed-container';
        
        const closedCheckbox = document.createElement('input');
        closedCheckbox.type = 'checkbox';
        closedCheckbox.id = `${day}-closed`;
        closedCheckbox.checked = daySettings.closed;
        closedCheckbox.addEventListener('change', function() {
            document.getElementById(`${day}-start`).disabled = this.checked;
            document.getElementById(`${day}-end`).disabled = this.checked;
        });
        
        const closedLabel = document.createElement('label');
        closedLabel.htmlFor = `${day}-closed`;
        closedLabel.textContent = 'Closed';
        
        closedContainer.appendChild(closedCheckbox);
        closedContainer.appendChild(closedLabel);
        dayContainer.appendChild(closedContainer);
        
        // Time inputs container
        const timeContainer = document.createElement('div');
        timeContainer.className = 'time-container';
        
        // Start time
        const startTimeLabel = document.createElement('label');
        startTimeLabel.htmlFor = `${day}-start`;
        startTimeLabel.textContent = 'From:';
        
        const startTimeInput = document.createElement('input');
        startTimeInput.type = 'time';
        startTimeInput.id = `${day}-start`;
        startTimeInput.value = daySettings.start;
        startTimeInput.disabled = daySettings.closed;
        
        // End time
        const endTimeLabel = document.createElement('label');
        endTimeLabel.htmlFor = `${day}-end`;
        endTimeLabel.textContent = 'To:';
        
        const endTimeInput = document.createElement('input');
        endTimeInput.type = 'time';
        endTimeInput.id = `${day}-end`;
        endTimeInput.value = daySettings.end;
        endTimeInput.disabled = daySettings.closed;
        
        timeContainer.appendChild(startTimeLabel);
        timeContainer.appendChild(startTimeInput);
        timeContainer.appendChild(endTimeLabel);
        timeContainer.appendChild(endTimeInput);
        
        dayContainer.appendChild(timeContainer);
        form.appendChild(dayContainer);
    });
    
    // Save button
    const saveButton = document.createElement('button');
    saveButton.type = 'submit';
    saveButton.className = 'btn btn-primary';
    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Working Hours';
    form.appendChild(saveButton);
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const updatedHours = {};
        
        daysOfWeek.forEach(day => {
            updatedHours[day] = {
                start: document.getElementById(`${day}-start`).value,
                end: document.getElementById(`${day}-end`).value,
                closed: document.getElementById(`${day}-closed`).checked
            };
        });
        
        saveWorkingHours(updatedHours);
        showMessage('Working hours updated successfully!', 'success');
    });
    
    container.appendChild(form);
    return container;
}

// Add working hours UI to settings tab (to be called after DOM is loaded)
function addWorkingHoursToSettings() {
    const settingsTab = document.getElementById('settings');
    if (settingsTab) {
        const workingHoursUI = createWorkingHoursUI();
        settingsTab.appendChild(workingHoursUI);
    }
}

// Initialize the module
function initTimeSlotSystem() {
    // Load working hours from storage
    loadWorkingHours();
    
    // Add working hours UI to settings if admin
    if (localStorage.getItem('userRole') === 'admin') {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', addWorkingHoursToSettings);
        } else {
            addWorkingHoursToSettings();
        }
    }
}

// Call initialization
initTimeSlotSystem();
